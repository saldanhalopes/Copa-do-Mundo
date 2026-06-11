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
 * @notice PvP de cartas com aposta (stake) ou partidas casuais (stake = 0).
 *         O vencedor leva o pote apenas em partidas com stake > 0.
 *         Partidas com stake = 0: sem entrada, sem prêmio financeiro,
 *         apenas ELO/Ranking (via RankingSeasons.sol).
 *
 *  FLUXO:
 *   1. Jogador A cria a partida com stake (0 = casual) e seu time (5 cartas)
 *   2. Jogador B entra (se stake > 0 paga o mesmo valor) e envia seu time
 *   3. O resolvedor (com VRF) processa a batalha: 5 confrontos carta-a-carta
 *      decididos por atributos (OVR + atributo relevante da posição) + fator VRF
 *   4. Quem vencer mais confrontos leva o pote (stake > 0) ou apenas ELO (stake = 0)
 *
 *  ANTI-TRAPAÇA:
 *   - Posse das cartas verificada on-chain (balanceOf)
 *   - Stake travado em escrow — ninguém saca no meio
 *   - Aleatoriedade dos confrontos via VRF (auditável)
 *   - Cartas NÃO saem da carteira (apenas referenciadas) — você joga e continua dono
 */
contract MatchEscrow is ReentrancyGuard, AccessControl {
    bytes32 public constant RESOLVER_ROLE = keccak256("RESOLVER_ROLE");
    bytes32 public constant AGE_VERIFIER_ROLE = keccak256("AGE_VERIFIER_ROLE");

    IERC1155   public immutable figurinhas;
    ICardStats public immutable stats;

    uint16 public taxaCasaBps = 500;     // 5% de taxa sobre o pote
    address public tesouro;

    uint8 public minAgeStakedPvP = 18;
    mapping(address => bool) public ageVerified;
    mapping(address => bool) public blockedWallets;
    mapping(bytes32 => uint8) public jurisdictionMinAge;

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
    error IdadeNaoVerificada();
    error WalletBlocked();
    modifier apenasMaiorIdade(uint256 stake) {
        if (stake > 0 && !ageVerified[msg.sender]) revert IdadeNaoVerificada();
        _;
    }

    constructor(address _figurinhas, address _stats, address _tesouro, address admin) {
        figurinhas = IERC1155(_figurinhas);
        stats      = ICardStats(_stats);
        tesouro    = _tesouro;
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(RESOLVER_ROLE, admin);
        _grantRole(AGE_VERIFIER_ROLE, admin);
    }

    // ─── Criar partida (stake = 0 casual; stake > 0 com aposta) ──

    function criarPartida(uint256[CARTAS_POR_TIME] calldata time)
        external payable nonReentrant apenasMaiorIdade(msg.value) returns (uint256 id)
    {
        if (blockedWallets[msg.sender]) revert WalletBlocked();
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

    // ─── Aceitar partida (stake = 0 sem pagamento; stake > 0 igual) ─

    function aceitarPartida(uint256 id, uint256[CARTAS_POR_TIME] calldata time)
        external payable nonReentrant
    {
        Partida storage p = partidas[id];
        if (p.estado != Estado.Aberta) revert EstadoInvalido();
        if (blockedWallets[msg.sender]) revert WalletBlocked();
        if (p.stake > 0) {
            if (msg.value != p.stake) revert StakeIncorreto();
            if (!ageVerified[msg.sender]) revert IdadeNaoVerificada();
        }
        if (p.stake == 0 && msg.value > 0) revert StakeIncorreto();
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

        // Distribuição do pote (apenas se houver stake)
        if (p.stake > 0) {
            uint256 pote = p.stake * 2;
            uint256 taxa = (pote * taxaCasaBps) / 10000;
            uint256 premio = pote - taxa;

            (bool t,) = tesouro.call{value: taxa}("");
            require(t, "taxa");
            (bool w,) = vencedor.call{value: premio}("");
            require(w, "premio");

            emit PartidaResolvida(id, vencedor, premio, placarA, placarB);
        } else {
            emit PartidaResolvida(id, vencedor, 0, placarA, placarB);
        }
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
        if (p.stake > 0) {
            (bool ok,) = p.jogadorA.call{value: p.stake}("");
            require(ok, "reembolso");
        }
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

    function setMinAgeStakedPvP(uint8 _minAge) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_minAge > 0, "minAge must be > 0");
        minAgeStakedPvP = _minAge;
    }

    function setJurisdictionMinAge(bytes32 jurisdictionCode, uint8 _minAge)
        external onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(_minAge > 0, "minAge must be > 0");
        jurisdictionMinAge[jurisdictionCode] = _minAge;
    }

    function setAgeVerified(address wallet, bool verified) external onlyRole(AGE_VERIFIER_ROLE) {
        ageVerified[wallet] = verified;
    }

    function setBlockedWallet(address wallet, bool blocked) external onlyRole(DEFAULT_ADMIN_ROLE) {
        blockedWallets[wallet] = blocked;
    }

    function isEligibleForStakedPvP(address wallet) external view returns (bool) {
        return ageVerified[wallet];
    }

    function getEffectiveMinAge(bytes32 jurisdictionCode) external view returns (uint8) {
        uint8 jurMin = jurisdictionMinAge[jurisdictionCode];
        if (jurMin > 0) return jurMin;
        return minAgeStakedPvP;
    }
}
