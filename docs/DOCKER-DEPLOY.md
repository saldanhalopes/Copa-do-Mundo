# 🐳 DOCKER-DEPLOY.md — Deploy Local com Docker
### CryptoÁlbum Copa

> Especificação para subir o ambiente de desenvolvimento completo localmente
> com Docker Compose: blockchain, contratos, IPFS, banco, cache e backend.

---

## 1. Visão geral da stack local

```
┌──────────────────────────────────────────────────────────┐
│                  docker-compose (rede: copa)               │
│                                                            │
│  ┌──────────┐   ┌──────────┐   ┌─────────┐                │
│  │ hardhat  │◄──│ deployer │   │  ipfs   │                │
│  │ :8545    │   │ (1x)     │   │ :5001   │                │
│  │ blockchain   │ deploy   │   │ :8080   │                │
│  └────┬─────┘   └────┬─────┘   └─────────┘                │
│       │              │ grava endereços                     │
│       │              ▼                                     │
│       │        [volume: deployments]                       │
│       │              │                                     │
│  ┌────▼─────┐   ┌─────▼────┐   ┌─────────┐   ┌──────────┐ │
│  │ postgres │   │ backend  │◄──│  redis  │   │  (Unity/ │ │
│  │ :5432    │◄──│ :3001    │   │ :6379   │   │  React   │ │
│  └──────────┘   └──────────┘   └─────────┘   │  host)   │ │
│                       ▲                       └────┬─────┘ │
└───────────────────────┼────────────────────────────┼──────┘
                        │ API/WS :3001               │ RPC :8545
                   cliente conecta nas portas expostas no host
```

---

## 2. Serviços

| Serviço | Imagem/Build | Porta | Função |
|---|---|---|---|
| **hardhat** | build `docker/hardhat.Dockerfile` | 8545 | Nó blockchain local (chainId 31337) |
| **deployer** | build `docker/hardhat.Dockerfile` | — | Deploya os 8 contratos (roda 1×) |
| **ipfs** | `ipfs/kubo` | 5001, 8080 | Metadados e arte local |
| **postgres** | `postgres:16-alpine` | 5432 | Mural de trocas, usuários |
| **redis** | `redis:7-alpine` | 6379 | Matchmaking, cache, sessões |
| **backend** | build `backend/Dockerfile` | 3001 | API REST + WebSocket |

---

## 3. Pré-requisitos

- **Docker** 24+ e **Docker Compose** v2
- 4 GB RAM livres (mínimo)
- Portas livres: 8545, 5001, 8080, 5432, 6379, 3001

```bash
docker --version          # Docker version 24+
docker compose version    # v2.x
```

---

## 4. Subir o ambiente

```bash
# na raiz do projeto
docker compose up -d --build

# acompanhar logs
docker compose logs -f backend
docker compose logs -f deployer   # ver os endereços deployados
```

### Ordem de inicialização (orquestrada por healthchecks)
```
1. hardhat sobe   → healthcheck (eth_blockNumber responde)
2. deployer roda  → deploya contratos → grava deployments/local.json → encerra
3. postgres/redis → healthcheck (pg_isready / redis ping)
4. backend sobe   → lê deployments/local.json → API no ar
5. ipfs           → independente
```

---

## 5. Verificar que está funcionando

```bash
# blockchain respondendo
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

# backend e contratos carregados
curl -s http://localhost:3001/health
curl -s http://localhost:3001/contracts    # endereços dos contratos

# IPFS
curl -s http://localhost:5001/api/v0/version -X POST

# endereços deployados
docker compose exec backend cat /app/deployments/local.json
```

---

## 6. Conectar os clientes

### Unity (ChainSafe)
- Adicionar rede local: RPC `http://localhost:8545`, chainId `31337`
- Pegar endereços via `GET http://localhost:3001/contracts`
- Importar uma conta de teste do Hardhat (chave privada nos logs do nó)

### React (protótipo)
- Apontar wagmi/viem para `http://localhost:8545`
- Backend em `http://localhost:3001`

### MetaMask (testar manualmente)
```
Nome:     Hardhat Local
RPC URL:  http://localhost:8545
Chain ID: 31337
Moeda:    ETH
```
Importar conta de teste (chave nos logs: `docker compose logs hardhat`).

---

## 7. Volumes (persistência)

| Volume | Conteúdo | Persistência |
|---|---|---|
| `deployments` | endereços dos contratos (local.json) | recriado a cada deploy |
| `ipfs_data` | blocos IPFS | persiste |
| `pg_data` | banco PostgreSQL | persiste |
| `redis_data` | snapshot Redis | persiste |

> ⚠️ O nó Hardhat **não** persiste estado entre `down`/`up` — a blockchain
> é recriada do zero e os contratos re-deployados. Isso é proposital em dev.

---

## 8. Comandos úteis

```bash
docker compose up -d --build      # subir (rebuild)
docker compose down               # derrubar (mantém volumes)
docker compose down -v            # derrubar + apagar volumes
docker compose restart backend    # reiniciar um serviço
docker compose logs -f backend    # logs ao vivo
docker compose ps                 # status dos serviços
docker compose exec backend sh    # shell no backend

# re-deployar contratos (blockchain já no ar)
docker compose run --rm deployer

# limpar tudo (cuidado)
docker compose down -v --rmi local
```

---

## 9. Variáveis de ambiente (backend)

Injetadas pelo compose (não precisa de .env em dev):

| Var | Valor (local) | Uso |
|---|---|---|
| `PORT` | 3001 | porta da API |
| `RPC_LOCAL` | http://hardhat:8545 | nó blockchain |
| `DATABASE_URL` | postgresql://copa:...@postgres:5432/cryptoalbum | banco |
| `REDIS_URL` | redis://redis:6379 | cache/matchmaking |
| `IPFS_API` | http://ipfs:5001 | metadados |
| `DEPLOYMENTS_PATH` | /app/deployments/local.json | endereços |

> Nomes de host (`hardhat`, `postgres`, `redis`, `ipfs`) resolvem dentro da rede
> `copa` do compose. No host, use `localhost`.

---

## 10. Fluxo de desenvolvimento típico

```bash
# 1. subir tudo
docker compose up -d --build

# 2. semear dados (cartas no IPFS, configurar contratos)
docker compose exec deployer npx hardhat run scripts/seed-cards.js --network localhost

# 3. desenvolver o cliente (Unity/React no host) apontando para localhost

# 4. ver logs enquanto testa
docker compose logs -f backend

# 5. ao terminar
docker compose down
```

---

## 11. Troubleshooting

| Problema | Causa | Solução |
|---|---|---|
| `backend` reinicia | deployments/local.json ausente | ver logs do `deployer`; rodar `docker compose run --rm deployer` |
| Porta em uso | outro processo na 8545/3001/etc | parar o processo ou mudar a porta no compose |
| Contratos não aparecem | deployer falhou | `docker compose logs deployer` |
| Hardhat lento p/ subir | build inicial | aguardar; healthcheck tem 20 retries |
| Sem RAM | muitos serviços | aumentar limite do Docker Desktop |

---

## 12. Diferenças local vs produção

| Aspecto | Local (Docker) | Produção |
|---|---|---|
| Blockchain | Hardhat (31337) | Polygon/BNB mainnet |
| VRF | Mock (instantâneo) | Chainlink/Binance Oracle |
| IPFS | Kubo local | Pinata + Arweave |
| Banco | Postgres container | RDS/Cloud SQL gerenciado |
| Backend | 1 container | horizontal scaling (k8s) |
| Secrets | env no compose | vault/secrets manager |

> Este setup é para **desenvolvimento e testes**, não produção.
> Para mainnet, ver `scripts/deploy-testnet.js` e `SECURITY-OPS.md`.

---

## 13. Próximos passos de infra (produção)

- Kubernetes (Helm charts) para o backend
- The Graph (subgraph) em vez do indexer simples
- RPC gerenciado (Chainstack/Alchemy) em vez do nó local
- IPFS via Pinata + backup Arweave
- CI/CD buildando e publicando as imagens (ver TESTING-QA §8)
