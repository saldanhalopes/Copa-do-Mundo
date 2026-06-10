# 🎮 CryptoÁlbum Copa — Cliente Unity

Jogo de cartas de futebol com NFTs (Polygon/BNB Chain), feito em Unity com **ChainSafe Web3.unity**. Multiplataforma (Android, iOS, PC/WebGL).

---

## Arquitetura

```
┌──────────────────────────────────────────────┐
│                  UNITY (C#)                    │
│                                                │
│  Data/        Battle/      Web3/      UI/       │
│  ├ Card       ├ Battle     ├ Web3     ├ CardView│
│  ├ Catalog    │  Engine    │  Service ├ ...     │
│  └ Country    └ ...        └ Config             │
│       │           │           │                │
│       └───────────┴───────────┘                │
│                   │                            │
└───────────────────┼────────────────────────────┘
                    │ ChainSafe Web3.unity SDK
                    ▼
        ┌───────────────────────┐
        │   Smart Contracts      │  (Polygon / BNB)
        │   FigurinhasCopa 1155  │
        │   CardStats · PackStore│
        │   MatchEscrow · Ranking│
        └───────────────────────┘
```

**Princípio:** Unity é o cliente (visual + jogo). A blockchain guarda a propriedade
das cartas, os atributos imutáveis, e resolve as apostas. O `CardCatalog` gera as
1.304 figurinhas localmente de forma determinística — o tokenId N é sempre a mesma
carta em qualquer dispositivo, batendo com o que está on-chain.

---

## Estrutura de pastas

| Pasta | Conteúdo |
|---|---|
| `Data/` | `Card`, `CardCatalog` (gera as 1.304 cartas), `CountryDatabase` (48 países) |
| `Battle/` | `BattleEngine` — resolve confrontos por atributos + bônus do técnico |
| `Web3/` | `Web3Service` (ChainSafe), `ContractConfig` (endereços) |
| `Game/` | `PlayerInventory`, `BattleController` (orquestra o PvP) |
| `UI/` | `CardView` (prefab visual da carta estilo FIFA) |

---

## Catálogo (1.304 figurinhas)

Por país (×48 = 1.296):
- 23 jogadores (com atributos FIFA: PAC/SHO/PAS/DRI/DEF/PHY + OVR)
- 1 técnico (dá **bônus de força ao time** na batalha)
- 1 bandeira, 1 brasão, 1 mascote, 1 curiosidade

+ 8 estádios mundiais (lendários)

---

## Modo Partida (PvP)

- Escala **11 jogadores + 1 técnico**
- Aposta em POL/BNB (travada no `MatchEscrow`)
- 5 confrontos-chave decididos por atributos (OVR×2 + atributo da posição + VRF + bônus do técnico/confronto)
- Vencedor leva o pote; ELO atualizado no `RankingSeasons`

---

## Setup do ChainSafe Web3.unity

1. **Instalar o SDK** (Unity Package Manager → Add from git URL):
   ```
   https://github.com/ChainSafe/web3.unity.git?path=/Assets/ChainSafe
   ```
   (ou baixar o `.unitypackage` do site chainsafe.io/web3-unity)

2. **Criar conta** em [dashboard.gaming.chainsafe.io](https://dashboard.gaming.chainsafe.io)
   e obter o `ProjectID` e `ClientID`.

3. **Configurar a rede** em `Web3/ContractConfig.cs` — preencher os endereços
   dos contratos após rodar o deploy:
   ```bash
   cd ..   # raiz do projeto
   npx hardhat run scripts/deploy-testnet.js --network amoy
   ```
   Copiar os endereços impressos para `ContractConfig.Amoy`.

4. **Importar os ABIs** dos contratos (gerados em `../artifacts/*.json`) para
   `Assets/Resources/ABIs/` — o `Web3Service` os carrega para chamar os métodos.

5. **Wallets suportadas** pelo SDK: MetaMask, WalletConnect (Trust Wallet,
   Binance Web3) e carteira embutida (login social, sem cripto).

---

## Testes

`test/CatalogTest.cs` valida o catálogo e a batalha sem Unity:
```bash
# requer dotnet/mono
csc /out:test.exe test/CatalogTest.cs \
    unity/Assets/Scripts/Data/*.cs \
    unity/Assets/Scripts/Battle/BattleEngine.cs
mono test.exe
```
A mesma lógica já foi validada via porta JS (16 testes no `test/logic.test.js`).

---

## Próximos passos

1. Criar os prefabs visuais (`CardView`, slots de escalação, mesa de batalha)
2. Telas: Álbum (48 países + categorias), Pacotes, Partida, Ranking, Trocas
3. Integrar matchmaking real (servidor) para PvP entre jogadores reais
4. Sincronizar inventário com `balanceOfBatch` ao conectar a carteira
5. Build Android/iOS/WebGL
