# ⚽ CryptoÁlbum Copa

Plataforma Web3 que une **álbum de figurinhas**, **jogo de cartas PvP** e **Cartola FC** — cada figurinha é uma carta NFT (ERC-1155) com atributos estilo FIFA, colecionável, negociável e usável em partidas com aposta.

## 🎮 O que dá pra fazer

- **📖 Colecionar** figurinhas num álbum por seleção (propriedade real on-chain)
- **✨ Abrir pacotes** com sorteio verificável (Chainlink VRF / Binance Oracle)
- **⚔️ Batalhar** PvP: escala 5 cartas, aposta, e os atributos decidem (vencedor leva o pote)
- **🏆 Subir no ranking** ELO com temporadas e premiação
- **🔄 Trocar** figurinhas P2P (swap atômico, sem golpe)
- **💰 Vender** na OpenSea (Polygon) ou Binance NFT (BNB Chain)

## 📜 Smart Contracts (Solidity 0.8.24)

| Contrato | Função |
|---|---|
| `FigurinhasCopa.sol` | Coleção ERC-1155 (680 cartas, royalties ERC-2981) |
| `FigurinhasCopaBNB.sol` | Versão BNB Chain (Binance Oracle + Binance Pay) |
| `CardStats.sol` | Atributos imutáveis (PAC/SHO/PAS/DRI/DEF/PHY + OVR) |
| `PackStore.sol` | Venda de pacotes com VRF |
| `MatchEscrow.sol` | PvP com aposta — batalha por atributos |
| `RankingSeasons.sol` | ELO + temporadas + premiação |
| `FantasyLeague.sol` | Modo fantasy (química + desempenho real) |
| `TradeDesk.sol` | Trocas P2P atômicas |

Todos compilam sem erros e estão abaixo do limite de 24KB (EIP-170).

## 🧪 Validação

```bash
node scripts/compile.js   # compila os 8 contratos com solc
node test/logic.test.js   # 16 testes de lógica (ELO, batalha, química, stats)
```

## 🎨 Gerador de cartas

```bash
cd generator && python3 generate_cards.py
```
Gera 680 cartas (imagem PNG estilo FIFA + metadados + stats empacotados). Exemplos em `generator/samples/`.

## 🚀 Deploy

```bash
npm install
cp .env.example .env
npx hardhat run scripts/deploy-testnet.js --network amoy
```

## 📚 Documentação

- `ESPECIFICACAO-PROJETO.md` — arquitetura blockchain completa
- `SISTEMA-CARTAS.md` — atributos, raridades, recebimento e validação
- `JOGO-PVP.md` — design do jogo de cartas
- `BINANCE-INTEGRACAO.md` — BNB Chain, Binance Pay, Trust Wallet, Mystery Box

## 🖥️ Protótipo

`CryptoAlbumCopa.jsx` — app React multi-chain com todas as telas funcionais.

---

> Jogadores fictícios no demo. Lançamento comercial requer licenciamento FIFA/FIFPro ou arte original.
