#!/usr/bin/env bash
# scripts/check-prereqs.sh — verifica o ambiente antes da execução autônoma.
set -uo pipefail

ok=true

check() {
  local name="$1"; local cmd="$2"; local min="$3"
  if command -v "$cmd" >/dev/null 2>&1; then
    local ver; ver=$("$cmd" --version 2>&1 | head -1)
    echo "  ✓ $name: $ver"
  else
    echo "  ✗ $name AUSENTE (necessário: $min)"
    ok=false
  fi
}

echo "Verificando pré-requisitos..."
check "Node.js"  node    "20+"
check "npm"      npm     "10+"
check "Python 3" python3 "3.10+"
check "git"      git     "qualquer"

# Docker é opcional (há modo sem Docker no RUNBOOK)
if command -v docker >/dev/null 2>&1; then
  echo "  ✓ Docker: $(docker --version 2>&1 | head -1)"
  if docker info >/dev/null 2>&1; then
    echo "    (daemon ativo — modo Docker disponível)"
  else
    echo "    ⚠️  daemon inativo — use o modo 'sem Docker' do RUNBOOK"
  fi
else
  echo "  ⚠️  Docker ausente (opcional) — use o modo 'sem Docker' do RUNBOOK"
fi

# versão mínima do Node (20)
if command -v node >/dev/null 2>&1; then
  major=$(node -p "process.versions.node.split('.')[0]")
  if [ "$major" -lt 20 ]; then
    echo "  ✗ Node $major é muito antigo (precisa 20+)"
    ok=false
  fi
fi

echo ""
if $ok; then
  echo "✅ Todos os pré-requisitos OK"
  exit 0
else
  echo "❌ Faltam pré-requisitos. Instale o que está marcado com ✗ e rode de novo."
  exit 1
fi
