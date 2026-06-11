# 🎮 UNITY-SPEC.md — Especificação Técnica Unity
### CryptoÁlbum Copa

> Especificação completa para desenvolver o cliente em Unity: versões, pacotes,
> configurações de projeto, arquitetura de cenas, prefabs, padrões de código e build.
> Baseada na documentação oficial do Unity e do ChainSafe web3.unity SDK.

---

## 1. Versões e requisitos

| Item | Versão / Requisito |
|---|---|
| **Unity** | 2022.3 LTS (ou 6000.x LTS) — usar **LTS** sempre |
| **Scripting Backend** | IL2CPP (mobile/release), Mono (dev rápido) |
| **API Compatibility** | .NET Standard 2.1 |
| **ChainSafe web3.unity** | v3.x (Web3Unity, modal unificado, `web3.ErcXX.*`) |
| **RPC** | Provedor próprio (Chainstack/Infura) — v3 não usa API ChainSafe |
| **TextMeshPro** | Essentials importados |
| **Plataformas-alvo** | Android (API 24+), iOS (13+), WebGL, PC standalone |

> ⚠️ ChainSafe v3 mudou em relação a v1/v2: `Web3Accessor` → `Web3Unity`,
> `signer.GetAddress()` (async) → `signer.PublicAddress` (sync), classe `EVM` removida,
> carteiras unificadas em um único modal. Seguir a doc v3 (docs.gaming.chainsafe.io).

---

## 2. Configuração do projeto (Project Settings)

### Player Settings
```
Company Name:        (sua empresa)
Product Name:        CryptoÁlbum Copa
Default Orientation: Portrait
Bundle Identifier:   com.suaempresa.cryptoalbumcopa
Minimum API (Android): 24 (Android 7.0)
Target iOS:          13.0
Scripting Backend:   IL2CPP
Target Architectures: ARM64 (mobile)
Api Compatibility:   .NET Standard 2.1
Active Input Handling: Input System (novo) ou Both
```

### Quality Settings
- Mobile: 2-3 níveis (Low/Medium/High), texturas comprimidas (ASTC)
- WebGL: compressão Brotli, code stripping High

### Graphics
- **URP (Universal Render Pipeline)** — leve, multiplataforma, suporta efeitos de carta
- Color Space: **Linear** (gradientes e holográficos corretos)

---

## 3. Pacotes (Package Manager)

### Pacotes Unity (Window → Package Manager)
```
com.unity.textmeshpro          (UI de texto)
com.unity.render-pipelines.universal  (URP)
com.unity.inputsystem          (input multiplataforma)
com.unity.addressables         (carregar arte das cartas sob demanda)
com.unity.nuget.newtonsoft-json (JSON, dependência do ChainSafe)
```

### ChainSafe web3.unity (Add via Git URL)
```
# Core SDK (interações de chain)
https://github.com/ChainSafe/web3.unity.git?path=/Packages/io.chainsafe.web3-unity

# Pacotes modulares conforme necessidade:
# - WalletConnect (MetaMask, Trust, Binance Web3)
# - Web Wallet (login social / embedded)
# - Marketplace (read/write de NFT)
# - Lootboxes (pacotes provably-fair, opcional)
```

> Os pacotes são **modulares** — importe só o que usar para não inflar o build.
> Cada pacote tem samples instaláveis no Package Manager.

---

## 4. Configuração do ChainSafe

### Passo a passo
1. Criar conta em **dashboard.gaming.chainsafe.io**
2. Criar projeto → obter **ProjectID** e **ClientID**
3. No Unity: **Window → ChainSafe → Server Settings** (toolbar no topo na v3)
4. Configurar RPC próprio (Chainstack oferece 3M chamadas/mês grátis)
5. Adicionar as redes: Polygon (137), Amoy (80002), BNB (56), BSC testnet (97)

### Inicialização (código)
```csharp
using ChainSafe.Gaming.UnityPackage;
using ChainSafe.Gaming.Web3;

// v3: Web3Unity é o ponto de entrada
var web3 = await Web3Unity.Instance.Connect(); // abre o modal unificado de carteira
string address = web3.Signer.PublicAddress;     // síncrono na v3
```

---

## 5. Estrutura de pastas (Assets/)

```
Assets/
├── Scripts/                     [já existe]
│   ├── Data/         (Card, CardCatalog, CountryDatabase)
│   ├── Battle/       (BattleEngine)
│   ├── Web3/         (Web3Service, ContractConfig)
│   ├── Game/         (PlayerInventory, BattleController, DemoSeeder)
│   ├── UI/           (CardView, CardSlot, TabNavigator)
│   │   └── Screens/  (Album, PackStore, Match, Ranking, Trade)
│   └── CryptoAlbumCopa.Runtime.asmdef
├── Editor/
│   ├── SceneBuilder.cs
│   └── CryptoAlbumCopa.Editor.asmdef
├── Prefabs/
│   ├── CardView.prefab
│   ├── CardSlot.prefab
│   ├── PackButton.prefab
│   ├── ClashRow.prefab
│   └── RankRow.prefab
├── Scenes/
│   ├── Boot.unity        (inicialização, splash)
│   ├── Main.unity        (jogo principal, 6 abas)
│   └── Battle.unity      (opcional: cena dedicada de batalha)
├── Resources/
│   └── ABIs/             (JSON dos contratos para o ChainSafe)
├── Art/
│   ├── Cards/            (Addressables: 1.352 PNGs)
│   ├── UI/               (ícones, fundos, molduras)
│   └── Fonts/            (Archivo Black, Space Grotesk via TMP)
├── Audio/
│   ├── SFX/             (abrir pacote, vitória, clique)
│   └── Music/
└── Settings/
    └── URP/             (assets do render pipeline)
```

---

## 6. Arquitetura de cenas

### Boot.unity (inicialização)
- Splash + logo
- Inicializa `Web3Service`, `PlayerInventory` (DontDestroyOnLoad)
- Carrega `Main.unity` de forma assíncrona

### Main.unity (jogo)
```
Canvas (Screen Space Overlay, 1080×1920)
├── Header (TabNavigator)
│   ├── Logo + nome
│   ├── ChainSelector
│   ├── ConnectWalletButton
│   └── ProgressBar (álbum)
├── Panels
│   ├── AlbumPanel    (AlbumScreen)
│   ├── PacotesPanel  (PackStoreScreen)
│   ├── PartidaPanel  (MatchScreen + BattleController)
│   ├── RankingPanel  (RankingScreen)
│   ├── TrocasPanel   (TradeScreen)
│   └── VenderPanel   (VenderScreen)
├── TabBar (6 botões)
└── ModalLayer
    ├── PackOpenModal
    ├── CardPickerModal
    ├── BattleModal
    └── ToastContainer

Managers (DontDestroyOnLoad)
├── Web3Service
├── PlayerInventory
└── AudioManager
```

---

## 7. Especificação dos Prefabs

### CardView.prefab (300×420, escala FIFA)
```
CardView (Image=fundo gradiente) + CardView.cs
├── Frame (Image=moldura raridade)
├── Holo (Image=overlay holográfico, só lendária/mítica)
├── OvrText (TMP, 72pt)
├── PosText (TMP, 32pt)
├── FlagBadge (Image) + FlagText (TMP)
├── Portrait (Image=retrato/emblema)
├── NameText (TMP, 34pt)
├── AttrsContainer
│   └── 6× (ValueText + LabelText + ProgressBar)
├── RarityText (TMP, 20pt)
├── CountBadge (Image + TMP "×N")
└── NewBadge (GameObject "NOVA")
```
Cores de moldura por raridade definidas em `CardView.FrameColors[]`.

### CardSlot.prefab (slot de escalação/álbum)
```
CardSlot (Button) + CardSlot.cs
├── CardView (filho, oculto quando vazio)
└── EmptyState
    └── EmptyLabel (TMP: "GOL", "CAM", "COLE"…)
```

### Outros prefabs
| Prefab | Uso | Conteúdo |
|---|---|---|
| `PackButton` | loja | 3 TMP (nome/desc/preço) + Button |
| `ClashRow` | batalha | 2 CardView + TMP (força/resultado) |
| `RankRow` | ranking | 4 TMP (pos/nome/V-D/ELO) + Image |
| `OfferRow` | trocas | 2 CardView + TMP + Button aceitar |

---

## 8. Padrões de código

### Convenções
- **Namespaces:** `CryptoAlbumCopa.{Data|Battle|Web3Net|Game|UI}`
- **Async:** usar `async Task` (não `async void`, exceto event handlers)
- **Singletons:** `Instance` + `DontDestroyOnLoad` (Web3Service, PlayerInventory)
- **Eventos:** `event System.Action` para desacoplar UI de lógica
- **Determinismo:** catálogo gerado igual ao Python/Solidity (validado)

### Separação de responsabilidades
```
Data       → modelo puro, sem Unity (testável standalone)
Battle     → lógica de jogo, sem Unity
Web3Net    → integração blockchain (ChainSafe)
Game       → estado + orquestração (MonoBehaviours)
UI         → apresentação (lê estado, dispara ações)
```

### Assembly Definitions
- `CryptoAlbumCopa.Runtime` → código de jogo (vai no build)
- `CryptoAlbumCopa.Editor` → ferramentas de editor (não vai no build)
- Referência: Runtime ← Editor

---

## 9. Integração com contratos (ChainSafe v3)

### Ler NFTs da carteira (balanceOfBatch)
```csharp
// via web3.ErcXX na v3, ou contrato customizado
var contract = web3.ContractBuilder.Build(abi, address);
var balances = await contract.Call("balanceOfBatch",
    new object[] { accounts, tokenIds });
```

### Comprar pacote (com value)
```csharp
var tx = await contract.Send("comprarPacote",
    new object[] { packType },
    new TransactionRequest { Value = priceWei });
```

### Ler atributos imutáveis (CardStats → BigInteger)
```csharp
var packed = await contract.Call("getPacked", new object[] { tokenId });
var (attrs, pos, rar, sel) = Card.UnpackFull((BigInteger)packed[0]);
```

> Substituir os **stubs** em `Web3Service.cs` por estas chamadas reais.
> ABIs ficam em `Resources/ABIs/` (gerados em `../artifacts/*.json`).

---

## 10. Arte e Addressables

- As 1.352 cartas em `Art/Cards/` como **Addressables** (carregamento sob demanda)
- Atlas de sprites para UI comum (ícones, molduras)
- Texturas comprimidas: ASTC (mobile), DXT (PC)
- Naming: `card_{tokenId}.png` → carregado por `Addressables.LoadAssetAsync`

```csharp
var sprite = await Addressables.LoadAssetAsync<Sprite>($"card_{tokenId}").Task;
cardView.Portrait.sprite = sprite;
```

---

## 11. Áudio

| Evento | Som |
|---|---|
| Abrir pacote (foil) | shimmer |
| Revelar carta rara+ | "ding" crescente por raridade |
| Vitória PvP | torcida + apito |
| Clique de UI | tap sutil |
| Colar figurinha | "stamp" |

`AudioManager` singleton com pools de AudioSource.

---

## 12. Build e distribuição

### Android
```
Build Settings → Android
- IL2CPP + ARM64
- Keystore configurado (release)
- Min API 24, Target API mais recente
- App Bundle (.aab) para Play Store
```

### iOS
```
Build Settings → iOS (requer Mac + Xcode)
- IL2CPP + ARM64
- Provisioning profile
```

### WebGL
```
Build Settings → WebGL
- Compression: Brotli
- Code stripping: High
- Template customizado (loading screen com a marca)
```

### Otimização de tamanho
- Addressables para arte (não embutir 1.352 PNGs no build)
- Code stripping (Managed Stripping Level: High)
- Texturas comprimidas por plataforma

---

## 13. Testes

| Tipo | Ferramenta | O que testa |
|---|---|---|
| Lógica pura | NUnit (Test Runner) | CardCatalog, BattleEngine, ELO |
| Standalone | `test/CatalogTest.cs` | catálogo + batalha sem Unity |
| Play Mode | Unity Test Framework | fluxos de UI, navegação |
| Integração chain | testnet Amoy | conexão, mint, partida reais |

```bash
# teste standalone (sem Unity)
dotnet run --project test/CatalogTest.cs
```

---

## 14. Checklist de implementação

**Setup (Fase 3 do roadmap):**
- [ ] Unity 2022.3 LTS instalado, projeto aberto
- [ ] TMP Essentials importados
- [ ] URP configurado, Color Space Linear
- [ ] ChainSafe v3 instalado (core + WalletConnect + WebWallet)
- [ ] ProjectID/ClientID + RPC Chainstack configurados
- [ ] ABIs em Resources/ABIs/

**Cenas e prefabs:**
- [ ] `CryptoÁlbum ▸ Criar Prefab de Carta`
- [ ] `CryptoÁlbum ▸ Construir UI Completa (6 abas)`
- [ ] Ligar screens aos painéis
- [ ] Ligar prefabs aos campos dos screens

**Integração:**
- [ ] Substituir stubs do Web3Service por chamadas ChainSafe reais
- [ ] Testar conexão de carteira na Amoy
- [ ] Testar compra de pacote + leitura de NFTs
- [ ] Testar PvP end-to-end

**Build:**
- [ ] Android (.aab), iOS, WebGL builds
- [ ] Addressables configurados para a arte
- [ ] Otimização de tamanho aplicada

---

## 15. Referências oficiais

- Unity Manual: https://docs.unity3d.com/Manual/
- ChainSafe Gaming Docs: https://docs.gaming.chainsafe.io/
- ChainSafe v3 release notes: https://blog.chainsafe.io/release-notes-web3-unity-3-0/
- web3.unity GitHub: https://github.com/ChainSafe/web3.unity
- Addressables: https://docs.unity3d.com/Packages/com.unity.addressables@latest
- URP: https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@latest
