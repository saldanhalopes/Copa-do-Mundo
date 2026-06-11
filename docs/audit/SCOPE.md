# SCOPE.md — Auditoria de Segurança | CryptoÁlbum Copa

> Artefato de preparação de auditoria. Define escopo, prioridades, invariantes, modelo de ameaças e suposições de confiança.

## Contratos no Escopo (8 contratos)

### Prioridade 1 — Lidam com dinheiro (stake, premiação, compra de pacotes)

| Contrato | Linhas | Função | Risco |
|----------|--------|--------|-------|
| `MatchEscrow` | 204 | Escrow de partidas PvP com aposta. Distribui prêmios e taxas. | Perda de stake, roubo do pote, Manipulação de VRF |
| `PackStore` | 170 | Venda de pacotes com Chainlink VRF v2.5. Recebe pagamentos, mint NFTs. | Roubo de pagamento, sorteio manipulável, mint abusivo |
| `RankingSeasons` | 187 | Rating ELO on-chain, temporadas, premiação do fundo. | Roubo do fundo de prêmios, manipulação de ELO |

### Prioridade 2 — Infraestrutura da coleção

| Contrato | Linhas | Função | Risco |
|----------|--------|--------|-------|
| `FigurinhasCopa` | 146 | ERC-1155 coleção Polygon. Mint, burn, freeze, pausa. | Supply excedido, mint não autorizado, freeze bypass |
| `FigurinhasCopaBNB` | 266 | ERC-1155 coleção BNB Chain. VRF Oracle, Binance Pay. | Mesmos + Oracle manipulation, Pay callback spoof |
| `CardStats` | 118 | Atributos imutáveis (FIFA-style) empacotados em uint256. | Stats mutáveis após freeze |
| `TradeDesk` | 100 | Trocas P2P atômicas sem custódia. | Roubo de NFT durante troca, reentrância |
| `FantasyLeague` | 148 | Modo Fantasy com escalação e oráculo de desempenho. | Oracle abuse, escalação inválida |

## Invariantes

As invariantes abaixo **não podem ser violadas** em nenhuma execução válida. Estão cobertas pelos testes Foundry com fuzzing.

```
I1. Supply nunca excede maxSupply para qualquer tokenId.
I2. freezeStats() e freezeMetadata() são irreversíveis — chamadas subsequentes de setStats/setURI revertem.
I3. Soma das probabilidades de raridade no PackStore._sortearRaridade = 10000.
I4. Pote do MatchEscrow = 2 × stake. Vencedor recebe pote − taxa. Taxa = pote × taxaCasaBps / 10000.
I5. ELO nunca é negativo (clamp em 0).
I6. Soma das variações de ELO em uma partida ≈ 0 (winner_gain ≈ loser_loss).
I7. Em uma troca no TradeDesk, ambas as partes recebem OU a transação toda reverte (atomicidade).
```

## Modelo de Ameaças

### Atores

| Ator | Descrição | Confiança |
|------|-----------|-----------|
| **Admin** (multisig 3/5) | Dono dos contratos. Configura pools, pacotes, pausa emergencial. | Confiável (multisig mitiga) |
| **Resolver** | Bot do backend com `RESOLVER_ROLE` no MatchEscrow. Chama resolver() com VRF. | Semi-confiável (VRF é auditável) |
| **Oracle** | Bot do backend com `ORACLE_ROLE` no FantasyLeague. | Semi-confiável (dados públicos) |
| **Usuário comum** | Compra pacotes, joga PvP, troca cartas. | Não confiável |
| **Atacante** | Tenta roubar fundos, mintar sem pagar, manipular resultados. | Não confiável |

### Superfície de Ataque

| # | Ameaça | Contrato | Mitigação |
|---|--------|----------|-----------|
| T1 | Roubo do pote no resolver() chamando com VRF malicioso | MatchEscrow | `onlyRole(RESOLVER_ROLE)`, VRF é público e auditável |
| T2 | Reentrância no resolver() ao enviar ETH | MatchEscrow | `ReentrancyGuard` + checks-effects-interactions |
| T3 | Mint sem pagar chamando fulfillRandomWords diretamente | PackStore | `fulfillRandomWords` é `internal override` — só chamável pelo VRF coordinator |
| T4 | Esgotar pool de raridade específica (ataque de exaustão) | PackStore | Pool circular: `pool.length > qtd` verificado em configuração |
| T5 | Flash loan para manipular ELO | RankingSeasons | ELO muda por partida, não por valor econômico |
| T6 | Finalizar temporada antes do prazo | RankingSeasons | `require(block.timestamp >= t.fim)` |
| T7 | Reentrância em safeBatchTransferFrom no TradeDesk | TradeDesk | `ReentrancyGuard` + `o.ativa = false` antes da transferência |
| T8 | Queimar carta de outro usuário via burn | FigurinhasCopa | ERC-1155 `_burn` verifica caller é owner/approved |
| T9 | Fusão de carta não-comum | FigurinhasCopa | `require(raridade[id] == 0)` |
| T10 | Spoof do callback Binance Pay | FigurinhasCopaBNB | `onlyRole(OPERATOR_ROLE)` + `verifyPayment` on-chain |

### Suposições de Confiança

1. **Chainlink VRF** é uma fonte de aleatoriedade segura e auditável.
2. **Binance Oracle** na BNB Chain é operado pela Binance e considerado confiável.
3. **Multisig admin** tem 3-de-5 signatários — nenhum signatário individual pode agir sozinho.
4. **Tesouro** é um endereço controlado por multisig.
5. **backend resolver** nunca chamará `resolver()` com VRF já utilizado (responsabilidade off-chain).

## Metodologia de Auditoria

- **Análise estática:** Slither + Mythril — todas as findings documentadas, zero críticos/altos não resolvidos
- **Testes Foundry:** 52 testes, 40k+ fuzz runs, 100% das invariantes cobertas
- **Revisão manual:** Todos os contratos revisados para:
  - Ataques de reentrância
  - Aritmética insegura
  - Controle de acesso
  - Lógica de negócio (ELO, distribuição de prêmios, garantia de raridade)
  - Dependências de terceiros (OpenZeppelin v5.0.2, Chainlink v1.2.0)

## Critérios de Aceitação para Mainnet

- [ ] Slither + Mythril sem findings críticos ou altos
- [ ] 52 testes Foundry passando, cobertura ≥95%
- [ ] Multisig 3/5 deployado e configurado como admin em todos os contratos
- [ ] Bug bounty publicado no Immunefi
- [ ] Auditoria externa concluída (tier-1 para P1, community para P2)
