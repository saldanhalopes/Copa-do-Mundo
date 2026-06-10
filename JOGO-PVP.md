# Jogo de Cartas PvP — CryptoÁlbum Copa

Mistura de **jogo de cartas competitivo** (cartas se enfrentam) com **Cartola FC**
(escalação, atributos, rodadas), usando as figurinhas NFT como cartas de batalha.

---

## Conceito

| Elemento | Inspiração | Como funciona aqui |
|---|---|---|
| Coleção de cartas | Álbum de figurinhas | Cada carta é um NFT ERC-1155 |
| Escalação | Cartola FC | Você monta um time de 5 cartas |
| Batalha | Jogos de cartas (TCG) | Cartas se enfrentam por atributos |
| Aposta | PvP com stake | Vencedor leva o pote |
| Atributos | FIFA Ultimate Team | OVR + PAC/SHO/PAS/DRI/DEF/PHY |

---

## Como funciona uma Partida

### 1. Escalação (5 cartas, 5 posições de confronto)
```
Slot 1: GOL  → atributo decisivo DEF
Slot 2: ZAG  → DEF
Slot 3: MEI  → PAS
Slot 4: PD   → SHO
Slot 5: CAM  → SHO
```

### 2. Aposta (stake)
- Você escolhe a aposta (5, 10 ou 25 POL/BNB)
- O valor é **travado no contrato `MatchEscrow.sol`** (escrow)
- O oponente paga o mesmo valor → pote = 2× aposta

### 3. Batalha (resolvida por atributos)
Cada um dos 5 slots gera um confronto carta-a-carta:

```
Força da carta = OVR × 2  +  atributo decisivo da posição  +  fator VRF (0–9)
```

- O **fator VRF** (Chainlink/Binance Oracle) garante que ninguém prevê ou manipula
- Quem vencer mais confrontos (melhor de 5) ganha a partida

### 4. Recompensa
- Vencedor recebe **95% do pote** (5% taxa da casa → fundo de prêmios)
- Distribuição automática on-chain, sem intermediário

---

## Por que é justo e à prova de trapaça (garantias blockchain)

1. **Posse verificada on-chain** — `balanceOf` confirma que você tem as 5 cartas
   antes de escalar. Impossível jogar com cartas que não possui.
2. **Stake em escrow** — o dinheiro fica travado no contrato; ninguém saca no meio.
3. **Aleatoriedade VRF** — o fator de sorte de cada confronto vem de prova
   criptográfica verificável. Nem a casa nem os jogadores controlam.
4. **Cartas não saem da carteira** — você joga apostando, mas continua dono dos NFTs.
   Só o stake em cripto muda de mãos, nunca as cartas.
5. **Resolução auditável** — qualquer um recalcula o resultado a partir dos
   atributos públicos + o número VRF registrado.

---

## Estratégia (camada Cartola + TCG)

- **Montar o time certo** importa: uma carta lendária (OVR 90+) quase sempre
  vence uma comum, mas o fator VRF dá chance ao azarão.
- **Casar carta e posição**: colocar um atacante (SHO alto) no slot de ataque
  maximiza a força naquele confronto.
- **Risco vs. recompensa**: apostar alto contra um time mais forte é arriscado;
  o matchmaking pode parear por OVR total para equilibrar.
- **Economia**: ganhe partidas → ganhe cripto → compre mais pacotes →
  consiga cartas melhores → ganhe mais. Loop de progressão.

---

## Modos futuros

| Modo | Descrição |
|---|---|
| **Ranqueado** | Temporadas com ranking; top jogadores ganham do fundo de royalties |
| **Liga Cartola** | Pontuação baseada no desempenho REAL dos jogadores no torneio (oráculo) |
| **Torneios** | Brackets eliminatórios com prêmio acumulado |
| **Modo coleção** | Restrições (só uma seleção, só épicas+) para variar o meta |

---

## Contratos envolvidos

- `FigurinhasCopa.sol` — as cartas (ERC-1155)
- `CardStats.sol` — atributos imutáveis de cada carta
- `MatchEscrow.sol` — partidas PvP com stake, batalha e distribuição do pote
- `PackStore.sol` — onde você adquire novas cartas
