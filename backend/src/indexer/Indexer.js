// src/indexer/Indexer.js
// Indexa eventos dos contratos para servir dados rápidos à API,
// sem precisar consultar a chain a cada request.
//
// Em produção, isto seria substituído/complementado por um subgraph (The Graph).
// Aqui mostramos a estrutura com ethers.js ouvindo eventos.

import { ethers } from "ethers";

// ABIs mínimos (só os eventos que indexamos)
const PACK_STORE_ABI = [
  "event PacoteAberto(address indexed comprador, uint256 requestId, uint256[] ids)",
];
const MATCH_ABI = [
  "event PartidaResolvida(uint256 indexed id, address indexed vencedor, uint256 premio, uint8 placarA, uint8 placarB)",
];
const RANKING_ABI = [
  "event EloAtualizado(address indexed jogador, uint256 novoElo, bool venceu)",
];

export class Indexer {
  constructor({ rpcUrl, addresses }) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.addresses = addresses;
    // estado indexado em memória (em produção: PostgreSQL/Redis)
    this.elo = new Map();         // address -> elo
    this.matchHistory = [];        // { id, winner, score, premio, ts }
    this.packsOpened = [];         // { buyer, ids, ts }
    this.leaderboard = [];         // ordenado por elo
  }

  start() {
    const pack = new ethers.Contract(this.addresses.PackStore, PACK_STORE_ABI, this.provider);
    const match = new ethers.Contract(this.addresses.MatchEscrow, MATCH_ABI, this.provider);
    const ranking = new ethers.Contract(this.addresses.Ranking, RANKING_ABI, this.provider);

    pack.on("PacoteAberto", (buyer, requestId, ids) => {
      this.packsOpened.push({ buyer, ids: ids.map(Number), ts: Date.now() });
      console.log(`[Indexer] Pacote aberto por ${buyer}: ${ids.length} cartas`);
    });

    match.on("PartidaResolvida", (id, winner, premio, placarA, placarB) => {
      this.matchHistory.push({
        id: Number(id), winner, premio: premio.toString(),
        score: `${placarA}-${placarB}`, ts: Date.now(),
      });
      console.log(`[Indexer] Partida ${id} resolvida: vencedor ${winner}`);
    });

    ranking.on("EloAtualizado", (jogador, novoElo, venceu) => {
      this.elo.set(jogador.toLowerCase(), Number(novoElo));
      this._rebuildLeaderboard();
    });

    console.log("[Indexer] Ouvindo eventos on-chain…");
  }

  _rebuildLeaderboard() {
    this.leaderboard = [...this.elo.entries()]
      .map(([address, elo]) => ({ address, elo }))
      .sort((a, b) => b.elo - a.elo);
  }

  getElo(address) {
    return this.elo.get(address.toLowerCase()) ?? 1000;
  }

  getLeaderboard(limit = 100) {
    return this.leaderboard.slice(0, limit);
  }

  getMatchHistory(address) {
    const a = address.toLowerCase();
    return this.matchHistory.filter(
      (m) => m.winner.toLowerCase() === a
    );
  }
}
