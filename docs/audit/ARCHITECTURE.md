# ARCHITECTURE.md — Arquitetura de Contratos | CryptoÁlbum Copa

> Artefato de preparação de auditoria. Diagrama de contratos, fluxos de valor, papéis e permissões.

## Visão Geral

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTENDS (Unity / React)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js)                           │
│  - Matchmaking (ELO-based)                                       │
│  - Indexer (The Graph)                                           │
│  - Oracle (Chainlink Functions / API esportiva)                  │
│  - Bot Resolver (chama resolver() com VRF)                       │
└───────────┬──────────┬──────────┬──────────┬────────────────────┘
            │          │          │          │
            ▼          ▼          ▼          ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐
│  PackStore   │ │MatchEscrow│ │Fantasy   │ │  TradeDesk   │
│  (venda)     │ │  (PvP)   │ │League    │ │  (trocas)    │
│ VRF v2.5     │ │ VRF      │ │Oracle    │ │  P2P atomic  │
└──────┬───────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘
       │              │            │               │
       │              ▼            │               │
       │     ┌──────────────┐      │               │
       │     │CardStats     │      │               │
       │     │(atributos    │◄─────┘               │
       │     │ imutáveis)   │                      │
       │     └──────────────┘                      │
       │                                           │
       ▼                                           ▼
┌──────────────────────────────────────────────────────┐
│              FigurinhasCopa (ERC-1155)                │
│              FigurinhasCopaBNB (ERC-1155)             │
│              RankingSeasons (ELO + prêmios)           │
└──────────────────────────────────────────────────────┘
```

## Fluxos de Valor

### 1. Compra de Pacote → Mint (PackStore)

```
Usuário → comprarPacote{value}(tipo)
           │
           ├── 1. Valida pacote ativo, preço, limite diário
           ├── 2. Solicita VRF ao Chainlink Coordinator
           ├── 3. Forward do pagamento ao Tesouro
           └── 4. Emite PacoteComprado
                     │
                     ▼ (30s depois — callback VRF)
           fulfillRandomWords(requestId, randomWords)
           ├── 1. Sorteia raridade por carta (tabela pública)
           ├── 2. Garantia mínima forçada na última carta
           ├── 3. Seleciona tokenId do pool da raridade
           └── 4. mintBatch para o comprador (via MINTER_ROLE)
```

### 2. Partida PvP com Aposta

```
Jogador A → criarPartida{value: stake}(time)
Jogador B → aceitarPartida{value: stake}(id, time)
             │
             ▼
Resolver (bot) → resolver(id, vrfRandom)
├── 5 confrontos carta-a-carta (atributo posicional + VRF)
├── Vencedor = quem vence mais rounds
├── Pote = 2 × stake
├── Taxa = pote × taxaCasaBps / 10000 → Tesouro
└── Prêmio = pote − taxa → Vencedor
```

### 3. Ciclo de Vida de Temporada

```
Admin → iniciarTemporada(duracaoDias)
         │
         ▼ (durante a temporada)
MatchEscrow → registrarResultado(vencedor, perdedor)
├── Atualiza ELO de ambos
├── Distribui pontos de temporada (3 vitória, 1 participação)
└── Registra participante
         │
         ▼ (após fim da temporada)
Admin → finalizarTemporada(numero, rankingOrdenado)
├── Top 3: 50% / 30% / 20% do fundo
└── Fundo abastecido por taxas de partida + royalties
```

### 4. Troca P2P

```
Usuário A → criarOferta(idsOferecidos, qtdOferecidas, idsPedidos, qtdPedidas, destinatario, duracao)
Usuário B → aceitarOferta(id)
├── safeBatchTransferFrom(A → B): itens oferecidos
└── safeBatchTransferFrom(B → A): itens pedidos
```

## Papéis e Permissões

### AccessControl — Roles por Contrato

| Contrato | Role | Detentor | Ações |
|----------|------|----------|-------|
| **MatchEscrow** | `DEFAULT_ADMIN_ROLE` | Multisig | setTaxa, grantRole |
| MatchEscrow | `RESOLVER_ROLE` | Backend bot | resolver() |
| **PackStore** | `owner()` (ConfirmedOwner) | Multisig | configurarPool, configurarPacote, setTesouro |
| **RankingSeasons** | `DEFAULT_ADMIN_ROLE` | Multisig | iniciarTemporada, finalizarTemporada |
| RankingSeasons | `MATCH_ROLE` | MatchEscrow | registrarResultado |
| **FigurinhasCopa** | `DEFAULT_ADMIN_ROLE` | Multisig | configurarFigurinhas, freezeMetadata, setURI, grantRole |
| FigurinhasCopa | `MINTER_ROLE` | PackStore, FantasyLeague | mintBatch |
| FigurinhasCopa | `PAUSER_ROLE` | Multisig | pause, unpause |
| **FigurinhasCopaBNB** | `DEFAULT_ADMIN_ROLE` | Multisig | configurarFigurinhas, freezeMetadata, setContractURI |
| FigurinhasCopaBNB | `MINTER_ROLE` | PackStore (BNB), admin | mintBatch |
| FigurinhasCopaBNB | `PAUSER_ROLE` | Multisig | pause, unpause |
| FigurinhasCopaBNB | `OPERATOR_ROLE` | Backend | confirmarBinancePay, configurarPool |
| **CardStats** | `DEFAULT_ADMIN_ROLE` | Multisig | freezeStats |
| CardStats | `SETTER_ROLE` | Admin bot (setup) | setStatsBatch |
| **TradeDesk** | — | N/A | Sem permissões especiais |
| **FantasyLeague** | `DEFAULT_ADMIN_ROLE` | Multisig | grantRole |
| FantasyLeague | `ORACLE_ROLE` | Backend oracle | registrarDesempenho, avancarRodada |

### Hierarquia de Confiança

```
Multisig 3/5 (Gnosis Safe)
├── Controle total: pause, configuração, upgrade de parâmetros
├── Tesouro (receita de pacotes + taxas)
└── Recuperação: pode substituir Resolver/Oracle em caso de comprometimento
         │
         ▼
Backend (Resolver + Oracle)
├── Operações diárias: resolver partidas, injetar desempenho
├── Limitado: não pode mintar, não pode sacar tesouro
└── Auditável: VRF público, desempenho é público
         │
         ▼
Usuários
├── Comprar pacotes, jogar, trocar
└── Sem privilégios administrativos
```

## Dependências Externas

| Dependência | Versão | Uso | Risco |
|-------------|--------|-----|-------|
| OpenZeppelin | 5.0.2 | ERC-1155, AccessControl, ReentrancyGuard, Pausable, ERC-2981 | Baixo — auditoria OZ é referência |
| Chainlink VRF | v2.5 (1.2.0) | Aleatoriedade em PackStore (Polygon) | Baixo — padrão de mercado |
| Chainlink VRF Mock | 1.2.0 | Testes Foundry | Zero — apenas dev |
| Gnosis Safe | 1.4.1+ | Multisig admin | Baixo — padrão de mercado |

## Gas Estimates (principais operações)

| Operação | Custo (estimado) | Otimização |
|----------|------------------|------------|
| `criarPartida` | ~272k gas | Leitura de balanceOf para 5 cartas |
| `aceitarPartida` | ~423k gas | Verificação dupla de posse |
| `resolver` | ~570k gas | 5× leitura de stats + chamadas .call |
| `comprarPacote` | ~250k gas | 1 chamada VRF + transfer |
| `fulfillRandomWords` | ~330k gas | 5× keccak + mintBatch (callback) |
| `registrarResultado` | ~236k gas | Atualização ELO + pontos de temporada |
| `finalizarTemporada` | ~564k gas | 3× .call + push ao array |
