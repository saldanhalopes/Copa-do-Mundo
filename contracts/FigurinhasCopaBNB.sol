// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title FigurinhasCopaBNB
 * @notice Versão da coleção para BNB Chain (BSC).
 *         Compatível com Binance NFT Marketplace (padrão ERC-1155 + royalties).
 *
 *  Diferenças vs. versão Polygon:
 *  - VRF usa Binance Oracle (BNB Chain) em vez de Chainlink
 *  - Pagamentos aceitos em BNB e BUSD (stablecoin Binance)
 *  - Integração com Binance Pay para onramp fiat zero-fricção
 *  - Royalties configurados para Binance NFT Marketplace (campo `feeRecipient`)
 *
 *  Deploy: BNB Smart Chain mainnet (chainId 56) / testnet (chainId 97)
 */

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// Interface do Binance Oracle VRF na BNB Chain
interface IBinanceVRF {
    function requestRandomNumber() external returns (uint256 requestId);
}

interface IBinanceVRFConsumer {
    function fulfillRandomness(uint256 requestId, uint256 randomness) external;
}

// Interface para Binance Pay callback (confirmação de pagamento fiat)
interface IBinancePay {
    struct PaymentResult {
        string merchantTradeNo;
        string transactionId;
        uint256 amount;     // em centavos USD
        address buyer;
    }
    function verifyPayment(string calldata merchantTradeNo) external view returns (bool, PaymentResult memory);
}

contract FigurinhasCopaBNB is ERC1155, ERC2981, AccessControl, Pausable, ReentrancyGuard, IBinanceVRFConsumer {
    bytes32 public constant MINTER_ROLE    = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE    = keccak256("PAUSER_ROLE");
    bytes32 public constant OPERATOR_ROLE  = keccak256("OPERATOR_ROLE");

    uint256 public constant TOTAL_FIGURINHAS = 680;

    IBinanceVRF  public binanceVRF;
    IBinancePay  public binancePay;

    // ─── Coleção ──────────────────────────────────────────────
    mapping(uint256 => uint8)   public raridade;
    mapping(uint256 => uint256) public maxSupply;
    mapping(uint256 => uint256) public totalMintado;

    // ─── Pacotes ──────────────────────────────────────────────
    struct TipoPacote {
        uint256 precoBNB;        // preço em wei (BNB)
        uint256 precoBUSD;       // preço em BUSD (18 decimais)
        uint8   qtd;
        uint8   garantiaMinRar;
        bool    ativo;
    }
    mapping(uint8 => TipoPacote) public pacotes;

    struct Pedido {
        address comprador;
        uint8   tipoPacote;
        string  binancePayTradeNo; // vazio se pagou em cripto
    }
    mapping(uint256 => Pedido) public pedidos; // requestId -> pedido

    // Pool de ids por raridade
    mapping(uint8 => uint256[]) public pool;

    // ─── Metadados ────────────────────────────────────────────
    bool    public metadataFrozen;
    // Compatibilidade Binance NFT: campo `contractURI` para metadata da coleção
    string  public contractURI;

    // ─── Royalties Binance NFT Marketplace ────────────────────
    // O Binance NFT usa o campo `feeRecipient` + `royaltyBps` no contractURI
    // além do ERC-2981 padrão. Os dois são configurados aqui.
    address public royaltyRecipient;
    uint16  public royaltyBps = 500; // 5%

    // ─── BUSD token (BEP-20) ──────────────────────────────────
    address public constant BUSD = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56; // BSC mainnet

    // ─────────────────────────────────────────────────────────
    event PacoteComprado(address indexed comprador, uint8 tipo, uint256 requestId, string via);
    event PacoteAberto(address indexed comprador, uint256 requestId, uint256[] ids);
    event MetadataFrozen(string uri);

    error SupplyExcedido(uint256 id);
    error FigurinhaInvalida(uint256 id);
    error PagamentoInvalido();
    error MetadataJaCongelada();

    constructor(
        string memory _baseUri,
        string memory _contractURI,
        address _admin,
        address _royaltyRecipient,
        address _binanceVRF,
        address _binancePay
    ) ERC1155(_baseUri) {
        contractURI       = _contractURI;
        royaltyRecipient  = _royaltyRecipient;
        binanceVRF        = IBinanceVRF(_binanceVRF);
        binancePay        = IBinancePay(_binancePay);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(PAUSER_ROLE,        _admin);
        _grantRole(OPERATOR_ROLE,      _admin);

        // Royalties ERC-2981
        _setDefaultRoyalty(_royaltyRecipient, royaltyBps);

        // Pacotes padrão
        pacotes[0] = TipoPacote(0.005 ether,  2 ether,   5,  0, true); // ~$1,99
        pacotes[1] = TipoPacote(0.02  ether,  8 ether,   5,  1, true); // ~$7,99
        pacotes[2] = TipoPacote(0.065 ether, 25 ether,  10,  2, true); // ~$24,99
    }

    // ─── Configuração ─────────────────────────────────────────

    function configurarFigurinhas(
        uint256[] calldata ids,
        uint8[]   calldata raridades,
        uint256[] calldata supplies
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == 0 || ids[i] > TOTAL_FIGURINHAS) revert FigurinhaInvalida(ids[i]);
            require(maxSupply[ids[i]] == 0, "ja configurada");
            raridade[ids[i]]  = raridades[i];
            maxSupply[ids[i]] = supplies[i];
        }
    }

    function configurarPool(uint8 rar, uint256[] calldata ids) external onlyRole(OPERATOR_ROLE) {
        pool[rar] = ids;
    }

    function setContractURI(string calldata _uri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (metadataFrozen) revert MetadataJaCongelada();
        contractURI = _uri;
    }

    function freezeMetadata() external onlyRole(DEFAULT_ADMIN_ROLE) {
        metadataFrozen = true;
        emit MetadataFrozen(contractURI);
    }

    // ─── Compra com BNB (cripto) ──────────────────────────────

    function comprarComBNB(uint8 tipo) external payable nonReentrant whenNotPaused returns (uint256 reqId) {
        TipoPacote memory p = pacotes[tipo];
        require(p.ativo, "inativo");
        if (msg.value != p.precoBNB) revert PagamentoInvalido();

        reqId = _requestVRF(msg.sender, tipo, "");

        // Repassa BNB ao tesouro imediatamente
        (bool ok,) = royaltyRecipient.call{value: msg.value}("");
        require(ok, "transfer");

        emit PacoteComprado(msg.sender, tipo, reqId, "BNB");
    }

    // ─── Compra com Binance Pay (fiat → Binance → callback) ──
    // O backend Binance Pay chama este método após confirmação de pagamento.

    function confirmarBinancePay(
        string calldata merchantTradeNo,
        address         comprador,
        uint8           tipo
    ) external onlyRole(OPERATOR_ROLE) nonReentrant whenNotPaused returns (uint256 reqId) {
        // Verifica no oracle da Binance Pay que o pagamento foi liquidado
        (bool ok, IBinancePay.PaymentResult memory res) = binancePay.verifyPayment(merchantTradeNo);
        require(ok && res.buyer == comprador, "pagamento invalido");

        reqId = _requestVRF(comprador, tipo, merchantTradeNo);
        emit PacoteComprado(comprador, tipo, reqId, "BinancePay");
    }

    function _requestVRF(address comprador, uint8 tipo, string memory tradeNo) internal returns (uint256 reqId) {
        reqId = binanceVRF.requestRandomNumber();
        pedidos[reqId] = Pedido(comprador, tipo, tradeNo);
    }

    // ─── Callback VRF (Binance Oracle) ───────────────────────

    function fulfillRandomness(uint256 reqId, uint256 randomness) external override {
        require(msg.sender == address(binanceVRF), "apenas VRF");
        Pedido   memory ped = pedidos[reqId];
        TipoPacote memory p = pacotes[ped.tipoPacote];

        uint256[] memory ids     = new uint256[](p.qtd);
        uint256[] memory amounts = new uint256[](p.qtd);
        bool garantiaOk = (p.garantiaMinRar == 0);

        for (uint8 i = 0; i < p.qtd; i++) {
            uint256 r = uint256(keccak256(abi.encode(randomness, i)));
            uint8 rar;
            if (i == p.qtd - 1 && !garantiaOk) {
                rar = p.garantiaMinRar;
            } else {
                rar = _sortearRaridade(r % 10000);
            }
            if (rar >= p.garantiaMinRar) garantiaOk = true;

            uint256[] storage p_ = pool[rar];
            ids[i]     = p_[(r >> 16) % p_.length];
            amounts[i] = 1;
        }

        _mintBatch(ped.comprador, ids, amounts, "");
        emit PacoteAberto(ped.comprador, reqId, ids);
    }

    function _sortearRaridade(uint256 roll) internal pure returns (uint8) {
        if (roll < 7000) return 0;
        if (roll < 9000) return 1;
        if (roll < 9800) return 2;
        return 3;
    }

    // ─── Mint direto (PackStore externo ou admin) ─────────────

    function mintBatch(address to, uint256[] calldata ids, uint256[] calldata amounts)
        external onlyRole(MINTER_ROLE) whenNotPaused
    {
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] == 0 || ids[i] > TOTAL_FIGURINHAS) revert FigurinhaInvalida(ids[i]);
            if (totalMintado[ids[i]] + amounts[i] > maxSupply[ids[i]])  revert SupplyExcedido(ids[i]);
            totalMintado[ids[i]] += amounts[i];
        }
        _mintBatch(to, ids, amounts, "");
    }

    // ─── Fusão ────────────────────────────────────────────────

    function fundir(uint256 id) external whenNotPaused {
        require(raridade[id] == 0, "apenas comuns");
        _burn(msg.sender, id, 10);
        _mint(msg.sender, id + 10000, 1, "");
    }

    // ─── Pausa ────────────────────────────────────────────────

    function pause()   external onlyRole(PAUSER_ROLE) { _pause(); }
    function unpause() external onlyRole(PAUSER_ROLE) { _unpause(); }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal override whenNotPaused { super._update(from, to, ids, values); }

    // ─── Interfaces ───────────────────────────────────────────

    function supportsInterface(bytes4 id)
        public view override(ERC1155, ERC2981, AccessControl) returns (bool)
    { return super.supportsInterface(id); }
}
