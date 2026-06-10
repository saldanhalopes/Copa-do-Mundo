// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
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
 * @title FantasyLeague
 * @notice Modo Fantasy: usuário escala 11 cartas (figurinhas NFT) e pontua.
 *
 *  Pontuação = OVR do time + bônus de química (Chemistry, estilo FIFA UT)
 *              + pontos de desempenho real (injetados por oráculo).
 *
 *  Regras de química:
 *   - Carta na posição correta da formação: +3 química
 *   - 2+ cartas da mesma seleção: +2 química por carta extra
 *   - Time 100% de uma seleção: bônus de +15
 */
contract FantasyLeague is AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    IERC1155   public immutable figurinhas;
    ICardStats public immutable stats;

    // Formação alvo (11 posições). Ex.: 4-3-3
    // posições: 0=GOL 1=ZAG 2=LD 3=LE 4=VOL 5=MEI 6=PD 7=PE 8=CAM
    struct Escalacao {
        uint256[11] cartas;     // tokenIds
        uint8[11]   posicoesAlvo;
        uint256     pontuacao;
        uint64      rodada;
        bool        ativa;
    }

    mapping(address => Escalacao) public escalacoes;

    // Pontos de desempenho real por carta, por rodada (injetados pelo oráculo)
    // tokenId => rodada => pontos
    mapping(uint256 => mapping(uint64 => int256)) public pontosDesempenho;

    uint64 public rodadaAtual;

    event TimeEscalado(address indexed jogador, uint256 pontuacao, uint8 quimica);
    event RodadaAvancada(uint64 rodada);
    event DesempenhoRegistrado(uint256 indexed tokenId, uint64 rodada, int256 pontos);

    error NaoPossuiCarta(uint256 tokenId);
    error EscalacaoIncompleta();

    constructor(address _figurinhas, address _stats, address admin) {
        figurinhas = IERC1155(_figurinhas);
        stats      = ICardStats(_stats);
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
    }

    // ─── Escalar o time ──────────────────────────────────────────

    /// @notice Escala 11 cartas numa formação. Calcula OVR + química.
    function escalar(uint256[11] calldata cartas, uint8[11] calldata posicoesAlvo) external {
        uint256 somaOvr;
        uint8 quimica;
        uint8 mesmaSelecaoCount;
        uint8 selecaoBase = 255;

        for (uint8 i = 0; i < 11; i++) {
            uint256 id = cartas[i];

            // 1. Verifica posse on-chain
            if (figurinhas.balanceOf(msg.sender, id) == 0) revert NaoPossuiCarta(id);

            ICardStats.Carta memory c = stats.getCarta(id);
            somaOvr += c.ovr;

            // 2. Química: carta na posição certa?
            if (c.posicao == posicoesAlvo[i]) {
                quimica += 3;
            }

            // 3. Química: mesma seleção?
            if (selecaoBase == 255) {
                selecaoBase = c.selecao;
                mesmaSelecaoCount = 1;
            } else if (c.selecao == selecaoBase) {
                mesmaSelecaoCount++;
                quimica += 2;
            }
        }

        // 4. Bônus time monoseleção
        if (mesmaSelecaoCount == 11) quimica += 15;

        uint256 pontuacao = somaOvr + uint256(quimica);

        escalacoes[msg.sender] = Escalacao({
            cartas: cartas,
            posicoesAlvo: posicoesAlvo,
            pontuacao: pontuacao,
            rodada: rodadaAtual,
            ativa: true
        });

        emit TimeEscalado(msg.sender, pontuacao, quimica);
    }

    // ─── Pontuação com desempenho real ───────────────────────────

    /// @notice Calcula a pontuação final do time na rodada atual,
    ///         somando OVR+química com o desempenho real dos jogadores.
    function pontuacaoTotal(address jogador) external view returns (int256 total) {
        Escalacao storage e = escalacoes[jogador];
        if (!e.ativa) return 0;

        total = int256(e.pontuacao);
        for (uint8 i = 0; i < 11; i++) {
            total += pontosDesempenho[e.cartas[i]][rodadaAtual];
        }
    }

    // ─── Oráculo de desempenho (Chainlink Functions / API esportiva) ──

    /// @notice O oráculo injeta os pontos de desempenho real dos jogadores.
    ///         Ex.: gol = +5, assistência = +3, cartão vermelho = -3.
    function registrarDesempenho(
        uint256[] calldata tokenIds,
        int256[]  calldata pontos
    ) external onlyRole(ORACLE_ROLE) {
        require(tokenIds.length == pontos.length, "tamanhos");
        for (uint256 i = 0; i < tokenIds.length; i++) {
            pontosDesempenho[tokenIds[i]][rodadaAtual] = pontos[i];
            emit DesempenhoRegistrado(tokenIds[i], rodadaAtual, pontos[i]);
        }
    }

    function avancarRodada() external onlyRole(ORACLE_ROLE) {
        rodadaAtual++;
        emit RodadaAvancada(rodadaAtual);
    }
}
