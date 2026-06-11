import { ethers } from "ethers";
import config from "../config.js";
import { getPlayer, upsertPlayer } from "../db/database.js";

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
  constructor({ rpcUrl, addresses, startBlock = 0 }) {
    this.rpcUrl = rpcUrl;
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.addresses = addresses;
    this.startBlock = parseInt(startBlock, 10) || 0;
    this.lastIndexedBlock = this.startBlock;

    this.elo = new Map();
    this.matchHistory = [];
    this.packsOpened = [];
    this.leaderboard = [];

    this._running = false;
    this._reconnectAttempts = 0;
    this._maxReconnectAttempts = 10;
    this._baseReconnectDelay = 1000;
  }

  async start() {
    if (this._running) return;
    this._running = true;

    if (this.startBlock > 0) {
      console.log(`[Indexer] Starting from block ${this.startBlock}`);
      await this._indexPastEvents(this.startBlock);
    }

    this._listenToEvents();
  }

  stop() {
    this._running = false;
    if (this._packContract) {
      this._packContract.removeAllListeners();
    }
    if (this._matchContract) {
      this._matchContract.removeAllListeners();
    }
    if (this._rankingContract) {
      this._rankingContract.removeAllListeners();
    }
  }

  _listenToEvents() {
    if (!this.addresses.PackStore || !this.addresses.MatchEscrow || !this.addresses.Ranking) {
      console.warn("[Indexer] Contract addresses not fully configured; skipping listener setup");
      this._running = false;
      return;
    }

    try {
      this._packContract = new ethers.Contract(
        this.addresses.PackStore, PACK_STORE_ABI, this.provider
      );
      this._matchContract = new ethers.Contract(
        this.addresses.MatchEscrow, MATCH_ABI, this.provider
      );
      this._rankingContract = new ethers.Contract(
        this.addresses.Ranking, RANKING_ABI, this.provider
      );

      this._setupListeners();
    } catch (err) {
      console.error("[Indexer] Failed to setup event listeners:", err.message);
      this._scheduleReconnect();
    }
  }

  _setupListeners() {
    this._packContract.on("PacoteAberto", (...args) => {
      const event = args[args.length - 1];
      const [buyer, requestId, ids] = args;
      this.packsOpened.push({ buyer, ids: ids.map(Number), ts: Date.now(), block: event.blockNumber });
      this.lastIndexedBlock = Math.max(this.lastIndexedBlock, event.blockNumber);
      this._reconnectAttempts = 0;
    });

    this._matchContract.on("PartidaResolvida", (...args) => {
      const event = args[args.length - 1];
      const [id, winner, premio, placarA, placarB] = args;
      this.matchHistory.push({
        id: Number(id), winner, premio: premio.toString(),
        score: `${placarA}-${placarB}`, ts: Date.now(), block: event.blockNumber,
      });
      this.lastIndexedBlock = Math.max(this.lastIndexedBlock, event.blockNumber);
      this._reconnectAttempts = 0;
    });

    this._rankingContract.on("EloAtualizado", (...args) => {
      const event = args[args.length - 1];
      const [jogador, novoElo, venceu] = args;
      const address = jogador.toLowerCase();
      this.elo.set(address, Number(novoElo));
      this._rebuildLeaderboard();

      upsertPlayer({
        address,
        elo: Number(novoElo),
        winsDelta: venceu ? 1 : 0,
        lossesDelta: venceu ? 0 : 1,
      });

      this.lastIndexedBlock = Math.max(this.lastIndexedBlock, event.blockNumber);
      this._reconnectAttempts = 0;
    });

    this.provider.on("error", (err) => {
      console.error("[Indexer] Provider error:", err.message);
      this._scheduleReconnect();
    });

    console.log("[Indexer] Listening for on-chain events...");
  }

  async _indexPastEvents(fromBlock) {
    const toBlock = await this.provider.getBlockNumber();
    console.log(`[Indexer] Indexing events from block ${fromBlock} to ${toBlock}`);

    try {
      if (this.addresses.Ranking) {
        const rankingContract = new ethers.Contract(
          this.addresses.Ranking, RANKING_ABI, this.provider
        );
        const filter = rankingContract.filters.EloAtualizado();
        const events = await rankingContract.queryFilter(filter, fromBlock, toBlock);
        for (const e of events) {
          const [jogador, novoElo, venceu] = e.args;
          const address = jogador.toLowerCase();
          this.elo.set(address, Number(novoElo));
          upsertPlayer({
            address,
            elo: Number(novoElo),
            winsDelta: venceu ? 1 : 0,
            lossesDelta: venceu ? 0 : 1,
          });
        }
        this._rebuildLeaderboard();
        console.log(`[Indexer] Indexed ${events.length} EloAtualizado events`);
      }
    } catch (err) {
      console.error("[Indexer] Past event indexing error:", err.message);
    }
  }

  _scheduleReconnect() {
    if (!this._running) return;
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      console.error("[Indexer] Max reconnection attempts reached");
      this._running = false;
      return;
    }

    const delay = Math.min(
      this._baseReconnectDelay * Math.pow(2, this._reconnectAttempts),
      30000
    );
    this._reconnectAttempts++;
    console.log(`[Indexer] Reconnecting in ${delay}ms (attempt ${this._reconnectAttempts})`);

    setTimeout(() => {
      if (this._running) {
        this.stop();
        this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
        this._listenToEvents();
      }
    }, delay);
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

  getLastIndexedBlock() {
    return this.lastIndexedBlock;
  }
}
