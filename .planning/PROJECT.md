# PROJECT.md — CryptoÁlbum Copa

> Artefato GSD Core. Descreve o projeto, seu escopo e visão.

## O que é

Plataforma Web3 que une **álbum de figurinhas da Copa do Mundo**, **jogo de cartas PvP** e **Cartola FC**. Cada figurinha é uma carta NFT (ERC-1155) com atributos estilo FIFA — colecionável, negociável e usável em partidas com aposta. Multi-chain (Polygon + BNB Chain), com cliente Unity multiplataforma (Android/iOS/PC/WebGL).

## Pilares do produto

1. **Colecionar** — álbum de 1.352 figurinhas (48 países × 28 + estádios): jogadores, técnicos, bandeiras, brasões, mascotes, curiosidades.
2. **Adquirir** — pacotes com sorteio verificável (Chainlink VRF / Binance Oracle), 5 raridades.
3. **Jogar** — PvP: escala 11 jogadores + técnico, aposta, atributos decidem (vencedor leva o pote).
4. **Competir** — ranking ELO com temporadas e premiação.
5. **Negociar** — trocas P2P atômicas + venda em OpenSea/Binance NFT.

## Estado atual (já implementado)

- 8 contratos Solidity (compilam, <24KB, lógica testada)
- Gerador das 1.352 cartas + renderizador de arte profissional
- Protótipo React (todas as telas) + cliente Unity (6 telas, motor de batalha)
- Backend (matchmaking, indexer, oráculo)
- Documentação técnica, de jogo, Binance e jurídica

## Decisão de escopo estratégica

**Arte original / jogadores fictícios** (não licenciamento FIFA) para o MVP — valida o jogo sem o custo proibitivo de licenças. Licenciamento só após tração.

## Público-alvo

Fãs de futebol (Brasil/LatAm/global), colecionadores de álbum nostálgicos, jogadores de fantasy (Cartola), e usuários cripto de jogos play-to-own.

## Restrições

- Conformidade: loot boxes/apostas variam por país (ver REQUIREMENTS NFR-LEGAL)
- Custos: gás baixo é mandatório (figurinhas de baixo valor unitário)
- Sem promessa de lucro (evitar classificação como security)
