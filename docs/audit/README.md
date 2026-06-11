# Pacote de Auditoria — CryptoÁlbum Copa

> Documentos preparados para submissão a auditor externo.

## Conteúdo

| Arquivo | Descrição |
|---------|-----------|
| `SCOPE.md` | Escopo da auditoria, prioridades, invariantes, modelo de ameaças |
| `ARCHITECTURE.md` | Diagrama de contratos, fluxos de valor, papéis e permissões |
| `slither-report.json` | Relatório Slither (gerar com `scripts/slither-report.sh`) |
| `mythril-report.txt` | Relatório Mythril (gerar com `scripts/slither-report.sh`) |

## Auditoria Externa — Recomendação

Baseado em **Build vs Buy / Reuse**: para contratos P1 (MatchEscrow, PackStore, RankingSeasons), contratar auditoria tier-1. Para P2, auditoria comunitária + revisão interna.

### Opções Consideradas

| Auditor | Foco | Custo Estimado | Prazo |
|---------|------|----------------|-------|
| **Trail of Bits** | Segurança geral, P1 | $100-200k | 3-4 semanas |
| **CertiK** | Contratos + Formal Verification | $80-150k | 2-3 semanas |
| **Hacken** | Custo-benefício | $30-60k | 2 semanas |
| **Code4rena** | Community audit (competição) | $20-40k (prêmios) | 1 semana |
| **Immunefi** | Bug bounty contínuo | 5-10% do TVL | Contínuo |

### Recomendação (Custo-Benefício)

1. **Code4rena** para audit inicial — cobertura ampla, custo moderado (~$30k)
2. **Trail of Bits** ou **CertiK** para P1 (MatchEscrow, PackStore, RankingSeasons) — ~$80k
3. **Immunefi** pós-audit para cobertura contínua — 5% do TVL em recompensas

### Bug Bounty (Immunefi)

Rascunho do programa:

- **Escopo:** Todos os 8 contratos (endereços de mainnet)
- **Recompensas:**
  - Crítico (perda de fundos): até $50k
  - Alto (perda de funcionalidade, quebra de invariante): até $10k
  - Médio (condições de corrida, manipulação parcial): até $2k
- **Elegibilidade:** Primeiro a reportar, KYC requerido para pagamento
- **Exclusões:** Ataques de front-running, ataques de governança, issues já conhecidas

## Próximos Passos

1. Rodar `bash scripts/slither-report.sh` para gerar relatórios estáticos
2. Revisar findings e corrigir antes da submissão
3. Deployar Gnosis Safe 3/5 na rede alvo (Amoy testnet → mainnet)
4. Rodar `node scripts/transfer-admin-to-safe.js --dry-run --network amoy --safe <safe-address>`
5. Contratar auditor externo (ver recomendação acima)
6. Publicar bug bounty no Immunefi

## Verificação

```bash
# 1. Compilar e testar
forge build --via-ir && forge test -vvv

# 2. Análise estática
bash scripts/slither-report.sh

# 3. Dry-run da migração multisig
node scripts/transfer-admin-to-safe.js --dry-run --network amoy --safe 0x...
```
