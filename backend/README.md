# Backend — CryptoÁlbum Copa

Servidor de matchmaking PvP, indexador on-chain e API de jogos.

## Componentes

| Módulo | Função |
|---|---|
| `matchmaking/Matchmaker.js` | Fila PvP por ELO, com faixa que expande conforme a espera |
| `indexer/Indexer.js` | Indexa eventos dos contratos (pacotes, partidas, ELO) |
| `oracle/SportsOracle.js` | Desempenho real dos jogadores → pontos Fantasy / álbum vivo |
| `server.js` | REST API + WebSocket (matchmaking em tempo real) |

## Rodar

```bash
cd backend
npm install
npm start
```

- REST: `http://localhost:3001/health`, `/leaderboard`, `/elo/:address`
- WebSocket: `ws://localhost:3001` — protocolo de matchmaking:
  ```json
  → { "type":"queue", "address":"0x..", "elo":1000, "stake":10 }
  ← { "type":"queued", "stake":10 }
  ← { "type":"matched", "matchId":1, "opponent":"0x..", "opponentElo":1050 }
  ```

## Matchmaking por ELO

- Pareia jogadores com rating próximo **e mesma aposta**
- Faixa inicial: ±100 ELO, expandindo +25/seg até ±600 máximo
- Quanto mais espera, mais ampla a busca (evita espera infinita)

## Indexer

Ouve eventos on-chain via ethers.js. Em produção, complementar/substituir por um
**subgraph (The Graph)** para consultas complexas. Preencher os endereços dos
contratos após o deploy.

## Oráculo esportivo

Converte estatísticas reais (gols, assistências, cartões) em pontos estilo Cartola,
e injeta on-chain via `FantasyLeague.registrarDesempenho()`. Requer API esportiva
licenciada em produção (Sportradar, API-Football).
