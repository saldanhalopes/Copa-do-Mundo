# CONTEXT.md — Fase 6: Conformidade & Jurídico

## Decisão estratégica

**Soft launch primeiro, full compliance na expansão.** Este projeto usa arte original/fictícia para evitar os custos proibitivos de licenciamento FIFA. A mesma lógica se aplica ao jurídico: começamos com o mínimo viável para um beta controlado, não com compliance total em 20 jurisdições.

## Abordagem em 3 anéis

1. **Anel 1 — Beta/testnet (agora):** Sem dinheiro real. Sem aposta. Arte original. Termos de uso simples. Nenhuma jurisdição bloqueia isso.
2. **Anel 2 — Mainnet sem aposta (próximo):** Itens reais, compras reais, PvP por glória. Exige: geofencing de loot boxes, KYC delegado, LGPD/GDPR, verificação de idade.
3. **Anel 3 — Full launch (futuro):** PvP com stake. Exige: pareceres jurídicos por jurisdição, geofencing de apostas, possível licença de gambling.

## Workstreams

| Workstream | Owner | Anel | Esforço | Tipo |
|---|---|---|---|---|
| A — Pareceres jurídicos + Termos | CEO (contratação humana) | 2-3 | 6-12 sem | Estratégico/jurídico |
| B — Geofencing | CTO | 2 | 2-3 sem | Técnico |
| C — KYC/AML | CTO (+ provedor) | 2 | 1-2 sem | Técnico/terceiros |
| D — Verificação de idade | CTO | 2 | 1-2 sem | Técnico |
| E — Modo sem aposta padrão | CTO | 1 | 1 sem | Técnico |

## Dependências

- Workstream E (no-stake default) não depende de nada — já pode começar.
- Workstreams B, C, D podem rodar em paralelo.
- Workstream A (pareceres) deve começar cedo pelo lead time, mas não bloqueia o beta.

## Por que não contratar um jurídico agora?

Este projeto está em estágio pré-receita. Contratar escritórios de advocacia especializados em cripto/gaming custa caro ($20k-100k+). A recomendação é:

- Fase 1 (testnet beta): docs internos, sem dinheiro real → risco jurídico mínimo.
- Antes da mainnet com dinheiro real: contratar parecer direcionado (Brasil + EUA), não um pacote global.
- Aposta com stake: só após auditoria + receita comprovada.

## Referências

- `JURIDICO-CONFORMIDADE.md` — análise detalhada de riscos
- `PLANO-GSD.md` — visão geral das 8 fases
- `PROJECT.md` — visão e escopo do projeto
- `REQUIREMENTS.md` — requisitos NFR-LEGAL-01 a 04
