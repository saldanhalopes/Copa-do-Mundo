# ⚽ CryptoÁlbum Copa

Plataforma Web3 de álbum de figurinhas da Copa do Mundo, onde cada figurinha é um NFT verificável em blockchain (ERC-1155 na Polygon).

## Estrutura

- `ESPECIFICACAO-PROJETO.md` — especificação técnica completa (blockchain, tokenomics, arquitetura, roadmap)
- `contracts/` — smart contracts em Solidity
  - `FigurinhasCopa.sol` — coleção ERC-1155 (680 figurinhas, royalties ERC-2981)
  - `PackStore.sol` — venda de pacotes com sorteio verificável via Chainlink VRF
  - `TradeDesk.sol` — trocas P2P atômicas sem custódia
- `CryptoAlbumCopa.jsx` — protótipo interativo do álbum (React)

## Stack

Solidity 0.8.24 · OpenZeppelin 5.x · Chainlink VRF 2.5 · Polygon PoS · Next.js · wagmi/viem · IPFS + Arweave

> Jogadores fictícios no demo. Lançamento comercial requer licenciamento FIFA/FIFPro ou arte original.
