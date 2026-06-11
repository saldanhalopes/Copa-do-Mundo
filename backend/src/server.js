// src/server.js — API + WebSocket do CryptoÁlbum Copa
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import http from "http";
import { Matchmaker } from "./matchmaking/Matchmaker.js";
// import { Indexer } from "./indexer/Indexer.js"; // ativar com endereços reais

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json());

const matchmaker = new Matchmaker();
// processa a fila a cada 2s (para pares que só ficam válidos ao expandir a faixa de ELO)
setInterval(() => matchmaker.tick(), 2000);

// ─── Indexer (opcional, requer contratos deployados) ──────────────
// const indexer = new Indexer({
//   rpcUrl: process.env.RPC_AMOY,
//   addresses: { PackStore: "0x...", MatchEscrow: "0x...", Ranking: "0x..." },
// });
// indexer.start();

// ─── REST API ─────────────────────────────────────────────────────

app.get("/health", (_, res) => res.json({ ok: true, ...matchmaker.stats() }));

// Ranking (do indexer; aqui um stub)
app.get("/leaderboard", (req, res) => {
  // return res.json(indexer.getLeaderboard(Number(req.query.limit) || 100));
  res.json([
    { address: "0xcrack...", elo: 1480, v: 87, d: 21 },
    { address: "0x10di...", elo: 1390, v: 64, d: 30 },
  ]);
});

app.get("/elo/:address", (req, res) => {
  // res.json({ elo: indexer.getElo(req.params.address) });
  res.json({ elo: 1000 });
});

app.get("/history/:address", (req, res) => {
  // res.json(indexer.getMatchHistory(req.params.address));
  res.json([]);
});

// ─── WebSocket: matchmaking em tempo real ─────────────────────────
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  let address = null;

  ws.on("message", async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case "queue": {
        // { type:'queue', address, elo, stake, lineupHash }
        address = msg.address;
        ws.send(JSON.stringify({ type: "queued", stake: msg.stake }));
        const result = await matchmaker.enqueue({
          address: msg.address, elo: msg.elo, stake: msg.stake, lineupHash: msg.lineupHash,
        });
        // pareado!
        ws.send(JSON.stringify({ type: "matched", ...result }));
        break;
      }
      case "cancel": {
        if (address) matchmaker.dequeue(address);
        ws.send(JSON.stringify({ type: "cancelled" }));
        break;
      }
    }
  });

  ws.on("close", () => {
    if (address) matchmaker.dequeue(address);
  });
});

server.listen(PORT, () => {
  console.log(`\n⚽ CryptoÁlbum Copa backend rodando na porta ${PORT}`);
  console.log(`   REST:  http://localhost:${PORT}/health`);
  console.log(`   WS:    ws://localhost:${PORT} (matchmaking)`);
});
