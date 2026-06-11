# 🛠️ Guia de Montagem no Unity — Passo a Passo

Como abrir, montar e rodar o CryptoÁlbum Copa no editor Unity, do zero ao Play.

---

## Pré-requisitos

- **Unity Hub** + **Unity 2022.3 LTS** (ou superior)
- O repositório clonado (`git clone https://github.com/saldanhalopes/Copa-do-Mundo.git`)

---

## Passo 1 — Abrir o projeto

1. Abra o **Unity Hub** → **Add** → **Add project from disk**
2. Selecione a pasta `unity/` do repositório
3. Abra. O Unity vai importar e compilar os scripts (1-2 min na primeira vez)

> Se aparecer erro de TextMeshPro, vá em **Window ▸ TextMeshPro ▸ Import TMP Essential Resources**.

---

## Passo 2 — Instalar o ChainSafe Web3.unity

1. **Window ▸ Package Manager**
2. Botão **+** (canto superior esquerdo) → **Add package from git URL**
3. Cole:
   ```
   https://github.com/ChainSafe/web3.unity.git?path=/Assets/ChainSafe
   ```
4. Aguarde a instalação

> Sem isso, o `Web3Service` roda em modo stub (demo funciona, mas sem blockchain real).

---

## Passo 3 — Gerar o prefab da carta (automático)

1. No menu superior, clique em **CryptoÁlbum ▸ Criar Prefab de Carta**
2. Confirme: aparece `Assets/Prefabs/CardView.prefab`

Esse prefab já vem com OVR, posição, nome, 6 atributos e moldura ligados ao `CardView`.

---

## Passo 3.5 — Gerar o prefab da tela de Partida (automático)

1. **CryptoÁlbum ▸ Criar Prefab da Partida**
2. Cria `Assets/Prefabs/PartidaPanel.prefab` com:
   - Seletor de modo (Ranqueada / Aposta) com highlights ligados
   - Painel de aposta com 4 botões de valor (5/10/25/50 POL)
   - Grid de escalação (11 jogadores + técnico) com `CardSlot` e `CardView`
   - Botão de iniciar partida com texto dinâmico
   - Picker overlay + Modal de confirmação + Battle panel + Result panel
   - `BattleController` já adicionado e ligado ao `MatchScreen.battle`
3. Todos os 28 campos públicos do `MatchScreen` já estão ligados aos GameObjects

## Passo 4 — Gerar a cena base (automático)

**Opção A (recomendada) — UI completa em um clique:**
1. **CryptoÁlbum ▸ Construir UI Completa (6 abas)**
2. Cria `Assets/Scenes/Main.unity` com header, 6 painéis, tab bar e `TabNavigator` já ligado

**Opção B — cena mínima:**
1. **CryptoÁlbum ▸ Construir Cena de Demo** → `Assets/Scenes/Demo.unity`

A cena já tem:
- **Managers** (Web3Service + PlayerInventory + DemoSeeder)
- **Canvas** (escala para 1080×1920, retrato mobile)
- **EventSystem**

---

## Passo 5 — Montar as 6 telas

Para cada tela, crie um **Panel** filho do Canvas e adicione o script correspondente:

| Painel | Script | Campos principais a ligar |
|---|---|---|
| AlbumPanel | `AlbumScreen` | countryButtonPrefab, cardSlotPrefab, gridContainer, categoryButtons[5] |
| PacotesPanel | `PackStoreScreen` | packButtonPrefab, cardViewPrefab (=CardView.prefab), revealContainer |
| PartidaPanel | `MatchScreen` + `BattleController` | playerSlots[11], coachSlot, stakeButtons, cardViewPrefab |
| RankingPanel | `RankingScreen` | rankRowPrefab, leaderboardContainer, eloText, tierBadge |
| TrocasPanel | `TradeScreen` | offerRowPrefab, pickerCardPrefab, givePickerGrid, wantPickerGrid |
| (header) | `TabNavigator` | panels[6], tabButtons[6], connectButton, progressBar |

> **Dica:** para o grid, use um `GridLayoutGroup` no container (cell size ~150×210, spacing 8).
> Para listas roláveis, use `ScrollRect` + `Content` com `VerticalLayoutGroup`.

---

## Passo 6 — Ligar a navegação

1. No GameObject do header, adicione `TabNavigator`
2. Arraste os 6 painéis para `panels[]` (ordem: Álbum, Pacotes, Partida, Ranking, Trocas, Vender)
3. Arraste os 6 botões de aba para `tabButtons[]`
4. Ligue `connectButton` ao botão de conectar carteira

---

## Passo 7 — Rodar (Play)

1. Abra `Assets/Scenes/Demo.unity`
2. Clique em **▶ Play**
3. O `DemoSeeder` popula um inventário de teste automaticamente
4. Teste:
   - **Álbum**: navegue pelos 48 países e categorias
   - **Pacotes**: abra um pacote (incl. Mítico) e veja a revelação
   - **Partida**: escale 11 + técnico, aposte, batalhe
   - **Ranking**: veja seu ELO subir após vitórias

---

## Passo 8 — Conectar à blockchain de verdade (opcional)

1. Faça o deploy dos contratos:
   ```bash
   cd ..        # raiz
   npm install
   cp .env.example .env   # preencher PRIVATE_KEY e RPCs
   npx hardhat run scripts/deploy-testnet.js --network amoy
   ```
2. Copie os endereços impressos para `Web3/ContractConfig.cs` (campo `Amoy`)
3. Configure o ProjectID do ChainSafe em [dashboard.gaming.chainsafe.io](https://dashboard.gaming.chainsafe.io)
4. Importe os ABIs de `../artifacts/*.json` para `Assets/Resources/ABIs/`
5. No Play, clique em **Conectar** → escolha MetaMask/Trust Wallet
6. O `PlayerInventory.SyncFromChain()` lê suas figurinhas reais via `balanceOfBatch`

---

## Passo 9 — Build multiplataforma

**File ▸ Build Settings** → adicione a cena Demo → escolha a plataforma:

| Plataforma | Notas |
|---|---|
| **Android** | Configure keystore; min API 24+ |
| **iOS** | Requer Mac + Xcode |
| **WebGL** | Jogar no navegador; bom para demo |
| **PC** | Windows/Mac/Linux standalone |

---

## Solução de problemas

| Erro | Solução |
|---|---|
| Scripts não compilam | Reimporte TMP Essentials; confira Unity 2022.3+ |
| Cartas não aparecem | Ligou o `CardView.prefab` nos campos `cardViewPrefab`? |
| Carteira não conecta | ChainSafe instalado? ProjectID configurado? |
| Inventário vazio | O `DemoSeeder` está no GameObject Managers? |
