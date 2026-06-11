# 🔌 API-SPEC.md — Especificação da API
### CryptoÁlbum Copa Backend

> Contrato formal dos endpoints REST e WebSocket. Base: `backend/src/`.
> Versão: v1. Base URL: `https://api.cryptoalbumcopa.com` (prod) / `http://localhost:3001` (dev).

---

## Autenticação

Autenticação via **assinatura de carteira** (SIWE — Sign-In With Ethereum):

```
1. GET  /auth/nonce?address=0x..     → { nonce }
2. cliente assina a mensagem com a carteira
3. POST /auth/verify { address, signature } → { token (JWT) }
4. requests autenticados: header Authorization: Bearer <token>
```

JWT expira em 24h. Endpoints públicos (leaderboard) não exigem token.

---

## REST API

### Health
```
GET /health
200 → { "ok": true, "queueSize": 3, "activeMatches": 12 }
```

### Ranking
```
GET /leaderboard?limit=100
200 → [ { "address": "0x..", "elo": 1480, "v": 87, "d": 21 }, ... ]

GET /elo/:address
200 → { "elo": 1000 }

GET /history/:address
200 → [ { "id": 42, "winner": "0x..", "score": "3-2", "premio": "19000000000000000000", "ts": 1717... } ]
```

### Coleção (via indexer/subgraph)
```
GET /collection/:address
200 → { "owned": { "1": 2, "5": 1, ... }, "unique": 145, "total": 1352 }

GET /card/:tokenId
200 → { "tokenId": 1, "type": "Jogador", "name": "...", "ovr": 85,
        "rarity": "Épica", "attrs": {...}, "supply": { "minted": 1203, "max": 2500 } }
```

### Trocas (mural off-chain, swap on-chain)
```
GET /trades?wantId=47
200 → [ { "id": "t_123", "user": "0x..", "giveId": 231, "wantId": 47, "createdAt": ... } ]

POST /trades  (auth)
body → { "giveId": 231, "wantId": 47 }
201 → { "id": "t_124" }
```

> Nota: o mural é off-chain (UX), mas a execução da troca é **on-chain** via
> `TradeDesk.aceitarOferta`. O backend só indexa/sugere, nunca custodia.

---

## WebSocket — Matchmaking em tempo real

Conexão: `ws://localhost:3001`

### Protocolo

**Entrar na fila:**
```json
→ { "type": "queue", "address": "0x..", "elo": 1000, "stake": 10, "lineupHash": "0x.." }
← { "type": "queued", "stake": 10 }
```

**Pareado:**
```json
← { "type": "matched", "matchId": 42, "opponent": "0x..", "opponentElo": 1050, "stake": 10 }
```
Após `matched`, o cliente cria/aceita a partida on-chain (`MatchEscrow`).

**Cancelar:**
```json
→ { "type": "cancel" }
← { "type": "cancelled" }
```

### Regras de matchmaking
- Pareia por ELO próximo **e mesma aposta**
- Faixa inicial ±100, expande +25/seg até ±600 máx
- Fila processada a cada 2s (para pares válidos só após expansão)

---

## Webhooks (provedores de pagamento)

### Binance Pay
```
POST /binancepay/webhook
header: BinancePay-Signature (HMAC-SHA512)
body → { merchantTradeNo, transactionId, status, buyerOpenId }

Fluxo: verifica assinatura → se PAY_SUCCESS → chama
       FigurinhasCopaBNB.confirmarBinancePay() on-chain
resposta → { "returnCode": "SUCCESS" }
```

### Crossmint (Polygon)
```
POST /crossmint/webhook
body → { orderId, status, recipient }
Fluxo: confirma pagamento → mint via PackStore
```

---

## Códigos de erro

| HTTP | Código | Significado |
|---|---|---|
| 400 | `BAD_REQUEST` | Parâmetros inválidos |
| 401 | `UNAUTHORIZED` | Token ausente/inválido |
| 403 | `FORBIDDEN` | Sem permissão / jurisdição bloqueada |
| 404 | `NOT_FOUND` | Recurso inexistente |
| 409 | `CONFLICT` | Ex: já está na fila |
| 429 | `RATE_LIMITED` | Excedeu limite de requests |
| 500 | `INTERNAL` | Erro do servidor |

Formato de erro:
```json
{ "error": { "code": "RATE_LIMITED", "message": "...", "retryAfter": 30 } }
```

---

## Rate limiting

| Escopo | Limite |
|---|---|
| Por IP (não autenticado) | 60 req/min |
| Por usuário (autenticado) | 300 req/min |
| WebSocket (mensagens) | 30/min |
| Webhooks | sem limite (com verificação de assinatura) |

---

## Infraestrutura

| Componente | Tecnologia | Escala |
|---|---|---|
| API HTTP | NestJS/Express | horizontal (stateless) |
| WebSocket | ws + Redis pub/sub | sticky sessions ou Redis |
| Matchmaking | fila em Redis | compartilhada entre instâncias |
| Indexer | The Graph (subgraph) + ethers | leitura rápida |
| Banco | PostgreSQL | mural de trocas, usuários |
| Cache | Redis | sessões, leaderboard |

---

## Versionamento

- Prefixo de versão: `/v1/...` (futuro)
- Mudanças breaking → nova versão major
- Depreciação anunciada com 90 dias de antecedência

---

## Segurança da API

- HTTPS obrigatório (TLS 1.2+)
- CORS restrito aos domínios oficiais
- Validação de input (schema) em todos os endpoints
- Webhooks: verificação de assinatura HMAC obrigatória
- Nenhuma chave privada no backend (assinaturas no cliente)
- Rate limiting + proteção DDoS (Cloudflare)
