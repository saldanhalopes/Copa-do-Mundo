# 🎨 DESIGN.md — Documento de Design
### CryptoÁlbum Copa

> Cobre o **como construir**: arquitetura do sistema, design técnico dos contratos,
> e o design visual/UX. Complementa o `PROD.md` (o quê/porquê).

---

# PARTE I — ARQUITETURA DO SISTEMA

## 1. Visão geral em camadas

```
┌───────────────────────────────────────────────────────────┐
│  CLIENTES                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Unity        │  │ React        │  │ Marketplaces     │  │
│  │ (mobile/PC/  │  │ (protótipo/  │  │ externos         │  │
│  │  WebGL)      │  │  web)        │  │ (OpenSea/Binance)│  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼──────────────────┼──────────────────┼────────────┘
          │ ChainSafe         │ wagmi/viem        │ Seaport
          ▼                   ▼                   ▼
┌───────────────────────────────────────────────────────────┐
│  BACKEND (off-chain)                                        │
│  ┌────────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │Matchmaking │ │ Indexer  │ │ Subgraph │ │SportsOracle │  │
│  │ (WS/Redis) │ │(eventos) │ │(The Graph│ │ (Cartola)   │  │
│  └────────────┘ └──────────┘ └──────────┘ └─────────────┘  │
└─────────┬──────────────────────────────────────┬───────────┘
          │ ethers                                 │ Chainlink Functions
          ▼                                        ▼
┌───────────────────────────────────────────────────────────┐
│  BLOCKCHAIN (on-chain) — Polygon / BNB Chain               │
│  ┌──────────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐  │
│  │FigurinhasCopa│ │ CardStats │ │PackStore │ │MatchEscrow│ │
│  │  (ERC-1155)  │ │(atributos)│ │  (VRF)   │ │  (PvP)   │  │
│  └──────────────┘ └───────────┘ └──────────┘ └──────────┘  │
│  ┌──────────────┐ ┌───────────┐ ┌──────────┐               │
│  │RankingSeasons│ │ TradeDesk │ │ Fantasy  │               │
│  └──────────────┘ └───────────┘ └──────────┘               │
└─────────┬──────────────────────────────────────┬───────────┘
          ▼                                        ▼
   ┌─────────────┐                         ┌──────────────┐
   │ IPFS/Arweave│                         │ Chainlink VRF│
   │ (metadados) │                         │ Binance Oracle│
   └─────────────┘                         └──────────────┘
```

**Princípio:** on-chain guarda propriedade, atributos imutáveis e valor (apostas).
Off-chain acelera leitura (indexer/subgraph) e coordena (matchmaking). Cliente é só apresentação.

---

## 2. Design dos Smart Contracts

### Princípios
- **Single responsibility:** cada contrato tem um papel (coleção, stats, loja, batalha…)
- **Imutabilidade onde importa:** supply e atributos congeláveis (`freeze*`)
- **Sem custódia:** cartas ficam na carteira do dono; só apostas vão para escrow
- **Verificabilidade:** probabilidades e aleatoriedade públicas e auditáveis

### Contratos e responsabilidades

| Contrato | Padrão | Responsabilidade | Estado crítico |
|---|---|---|---|
| `FigurinhasCopa` | ERC-1155 + ERC-2981 | Coleção, mint, royalties | maxSupply (imutável) |
| `CardStats` | custom | Atributos empacotados (uint256) | frozen |
| `PackStore` | custom + VRF | Venda + sorteio | pools por raridade |
| `MatchEscrow` | custom + ReentrancyGuard | PvP, stake, distribuição | escrow do pote |
| `RankingSeasons` | custom | ELO + temporadas + prêmios | fundo da temporada |
| `TradeDesk` | custom | Swap atômico P2P | ofertas abertas |
| `FantasyLeague` | custom | Escalação + desempenho | pontos por rodada |

### Layout de bits dos atributos (CardStats, uint256)
```
bits  0-7   PAC      bits 32-39  DEF      bits 56-63  posição
bits  8-15  SHO      bits 40-47  PHY      bits 64-71  raridade
bits 16-23  PAS      bits 48-55  OVR      bits 72-79  seleção
bits 24-31  DRI
```
Empacotamento idêntico em Solidity, Python (gerador) e C# (Unity) — validado por testes.

### Fluxos de valor
```
Compra de pacote:  usuário → PackStore (paga) → tesouro
                            ↘ VRF → mintBatch → carteira do usuário

PvP:  A → MatchEscrow (stake)     ┐
      B → MatchEscrow (stake)     ├→ resolver() → vencedor (95%) + tesouro (5%)
                                  ┘

Venda secundária:  comprador → marketplace → vendedor
                                          ↘ royalty 5% → tesouro + fundo
```

---

## 3. Determinismo cross-platform

O catálogo de 1.352 cartas é **gerado deterministicamente** em 3 lugares com a mesma lógica:
- `generator/generate_catalog.py` (fonte de verdade, gera stats on-chain)
- `unity/.../CardCatalog.cs` (cliente Unity)
- `CryptoAlbumCopa.jsx` (protótipo React)

→ O tokenId N produz **sempre a mesma carta** em qualquer lugar, batendo com a blockchain.

---

## 4. Aleatoriedade e anti-fraude

| Vetor | Defesa |
|---|---|
| Manipular sorteio de pacote | Chainlink VRF (prova on-chain) |
| Manipular resultado do PvP | VRF como fator + atributos públicos |
| Jogar com cartas que não tem | `balanceOf` verificado on-chain |
| Sacar aposta no meio | Stake travado em escrow |
| Inflacionar raridades | maxSupply imutável |
| Bots comprando pacotes | Limite diário por carteira + anti-bot no backend (Fase 5) |

---

# PARTE II — DESIGN VISUAL & UX

## 5. Identidade visual

### Conceito
"Álbum de figurinhas premium encontra o estádio à noite." Une a **textura nostálgica do papel** do álbum com a **energia vibrante** de um app de futebol moderno.

### Paleta
| Cor | Hex | Uso |
|---|---|---|
| Verde campo (escuro) | `#0A2E22` | Fundo principal, header |
| Verde gramado | `#14533C` | Gradientes, acentos |
| Amarelo troféu | `#FFDF00` | CTAs, destaques, marca |
| Papel envelhecido | `#F3E9D2` | Fundo do álbum (textura) |
| Marrom tinta | `#3A2E1E` | Texto sobre papel |

### Tipografia
- **Archivo Black** — títulos, OVR, marca (impacto esportivo)
- **Space Grotesk** — corpo, UI (legível, moderna)

### Texturas e efeitos
- Fundo do álbum: papel com linhas sutis e sombra interna
- Figurinhas "coladas": leve rotação aleatória (±2°) e sombra de adesivo
- Pacotes: efeito foil holográfico animado

---

## 6. Sistema de cartas (visual)

### Hierarquia de raridade (deve ser óbvia à primeira vista)
| Raridade | Moldura | Fundo | Efeito |
|---|---|---|---|
| Comum | Bronze fosco | Gradiente marrom | — |
| Rara | Prata metálica | Gradiente cinza-azul | brilho sutil |
| Épica | Ouro brilhante | Gradiente dourado | glow dourado |
| Lendária | Holográfica | Roxo + arco-íris | holo animado + glow |
| Mítica | Premium animada | Rosa-laranja | holo intenso + aura |

### Anatomia da carta (estilo FIFA)
```
┌─────────────────────┐
│ 90        [BRA] ◄── OVR + seleção
│ CAM                 │
│      ╭─────╮        │
│      │ 10  │ ◄────── emblema/retrato
│      ╰─────╯        │
│    REI ARTHUR  ◄──── nome
│ ───────────────     │
│ 87 PAC   90 DRI ◄─── 6 atributos
│ 92 SHO   80 DEF     │   com barras
│ 89 PAS   85 PHY     │
│  #0004 · LENDÁRIA   │
└─────────────────────┘
```

Cartas não-jogador (bandeira, mascote, estádio, curiosidade) usam o mesmo frame
mas com conteúdo central diferente (emblema, ilustração, texto).

---

## 7. Telas e navegação

### Estrutura de navegação (6 abas)
```
[📖 Álbum] [✨ Pacotes] [⚔️ Partida] [🏆 Ranking] [🔄 Trocas] [💰 Vender]
```
Header fixo: marca + seletor de rede + carteira/saldo + barra de progresso.

### Telas
| Tela | Elementos-chave | Estado emocional |
|---|---|---|
| **Álbum** | Seletor de país (48) + categorias + grid de slots | Nostalgia, conquista |
| **Pacotes** | 4 pacotes + animação de abertura (foil → VRF → revelação) | Antecipação, surpresa |
| **Partida** | Escalação 11+técnico + aposta + batalha animada | Tensão, competição |
| **Ranking** | Cartão do jogador + faixa + leaderboard + temporada | Status, progresso |
| **Trocas** | Mural de ofertas + criar oferta | Comunidade, negociação |
| **Vender** | Lista de cartas + preço + listar em marketplace | Controle, lucro |

---

## 8. Microinterações & animações

| Momento | Animação | Propósito |
|---|---|---|
| Abrir pacote | Foil brilhando → "rasgar" → cartas viram uma a uma | Dopamina da surpresa |
| Carta nova | "Slap" (cola com escala + rotação) + badge NOVA | Recompensa visual |
| Carta repetida | Badge ×N discreto | Informação sem frustração |
| VRF processando | Spinner + texto "gerando aleatoriedade" | Transparência (mascarar ~30s) |
| Batalha PvP | Confrontos revelados 1 a 1 com placar ao vivo | Tensão crescente |
| Vitória | Explosão dourada + ELO subindo | Celebração |
| Álbum completo | Troféu flutuante + número de série | Conquista máxima |

---

## 9. UX para Web3 sem fricção

Princípio: **o fã não precisa saber que é blockchain.**

| Fricção Web3 | Solução de UX |
|---|---|
| Seed phrase | Carteira embedded (login email/Google) |
| Gas fees | Pagos nos bastidores; usuário vê preço em R$/USD |
| Esperar confirmação | Animação cobre o tempo de transação |
| Termos cripto | Linguagem de jogo ("colar", "pacote", "troca") |
| Comprar cripto | Pix/cartão direto (Crossmint/Binance Pay) |

Usuário avançado pode "exportar para MetaMask" e usar OpenSea quando quiser —
a propriedade é real, mas a complexidade é opcional.

---

## 10. Acessibilidade & responsividade

- **Mobile-first:** layout retrato 1080×1920, alvos de toque ≥44px
- **Contraste:** texto sobre fundos validado (WCAG AA)
- **Reduced motion:** animações respeitam `prefers-reduced-motion`
- **Multiplataforma:** Unity escala para mobile, PC e WebGL
- **Idiomas:** PT-BR primeiro, depois ES e EN (foco LatAm)

---

## 11. Design System (componentes reutilizáveis)

| Componente | Onde | Variantes |
|---|---|---|
| `CardView` | todas as telas | 5 raridades × 7 tipos |
| `CardSlot` | álbum, escalação | vazio / preenchido |
| Botão primário | CTAs | amarelo (ação) / escuro (secundário) |
| Badge | cartas | NOVA / ×N / raridade |
| Modal | pacote, picker, batalha | bottom-sheet / centro |
| Toast | feedback | sucesso / info (com hash tx) |
| Barra de progresso | álbum, atributos | linear |

Referência de implementação: `CardView.cs` (Unity) e o componente `Sticker` (React).
