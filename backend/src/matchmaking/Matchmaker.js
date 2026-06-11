// src/matchmaking/Matchmaker.js
// Fila de matchmaking PvP por ELO. Pareia jogadores com rating próximo,
// expandindo a faixa de busca quanto mais tempo o jogador espera.

export class Matchmaker {
  constructor({ baseRange = 100, expandPerSec = 25, maxRange = 600 } = {}) {
    this.queue = []; // { address, elo, stake, joinedAt, lineupHash, resolve }
    this.baseRange = baseRange;
    this.expandPerSec = expandPerSec;
    this.maxRange = maxRange;
    this.matches = new Map(); // matchId -> { a, b, stake, createdAt }
    this._nextId = 1;
  }

  /**
   * Entra na fila. Retorna uma Promise que resolve quando pareado.
   * @param {object} player { address, elo, stake, lineupHash }
   */
  enqueue(player) {
    return new Promise((resolve) => {
      const entry = { ...player, joinedAt: Date.now(), resolve };
      // tenta parear imediatamente
      const opponent = this._findOpponent(entry);
      if (opponent) {
        this._pair(entry, opponent);
      } else {
        this.queue.push(entry);
      }
    });
  }

  /** Remove jogador da fila (cancelou). */
  dequeue(address) {
    this.queue = this.queue.filter((p) => p.address !== address);
  }

  /** Faixa de ELO aceitável conforme tempo de espera. */
  _currentRange(entry) {
    const waitedSec = (Date.now() - entry.joinedAt) / 1000;
    return Math.min(this.maxRange, this.baseRange + waitedSec * this.expandPerSec);
  }

  _findOpponent(entry) {
    let best = null;
    let bestDiff = Infinity;
    for (const other of this.queue) {
      if (other.address === entry.address) continue;
      if (other.stake !== entry.stake) continue; // mesma aposta
      const diff = Math.abs(other.elo - entry.elo);
      const range = Math.max(this._currentRange(entry), this._currentRange(other));
      if (diff <= range && diff < bestDiff) {
        best = other;
        bestDiff = diff;
      }
    }
    return best;
  }

  _pair(a, b) {
    this.queue = this.queue.filter((p) => p !== a && p !== b);
    const matchId = this._nextId++;
    const match = { matchId, a: a.address, b: b.address, stake: a.stake, createdAt: Date.now() };
    this.matches.set(matchId, match);
    const payload = { matchId, stake: a.stake };
    a.resolve({ ...payload, opponent: b.address, opponentElo: b.elo });
    b.resolve({ ...payload, opponent: a.address, opponentElo: a.elo });
    return match;
  }

  /** Processa a fila periodicamente (para pares que só ficam válidos ao expandir a faixa). */
  tick() {
    // ordena por tempo de espera (mais antigo primeiro)
    const sorted = [...this.queue].sort((x, y) => x.joinedAt - y.joinedAt);
    for (const entry of sorted) {
      if (!this.queue.includes(entry)) continue;
      const opp = this._findOpponent(entry);
      if (opp) this._pair(entry, opp);
    }
  }

  stats() {
    return { queueSize: this.queue.length, activeMatches: this.matches.size };
  }
}
