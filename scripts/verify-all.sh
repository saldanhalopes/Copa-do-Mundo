#!/usr/bin/env bash
# scripts/verify-all.sh — Verificação final (Definition of Done).
# Confere que o projeto está funcionando de ponta a ponta.
set -uo pipefail

pass=0; fail=0
ok()  { echo "  ✅ $1"; pass=$((pass+1)); }
no()  { echo "  ❌ $1"; fail=$((fail+1)); }

echo ""
echo "═══ VERIFICAÇÃO FINAL — CryptoÁlbum Copa ═══"
echo ""

# 1. Catálogo + metadados
echo "1. Catálogo e metadados"
[ -f generator/output/catalogo.json ] && ok "catalogo.json existe" || no "catalogo.json AUSENTE"
[ -f generator/output/stats.json ] && ok "stats.json existe" || no "stats.json AUSENTE"
if [ -d generator/output/metadata ]; then
  n=$(ls generator/output/metadata/*.json 2>/dev/null | wc -l)
  [ "$n" -ge 1352 ] && ok "metadados gerados ($n)" || no "metadados incompletos ($n/1352)"
else
  no "pasta metadata/ AUSENTE"
fi

# 2. Deploy
echo ""
echo "2. Contratos deployados"
DEP=""
[ -f deployments/local.json ] && DEP=deployments/local.json
if [ -n "$DEP" ]; then
  ok "deployments/local.json existe"
  grep -q FigurinhasCopa "$DEP" && ok "endereços presentes" || no "endereços ausentes"
else
  no "deployments/local.json AUSENTE (rode deploy-local.js)"
fi

# 3. Backend
echo ""
echo "3. Backend"
if curl -sf http://localhost:3001/health >/dev/null 2>&1; then
  ok "/health responde"
  curl -sf http://localhost:3001/contracts >/dev/null 2>&1 && ok "/contracts responde" || no "/contracts não responde"
else
  no "backend não responde em :3001 (rode o Passo 6)"
fi

# 4. Blockchain local
echo ""
echo "4. Blockchain local"
if curl -sf -X POST http://localhost:8545 -H "Content-Type: application/json" \
     --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' >/dev/null 2>&1; then
  ok "nó respondendo em :8545"
else
  no "nó não responde em :8545 (rode o Passo 3)"
fi

# resultado
echo ""
echo "─────────────────────────────────────────"
echo "RESULTADO: $pass ✅   $fail ❌"
if [ "$fail" -eq 0 ]; then
  echo "🎉 PROJETO FUNCIONANDO — Definition of Done atingida!"
  exit 0
else
  echo "⚠️  Itens pendentes. Volte ao RUNBOOK no passo correspondente."
  exit 1
fi
