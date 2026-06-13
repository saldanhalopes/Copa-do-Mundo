# CryptoÁlbum Copa — TODO

## Schema & Backend
- [x] Schema DB: cartas, pacotes, inventário, batalhas, ranking, marketplace
- [x] Dados base: 185 jogadores reais, 20 seleções, 3 tipos de pacote
- [x] tRPC routers: cards, packs, pvp, ranking, marketplace, player
- [x] Lógica de abertura de pacotes com raridade
- [x] Lógica de batalha PvP por atributos
- [x] Sistema ELO (cálculo e temporadas)
- [x] Swap atômico marketplace (P2P)

## Layout & Design System
- [x] index.css: paleta dark premium, fontes, variáveis CSS
- [x] index.html: Google Fonts (Archivo Black + Space Grotesk)
- [x] Layout global com navbar e sidebar
- [x] Componente StickerCard (visual FIFA Ultimate Team)
- [x] Componente AppLayout com sidebar e header
- [x] WalletButton na navbar

## Páginas
- [x] Home — landing page com hero, seleção de rede, connect wallet
- [x] Album — álbum interativo por seleção com 185 cartas estilo Panini Copa 2026
- [x] Shop — loja de pacotes (Básico, Premium, Lendário) com animação de abertura
- [x] Arena — PvP com seleção de 5 cartas e resultado por atributos
- [x] Ranking — tabela ELO, temporada, histórico e tiers
- [x] Marketplace — listagem e swap P2P com filtros de raridade
- [x] Dashboard — inventário, estatísticas, progresso do álbum

## Qualidade
- [x] Testes vitest (65 testes passando: game data + battle engine + auth + E2E)
- [x] Estados de loading/empty/error em todas as páginas
- [x] Responsividade mobile
- [x] Animações e micro-interações (shimmer, pack reveal, card flip)

## Correções e Testes E2E
- [x] Correção do insertId no Drizzle MySQL (r[0].insertId em vez de r.insertId)
- [x] Validação de posse de cartas antes de batalhas e trades
- [x] Bloqueio de auto-compra no marketplace
- [x] Bloqueio de trade consigo mesmo
- [x] Swap atômico P2P com validação de posses antes do swap
- [x] Cálculo ELO correto com conservação de pontos
- [x] Correção de anchor aninhado no AppLayout e Home
- [x] Testes E2E com dados sintéticos — 65 testes passando (3 arquivos)

## Redesign Álbum Panini Copa 2026
- [x] Redesenhar página Album com visual Panini Copa 2026
- [x] Grid de figurinhas com espaços vazios para cartas não coletadas
- [x] Cores vibrantes por seleção (verde/amarelo Brasil, azul Argentina, etc.)
- [x] Organizar por Copa/Seleção com jogadores reais de cada edição

## Jogadores Reais + Redesign Cards FIFA Ultimate Team
- [x] Compilar 185 jogadores reais icônicos de todas as Copas (1930-2022)
- [x] Criar catálogo com stats realistas (PAC, SHO, PAS, DRI, DEF, PHY, OVR)
- [x] Redesenhar StickerCard com visual FIFA Ultimate Team (OVR grande, posição, stats 2 colunas)
- [x] Diferentes visuais por raridade (Bronze/Prata/Ouro holográfico/Platina holográfico)
- [x] 20 seleções históricas com jogadores de todas as eras

## Sistema de Raridades
- [x] Comum → Bronze (card bronze sólido)
- [x] Rara → Prata (card prateado com brilho)
- [x] Lendária → Ouro (card dourado HOLOGRÁFICO)
- [x] Mítica → Platina (card platina HOLOGRÁFICO premium)
- [x] Schema, gameData e UI atualizados para novo sistema de 4 raridades

## Aleatoriedade Verificável (VRF)
- [x] Módulo vrfRandomness.ts com commit-reveal + VRF
- [x] Integração com openPack (aleatoriedade não-manipulável)
- [x] Painel de verificação na UI (prova criptográfica visível ao usuário)
- [x] Derivação determinística de cartas a partir de números VRF
- [x] Auditoria: commitHash, blockHash, randomValue, proof, verificationSteps

## Animação de Abertura de Pacote
- [ ] Componente PackOpenAnimation com sequência cinematográfica
- [ ] Efeito 3D flip carta a carta com delay sequencial
- [ ] Brilho holográfico animado para cartas Ouro e Platina
- [ ] Efeito de partículas/brilho no reveal de cartas raras
- [ ] Integração com Shop.tsx substituindo modal estático
