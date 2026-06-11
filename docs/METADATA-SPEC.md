# 🎴 METADATA-SPEC.md — Metadados & Padrão NFT
### CryptoÁlbum Copa

> Schema dos metadados, estrutura IPFS/Arweave e conformidade com marketplaces.
> Padrão ERC-1155 Metadata + extensões OpenSea/Binance NFT.

---

## 1. Estrutura de armazenamento

```
IPFS (Pinata)                      Arweave (backup permanente)
├── collection.json    ← contractURI    (mesma cópia)
├── metadata/
│   ├── 1.json
│   ├── 2.json
│   └── ... (1.352 arquivos)
└── images/
    ├── 1.png
    ├── 2.png
    └── ... (1.352 imagens)
```

- **IPFS:** distribuição rápida, padrão de mercado (via Pinata/Filebase)
- **Arweave:** backup permanente (pago uma vez) — garante sobrevivência da arte
- URI base no contrato: `ipfs://<CID>/metadata/{id}.json`
- Após upload: `setURI()` + `freezeMetadata()` (imutável para sempre)

---

## 2. Schema de metadados (por carta)

### Jogador
```json
{
  "name": "#0004 Rei Arthur (90 OVR)",
  "description": "Figurinha Lendária do Brasil — CryptoÁlbum Copa. Atributos imutáveis on-chain.",
  "image": "ipfs://<CID>/images/4.png",
  "external_url": "https://cryptoalbumcopa.com/card/4",
  "attributes": [
    { "trait_type": "Tipo", "value": "Jogador" },
    { "trait_type": "Seleção", "value": "Brasil" },
    { "trait_type": "Posição", "value": "CAM" },
    { "trait_type": "Raridade", "value": "Lendária" },
    { "trait_type": "OVR", "value": 90, "max_value": 99 },
    { "trait_type": "PAC", "value": 87, "max_value": 99 },
    { "trait_type": "SHO", "value": 92, "max_value": 99 },
    { "trait_type": "PAS", "value": 89, "max_value": 99 },
    { "trait_type": "DRI", "value": 90, "max_value": 99 },
    { "trait_type": "DEF", "value": 80, "max_value": 99 },
    { "trait_type": "PHY", "value": 85, "max_value": 99 },
    { "trait_type": "Número no Álbum", "value": 4 },
    { "trait_type": "Edição", "value": "2026" }
  ]
}
```

### Carta não-jogador (mascote, bandeira, estádio, curiosidade)
```json
{
  "name": "Canarinho — Mascote do Brasil",
  "description": "Mascote oficial — CryptoÁlbum Copa.",
  "image": "ipfs://<CID>/images/25.png",
  "attributes": [
    { "trait_type": "Tipo", "value": "Mascote" },
    { "trait_type": "Seleção", "value": "Brasil" },
    { "trait_type": "Raridade", "value": "Épica" },
    { "trait_type": "Edição", "value": "2026" }
  ]
}
```

> Cartas não-jogador **não** têm atributos PAC/SHO/etc (não são jogáveis no PvP).

---

## 3. contractURI (metadados da coleção)

Lido por OpenSea e Binance NFT para exibir a coleção:

```json
{
  "name": "CryptoÁlbum Copa",
  "description": "Álbum de figurinhas da Copa em NFT. 1.352 figurinhas ERC-1155 com atributos estilo FIFA. Colecione, jogue, troque.",
  "image": "ipfs://<CID>/collection.png",
  "banner_image_url": "ipfs://<CID>/banner.png",
  "external_link": "https://cryptoalbumcopa.com",
  "seller_fee_basis_points": 500,
  "fee_recipient": "0xTESOURO"
}
```

---

## 4. Conformidade com marketplaces

### OpenSea (Polygon)
- ✅ `name`, `description`, `image`, `attributes` padrão
- ✅ `max_value` nos atributos numéricos (mostra barra de progresso)
- ✅ Royalties via ERC-2981 (on-chain) + `seller_fee_basis_points` (contractURI)
- ✅ `external_url` por item

### Binance NFT Marketplace (BNB)
- ✅ `contractURI` com `fee_recipient` e `seller_fee_basis_points`
- ✅ Padrão ERC-1155 compatível
- ⚠️ Requer verificação KYC da coleção antes de listar
- 💡 Pacotes podem ser lançados como **Mystery Boxes** (formato nativo)

### Trust Wallet (auto-detecção)
- Submeter ao repo `trustwallet/assets`:
  ```
  blockchains/smartchain/assets/0xCONTRATO/
  ├── logo.png (256×256)
  └── info.json
  ```

---

## 5. Especificação das imagens

| Propriedade | Valor |
|---|---|
| Formato | PNG (RGB), opcional WebP |
| Resolução | 600×840 (proporção carta 5:7) |
| Tamanho alvo | < 500 KB por carta |
| Lendária/Mítica | + `animation_url` (MP4/GIF holográfico) |
| Mítica 1/1 | + vídeo, possível resgate físico (burn-to-redeem) |

### animation_url (cartas premium)
```json
{
  "image": "ipfs://<CID>/images/4.png",
  "animation_url": "ipfs://<CID>/anim/4.mp4"
}
```

---

## 6. Pipeline de geração e upload

```
1. generate_catalog.py    → catalogo.json + stats.json (atributos)
2. render_pro.py          → images/*.png (arte)
3. build_metadata.py      → metadata/*.json (a criar: monta os JSONs)
4. upload IPFS (Pinata)   → obtém CID
5. upload Arweave         → backup permanente
6. setURI(ipfs://CID/)    → registra no contrato
7. setStatsBatch(stats)   → grava atributos on-chain
8. freezeMetadata()       → congela URI
9. freezeStats()          → congela atributos
```

### Verificação pós-upload
- [ ] Cada `{id}.json` resolve e tem schema válido
- [ ] Cada `image` aponta para CID válido e carrega
- [ ] `contractURI` resolve
- [ ] Atributos on-chain (`getCarta`) batem com os metadados
- [ ] OpenSea/Binance renderizam corretamente (testnet primeiro)

---

## 7. Imutabilidade e confiança

Após o freeze, a garantia ao colecionador:
- A arte **não pode** ser trocada (URI congelada)
- Os atributos **não podem** mudar (stats congelados)
- O supply **não pode** inflar (maxSupply imutável)
- Verificável por qualquer um: comparar hash IPFS + ler contrato

> Esta é a diferença fundamental vs álbuns digitais centralizados:
> a figurinha lendária continuará lendária para sempre, sem depender da empresa.

---

## 8. Consistência cross-source (crítico)

Os atributos existem em 4 lugares e **devem ser idênticos**:
1. `generator/output/stats.json` (fonte)
2. On-chain (`CardStats.getPacked`)
3. Metadados IPFS (`attributes`)
4. Cliente (Unity `CardCatalog` / React)

→ Validado por: empacotamento BigInteger idêntico (testado) + verificação pós-upload.
