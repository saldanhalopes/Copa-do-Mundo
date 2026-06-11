# 💰 TOKENOMICS.md — Economia & Tokenomics
### CryptoÁlbum Copa

> Design econômico: supply, preços, sinks/faucets, fundo de prêmios, sustentabilidade.

---

## 1. Princípios econômicos

1. **Escassez real** — supply fixo e imutável por raridade (sem inflação possível)
2. **Utilidade > especulação** — cartas servem para jogar, não só guardar
3. **Sinks equilibram faucets** — queima de cartas compensa a entrada
4. **Sem promessa de lucro** — colecionável/jogo, não investimento (ver JURIDICO)

---

## 2. Supply por raridade

| Raridade | Supply por figurinha | % no sorteio | Cartas distintas | Supply total aprox |
|---|---|---|---|---|
| Comum | 50.000 | 70% | ~900 | ~45.000.000 |
| Rara | 10.000 | 20% | ~250 | ~2.500.000 |
| Épica | 2.500 | 8% | ~150 | ~375.000 |
| Lendária | 500 | 1.9% | ~50 | ~25.000 |
| Mítica | 10-50 | 0.1% | ~10 | ~300 |

> Supply **fixado no deploy** via `configurarFigurinhas`. Impossível mintar além do max.

---

## 3. Preços (pacotes)

| Pacote | Preço | Conteúdo | Garantia | Custo médio/carta |
|---|---|---|---|---|
| Básico | ~$1,99 | 5 | — | $0,40 |
| Premium | ~$7,99 | 5 | ≥1 Rara | $1,60 |
| Lendário | ~$24,99 | 10 | ≥1 Épica | $2,50 |
| Mítico | ~$74,99 | 10 | ≥1 Lendária + chance Mítica | $7,50 |

Preços em cripto (POL/BNB) ajustáveis via `configurarPacote` conforme cotação.
Pagamento fiat (Pix/cartão) com leve markup do provedor.

---

## 4. Faucets (entrada de cartas/valor)

| Faucet | Descrição |
|---|---|
| Venda de pacotes | Principal entrada de cartas no ecossistema |
| Recompensas de temporada | Cartas/cripto para o top do ranking |
| Eventos sazonais | Drops especiais (lendas, finais) |
| Airdrops de engajamento | Recompensas por marcos (completar país) |

## 5. Sinks (saída/queima)

| Sink | Descrição | Efeito |
|---|---|---|
| Fusão (burn-to-upgrade) | 10 comuns → 1 rara | Reduz oferta de comuns |
| Burn-to-redeem (mítica) | Queima NFT → figurinha física | Reduz supply de míticas |
| Taxa de PvP (5%) | Sai do pote dos jogadores | Dreno de cripto |
| Royalties (5%) | Em cada revenda | Recircula valor |

**Equilíbrio:** comuns entram em massa (70% dos pacotes) mas a fusão as queima,
mantendo a oferta de raras saudável sem inflação.

---

## 6. Fluxo do Fundo de Prêmios

```
Taxa de PvP (5% dos potes) ──┐
Royalties (parte) ───────────┼──> Fundo da Temporada (RankingSeasons)
Patrocínios ─────────────────┘         │
                                       ▼
                          Fim da temporada: top 3
                          50% / 30% / 20%
```

O fundo é **auto-sustentável**: quanto mais gente joga, maior o prêmio,
o que atrai mais jogadores (loop virtuoso).

---

## 7. Distribuição de receita

| Destino | % | Uso |
|---|---|---|
| Operação/desenvolvimento | 60% | Time, infra, manutenção |
| Fundo de prêmios | 20% | Recompensas dos jogadores |
| Arte/conteúdo | 10% | Novas coleções, ilustração |
| Reserva/contingência | 10% | Auditoria, jurídico, imprevistos |

(Da receita líquida de pacotes + royalties)

---

## 8. Economia do jogador (loops)

### Loop de progressão (free-to-play friendly)
```
Joga PvP grátis (ranking) → ganha posição → recompensa de temporada
→ usa para comprar pacotes → melhora o time → joga melhor
```

### Loop do colecionador
```
Compra pacotes → tem repetidas → troca por faltantes
→ completa álbum → resgata troféu → status/prêmio
```

### Loop do trader
```
Compra pacotes → consegue raras → vende no secundário
→ lucra → reinveste em mais pacotes
```

---

## 9. Sustentabilidade (evitar morte do P2E)

Erros clássicos de play-to-earn e como evitamos:

| Erro comum | Nossa defesa |
|---|---|
| Inflação infinita de tokens | Supply fixo, sem token inflacionário no core |
| Recompensa > custo (ponzi) | Prêmios vêm de taxas reais, não de emissão |
| Sem utilidade real | Cartas são jogáveis (PvP/fantasy) |
| Economia só de especulação | Foco em diversão; valor é consequência |
| Whales dominam | Matchmaking por ELO, fator VRF dá chance ao azarão |

---

## 10. Token de fidelidade $FIGO (Fase 2 — opcional)

> ⚠️ Alto risco regulatório. Só implementar com parecer jurídico (ver JURIDICO §3).

Se implementado:
- **Não** é o meio de pagamento principal (pacotes seguem em POL/BNB/fiat)
- Utilidade: descontos, acesso antecipado, governança leve
- **Sem** promessa de valorização (evitar classificação como security)
- Distribuição por engajamento, não venda inicial (evitar ICO)

---

## 11. Métricas de saúde econômica (monitorar)

| Métrica | Saudável | Alerta |
|---|---|---|
| Razão fusão/mint de comuns | > 0,3 | < 0,1 (excesso de comuns) |
| Preço médio Lendária (secundário) | estável/crescente | queda forte |
| Volume do secundário | crescente | estagnado |
| Tamanho do fundo de prêmios | crescente | encolhendo |
| Distribuição de raridade em circulação | próxima do projetado | desvio grande |

Dashboards alimentados pelo indexer/subgraph (ver API-SPEC).
