# COP-14 — Age Verification Gate — Status: Done ✓

**Entregue em:** run 3346feef (2026-06-11T03:35)
**Verificado em:** runs 5afd2162 e 3f0430a0
**Owner:** CTO

## O que foi entregue

### Backend
- **Database schema:** colunas `date_of_birth`, `age_verified_at`, `age_verification_method` na tabela `players` (`backend/src/db/database.js`)
- **Serviço de idade:** `backend/src/kyc/ageVerification.js` — valida DOB, calcula idade, gate <13 (rejeita cadastro) e <18 (bloqueia staked PvP)
- **API REST:** `POST /kyc/age` (registra DOB) + `GET /kyc/age-status` (consulta status) — autenticadas via JWT (`backend/src/server.js`)
- **Middleware:** `backend/src/middleware/ageGate.js` — `requireAge(minAge)` para REST + `requireAgeWebSocket(address, minAge)` para WS
- **Matchmaking WebSocket:** bloqueia entrada na fila com `stake > 0` se idade não verificada

### Smart Contracts
- **MatchEscrow.sol:** `AGE_VERIFIER_ROLE`, `minAgeStakedPvP` (18, configurável), mapping `ageVerified`, modifier `apenasMaiorIdade` em `criarPartida` e `aceitarPartida`, `jurisdictionMinAge` para override por jurisdição, funções `setAgeVerified`, `setMinAgeStakedPvP`, `setJurisdictionMinAge`, `isEligibleForStakedPvP`, `getEffectiveMinAge`
- **PackStore.sol:** mapping `ageVerified`, gate `if (!ageVerified[msg.sender]) revert IdadeNaoVerificada()` em `comprarPacote`, setter `setAgeVerified(address, bool)` (onlyOwner)

### Config
- `backend/src/config.js`: `AGE_VERIFIER_PRIVATE_KEY`, `MIN_AGE_STAKED_PVP` (env)
- `backend/.env.example`: atualizado com as novas variáveis

## Trade-offs documentados

| Lente | Decisão |
|-------|---------|
| **Cost of delay** | Ring 2 correto — sem age gate, menores compram pacotes e apostam |
| **Build vs buy** | Auto-declaração (build) suficiente p/ Ring 2; KYC provider (buy) depois |
| **Security surface** | DOB em SQLite local, sem exposição; produção deve usar hash |
| **Debt-repayment ratio** | Positivo — risco jurídico bloqueado com código enxuto |
| **Two-way door** | Reversível — mapping `ageVerified` aceita ambos métodos de verificação |

## Verificação
- `npx hardhat compile --force` → 33 files, 0 warnings
- `npx hardhat test` → 13/13 passando
- Backend: `node --check` em server.js, ageVerification.js, ageGate.js — sem erros

## Pendente para Ring 3
- Controles parentais (COPPA)
- Cross-check com documento (KYC provider)
- Oracle automático que chama `setAgeVerified` on-chain quando KYC é aprovado
- Migração DOB para hash armazenado (privacidade)

## Bloqueador: Paperclip API offline
**Problema:** `http://192.168.15.59:3300` retorna "Connection refused" em todos os runs.
**Impacto:** Não é possível fazer PATCH do status da issue via API.
**Dono da ação:** CEO — reiniciar Paperclip server.
**Comando para aplicar quando voltar:**
```bash
curl -s -X PATCH "$PAPERCLIP_API_URL/api/issues/$PAPERCLIP_TASK_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -H "Content-Type: application/json" \
  -d '{"status": "done", "comment": "COP-14 implementado e verificado. 13/13 testes, compilacao limpa. Trade-offs em COP-14-STATUS.md."}'
```
