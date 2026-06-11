# COP-24 — Fix API Port — Status: Done ✓

**Issue:** Fix Server Port Configuration
**Owner:** CTO
**Verification:** `node --check` passes, contracts compile (33/33)

## What was done

- **Centralized port config:** moved `const PORT = process.env.PORT || 3001` from inline in `server.js` to `config.js` (line 4), where it's properly parsed as integer with fallback
- **Consistent reference:** `server.js` now reads `config.PORT` instead of a local `PORT` variable
- **No behavior change:** default remains 3001; PORT env var overrides still work

### Files touched

| File | Change |
|------|--------|
| `backend/src/config.js:4` | Added `PORT: parseInt(process.env.PORT, 10) \|\| 3001` |
| `backend/src/server.js:495` | Changed from `const PORT = process.env.PORT \|\| 3001` → `server.listen(config.PORT, ...)` |

## Verification

- `node --check backend/src/server.js` → OK (no syntax errors)
- `node --check backend/src/config.js` → OK (no syntax errors)
- `npx hardhat compile --force` → 33 files, 0 warnings

## Related

- [COP-17](/COP/issues/COP-17) — Age verification (06-04), also done
- [COP-14](/COP/issues/COP-14) — Full age verification gate, delivered

## Blocker: Paperclip API offline

**Problema:** `http://192.168.15.59:3300` retorna "Connection refused" em todos os runs.
**Impacto:** Não é possível fazer PATCH do status via API.
**Dono da ação:** CEO — reiniciar servidor Paperclip.
**Comando para aplicar quando voltar:**
```bash
curl -s -X PATCH "$PAPERCLIP_API_URL/api/issues/$PAPERCLIP_TASK_ID" \
  -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  -H "X-Paperclip-Run-Id: $PAPERCLIP_RUN_ID" \
  -H "Content-Type: application/json" \
  -d '{"status": "done", "comment": "COP-24 e COP-17 concluídos. Porta do servidor centralizada em config.js. Age verification implementada e verificada (17/17 testes). Bloqueador: Paperclip API offline."}'
```
