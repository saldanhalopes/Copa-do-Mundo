# 📜 CONTRACTS-REFERENCE.md — Referência dos Smart Contracts
### CryptoÁlbum Copa

> Referência técnica de cada contrato: funções públicas, eventos, erros, roles.
> Extraído de `contracts/`. Solidity 0.8.24, OpenZeppelin 5.x.

---

## Mapa de contratos

| Contrato | Padrão | Linhas | Bytecode |
|---|---|---|---|
| FigurinhasCopa | ERC-1155 + ERC-2981 | ~180 | 10.3 KB |
| FigurinhasCopaBNB | ERC-1155 (BNB) | ~280 | 14.4 KB |
| CardStats | custom | ~120 | 2.7 KB |
| PackStore | VRF consumer | ~180 | 5.0 KB |
| MatchEscrow | custom + ReentrancyGuard | ~200 | 6.1 KB |
| RankingSeasons | custom | ~180 | 5.8 KB |
| TradeDesk | custom | ~110 | 3.3 KB |
| FantasyLeague | custom | ~140 | 4.2 KB |

---

## FigurinhasCopa (ERC-1155)

Coleção principal. 1.352 tokenIds, supply imutável por raridade, royalties 5%.

### Roles
| Role | Permissão |
|---|---|
| `DEFAULT_ADMIN_ROLE` | configurar, congelar, gerir roles (→ Gnosis Safe) |
| `MINTER_ROLE` | mintar (concedido ao PackStore) |
| `PAUSER_ROLE` | pausar/despausar |

### Funções
| Função | Acesso | Descrição |
|---|---|---|
| `configurarFigurinhas(ids[], raridades[], supplies[])` | admin | Define raridade e maxSupply (imutável após definido) |
| `freezeMetadata()` | admin | Congela URI para sempre |
| `setURI(string)` | admin | Atualiza URI (antes do freeze) |
| `mintBatch(to, ids[], amounts[])` | minter | Minta lote (respeita maxSupply) |
| `fundir(id)` | público | Queima 10 comuns → 1 rara (id+10000) |
| `pause()` / `unpause()` | pauser | Emergência |
| `uri(id)` / `royaltyInfo(id, price)` | view | Padrões ERC-1155/2981 |

### Eventos
- `MetadataFrozen(string finalUri)`
- `FigurinhaConfigurada(uint256 id, uint8 raridade, uint256 maxSupply)`

### Erros
- `SupplyExcedido(uint256 id)` · `FigurinhaInvalida(uint256 id)` · `MetadataJaCongelada()`

---

## CardStats

Armazena atributos imutáveis empacotados em uint256.

### Layout de bits
```
0-7 PAC | 8-15 SHO | 16-23 PAS | 24-31 DRI | 32-39 DEF
40-47 PHY | 48-55 OVR | 56-63 posição | 64-71 raridade | 72-79 seleção
```

### Funções
| Função | Acesso | Descrição |
|---|---|---|
| `setStatsBatch(ids[], packed[])` | setter | Grava stats (antes do freeze) |
| `freezeStats()` | admin | Congela para sempre |
| `getCarta(id)` → `Carta` | view | Desempacota struct completa |
| `getPacked(id)` → `uint256` | view | Retorna o valor empacotado |
| `pack(...)` → `uint256` | pure | Helper de empacotamento |

### Eventos
- `StatsDefinidos(uint256 id, uint256 packed)` · `StatsCongelados()`

---

## PackStore (Chainlink VRF)

Venda de pacotes com sorteio verificável.

### Funções
| Função | Acesso | Descrição |
|---|---|---|
| `comprarPacote(tipo)` payable | público | Paga e solicita VRF. Retorna requestId |
| `fulfillRandomWords(reqId, words[])` | VRF only | Callback: sorteia e minta |
| `configurarPool(rar, ids[])` | owner | Define pool de ids por raridade |
| `configurarPacote(tipo, preco, qtd, garantia, ativo)` | owner | Configura tipo de pacote |
| `setTesouro(addr)` | owner | Destino dos pagamentos |

### Tabela de probabilidades (`_sortearRaridade`, base 10000)
```
0-6999    Comum    (70%)
7000-8999 Rara     (20%)
9000-9799 Épica    (8%)
9800-9989 Lendária (1.9%)
9990-9999 Mítica   (0.1%)  [só pacote mítico]
```

### Eventos
- `PacoteComprado(address comprador, uint8 tipo, uint256 requestId)`
- `PacoteAberto(address comprador, uint256 requestId, uint256[] ids)`

### Limites
- `LIMITE_DIARIO = 50` pacotes/carteira/dia (anti-bot on-chain)

---

## MatchEscrow (PvP com aposta)

### Estados
`Aberta → Pronta → Resolvida` (ou `Cancelada`)

### Funções
| Função | Acesso | Descrição |
|---|---|---|
| `criarPartida(time[5])` payable | público | Cria com stake. Verifica posse |
| `aceitarPartida(id, time[5])` payable | público | Entra (mesmo stake) |
| `resolver(id, vrfRandom)` | resolver | Bate 5 confrontos, paga vencedor |
| `cancelar(id)` | criador | Reembolso após TIMEOUT (1h) |
| `getPartida(id)` → `Partida` | view | Estado da partida |
| `setTaxa(bps)` | admin | Taxa da casa (máx 10%) |

### Fórmula de força (`_forcaCarta`)
```
força = OVR×2 + atributo_decisivo + fator_VRF(0-9)
atributo: GOL/ZAG→DEF, PD/PE/CAM→SHO, demais→PAS
```

### Distribuição
- Pote = 2 × stake. Vencedor recebe `pote − taxa` (taxa 5% → tesouro)

### Eventos
- `PartidaCriada(id, jogadorA, stake)` · `PartidaAceita(id, jogadorB)`
- `PartidaResolvida(id, vencedor, premio, placarA, placarB)` · `PartidaCancelada(id)`

### Erros
- `NaoPossuiCarta(id)` · `StakeIncorreto()` · `EstadoInvalido()`

---

## RankingSeasons (ELO + temporadas)

### Funções
| Função | Acesso | Descrição |
|---|---|---|
| `registrarResultado(vencedor, perdedor)` | match | Atualiza ELO de ambos |
| `iniciarTemporada(duracaoDias)` | admin | Nova temporada |
| `abastecerFundo()` payable | público | Adiciona ao fundo de prêmios |
| `finalizarTemporada(num, ranking[])` | admin | Paga top 3 (50/30/20%) |
| `getRating(addr)` → `uint256` | view | ELO atual (default 1000) |
| `statsJogador(addr)` → (elo, v, d) | view | Estatísticas |

### ELO
- Inicial: 1000 · Fator K: 32 · expectativa via aproximação linear (evita exp on-chain)

### Eventos
- `EloAtualizado(jogador, novoElo, venceu)` · `TemporadaIniciada` · `TemporadaFinalizada` · `PremioPago`

---

## TradeDesk (trocas P2P)

Swap atômico sem custódia (só approval).

### Funções
| Função | Acesso | Descrição |
|---|---|---|
| `criarOferta(daIds[], daQtd[], querIds[], querQtd[], destinatario, duracao)` | público | Cria oferta. `destinatario=0` = pública |
| `aceitarOferta(id)` | público | Swap atômico em 1 tx |
| `cancelarOferta(id)` | criador | Cancela |
| `lerOferta(id)` → `Oferta` | view | Detalhes |

### Eventos
- `OfertaCriada(id, criador, da[], quer[])` · `OfertaAceita(id, aceitante)` · `OfertaCancelada(id)`

---

## FantasyLeague

### Funções
| Função | Acesso | Descrição |
|---|---|---|
| `escalar(cartas[11], posicoes[11])` | público | Escala time, calcula OVR+química |
| `pontuacaoTotal(jogador)` → int | view | OVR+química+desempenho |
| `registrarDesempenho(ids[], pontos[])` | oracle | Injeta pontos reais |
| `avancarRodada()` | oracle | Próxima rodada |

### Química
- Posição certa: +3 · Mesma seleção (2+): +2/carta · Time monoseleção: +15

---

## FigurinhasCopaBNB

Variante para BNB Chain. Diferenças do principal:
- Binance Oracle VRF (em vez de Chainlink)
- `confirmarBinancePay(tradeNo, comprador, tipo)` — onramp fiat via Binance Pay
- `contractURI` para Binance NFT Marketplace
- Aceita BNB e BUSD

---

## Convenções gerais

- **Reentrancy:** `nonReentrant` em todas as funções com transferência de valor
- **Checks-Effects-Interactions:** estado alterado antes de chamadas externas
- **Pausable:** transferências respeitam `whenNotPaused`
- **Imutabilidade:** `freeze*` é irreversível por design
- **Admin:** recomendado Gnosis Safe 3/5 (ver Fase 1 do roadmap)
