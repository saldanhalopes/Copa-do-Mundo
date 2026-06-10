# ⚽ CryptoÁlbum Copa — Plataforma de Álbum de Figurinhas NFT

## 1. Visão Geral

Plataforma Web3 que recria a experiência clássica do álbum de figurinhas da Copa do Mundo, onde cada figurinha é um NFT verificável em blockchain. Os usuários compram pacotes, colecionam, trocam entre si e ganham recompensas ao completar o álbum — com propriedade real, escassez comprovável e mercado secundário transparente.

> ⚠️ **Nota de Propriedade Intelectual:** A marca "Copa do Mundo FIFA", escudos de seleções, nomes e imagens de jogadores exigem licenciamento (FIFA, FIFPro, federações). Para lançamento comercial, há duas rotas: (a) negociar licenças oficiais, ou (b) lançar com arte original e jogadores fictícios/genéricos ("torneio mundial de futebol"). Toda a arquitetura abaixo funciona em ambos os cenários.

---

## 2. Especificações de Blockchain

### 2.1 Rede escolhida: **Polygon PoS** (com alternativa Base)

| Critério | Polygon PoS | Base (L2 Ethereum) | Ethereum L1 |
|---|---|---|---|
| Custo por mint | ~$0,001–0,01 | ~$0,01–0,05 | $2–50 |
| TPS prático | ~65.000 | ~1.000+ | ~15 |
| Compatibilidade EVM | Total | Total | Nativa |
| Ecossistema NFT | OpenSea, Magic Eden | OpenSea, Zora | Todos |
| Onboarding fiat | Ramp, MoonPay | Coinbase Onramp | Caro |

**Decisão:** Polygon PoS como rede principal — milhões de mints baratos são essenciais para figurinhas de baixo valor unitário. Base como alternativa se o foco for onboarding via Coinbase (forte nos EUA).

### 2.2 Padrão de Token: **ERC-1155 (Multi-Token)**

Por que ERC-1155 e não ERC-721:

- **Figurinhas são semi-fungíveis:** existem milhares de cópias da figurinha #10 "Camisa 10 do Brasil". ERC-1155 representa isso nativamente: `tokenId = figurinha`, `balance = quantidade de cópias`.
- **Batch operations:** abrir um pacote de 5 figurinhas = 1 transação (`mintBatch`), reduzindo gás em ~80% vs. 5 mints ERC-721.
- **Trocas atômicas:** `safeBatchTransferFrom` permite trocar várias figurinhas de uma vez.

Tokens complementares:
- **ERC-721** apenas para o **"Troféu de Álbum Completo"** (único por colecionador, com número de série da ordem de conclusão).
- **ERC-20 opcional ($FIGO)** como token de recompensas/fidelidade (fase 2).

### 2.3 Aleatoriedade: **Chainlink VRF v2.5**

A abertura de pacotes precisa de aleatoriedade **verificável e à prova de manipulação**:

1. Usuário compra pacote → contrato solicita número aleatório ao Chainlink VRF.
2. VRF responde com prova criptográfica on-chain (~30 seg).
3. Contrato usa o número para sortear as 5 figurinhas conforme tabela de raridade.
4. Qualquer pessoa pode auditar que nem a plataforma nem o usuário manipularam o sorteio.

### 2.4 Metadados e Arte: **IPFS + Arweave**

```
ipfs://QmXxx.../{tokenId}.json
```

```json
{
  "name": "Figurinha #047 — Goleiro Lendário",
  "description": "Figurinha oficial do CryptoÁlbum Copa 2026",
  "image": "ipfs://QmYyy.../047.png",
  "animation_url": "ipfs://QmZzz.../047-holo.mp4",
  "attributes": [
    { "trait_type": "Seleção", "value": "Brasil" },
    { "trait_type": "Posição", "value": "Goleiro" },
    { "trait_type": "Raridade", "value": "Lendária" },
    { "trait_type": "Número no Álbum", "value": 47 },
    { "trait_type": "Edição", "value": "2026" }
  ]
}
```

- **IPFS (via Pinata/Filebase):** distribuição rápida e padrão de mercado.
- **Arweave:** backup permanente (pago uma vez, armazenado para sempre) — garante que a arte sobrevive mesmo se a empresa fechar.
- Hash dos metadados gravado no contrato (`uri()` imutável após `freezeMetadata()`).

### 2.5 Arquitetura de Smart Contracts

```
┌─────────────────────────────────────────────────┐
│                   USUÁRIO                        │
└──────┬──────────────┬──────────────┬────────────┘
       │              │              │
┌──────▼─────┐ ┌──────▼─────┐ ┌──────▼──────────┐
│ PackStore  │ │ TradeDesk  │ │ AlbumRewards    │
│ (vendas +  │ │ (trocas    │ │ (verifica álbum │
│  VRF)      │ │  P2P sem   │ │  completo e     │
│            │ │  custódia) │ │  minta troféu)  │
└──────┬─────┘ └──────┬─────┘ └──────┬──────────┘
       │              │              │
┌──────▼──────────────▼──────────────▼───────────┐
│         FigurinhasCopa (ERC-1155)               │
│  680 tokenIds · supply controlado · royalties   │
└─────────────────────────────────────────────────┘
```

| Contrato | Padrão | Função |
|---|---|---|
| `FigurinhasCopa.sol` | ERC-1155 + ERC-2981 | Coleção principal, 680 figurinhas, royalties de 5% |
| `PackStore.sol` | Custom + VRF | Venda de pacotes, sorteio verificável, limites por carteira |
| `TradeDesk.sol` | Custom (escrow atômico) | Trocas P2P "figurinha por figurinha" sem intermediário |
| `AlbumRewards.sol` | ERC-721 | Verifica posse das 680 figurinhas e minta o Troféu |
| `Marketplace` | Externo | OpenSea/Magic Eden via Seaport (não reinventar a roda) |

### 2.6 Royalties: **ERC-2981**

- 5% de royalty em vendas secundárias, dividido: 3% plataforma, 2% fundo de prêmios dos colecionadores.
- Implementado via padrão ERC-2981 (respeitado por OpenSea, Magic Eden, Rarible).

### 2.7 Segurança

- Contratos baseados em **OpenZeppelin 5.x** (auditados).
- `ReentrancyGuard` em todas as funções com transferência de valor.
- **Pausable** para emergências; **AccessControl** com multisig (Gnosis Safe 3/5) como admin.
- Supply de cada figurinha **fixado no deploy** — impossível inflacionar raridades.
- Auditoria externa (CertiK, Trail of Bits ou Hacken) antes do mainnet.
- Bug bounty via Immunefi.

---

## 3. Estrutura da Coleção

### 3.1 O Álbum (Edição 2026 — 48 seleções)

| Categoria | Qtde de figurinhas | Detalhe |
|---|---|---|
| Jogadores | 48 seleções × 11 = 528 | Titulares de cada seleção |
| Escudos/Bandeiras | 48 | Uma por seleção |
| Estádios | 16 | Sedes do torneio |
| Mascote + Troféu + Bola | 8 | Itens especiais |
| Lendas históricas | 80 | Craques de copas passadas |
| **TOTAL** | **680** | |

### 3.2 Raridades e Supply

| Raridade | % no sorteio | Supply por figurinha | Visual |
|---|---|---|---|
| Comum | 70% | 50.000 | Padrão |
| Rara | 20% | 10.000 | Borda prateada |
| Épica | 8% | 2.500 | Borda dourada |
| Lendária | 1,9% | 500 | Holográfica animada |
| Mítica (1/1 autografada*) | 0,1% | 10–50 | Vídeo + benefício físico |

*Versões míticas podem incluir resgate físico (figurinha impressa autografada via burn-to-redeem).

### 3.3 Pacotes

| Pacote | Preço | Conteúdo | Garantia |
|---|---|---|---|
| Básico | $1,99 | 5 figurinhas | — |
| Premium | $7,99 | 5 figurinhas | ≥1 Rara |
| Lendário | $24,99 | 10 figurinhas | ≥1 Épica |

Pagamento em: cartão de crédito (via Crossmint/MoonPay — usuário nem precisa saber o que é cripto), USDC, MATIC/POL.

---

## 4. Mecânicas de Jogo

### 4.1 Trocas P2P (o coração do álbum!)

A magia do álbum de figurinhas sempre foi a troca no recreio. O `TradeDesk.sol` recria isso:

1. Ana cria oferta: "Dou minha #231 (repetida) por uma #047".
2. A oferta fica pública no mural de trocas (filtrável por "quem tem o que eu preciso").
3. Bruno aceita → swap atômico em 1 transação. Ou os dois têm a figurinha, ou nada acontece. **Zero risco de golpe.**
4. Matching automático: o backend sugere trocas triangulares (A→B→C→A) quando não há troca direta possível.

### 4.2 Álbum Completo = Troféu + Prêmios

- Ao reunir as 680 figurinhas, o usuário chama `claimTrophy()`.
- Contrato verifica `balanceOfBatch` on-chain e minta o **Troféu ERC-721 numerado** (Troféu #1 = primeiro do mundo a completar).
- As figurinhas ficam **soulbound temporariamente** (travadas) ou são "carimbadas" — escolha de design: recomendo apenas snapshot, sem travar, para não matar liquidez.
- Prêmios escalonados: primeiros 100 troféus ganham ingressos/camisas oficiais; todos entram no sorteio do fundo de prêmios (os 2% de royalties).

### 4.3 Outras mecânicas

- **Fusão (burn-to-upgrade):** queime 10 cópias Comuns da mesma figurinha → receba 1 Rara.
- **Álbum vivo:** figurinhas de jogadores que marcam gols no torneio real recebem "estrelas" via oráculo de dados esportivos (Chainlink Functions + API de resultados).
- **Modo fantasy:** escale um time com suas figurinhas e pontue conforme desempenho real.

---

## 5. Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Smart Contracts | Solidity 0.8.24, OpenZeppelin 5.x, Chainlink VRF 2.5 |
| Dev/Test | Hardhat + Foundry (fuzzing), cobertura ≥95% |
| Frontend | Next.js 14, TypeScript, TailwindCSS, wagmi + viem |
| Carteiras | RainbowKit (MetaMask, WalletConnect) + **embedded wallets (Privy/Dynamic)** para usuários sem cripto — login com e-mail/Google |
| Indexação | The Graph (subgraph da coleção) + Alchemy NFT API |
| Backend | Node.js (NestJS), PostgreSQL, Redis (mural de trocas, matching) |
| Pagamentos fiat | Crossmint (mint com cartão), MoonPay |
| Mídia | IPFS (Pinata) + Arweave |
| Infra | Vercel + AWS, RPC via Alchemy/QuickNode |

---

## 6. Fluxo do Usuário (sem fricção Web3)

1. **Cadastro:** e-mail ou Google → carteira embedded criada automaticamente (Privy). Usuário nem vê seed phrase.
2. **Compra:** pacote com cartão de crédito (Crossmint faz o mint e entrega na carteira).
3. **Abertura:** animação de "rasgar o pacote" enquanto o VRF responde (~30s mascarados pela animação).
4. **Colagem:** interface visual do álbum — figurinhas "coladas" automaticamente nas páginas.
5. **Troca:** mural estilo "tenho/preciso" com 1 clique.
6. **Exportação:** usuário avançado pode exportar para MetaMask e vender na OpenSea quando quiser. **A propriedade é dele de verdade.**

---

## 7. Modelo de Receita

| Fonte | Estimativa |
|---|---|
| Venda primária de pacotes | Principal (margem ~90% pós-gás) |
| Royalties secundários (3%) | Recorrente |
| Pacotes patrocinados por marcas | B2B |
| Edições especiais (lendas, finais) | Sazonal |
| Taxa de listagem premium no mural de trocas | Micro |

---

## 8. Roadmap

| Fase | Prazo | Entregas |
|---|---|---|
| 1 — MVP | Mês 1–3 | Contratos na testnet (Amoy), álbum web, compra com cripto |
| 2 — Beta | Mês 4–5 | Auditoria, fiat onramp, embedded wallets, trocas P2P |
| 3 — Lançamento | Mês 6 | Mainnet Polygon, marketing, parcerias com influenciadores de futebol |
| 4 — Torneio | Durante a Copa | Álbum vivo, fantasy, drops de lendas |
| 5 — Expansão | Pós-Copa | Token $FIGO, álbuns de ligas (Brasileirão, Champions) |

---

## 9. Conformidade e Riscos

- **Jurídico:** estruturar figurinhas como colecionáveis digitais (não valores mobiliários — sem promessa de lucro). Parecer jurídico em cada jurisdição-alvo; no Brasil, atenção à CVM e à Lei 14.478/2022 (marco das criptos).
- **Loot box / sorteio:** o sorteio de pacotes pode ser enquadrado como mecânica de azar em alguns países — exibir probabilidades publicamente (como já fazem jogos mobile) e verificar regras locais.
- **PI:** licenciamento FIFA/jogadores ou arte original (ver nota na seção 1).
- **KYC/AML:** obrigatório no fiat onramp (delegado a Crossmint/MoonPay).

---

## 10. Arquivos do Projeto

- `contracts/FigurinhasCopa.sol` — Contrato ERC-1155 principal
- `contracts/PackStore.sol` — Venda de pacotes com Chainlink VRF
- `contracts/TradeDesk.sol` — Trocas P2P atômicas
