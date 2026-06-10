// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface ICardStats {
    struct Carta {
        uint8 pac; uint8 sho; uint8 pas; uint8 dri;
        uint8 def; uint8 phy; uint8 ovr; uint8 posicao;
        uint8 raridade; uint8 selecao;
    }
    function getCarta(uint256 tokenId) external view returns (Carta memory);
}

/**
 * @title MatchEscrow
 * @notice PvP de cartas com aposta (stake). O vencedor leva o pote.
 *
 *  FLUXO:
 *   1. Jogador A cria a partida com um stake (deposita POL/BNB) e seu time (5 cartas)
 *   2. Jogador B entra pagando o mesmo stake e enviando seu time
 *   3. O resolvedor (com VRF) processa a batalha: 5 confrontos carta-a-carta
 *      decididos por atributos (OVR + atributo relevante da posição) + fator VRF
 *   4. quem vencer mais confrontos leva o pote (menos a taxa da casa)
 *
 *  ANTI-TRAPAÇA:
 *   - Posse das cartas verificada on-chain (balanceOf)
 *   - Stake travado em escrow — ninguém saca no meio
 *   - Aleatoriedade dos confrontos via VRF (auditável)
 *   - Cartas NÃO saem da carteira (apenas referenciadas) — você joga e continua dono
 */
contract MatchEscrow is ReentrancyGuard, AccessControl {
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");

    IERC1155   public immutable figurinhas;
    ICardStats public immutable stats;

    uint16 public taxaCasaBps = 500;     // 5% de taxa sobre o pote
    address public tesouro;

    uint8 public constant CARTAS_POR_TIME = 5;

    enum Estado { Aberta, Pronta, Resolvida, Cancelada }

    struct Partida {
        address jogadorA;
        address jogadorB;
        uint256 stake;                        // por jogador
        uint256[CARTAS_POR_TIME] timeA;
        uint256[CARTAS_POR_TIME] timeB;
        Estado  estado;
        address vencedor;
        uint64  criadaEm;
        uint256 vrfRandom;
    }

    uint256 public proximaPartida;
    mapping(uint256 => Partida) public partidas;

    // tempo máximo esperando oponente antes de poder cancelar e reembolsar
    uint64 public constant TIMEOUT = 1 hours;

    event PartidaCriada(uint256 indexed id, address indexed jogadorA, uint256 stake);
    event PartidaAceita(uint256 indexed id, address indexed jogadorB);
    event PartidaResolvida(uint256 indexed id, address indexed vencedor, uint256 premio, uint8 placarA, uint8 placarB);
    event PartidaCancelada(uint256 indexed id);

    error NaoPossuiCarta(uint256 tokenId);
    error StakeIncorreto();
    error EstadoInvalido();

    constructor(address _figurinhas, address _stats, address _tesouro, address admin) {
        figurinhas = IERC1155(_figurinhas);
        stats      = ICardStats(_stats);
        tesouro    = _tesouro;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RESOLVER_ROLE, admin);
    }

    // ─── Criar partida (jogador A deposita stake + envia time) ────

    function criarPartida(uint256[CARTAS_POR_TIME] calldata time)
        external payable nonReentrant returns (uint256 id)
    {
        require(msg.value > 0, "stake > 0");
        _verificarPosse(msg.sender, time);

        id = proximaPartida++;
        Partida storage p = partidas[id];
        p.jogadorA = msg.sender;
        p.stake    = msg.value;
        p.timeA    = time;
        p.estado   = Estado.Aberta;
        p.criadaEm = uint64(block.timestamp);

        emit PartidaCriada(id, msg.sender, msg.value);
    }

    // ─── Aceitar partida (jogador B paga o mesmo stake) ───────────

    function aceitarPartida(uint256 id, uint256[CARTAS_POR_TIME] calldata time)
        external payable nonReentrant
    {
        Partida storage p = partidas[id];
        if (p.estado != Estado.Aberta) revert EstadoInvalido();
        if (msg.value != p.stake) revert StakeIncorreto();
        require(msg.sender != p.jogadorA, "nao pode jogar contra si");
        _verificarPosse(msg.sender, time);

        p.jogadorB = msg.sender;
        p.timeB    = time;
        p.estado   = Estado.Pronta;

        emit PartidaAceita(id, msg.sender);
        // a partir daqui, o resolver (com VRF) chama resolver()
    }

    // ─── Resolver a batalha (chamado pelo resolver com aleatoriedade VRF) ──

    function resolver(uint256 id, uint256 vrfRandom) external onlyRole(RESOLVER_ROLE) nonReentrant {
        Partida storage p = partidas[id];
        if (p.estado != Estado.Pronta) revert EstadoInvalido();
        p.vrfRandom = vrfRandom;

        uint8 placarA = 0;
        uint8 placarB = 0;

        // 5 confrontos carta-a-carta
        for (uint8 i = 0; i < CARTAS_POR_TIME; i++) {
            uint256 forcaA = _forcaCarta(p.timeA[i], vrfRandom, i, true);
            uint256 forcaB = _forcaCarta(p.timeB[i], vrfRandom, i, false);
            if (forcaA >= forcaB) placarA++;
            else placarB++;
        }

        address vencedor = placarA >= placarB ? p.jogadorA : p.jogadorB;
        p.vencedor = vencedor;
        p.estado   = Estado.Resolvida;

        // Distribuição do pote
        uint256 pote = p.stake * 2;
        uint256 taxa = (pote * taxaCasaBps) / 10000;
        uint256 premio = pote - taxa;

        (bool t,) = tesouro.call{value: taxa}("");
        require(t, "taxa");
        (bool w,) = vencedor.call{value: premio}("");
        require(w, "premio");

        emit PartidaResolvida(id, vencedor, premio, placarA, placarB);
    }

    /// @dev Força de uma carta = OVR + atributo relevante da posição + fator VRF (0–9).
    ///      Espelha a lógica de "batalha por atributos".
    function _forcaCarta(uint256 tokenId, uint256 seed, uint8 idx, bool ladoA)
        internal view returns (uint256)
    {
        ICardStats.Carta memory c = stats.getCarta(tokenId);

        // atributo decisivo conforme a posição
        uint256 attr;
        if (c.posicao == 0 || c.posicao == 1) attr = c.def;          // GOL/ZAG -> DEF
        else if (c.posicao >= 6) attr = c.sho;                       // PD/PE/CAM -> SHO
        else attr = c.pas;                                           // meio -> PAS

        // fator aleatório do VRF (justo, auditável)
        uint256 r = uint256(keccak256(abi.encode(seed, idx, ladoA))) % 10;

        return uint256(c.ovr) * 2 + attr + r;
    }

    // ─── Cancelamento por timeout (sem oponente) ─────────────────

    function cancelar(uint256 id) external nonReentrant {
        Partida storage p = partidas[id];
        if (p.estado != Estado.Aberta) revert EstadoInvalido();
        require(msg.sender == p.jogadorA, "so o criador");
        require(block.timestamp > p.criadaEm + TIMEOUT, "aguarde timeout");

        p.estado = Estado.Cancelada;
        (bool ok,) = p.jogadorA.call{value: p.stake}("");
        require(ok, "reembolso");
        emit PartidaCancelada(id);
    }

    // ─── Helpers ──────────────────────────────────────────────────

    function _verificarPosse(address jogador, uint256[CARTAS_POR_TIME] calldata time) internal view {
        for (uint8 i = 0; i < CARTAS_POR_TIME; i++) {
            if (figurinhas.balanceOf(jogador, time[i]) == 0) revert NaoPossuiCarta(time[i]);
        }
    }

    function getPartida(uint256 id) external view returns (Partida memory) {
        return partidas[id];
    }

    function setTaxa(uint16 bps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(bps <= 1000, "max 10%");
        taxaCasaBps = bps;
    }
}
