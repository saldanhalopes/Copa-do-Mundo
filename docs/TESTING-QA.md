# 🧪 TESTING-QA.md — Plano de Testes & QA
### CryptoÁlbum Copa

> Estratégia de testes, casos, critérios de aceitação e QA por camada.

---

## 1. Pirâmide de testes

```
        ┌─────────────┐
        │  E2E (poucos)│  fluxos completos na testnet
        ├─────────────┤
        │ Integração  │  contrato↔cliente, API↔chain
        ├─────────────┤
        │  Unitários  │  lógica pura (muitos, rápidos)
        └─────────────┘
```

---

## 2. Testes por camada

### Smart Contracts
| Tipo | Ferramenta | Cobertura alvo |
|---|---|---|
| Unitário | Foundry (forge) | ≥95% nos contratos P1 |
| Fuzzing | Foundry | invariantes críticas |
| Integração | Hardhat | fluxos multi-contrato |
| Estático | Slither, Mythril | sem issues críticas |
| Auditoria | CertiK/Hacken | externa, pré-mainnet |

**Invariantes (fuzzing):**
- Supply nunca excede maxSupply
- Σ probabilidades de raridade = 10000
- Pote PvP = 2 × stake; vencedor + taxa = pote
- ELO ≥ 0 sempre; Σ variações ELO de uma partida ≈ 0
- `freeze*` é irreversível

### Backend
| Tipo | Ferramenta | O que testa |
|---|---|---|
| Unitário | Jest/Vitest | Matchmaker, Oracle, lógica |
| Integração | supertest | endpoints REST |
| WebSocket | ws client | protocolo de matchmaking |
| Carga | k6/Artillery | matchmaking sob carga |

### Cliente Unity
| Tipo | Ferramenta | O que testa |
|---|---|---|
| Unitário | NUnit (Test Runner) | CardCatalog, BattleEngine, ELO |
| Standalone | `test/CatalogTest.cs` | catálogo + batalha sem Unity |
| Play Mode | Unity Test Framework | navegação, fluxos de UI |
| Determinismo | cross-check | catálogo C# == Python == Solidity |

---

## 3. Casos de teste críticos

### TC-PACK — Abertura de pacote
| ID | Caso | Esperado |
|---|---|---|
| TC-PACK-01 | Comprar pacote básico | 5 cartas mintadas na carteira |
| TC-PACK-02 | Pacote Premium garante ≥1 Rara | última carta força Rara se não saiu |
| TC-PACK-03 | Pacote Mítico permite Mítica | raridade 4 possível |
| TC-PACK-04 | Saldo insuficiente | transação revertida |
| TC-PACK-05 | Limite diário (50) | bloqueado no 51º |

### TC-PVP — Partida
| ID | Caso | Esperado |
|---|---|---|
| TC-PVP-01 | Escalar 11 + técnico completo | botão habilitado |
| TC-PVP-02 | Jogar com carta não possuída | revertido (NaoPossuiCarta) |
| TC-PVP-03 | Time forte vs fraco (×50) | forte vence ≥30 |
| TC-PVP-04 | Mesma seed → mesmo resultado | determinístico |
| TC-PVP-05 | Vencedor recebe 95% do pote | distribuição correta |
| TC-PVP-06 | Timeout sem oponente | reembolso após 1h |

### TC-TRADE — Trocas
| ID | Caso | Esperado |
|---|---|---|
| TC-TRADE-01 | Criar oferta com repetida | oferta publicada |
| TC-TRADE-02 | Aceitar tendo a carta pedida | swap atômico, ambos recebem |
| TC-TRADE-03 | Aceitar sem ter a carta | botão desabilitado |
| TC-TRADE-04 | Swap falha em um lado | tudo reverte (atomicidade) |

### TC-ALBUM — Coleção
| ID | Caso | Esperado |
|---|---|---|
| TC-ALBUM-01 | Navegar 48 países | todos renderizam |
| TC-ALBUM-02 | 5 categorias por país | filtros corretos |
| TC-ALBUM-03 | Carta possuída "colada" | aparece no slot |
| TC-ALBUM-04 | Completar 1.352 | troféu resgatável |

### TC-WALLET — Carteira
| ID | Caso | Esperado |
|---|---|---|
| TC-WALLET-01 | Conectar MetaMask | endereço exibido |
| TC-WALLET-02 | Login email (embedded) | carteira criada |
| TC-WALLET-03 | Ler NFTs (balanceOfBatch) | inventário correto |
| TC-WALLET-04 | Trocar de rede | endereços de contrato corretos |

---

## 4. Critérios de aceitação (MVP)

Para o MVP ser aprovado, na testnet:
- [ ] Todos os TC-* críticos passam
- [ ] Cobertura de contratos ≥95% (P1)
- [ ] Sem issues críticas/altas na auditoria
- [ ] Onboarding completo (email→pacote) funciona em < 2 min
- [ ] Determinismo cross-platform validado
- [ ] Build roda em Android, iOS e WebGL sem crash

---

## 5. QA manual (smoke test por release)

Roteiro rápido antes de cada release:
1. Conectar carteira (cada tipo)
2. Comprar e abrir 1 pacote de cada tipo
3. Verificar cartas no álbum
4. Criar e aceitar 1 troca
5. Jogar 1 partida PvP completa
6. Verificar ELO/ranking atualizado
7. Listar 1 carta para venda
8. Trocar de rede (Polygon↔BNB)

---

## 6. Ambientes

| Ambiente | Rede | Uso |
|---|---|---|
| Local | Anvil/Hardhat | dev rápido |
| Dev | Amoy/BSC testnet | integração |
| Staging | Amoy/BSC testnet | pré-prod, QA |
| Prod | Polygon/BNB mainnet | usuários reais |

---

## 7. Testes de segurança específicos

| Vetor | Teste |
|---|---|
| Reentrancy | Tentar reentrar em resolver/aceitarOferta |
| Manipular VRF | Confirmar que só o coordinator chama callback |
| Front-running | Verificar que sorteio não é previsível |
| Overflow/underflow | Solidity 0.8 (checado), + fuzzing |
| Acesso indevido | Funções admin só com role correto |
| Pausabilidade | Pausa bloqueia transferências |

---

## 8. CI/CD (a configurar)

```yaml
# pipeline sugerido
on: [push, pull_request]
jobs:
  contracts:  forge test + forge coverage + slither
  backend:    npm test + lint
  unity:      Unity Test Runner (via game-ci/unity-test-runner)
  catalog:    validar determinismo Python==C#==Solidity
```

---

## 9. Bug tracking & severidade

| Severidade | Definição | SLA |
|---|---|---|
| Crítica | Perda de fundos, exploit | imediato |
| Alta | Funcionalidade core quebrada | 24h |
| Média | Bug com workaround | 1 semana |
| Baixa | Cosmético, UX menor | backlog |

Bug bounty (Immunefi) para os contratos após auditoria.
