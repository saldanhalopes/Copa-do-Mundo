# REQUIREMENTS.md — CryptoÁlbum Copa

> Artefato GSD Core. REQ-IDs para cada capacidade. Status: ✅ feito · 🟡 parcial · ❌ pendente.

## Funcionais — Coleção & NFT

| ID | Requisito | Status |
|---|---|---|
| COL-01 | Coleção ERC-1155 de 1.352 figurinhas com supply imutável por raridade | ✅ |
| COL-02 | Atributos FIFA (PAC/SHO/PAS/DRI/DEF/PHY+OVR) imutáveis on-chain | ✅ |
| COL-03 | 5 raridades (Comum→Mítica) com faixas de OVR | ✅ |
| COL-04 | 7 tipos de carta (jogador, técnico, bandeira, brasão, mascote, estádio, curiosidade) | ✅ |
| COL-05 | Metadados em IPFS + Arweave, congeláveis | 🟡 estrutura pronta, falta upload real |
| COL-06 | Royalties ERC-2981 de 5% | ✅ |

## Funcionais — Aquisição

| ID | Requisito | Status |
|---|---|---|
| PACK-01 | 4 tipos de pacote (Básico/Premium/Lendário/Mítico) | ✅ |
| PACK-02 | Sorteio verificável via Chainlink VRF (Polygon) | ✅ contrato |
| PACK-03 | Sorteio via Binance Oracle (BNB) | ✅ contrato |
| PACK-04 | Probabilidades públicas on-chain | ✅ |
| PACK-05 | Garantia de raridade mínima por pacote | ✅ |
| PACK-06 | Pagamento cripto (POL/BNB) e fiat (Crossmint/Binance Pay) | 🟡 cripto pronto, fiat a integrar |

## Funcionais — Jogo (PvP/Fantasy)

| ID | Requisito | Status |
|---|---|---|
| GAME-01 | Escalar 11 jogadores + 1 técnico | ✅ |
| GAME-02 | Técnico dá bônus de força ao time | ✅ |
| GAME-03 | Batalha por atributos (OVR + atributo posição + VRF) | ✅ |
| GAME-04 | Aposta em escrow, vencedor leva o pote (−taxa) | ✅ contrato |
| GAME-05 | Matchmaking equilibrado por ELO | ✅ backend |
| GAME-06 | Modo Fantasy com desempenho real (oráculo esportivo) | 🟡 contrato+oráculo, falta API real |
| GAME-07 | Cartas nunca saem da carteira durante a partida | ✅ |

## Funcionais — Competição & Economia

| ID | Requisito | Status |
|---|---|---|
| RANK-01 | Rating ELO on-chain | ✅ |
| RANK-02 | Temporadas com premiação top 3 (50/30/20%) | ✅ contrato |
| RANK-03 | Leaderboard | ✅ |
| TRADE-01 | Trocas P2P atômicas (sem custódia) | ✅ contrato |
| TRADE-02 | Criar e aceitar ofertas | ✅ |
| SELL-01 | Venda em marketplace externo (OpenSea/Binance NFT) | ✅ deep links |

## Funcionais — Cliente

| ID | Requisito | Status |
|---|---|---|
| UI-01 | App Unity multiplataforma (Android/iOS/PC/WebGL) | 🟡 código pronto, falta build |
| UI-02 | 6 telas (Álbum, Pacotes, Partida, Ranking, Trocas, Vender) | ✅ |
| UI-03 | Conexão de carteira (MetaMask/Trust/Binance/embedded) | 🟡 stub, falta ChainSafe real |
| UI-04 | Ler NFTs da carteira (balanceOfBatch) | 🟡 stub |
| UI-05 | Arte profissional das cartas | 🟡 gerador pronto, falta arte final |

## Não-funcionais

| ID | Requisito | Status |
|---|---|---|
| NFR-SEC-01 | Auditoria de segurança dos contratos | ❌ |
| NFR-SEC-02 | Multisig (Gnosis Safe) como admin | 🟡 previsto |
| NFR-SEC-03 | Anti-bot / anti-fraude | ❌ |
| NFR-PERF-01 | Gás baixo (mint em lote) | ✅ |
| NFR-PERF-02 | Indexação rápida (The Graph) | 🟡 indexer básico, falta subgraph |
| NFR-LEGAL-01 | Conformidade loot box/aposta por jurisdição | ❌ pareceres |
| NFR-LEGAL-02 | KYC/AML no on-ramp | 🟡 delegado a provedor |
| NFR-LEGAL-03 | LGPD/GDPR, termos, privacidade | ❌ |
| NFR-LEGAL-04 | Verificação de idade | ❌ |
| NFR-INFRA-01 | Backend escalável (matchmaking, API) | 🟡 base pronta |
| NFR-INFRA-02 | Deploy testnet → mainnet | ❌ |
