#!/usr/bin/env python3
"""
build_metadata.py — Gera os metadados NFT (JSON) de todas as cartas.
Lê output/catalogo.json e produz output/metadata/{id}.json conforme METADATA-SPEC.md.

Uso: python build_metadata.py [--cid <IPFS_CID>]
"""
import json
import os
import argparse

TIPO_NOME = {0: "Jogador", 1: "Técnico", 2: "Bandeira", 3: "Brasão",
             4: "Mascote", 5: "Estádio", 6: "Curiosidade"}
RAR_NOME = ["Comum", "Rara", "Épica", "Lendária", "Mítica"]


def card_metadata(card, cid):
    base_img = f"ipfs://{cid}/images/{card['id']}.png" if cid else f"images/{card['id']}.png"
    tipo = TIPO_NOME.get(card.get("tipo", 0), "Jogador")
    rar = RAR_NOME[card.get("rar", 0)]

    attrs = [
        {"trait_type": "Tipo", "value": tipo},
        {"trait_type": "Seleção", "value": card.get("pais_nome", card.get("paisNome", "—"))},
        {"trait_type": "Raridade", "value": rar},
        {"trait_type": "Número no Álbum", "value": card["id"]},
        {"trait_type": "Edição", "value": "2026"},
    ]

    # jogadores têm atributos
    if card.get("tipo") == 0 and card.get("attrs"):
        a = card["attrs"]
        attrs.insert(3, {"trait_type": "Posição", "value": card.get("pos", "—")})
        attrs.insert(4, {"trait_type": "OVR", "value": card.get("ovr", a.get("OVR", 0)), "max_value": 99})
        for k in ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"]:
            if k in a:
                attrs.append({"trait_type": k, "value": a[k], "max_value": 99})

    name = card.get("nome", f"Carta #{card['id']}")
    if card.get("tipo") == 0:
        name = f"#{card['id']:04d} {name} ({card.get('ovr', 0)} OVR)"

    meta = {
        "name": name,
        "description": f"Figurinha {rar} — CryptoÁlbum Copa 2026. Atributos imutáveis on-chain.",
        "image": base_img,
        "external_url": f"https://cryptoalbumcopa.com/card/{card['id']}",
        "attributes": attrs,
    }
    if card.get("texto"):
        meta["description"] = card["texto"] + " — CryptoÁlbum Copa."
    return meta


def collection_metadata(cid, fee_recipient="0x0000000000000000000000000000000000000000"):
    return {
        "name": "CryptoÁlbum Copa",
        "description": "Álbum de figurinhas da Copa em NFT. 1.352 figurinhas ERC-1155 com atributos estilo FIFA.",
        "image": f"ipfs://{cid}/collection.png" if cid else "collection.png",
        "external_link": "https://cryptoalbumcopa.com",
        "seller_fee_basis_points": 500,
        "fee_recipient": fee_recipient,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cid", default="", help="CID do IPFS (vazio = caminhos relativos)")
    args = ap.parse_args()

    base = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(base, "output")
    catalogo_path = os.path.join(out, "catalogo.json")

    if not os.path.exists(catalogo_path):
        print("❌ output/catalogo.json não encontrado. Rode generate_catalog.py primeiro.")
        raise SystemExit(1)

    catalogo = json.load(open(catalogo_path, encoding="utf-8"))
    meta_dir = os.path.join(out, "metadata")
    os.makedirs(meta_dir, exist_ok=True)

    for card in catalogo:
        meta = card_metadata(card, args.cid)
        with open(os.path.join(meta_dir, f"{card['id']}.json"), "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

    # contractURI
    with open(os.path.join(out, "collection.json"), "w", encoding="utf-8") as f:
        json.dump(collection_metadata(args.cid), f, ensure_ascii=False, indent=2)

    print(f"✅ {len(catalogo)} metadados gerados em output/metadata/")
    print(f"   + collection.json (contractURI)")
    if not args.cid:
        print("   ⚠️  CID vazio — rode novamente com --cid após upload IPFS para URLs absolutas")


if __name__ == "__main__":
    main()
