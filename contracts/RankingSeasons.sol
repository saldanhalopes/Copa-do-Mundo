// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title RankingSeasons
 * @notice Ranking ELO + temporadas com premiação do fundo de royalties.
 *
 *  - Cada jogador tem um rating ELO (começa em 1000)
 *  - Vitórias/derrotas atualizam o ELO (chamado pelo MatchEscrow)
 *  - Temporadas duram N dias; ao fim, top jogadores dividem o prêmio
 *  - O fundo de prêmios é abastecido pelas taxas das partidas e royalties
 */
contract RankingSeasons is AccessControl, ReentrancyGuard {
    bytes32 public constant MATCH_ROLE = keccak256("MATCH_ROLE");

    uint256 public constant ELO_INICIAL = 1000;
    uint256 public constant K = 32; // fator K do ELO

    struct Jogador {
        uint256 elo;
        uint32  vitorias;
        uint32  derrotas;
        uint32  ultimaTemporada; // para resetar stats de temporada
        bool    registrado;
    }

    mapping(address => Jogador) public jogadores;

    // ─── Temporadas ───────────────────────────────────────────────
    struct Temporada {
        uint64  inicio;
        uint64  fim;
        uint256 fundoPremio;
        bool    finalizada;
        address[] topJogadores; // preenchido na finalização
    }

    uint32 public temporadaAtual;
    mapping(uint32 => Temporada) public temporadas;

    // ranking da temporada: jogador => pontos da temporada
    mapping(uint32 => mapping(address => uint256)) public pontosTemporada;
    mapping(uint32 => address[]) public participantes;

    // distribuição do prêmio (top 3): 50% / 30% / 20%
    uint16[3] public distribuicao = [5000, 3000, 2000];

    event JogadorRegistrado(address indexed jogador);
    event EloAtualizado(address indexed jogador, uint256 novoElo, bool venceu);
    event TemporadaIniciada(uint32 indexed numero, uint64 inicio, uint64 fim);
    event TemporadaFinalizada(uint32 indexed numero, address[] top);
    event PremioPago(address indexed jogador, uint256 valor, uint8 posicao);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MATCH_ROLE, admin);
    }

    // ─── Registro implícito ───────────────────────────────────────

    function _garantirRegistro(address j) internal {
        if (!jogadores[j].registrado) {
            jogadores[j] = Jogador(ELO_INICIAL, 0, 0, temporadaAtual, true);
            emit JogadorRegistrado(j);
        }
    }

    // ─── Atualização de resultado (chamado pelo MatchEscrow) ──────

    /// @notice Registra o resultado de uma partida e atualiza ELO de ambos.
    function registrarResultado(address vencedor, address perdedor)
        external onlyRole(MATCH_ROLE)
    {
        _garantirRegistro(vencedor);
        _garantirRegistro(perdedor);

        uint256 eloV = jogadores[vencedor].elo;
        uint256 eloP = jogadores[perdedor].elo;

        // Expectativa (fórmula ELO simplificada, escala 0–10000)
        // E = 1 / (1 + 10^((elo_oponente - elo_jogador)/400))
        uint256 expectativaV = _expectativa(eloV, eloP);
        uint256 expectativaP = 10000 - expectativaV;

        // Vencedor: resultado real = 10000; Perdedor: 0
        jogadores[vencedor].elo = eloV + (K * (10000 - expectativaV)) / 10000;
        jogadores[perdedor].elo = eloP > (K * expectativaP) / 10000
            ? eloP - (K * expectativaP) / 10000
            : 0;

        jogadores[vencedor].vitorias++;
        jogadores[perdedor].derrotas++;

        // pontos de temporada (vitória = 3 pts, derrota = 0)
        _adicionarPontosTemporada(vencedor, 3);
        _adicionarPontosTemporada(perdedor, 1); // ponto de participação

        emit EloAtualizado(vencedor, jogadores[vencedor].elo, true);
        emit EloAtualizado(perdedor, jogadores[perdedor].elo, false);
    }

    function _expectativa(uint256 eloA, uint256 eloB) internal pure returns (uint256) {
        // Aproximação linear da curva ELO para evitar exponenciais on-chain.
        // Diferença de 400 pts ≈ 90% de expectativa. Clamp em [500, 9500].
        if (eloA >= eloB) {
            uint256 diff = eloA - eloB;
            uint256 e = 5000 + (diff * 4500) / 400;
            return e > 9500 ? 9500 : e;
        } else {
            uint256 diff = eloB - eloA;
            uint256 e = diff * 4500 / 400;
            return e > 4500 ? 500 : 5000 - e;
        }
    }

    function _adicionarPontosTemporada(address j, uint256 pts) internal {
        uint32 t = temporadaAtual;
        if (pontosTemporada[t][j] == 0 && jogadores[j].ultimaTemporada != t) {
            participantes[t].push(j);
            jogadores[j].ultimaTemporada = t;
        } else if (pontosTemporada[t][j] == 0) {
            participantes[t].push(j);
        }
        pontosTemporada[t][j] += pts;
    }

    // ─── Gestão de temporadas ─────────────────────────────────────

    function iniciarTemporada(uint64 duracaoDias) external onlyRole(DEFAULT_ADMIN_ROLE) {
        temporadaAtual++;
        temporadas[temporadaAtual] = Temporada({
            inicio: uint64(block.timestamp),
            fim: uint64(block.timestamp) + duracaoDias * 1 days,
            fundoPremio: 0,
            finalizada: false,
            topJogadores: new address[](0)
        });
        emit TemporadaIniciada(temporadaAtual, uint64(block.timestamp), uint64(block.timestamp) + duracaoDias * 1 days);
    }

    /// @notice Abastece o fundo de prêmio da temporada atual (taxas, royalties).
    function abastecerFundo() external payable {
        temporadas[temporadaAtual].fundoPremio += msg.value;
    }

    /// @notice Finaliza a temporada e paga o top 3. O ranking ordenado é
    ///         calculado off-chain e passado como parâmetro (verificável).
    function finalizarTemporada(uint32 numero, address[] calldata rankingOrdenado)
        external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant
    {
        Temporada storage t = temporadas[numero];
        require(!t.finalizada, "ja finalizada");
        require(block.timestamp >= t.fim, "ainda em andamento");
        t.finalizada = true;

        uint256 fundo = t.fundoPremio;
        uint8 topN = uint8(rankingOrdenado.length < 3 ? rankingOrdenado.length : 3);

        for (uint8 i = 0; i < topN; i++) {
            uint256 premio = (fundo * distribuicao[i]) / 10000;
            t.topJogadores.push(rankingOrdenado[i]);
            (bool ok,) = rankingOrdenado[i].call{value: premio}("");
            require(ok, "premio");
            emit PremioPago(rankingOrdenado[i], premio, i + 1);
        }

        emit TemporadaFinalizada(numero, t.topJogadores);
    }

    // ─── Leitura ──────────────────────────────────────────────────

    function getRating(address j) external view returns (uint256) {
        return jogadores[j].registrado ? jogadores[j].elo : ELO_INICIAL;
    }

    function getParticipantes(uint32 temporada) external view returns (address[] memory) {
        return participantes[temporada];
    }

    function statsJogador(address j) external view returns (uint256 elo, uint32 v, uint32 d) {
        Jogador memory p = jogadores[j];
        return (p.registrado ? p.elo : ELO_INICIAL, p.vitorias, p.derrotas);
    }
}
