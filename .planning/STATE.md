# STATE.md — CryptoÁlbum Copa

> Artefato GSD Core. Memória de sessão e posição atual no roadmap.

## Posição atual

- **Fase 0 (Fundação):** ✅ concluída
- **Fase 1 — Hardening dos Contratos:** 🟡 em andamento
  - **01-01 (Suíte Foundry):** ✅ concluída (commit `fa89b54`)
  - **01-02 (Auditoria + Multisig):** ⏳ pendente
- **Próximo comando GSD:** `/gsd-discuss-phase 1`

## Marcos concluídos (Fase 0)

| Entrega | Local |
|---|---|
| 8 contratos Solidity | `contracts/` |
| Gerador de 1.352 cartas | `generator/generate_catalog.py` |
| Renderizador de arte pro | `generator/render_pro.py` |
| Protótipo React | `CryptoAlbumCopa.jsx` |
| Cliente Unity (6 telas) | `unity/Assets/Scripts/` |
| Backend (matchmaking/indexer/oráculo) | `backend/src/` |
| Docs técnica/jogo/Binance/jurídica | `*.md` |
| Testes de lógica | `test/` |

## Decisões-chave registradas

1. **Rede:** Polygon principal + BNB Chain (Binance NFT/Pay). Padrão ERC-1155.
2. **Arte:** original/fictícia (sem licença FIFA) para o MVP.
3. **Cliente:** Unity + ChainSafe Web3.unity, multiplataforma.
4. **Jogo:** híbrido escalação (11+técnico) + PvP por atributos + aposta.
5. **Aleatoriedade:** Chainlink VRF (Polygon) / Binance Oracle (BNB).

## Bloqueios conhecidos

- **Fase 1 (auditoria)** é o gargalo antes de qualquer dinheiro real.
  - 01-01 (testes Foundry) ✅ concluído — 52 testes passando
  - 01-02 (auditoria + multisig) ⏳ pendente — precisa de Slither, SCOPE.md, Gnosis Safe setup
- **Fase 6 (jurídico)** tem lead time longo — começar cedo.
- Integração ChainSafe real exige Unity aberto + contratos deployados.
- **Paperclip API** (192.168.15.59:3300) offline — heartbeat comments não postados.

## Notas de ambiente

- Sandbox bloqueia download do .NET e do compilador Hardhat; validações feitas
  via solc (npm) e portas JS. Em ambiente real, rodar os comandos normalmente.
