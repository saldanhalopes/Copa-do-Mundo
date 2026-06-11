// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IFigurinhas {
    function mintBatch(address to, uint256[] calldata ids, uint256[] calldata amounts) external;
}

/**
 * @title PackStore
 * @notice Venda de pacotes de figurinhas com sorteio verificável via Chainlink VRF v2.5.
 *
 * Fluxo:
 *  1. comprarPacote() — usuário paga, contrato solicita aleatoriedade ao VRF
 *  2. fulfillRandomWords() — Chainlink responde (~30s), figurinhas são sorteadas
 *     conforme a tabela de raridade e mintadas direto na carteira do comprador
 *
 * Probabilidades públicas (base 10000):
 *  Comum 7000 | Rara 2000 | Épica 800 | Lendária 190 | Mítica 10
 */
contract PackStore is VRFConsumerBaseV2Plus, ReentrancyGuard {
    IFigurinhas public immutable figurinhas;

    // --- Chainlink VRF ---
    uint256 public immutable subscriptionId;
    bytes32 public immutable keyHash;
    uint32 public constant CALLBACK_GAS = 400_000;

    // --- Pacotes ---
    struct TipoPacote {
        uint256 preco;        // em wei (POL) — versão USDC na variante ERC-20
        uint8 qtdFigurinhas;  // 5 ou 10
        uint8 raridadeMinima; // garantia: 0=nenhuma, 1=>=1 Rara, 2=>=1 Épica
        bool ativo;
    }
    mapping(uint8 => TipoPacote) public pacotes;

    struct Pedido {
        address comprador;
        uint8 tipoPacote;
    }
    mapping(uint256 => Pedido) public pedidos; // requestId => pedido

    // Pool de figurinhas por raridade (ids configurados no deploy/admin)
    mapping(uint8 => uint256[]) public poolPorRaridade;

    // Limite anti-bot: máx. de pacotes por carteira por dia
    uint256 public constant LIMITE_DIARIO = 50;
    mapping(address => mapping(uint256 => uint256)) public comprasNoDia;

    address public tesouro;
    mapping(address => bool) public ageVerified;
    mapping(address => bool) public blockedWallets;

    error IdadeNaoVerificada();
    error WalletBlocked();

    event PacoteComprado(address indexed comprador, uint8 tipo, uint256 requestId);
    event PacoteAberto(address indexed comprador, uint256 requestId, uint256[] ids);

    constructor(
        address vrfCoordinator,
        uint256 _subscriptionId,
        bytes32 _keyHash,
        address _figurinhas,
        address _tesouro
    ) VRFConsumerBaseV2Plus(vrfCoordinator) {
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        figurinhas = IFigurinhas(_figurinhas);
        tesouro = _tesouro;

        // Pacotes padrão (preços em POL — ajustar via admin conforme cotação)
        pacotes[0] = TipoPacote(4 ether, 5, 0, true);    // Básico  ~$1,99
        pacotes[1] = TipoPacote(16 ether, 5, 1, true);   // Premium ~$7,99
        pacotes[2] = TipoPacote(50 ether, 10, 2, true);  // Lendário ~$24,99
    }

    // ---------------------------------------------------------------
    // Compra
    // ---------------------------------------------------------------

    function comprarPacote(uint8 tipo) external payable nonReentrant returns (uint256 requestId) {
        TipoPacote memory p = pacotes[tipo];
        require(p.ativo, "pacote inativo");
        require(msg.value == p.preco, "valor incorreto");
        if (blockedWallets[msg.sender]) revert WalletBlocked();
        if (!ageVerified[msg.sender]) revert IdadeNaoVerificada();

        uint256 dia = block.timestamp / 1 days;
        require(comprasNoDia[msg.sender][dia] < LIMITE_DIARIO, "limite diario");
        comprasNoDia[msg.sender][dia]++;

        requestId = s_vrfCoordinator.requestRandomWords(
            VRFV2PlusClient.RandomWordsRequest({
                keyHash: keyHash,
                subId: subscriptionId,
                requestConfirmations: 3,
                callbackGasLimit: CALLBACK_GAS,
                numWords: 1,
                extraArgs: VRFV2PlusClient._argsToBytes(
                    VRFV2PlusClient.ExtraArgsV1({nativePayment: true})
                )
            })
        );

        pedidos[requestId] = Pedido(msg.sender, tipo);

        (bool ok, ) = tesouro.call{value: msg.value}("");
        require(ok, "transferencia falhou");

        emit PacoteComprado(msg.sender, tipo, requestId);
    }

    // ---------------------------------------------------------------
    // Callback do Chainlink VRF — sorteio e mint
    // ---------------------------------------------------------------

    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal override {
        Pedido memory pedido = pedidos[requestId];
        TipoPacote memory p = pacotes[pedido.tipoPacote];

        uint256 seed = randomWords[0];
        uint256 n = p.qtdFigurinhas;
        uint256[] memory ids = new uint256[](n);
        uint256[] memory amounts = new uint256[](n);
        bool garantiaCumprida = p.raridadeMinima == 0;

        for (uint256 i = 0; i < n; i++) {
            uint256 r = uint256(keccak256(abi.encode(seed, i)));
            uint8 rar;

            // Última figurinha força a garantia mínima se ainda não saiu
            if (i == n - 1 && !garantiaCumprida) {
                rar = p.raridadeMinima;
            } else {
                rar = _sortearRaridade(r % 10000);
            }
            if (rar >= p.raridadeMinima) garantiaCumprida = true;

            uint256[] storage pool = poolPorRaridade[rar];
            ids[i] = pool[(r >> 16) % pool.length];
            amounts[i] = 1;
        }

        figurinhas.mintBatch(pedido.comprador, ids, amounts);
        emit PacoteAberto(pedido.comprador, requestId, ids);
    }

    /// @dev Tabela pública de probabilidades (auditável por qualquer um)
    function _sortearRaridade(uint256 roll) internal pure returns (uint8) {
        if (roll < 7000) return 0;        // 70,0% Comum
        if (roll < 9000) return 1;        // 20,0% Rara
        if (roll < 9800) return 2;        //  8,0% Épica
        if (roll < 9990) return 3;        //  1,9% Lendária
        return 4;                          //  0,1% Mítica
    }

    // ---------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------

    function configurarPool(uint8 rar, uint256[] calldata ids) external onlyOwner {
        poolPorRaridade[rar] = ids;
    }

    function configurarPacote(uint8 tipo, uint256 preco, uint8 qtd, uint8 garantia, bool ativo) external onlyOwner {
        pacotes[tipo] = TipoPacote(preco, qtd, garantia, ativo);
    }

    function setTesouro(address t) external onlyOwner {
        tesouro = t;
    }

    function setAgeVerified(address wallet, bool verified) external onlyOwner {
        ageVerified[wallet] = verified;
    }

    function setBlockedWallet(address wallet, bool blocked) external onlyOwner {
        blockedWallets[wallet] = blocked;
    }
}
