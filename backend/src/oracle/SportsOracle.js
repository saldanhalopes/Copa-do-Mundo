// src/oracle/SportsOracle.js
// Oráculo de desempenho real: busca resultados de jogos de uma API esportiva
// e converte em pontos para o modo Fantasy e o "álbum vivo" (estrelas nas cartas
// de jogadores que se destacam no torneio real).
//
// Em produção, a fonte seria uma API licenciada (ex.: Sportradar, API-Football)
// e os pontos seriam injetados on-chain via Chainlink Functions ->
// FantasyLeague.registrarDesempenho().

export class SportsOracle {
  constructor({ apiKey, registrarDesempenhoFn } = {}) {
    this.apiKey = apiKey;
    this.registrar = registrarDesempenhoFn; // callback que escreve on-chain
  }

  /**
   * Pontuação de desempenho (regras estilo Cartola):
   *  gol marcado          = +5 (atacante/meia), +8 (defensor/goleiro)
   *  assistência          = +3
   *  jogo sem sofrer gol  = +4 (goleiro/zagueiro)
   *  defesa difícil       = +1.5
   *  cartão amarelo       = -1
   *  cartão vermelho      = -3
   *  gol contra           = -3
   *  pênalti perdido      = -2
   */
  computePoints(playerStats, position) {
    const isDefender = position === "GOL" || position === "ZAG" || position.startsWith("L");
    let pts = 0;
    pts += (playerStats.goals || 0) * (isDefender ? 8 : 5);
    pts += (playerStats.assists || 0) * 3;
    if (isDefender && playerStats.cleanSheet) pts += 4;
    pts += (playerStats.saves || 0) * 1.5;
    pts -= (playerStats.yellowCards || 0) * 1;
    pts -= (playerStats.redCards || 0) * 3;
    pts -= (playerStats.ownGoals || 0) * 3;
    pts -= (playerStats.penaltiesMissed || 0) * 2;
    return Math.round(pts * 10) / 10;
  }

  /**
   * Processa uma rodada: mapeia tokenIds das cartas para jogadores reais,
   * calcula pontos e os injeta on-chain.
   * @param {Array} fixtures resultados dos jogos
   * @param {Map} tokenToPlayer  tokenId -> { apiPlayerId, position }
   */
  async processRound(fixtures, tokenToPlayer) {
    const tokenIds = [];
    const points = [];

    for (const [tokenId, info] of tokenToPlayer.entries()) {
      const stats = this._extractStats(fixtures, info.apiPlayerId);
      if (!stats) continue;
      const pts = this.computePoints(stats, info.position);
      tokenIds.push(tokenId);
      points.push(Math.round(pts * 100)); // pontos em centésimos (int para on-chain)
    }

    if (this.registrar && tokenIds.length > 0) {
      await this.registrar(tokenIds, points);
      console.log(`[Oracle] ${tokenIds.length} desempenhos registrados on-chain`);
    }
    return { tokenIds, points };
  }

  _extractStats(fixtures, apiPlayerId) {
    for (const fx of fixtures) {
      const p = (fx.players || []).find((pl) => pl.id === apiPlayerId);
      if (p) return p.stats;
    }
    return null;
  }

  /**
   * Determina quais cartas ganham "estrela" no álbum vivo
   * (jogadores que se destacaram: 2+ gols, ou nota alta).
   */
  starsForRound(fixtures) {
    const stars = [];
    for (const fx of fixtures) {
      for (const p of fx.players || []) {
        const s = p.stats || {};
        if ((s.goals || 0) >= 2 || (s.rating || 0) >= 8.5) {
          stars.push({ apiPlayerId: p.id, reason: (s.goals >= 2 ? "multigol" : "craque") });
        }
      }
    }
    return stars;
  }
}
