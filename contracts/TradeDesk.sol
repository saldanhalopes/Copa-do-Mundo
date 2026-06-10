// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TradeDesk
 * @notice Trocas P2P atômicas de figurinhas — a "troca no recreio" on-chain.
 *
 * Sem custódia: as figurinhas ficam na carteira dos donos até o momento exato
 * da troca. O contrato só precisa de approval (setApprovalForAll).
 * Ou os dois lados recebem, ou a transação inteira reverte. Zero risco de golpe.
 */
contract TradeDesk is ReentrancyGuard {
    IERC1155 public immutable figurinhas;

    struct Oferta {
        address criador;
        address destinatario;     // address(0) = qualquer um pode aceitar
        uint256[] idsOferecidos;  // o que o criador dá
        uint256[] qtdOferecidas;
        uint256[] idsPedidos;     // o que o criador quer em troca
        uint256[] qtdPedidas;
        uint64 expiraEm;
        bool ativa;
    }

    uint256 public proximaOferta;
    mapping(uint256 => Oferta) public ofertas;

    event OfertaCriada(uint256 indexed id, address indexed criador, uint256[] da, uint256[] quer);
    event OfertaAceita(uint256 indexed id, address indexed aceitante);
    event OfertaCancelada(uint256 indexed id);

    error OfertaInvalida();
    error OfertaExpirada();
    error NaoAutorizado();

    constructor(address _figurinhas) {
        figurinhas = IERC1155(_figurinhas);
    }

    /// @notice Cria uma oferta de troca. Ex.: "dou minha #231 por uma #047".
    function criarOferta(
        uint256[] calldata idsOferecidos,
        uint256[] calldata qtdOferecidas,
        uint256[] calldata idsPedidos,
        uint256[] calldata qtdPedidas,
        address destinatario,
        uint64 duracaoSegundos
    ) external returns (uint256 id) {
        require(idsOferecidos.length == qtdOferecidas.length, "tamanhos");
        require(idsPedidos.length == qtdPedidas.length, "tamanhos");
        require(idsOferecidos.length > 0 && idsPedidos.length > 0, "vazio");

        id = proximaOferta++;
        ofertas[id] = Oferta({
            criador: msg.sender,
            destinatario: destinatario,
            idsOferecidos: idsOferecidos,
            qtdOferecidas: qtdOferecidas,
            idsPedidos: idsPedidos,
            qtdPedidas: qtdPedidas,
            expiraEm: uint64(block.timestamp) + duracaoSegundos,
            ativa: true
        });

        emit OfertaCriada(id, msg.sender, idsOferecidos, idsPedidos);
    }

    /// @notice Aceita uma oferta — swap atômico em uma única transação.
    function aceitarOferta(uint256 id) external nonReentrant {
        Oferta storage o = ofertas[id];
        if (!o.ativa) revert OfertaInvalida();
        if (block.timestamp > o.expiraEm) revert OfertaExpirada();
        if (o.destinatario != address(0) && msg.sender != o.destinatario) revert NaoAutorizado();

        o.ativa = false; // efeito antes da interação (checks-effects-interactions)

        // Criador -> Aceitante
        figurinhas.safeBatchTransferFrom(o.criador, msg.sender, o.idsOferecidos, o.qtdOferecidas, "");
        // Aceitante -> Criador
        figurinhas.safeBatchTransferFrom(msg.sender, o.criador, o.idsPedidos, o.qtdPedidas, "");

        emit OfertaAceita(id, msg.sender);
    }

    function cancelarOferta(uint256 id) external {
        Oferta storage o = ofertas[id];
        if (msg.sender != o.criador) revert NaoAutorizado();
        o.ativa = false;
        emit OfertaCancelada(id);
    }

    /// @notice Leitura para o frontend montar o mural de trocas.
    function lerOferta(uint256 id) external view returns (Oferta memory) {
        return ofertas[id];
    }
}
