#!/usr/bin/env bash
# scripts/slither-report.sh
#
# Roda Slither e Mythril em todos os contratos e gera relatórios em docs/audit/.
# Uso: bash scripts/slither-report.sh
#
# Pré-requisitos:
#   pip install slither-analyzer  (Slither)
#   pip install mythril           (Mythril)
#   forge build --via-ir          (Contratos compilados)
#
# Saída:
#   docs/audit/slither-report.json
#   docs/audit/slither-report.txt (sumário)
#   docs/audit/mythril-report.json
#   docs/audit/mythril-report.txt

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
AUDIT_DIR="$REPO_DIR/docs/audit"
CONTRACTS_DIR="$REPO_DIR/contracts"

mkdir -p "$AUDIT_DIR"

echo "=== Compilando contratos com Foundry ==="
cd "$REPO_DIR"
forge build --via-ir

echo ""
echo "=== Rodando Slither ==="
slither "$CONTRACTS_DIR" \
  --solc-remaps "@openzeppelin/=node_modules/@openzeppelin/ @chainlink/=node_modules/@chainlink/" \
  --exclude-dependencies \
  --json "$AUDIT_DIR/slither-report.json" 2>&1 | tee "$AUDIT_DIR/slither-report.txt"

SLITHER_EXIT=$?

echo ""
echo "=== Rodando Mythril ==="
echo "(pode levar vários minutos por contrato)"

for contract in "$CONTRACTS_DIR"/*.sol; do
  name=$(basename "$contract" .sol)
  echo "  Analisando $name..."
  myth analyze "$contract" \
    --solc-json <(echo '{"remappings": ["@openzeppelin/=node_modules/@openzeppelin/", "@chainlink/=node_modules/@chainlink/"]}') \
    --solvers 2 \
    --execution-timeout 120 \
    --max-depth 22 \
    --out "$AUDIT_DIR/mythril-$name.json" 2>> "$AUDIT_DIR/mythril-report.txt" || true
done

echo ""
echo "=== Resumo ==="

# Contar findings do Slither
if [ -f "$AUDIT_DIR/slither-report.json" ]; then
  echo ""
  echo "--- Slither --"
  python3 -c "
import json
with open('$AUDIT_DIR/slither-report.json') as f:
    data = json.load(f)
results = data.get('results', {}).get('detectors', [])
high = [r for r in results if r.get('impact') == 'High']
medium = [r for r in results if r.get('impact') == 'Medium']
low = [r for r in results if r.get('impact') == 'Low']
print(f'  High:   {len(high)}')
print(f'  Medium: {len(medium)}')
print(f'  Low:    {len(low)}')
for r in high:
    print(f'    🔴 {r.get(\"check\", \"?\")}: {r.get(\"description\", \"\")[:120]}')
for r in medium:
    print(f'    🟡 {r.get(\"check\", \"?\")}: {r.get(\"description\", \"\")[:120]}')
" 2>/dev/null || echo "  (relatório não encontrado ou erro no parsing)"
fi

echo ""
echo "--- Mythril --"
echo "  Ver: $AUDIT_DIR/mythril-*.json"

echo ""
echo "=== Relatórios salvos em $AUDIT_DIR ==="

if [ $SLITHER_EXIT -ne 0 ]; then
  echo "⚠️  Slither encontrou issues. Revise antes de prosseguir."
else
  echo "✅ Slither concluído sem erros."
fi
