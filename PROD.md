# 📦 PROD.md — Documento de Produto (PRD)
### CryptoÁlbum Copa

> Product Requirements Document. Define o **quê** e o **porquê** do produto.
> Complementa o `DESIGN.md` (como construir) e o `.planning/` (roadmap GSD).

---

## 1. Visão do Produto

**CryptoÁlbum Copa** é a primeira plataforma que une a nostalgia do álbum de figurinhas da Copa com um jogo de cartas competitivo e propriedade real via NFT. O jogador colA, joga, compete e negocia — e tudo que ele coleciona é **dele de verdade**, na blockchain.

### Statement de visão
> "Reviver a magia do álbum de figurinhas da Copa, mas onde cada figurinha é sua para sempre, vale a pena colecionar e pode ser jogada."

### Proposta de valor única
1. **Propriedade real** — diferente do álbum físico (que some) ou do FUT da EA (que a empresa controla), suas cartas vivem na blockchain.
2. **Joga, não só coleciona** — atributos estilo FIFA + PvP com aposta dão utilidade às cartas.
3. **Economia aberta** — troca e venda livres, mercado secundário com royalties.

---

## 2. Problema & Oportunidade

| Problema | Como resolvemos |
|---|---|
| Álbuns físicos somem, rasgam, não têm valor após a Copa | NFTs permanentes, negociáveis, colecionáveis |
| Cartas de FUT (EA) não são propriedade do jogador | ERC-1155 = posse real, exportável |
| Trocas de figurinhas presenciais têm risco de golpe | Swap atômico on-chain, zero risco |
| Jogos play-to-earn morrem por economia inflacionária | Supply fixo e imutável por raridade |
| Cripto é complicado para o fã comum | Login por email, compra com Pix/cartão |

---

## 3. Personas

### 🟢 Persona 1 — "O Colecionador Nostálgico" (Carlos, 34)
- Cresceu colando álbuns da Copa, hoje tem renda
- **Quer:** completar o álbum, reviver a nostalgia, ter algo que dure
- **Motivação:** coleção, conquista (troféu de álbum completo)
- **Não quer:** complexidade técnica de cripto

### 🔵 Persona 2 — "O Competidor" (Bruna, 22)
- Joga FIFA/eFootball, gosta de PvP e ranking
- **Quer:** montar o melhor time, subir no ranking, ganhar apostas
- **Motivação:** competição, status, recompensa
- **Não quer:** pay-to-win desbalanceado

### 🟡 Persona 3 — "O Trader Cripto" (Diego, 28)
- Já usa OpenSea, entende de NFT
- **Quer:** especular em cartas raras, lucrar no mercado secundário
- **Motivação:** valorização, raridade, liquidez
- **Não quer:** coleção sem liquidez ou demanda real

### 🟣 Persona 4 — "O Fã de Fantasy" (Patrícia, 30)
- Joga Cartola FC toda rodada
- **Quer:** escalar time, pontuar pelo desempenho real, ligas
- **Motivação:** acompanhar o torneio, competir com amigos

---

## 4. Jornadas do Usuário

### Jornada A — Onboarding (Carlos, sem cripto)
```
Baixa o app → cadastra com Google → carteira criada nos bastidores
→ compra primeiro pacote com Pix → abre o pacote (animação)
→ vê as cartas coladas no álbum → compartilha com amigos
```
**Métrica de sucesso:** % que abre ≥1 pacote no D0.

### Jornada B — Engajamento competitivo (Bruna)
```
Abre vários pacotes → escala 11 + técnico → entra na fila PvP
→ batalha por atributos → vence, ELO sobe → sobe de faixa
→ usa o prêmio para comprar mais pacotes
```
**Métrica de sucesso:** partidas PvP por usuário/semana.

### Jornada C — Completar o álbum (Carlos)
```
Coleciona → tem repetidas → cria ofertas de troca
→ completa as figurinhas que faltam → reúne as 1.352
→ resgata o Troféu ERC-721 numerado → entra no hall da fama
```
**Métrica de sucesso:** % de progresso médio do álbum.

---

## 5. Features (priorização MoSCoW)

### Must Have (MVP)
- Álbum com 1.352 figurinhas (48 países + estádios)
- Pacotes com sorteio verificável (4 tipos incl. Mítico)
- Trocas P2P atômicas
- Conexão de carteira + login social
- Telas: Álbum, Pacotes, Trocas

### Should Have (lançamento)
- PvP (11 + técnico) por ranking/glória
- Ranking ELO + temporadas
- Venda em marketplace externo
- Pagamento fiat (Pix/cartão)

### Could Have (pós-lançamento)
- PvP com aposta (onde legal)
- Modo Fantasy com desempenho real (álbum vivo)
- Burn-to-redeem (carta mítica → figurinha física)
- Token de fidelidade $FIGO

### Won't Have (fora de escopo agora)
- Licenciamento FIFA/jogadores reais
- Chat/social network interno
- Modo PvE/campanha

---

## 6. Modelo de Negócio

| Fonte de receita | Descrição | Margem |
|---|---|---|
| Venda primária de pacotes | Principal | ~90% pós-gás |
| Royalties secundários (3%) | Recorrente, automático | 100% |
| Taxa de PvP com aposta (5%) | Sobre o pote | — |
| Pacotes patrocinados | B2B com marcas | alta |
| Edições especiais sazonais | Lendas, finais | alta |

**Economia (princípios):**
- Supply fixo e imutável → escassez real, sem inflação
- Sink de cartas (fusão burn-to-upgrade) → controla oferta de comuns
- Fundo de prêmios alimentado por taxas → recompensa os melhores

---

## 7. Métricas de Sucesso (KPIs)

### Aquisição
- CAC (custo de aquisição) vs LTV
- % onboarding completo (carteira + 1º pacote)

### Engajamento
- DAU/MAU
- Pacotes abertos por usuário/semana
- Partidas PvP por usuário/semana
- Progresso médio do álbum

### Retenção
- D1 / D7 / D30 retention
- % de usuários que voltam após a Copa

### Monetização
- ARPU / ARPPU
- Volume do mercado secundário
- Receita de royalties recorrente

### Saúde da economia
- Distribuição de raridades em circulação
- Preço médio por raridade no secundário
- Razão de cartas "queimadas" (fusão) vs mintadas

---

## 8. Riscos de Produto

| Risco | Mitigação |
|---|---|
| Hype só durante a Copa, abandono depois | Modos perenes (PvP, ligas), álbuns de outras competições |
| Pay-to-win afasta jogadores free | Fator VRF dá chance ao azarão; matchmaking por ELO |
| Economia infla e cartas perdem valor | Supply imutável + sinks (fusão) |
| Onboarding cripto afasta o fã comum | Login social + fiat + carteira invisível |
| Questões legais (loot box/aposta) | Modo sem aposta padrão, geofencing (ver JURIDICO) |
| Falta de liquidez no secundário | Integração OpenSea/Binance NFT, royalties que incentivam |

---

## 9. Concorrência

| Produto | Força | Nossa diferenciação |
|---|---|---|
| Panini (álbum físico/digital) | Marca, licença FIFA | Propriedade real, jogável, sem expirar |
| EA FC Ultimate Team | Licença, base gigante | Você é dono das cartas, mercado aberto |
| Sorare (fantasy NFT futebol) | Estabelecido, licenças | Álbum + PvP por atributos + foco Copa/LatAm |
| Cartola FC | Base BR enorme, grátis | Propriedade NFT + colecionável + PvP |

**Posicionamento:** o cruzamento único de **álbum nostálgico + jogo de cartas + Cartola**, com propriedade real e foco no público latino-americano via BNB Chain/Binance Pay.

---

## 10. Definição de "Pronto" (MVP)

O MVP está pronto quando um usuário consegue, na testnet:
- [ ] Criar conta com email/Google
- [ ] Comprar e abrir um pacote
- [ ] Ver figurinhas coladas no álbum (48 países)
- [ ] Criar e aceitar uma troca P2P
- [ ] Escalar um time e jogar uma partida PvP (sem aposta)
- [ ] Ver seu ELO no ranking
