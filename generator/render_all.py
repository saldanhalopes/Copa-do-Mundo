#!/usr/bin/env python3
"""
Pipeline de Produção — CryptoÁlbum Copa
=========================================
Gera as 1.352 cartas finais, logo, e metadados IPFS.

Fases:
  1. Logo + branding
  2. Renderização de todas as cartas
  3. Metadados IPFS por card
  4. Metadados IPFS da coleção

Uso: python render_all.py [--skip-images] [--skip-metadata] [--resume]
"""
import json, os, math, argparse, sys, time
from PIL import Image, ImageDraw, ImageFont, ImageFilter

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paises import PAISES, POSICOES_23, ESTADIOS_ESPECIAIS

W, H = 600, 840
ATTR = ["PAC","SHO","PAS","DRI","DEF","PHY"]
RAR_NOME = ["COMUM","RARA","ÉPICA","LENDÁRIA","MÍTICA"]
RAR_SLUG = ["comum","rara","epica","lendaria","mitica"]
PALETAS = {
    0: ((92,64,38),(58,40,24),(210,180,140),False),
    1: ((180,190,205),(120,130,148),(240,245,250),False),
    2: ((212,168,70),(150,110,35),(255,230,150),False),
    3: ((130,80,200),(70,35,130),(200,160,255),True),
    4: ((255,90,140),(180,40,90),(255,200,120),True),
}

BASE = os.path.dirname(os.path.abspath(__file__))
CATALOGO_PATH = os.path.join(BASE, "output", "catalogo.json")
OUT_IMG = os.path.join(BASE, "output_pro")
OUT_LOGO = os.path.join(BASE, "branding")
OUT_META = os.path.join(BASE, "output_ipfs")

os.makedirs(OUT_IMG, exist_ok=True)
os.makedirs(OUT_LOGO, exist_ok=True)
os.makedirs(OUT_META, exist_ok=True)

def font(size, bold=True):
    paths = [
        f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'-Bold' if bold else ''}.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    try:
        return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size)
    except:
        return ImageFont.load_default()

def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2],16) for i in (0,2,4))
_GRAD_CACHE = {}
_HOLO_CACHE = {}

def gradient(w, h, top, bottom, diagonal=True):
    key = (w, h, top, bottom, diagonal)
    if key in _GRAD_CACHE:
        return _GRAD_CACHE[key].copy()
    arr = bytearray(w * h * 3)
    stride = w * 3
    for y in range(h):
        for x in range(w):
            t = (x / w * 0.35 + y / h * 0.65) if diagonal else y / h
            t = max(0, min(1, t))
            idx = y * stride + x * 3
            arr[idx]   = int(top[0] * (1 - t) + bottom[0] * t)
            arr[idx+1] = int(top[1] * (1 - t) + bottom[1] * t)
            arr[idx+2] = int(top[2] * (1 - t) + bottom[2] * t)
    img = Image.frombytes("RGB", (w, h), bytes(arr))
    _GRAD_CACHE[key] = img.copy()
    return img


def holographic_overlay(w, h, intensity=0.5):
    key = (w, h, intensity)
    if key in _HOLO_CACHE:
        return _HOLO_CACHE[key].copy()
    arr = bytearray(w * h * 4)
    stride = w * 4
    for y in range(h):
        for x in range(w):
            ang = (x + y) / (w + h) * math.pi * 6
            idx = y * stride + x * 4
            arr[idx]   = int((math.sin(ang)        * 0.5 + 0.5) * 255)
            arr[idx+1] = int((math.sin(ang + 2.1)   * 0.5 + 0.5) * 255)
            arr[idx+2] = int((math.sin(ang + 4.2)   * 0.5 + 0.5) * 255)
            arr[idx+3] = int(40 * intensity)
    img = Image.frombytes("RGBA", (w, h), bytes(arr))
    _HOLO_CACHE[key] = img.copy()
    return img

_RADIAL_CACHE = {}

def radial_glow(w, h, center, color, radius, alpha=120):
    key = (w, h, center, color, radius, alpha)
    if key in _RADIAL_CACHE:
        return _RADIAL_CACHE[key].copy()
    glow = Image.new("RGBA", (w, h), (0,0,0,0))
    d = ImageDraw.Draw(glow)
    cx, cy = center
    for r in range(radius, 0, -2):
        a = int(alpha * (1 - r / radius)**2)
        d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=color+(a,))
    glow = glow.filter(ImageFilter.GaussianBlur(8))
    _RADIAL_CACHE[key] = glow.copy()
    return glow

def draw_attr_bar(draw, x, y, label, value, accent, w=200):
    f_val = font(34)
    f_lbl = font(24, bold=False)
    draw.text((x, y), f"{value:02d}", font=f_val, fill=(255,255,255))
    draw.text((x+60, y+6), label, font=f_lbl, fill=(255,255,255,220))
    bar_x, bar_y, bar_w, bar_h = x, y+42, w, 8
    draw.rounded_rectangle([bar_x, bar_y, bar_x+bar_w, bar_y+bar_h], radius=4, fill=(0,0,0,90))
    fill_w = int(bar_w * value / 99)
    draw.rounded_rectangle([bar_x, bar_y, bar_x+fill_w, bar_y+bar_h], radius=4, fill=accent)

_BG_CACHE = {}

def render_card(card, out_path):
    rar = card["rar"]
    top, bottom, accent, holo = PALETAS[rar]
    c1 = hex_rgb(card["c1"])
    c2 = hex_rgb(card["c2"])

    # Cache background per rarity x country primary color
    bg_key = (rar, card["c1"], card["c2"])
    if bg_key in _BG_CACHE:
        img = _BG_CACHE[bg_key].copy()
    else:
        img = gradient(W, H, top, bottom).convert("RGBA")
        glow = radial_glow(W, H, (W//2,300), c1, 220, alpha=90)
        img = Image.alpha_composite(img, glow)
        if holo:
            img = Image.alpha_composite(img, holographic_overlay(W, H, 0.6))
        _BG_CACHE[bg_key] = img.copy()

    draw = ImageDraw.Draw(img)

    draw.rounded_rectangle([10,10,W-10,H-10], radius=32, outline=accent+(255,), width=5)
    draw.rounded_rectangle([20,20,W-20,H-20], radius=26, outline=(255,255,255,60), width=2)

    is_jogador = card.get("tipo_nome") == "Jogador"

    if is_jogador:
        draw.text((48,44), str(card["ovr"]), font=font(96), fill=(255,255,255))
        draw.text((54,150), card["pos"], font=font(40), fill=accent+(255,))
        draw.line([(50,200),(170,200)], fill=accent+(200,), width=3)

    draw.rounded_rectangle([W-160,48,W-48,120], radius=12, fill=c1+(255,))
    bb = draw.textbbox((0,0), card["pais"], font=font(40))
    draw.text((W-104-(bb[2]-bb[0])//2,60), card["pais"], font=font(40), fill=c2+(255,))

    cx, cy = W//2, 340
    draw.ellipse([cx-95, cy-95, cx+95, cy+95], fill=c1+(255,), outline=(255,255,255,230), width=5)
    if is_jogador:
        label = "10" if card.get("pos") == "CAM" and card.get("camisa") == 11 else str(card.get("camisa",1))
    elif card["tipo_nome"] in ("Bandeira","Brasão","Mascote"):
        label = card["pais"][:2]
    elif card["tipo_nome"] == "Curiosidade":
        label = "?"
    elif card["tipo_nome"] == "Estádio":
        label = "ST"
    else:
        label = card["pais"][:2]
    bb = draw.textbbox((0,0), label, font=font(72))
    draw.text((cx-(bb[2]-bb[0])//2, cy-(bb[3]-bb[1])//2-8), label, font=font(72), fill=c2+(255,))

    nome = card["nome"].upper()
    f_nome = font(44)
    bb = draw.textbbox((0,0), nome, font=f_nome)
    while bb[2]-bb[0] > W-100 and f_nome.size > 20:
        f_nome = font(f_nome.size-2)
        bb = draw.textbbox((0,0), nome, font=f_nome)
    draw.text((cx-(bb[2]-bb[0])//2, 470), nome, font=f_nome, fill=(255,255,255))
    draw.line([(80,540),(W-80,540)], fill=(255,255,255,100), width=2)

    if is_jogador:
        a = card["attrs"]
        col1 = [("PAC",a["PAC"]),("SHO",a["SHO"]),("PAS",a["PAS"])]
        col2 = [("DRI",a["DRI"]),("DEF",a["DEF"]),("PHY",a["PHY"])]
        for i,(lbl,val) in enumerate(col1):
            draw_attr_bar(draw, 90, 570+i*70, lbl, val, accent)
        for i,(lbl,val) in enumerate(col2):
            draw_attr_bar(draw, 320, 570+i*70, lbl, val, accent)
    elif card.get("texto"):
        f_txt = font(28, bold=False)
        words = card["texto"].split()
        lines, cur = [], ""
        for w_ in words:
            if draw.textlength(cur+" "+w_, font=f_txt) < W-140:
                cur = (cur+" "+w_).strip()
            else:
                lines.append(cur); cur = w_
        if cur: lines.append(cur)
        for i, ln in enumerate(lines):
            bb = draw.textbbox((0,0), ln, font=f_txt)
            draw.text((cx-(bb[2]-bb[0])//2, 590+i*40), ln, font=f_txt, fill=(255,255,255,230))

    f_foot = font(26)
    foot = f"#{card['id']:04d}   ·   {RAR_NOME[rar]}"
    bb = draw.textbbox((0,0), foot, font=f_foot)
    draw.text((cx-(bb[2]-bb[0])//2, H-70), foot, font=f_foot, fill=accent+(255,))

    img.convert("RGB").save(out_path, "PNG", quality=95)


# ─── Fase 1: Logo ───────────────────────────────────────────────────────────

def generate_logo():
    """Gera logotipo principal + variações."""
    print("\n=== Fase 1: Logo & Branding ===")

    L = 1024
    img = Image.new("RGBA", (L, L), (0,0,0,0))
    draw = ImageDraw.Draw(img)

    circle_outer = (L//2, L//2, L-40, L-40)
    draw.ellipse(circle_outer, outline=(255,215,0), width=12)

    for i in range(36):
        ang = i * 10 * math.pi / 180
        r1, r2 = 420, 480
        x1 = L//2 + int(r1 * math.cos(ang))
        y1 = L//2 + int(r1 * math.sin(ang))
        x2 = L//2 + int(r2 * math.cos(ang))
        y2 = L//2 + int(r2 * math.sin(ang))
        color = (255,215,0) if i % 2 == 0 else (0,156,59)
        draw.line([(x1,y1),(x2,y2)], fill=color, width=3)

    inner = (L//2-160, L//2-160, L//2+160, L//2+160)
    draw.ellipse(inner, fill=(0,30,0), outline=(255,215,0), width=6)
    draw.ellipse((L//2-140, L//2-140, L//2+140, L//2+140), fill=(0,156,59), outline=(255,215,0), width=3)

    cup_paths = [
        ((L//2-90, L//2-20), (L//2-110, L//2+60), (L//2+110, L//2+60), (L//2+90, L//2-20)),
    ]
    draw.polygon(cup_paths[0], fill=(255,215,0))
    draw.ellipse((L//2-60, L//2-80, L//2+60, L//2), fill=(255,215,0))

    f_logo = font(80, bold=True)
    txt = "CRYPTOÁLBUM"
    bb = draw.textbbox((0,0), txt, font=f_logo)
    draw.text((L//2-(bb[2]-bb[0])//2, L-160), txt, font=f_logo, fill=(255,255,255))

    txt2 = "COPA"
    f_sub = font(120, bold=True)
    bb2 = draw.textbbox((0,0), txt2, font=f_sub)
    draw.text((L//2-(bb2[2]-bb2[0])//2, L-260), txt2, font=f_sub, fill=(255,215,0))

    out_path = os.path.join(OUT_LOGO, "cryptoalbum_copa_logo.png")
    img.convert("RGB").save(out_path, "PNG", quality=95)
    print(f"  Logo: {out_path}")

    sizes = {"128":128,"256":256,"512":512,"1024":1024}
    for name, sz in sizes.items():
        resized = img.resize((sz,sz), Image.LANCZOS)
        rpath = os.path.join(OUT_LOGO, f"cryptoalbum_copa_{name}.png")
        resized.convert("RGB").save(rpath, "PNG", quality=95)
        print(f"  Logo {name}: {rpath}")

    # favicon
    favicon = img.resize((64,64), Image.LANCZOS).convert("RGB")
    favicon.save(os.path.join(OUT_LOGO, "favicon.ico"), format="ICO", sizes=[(64,64)])
    print(f"  Favicon: {os.path.join(OUT_LOGO, 'favicon.ico')}")

    # banner horizontal (1200x630, OG card)
    banner = Image.new("RGB", (1200,630), (0,30,0))
    # gradient overlay
    b_grad = gradient(1200,630, (0,156,59), (0,30,0))
    banner = Image.blend(banner, b_grad, 0.6)
    b_draw = ImageDraw.Draw(banner)

    # scale logo into banner corner
    logo_small = img.resize((200,200), Image.LANCZOS)
    banner.paste(logo_small, (50,50), logo_small)

    f_banner = font(96, bold=True)
    b_draw.text((300,120), "CRYPTOÁLBUM COPA", font=f_banner, fill=(255,215,0))
    f_banner2 = font(40)
    b_draw.text((300,240), "1.352 Cartas Colecionáveis · NFT · ERC-1155", font=f_banner2, fill=(255,255,255))

    bnr_path = os.path.join(OUT_LOGO, "cryptoalbum_banner.png")
    banner.save(bnr_path, "PNG", quality=95)
    print(f"  Banner OG: {bnr_path}")

    return img


# ─── Fase 2: Renderização ──────────────────────────────────────────────────

def render_all_cards(cards, resume=False):
    print(f"\n=== Fase 2: Renderizando {len(cards)} cartas ===")
    t0 = time.time()

    for i, card in enumerate(cards):
        cid = card["id"]
        fname = f"{cid:04d}_{RAR_SLUG[card['rar']]}_{card['tipo_nome']}.png"
        path = os.path.join(OUT_IMG, fname)

        if resume and os.path.exists(path):
            continue

        render_card(card, path)

        if (i+1) % 100 == 0:
            elapsed = time.time() - t0
            rate = (i+1)/elapsed if elapsed > 0 else 0
            print(f"  [{i+1}/{len(cards)}] {rate:.1f} cards/s — {fname}")

    elapsed = time.time() - t0
    print(f"  ✅ {len(cards)} cartas renderizadas em {elapsed:.1f}s ({len(cards)/elapsed:.1f} cards/s)")
    print(f"  📁 {OUT_IMG}/")


# ─── Fase 3: Metadados IPFS ────────────────────────────────────────────────

def card_to_metadata(card):
    """Converte carta para schema OpenSea/ERC-1155 metadata."""
    meta = {
        "name": card["nome"],
        "description": f"CryptoÁlbum Copa — {card['tipo_nome']} | {card.get('pais_nome',card['pais'])} | #{card['id']:04d}",
        "external_url": f"https://cryptoalbumcopa.io/card/{card['id']}",
        "image": f"ipfs://__CID_PLACEHOLDER__/{card['id']:04d}.png",
        "attributes": [
            {"trait_type":"Tipo","value":card["tipo_nome"]},
            {"trait_type":"País","value":card.get("pais_nome",card["pais"])},
            {"trait_type":"Raridade","value":RAR_NOME[card["rar"]]},
        ]
    }
    if card["tipo_nome"] == "Jogador":
        meta["attributes"].extend([
            {"trait_type":"Posição","value":card["pos"]},
            {"trait_type":"Overall","value":card["ovr"],"max_value":99,"display_type":"number"},
        ])
        for attr, val in card["attrs"].items():
            meta["attributes"].append({
                "trait_type": attr,
                "value": val,
                "max_value": 99,
                "display_type": "number"
            })
    if card["tipo_nome"] == "Técnico":
        meta["attributes"].append({"trait_type":"Bônus","value":card.get("bonus",0),"display_type":"number"})
    if "texto" in card and card["texto"]:
        meta["attributes"].append({"trait_type":"Descrição","value":card["texto"]})
    return meta

def generate_metadata(cards):
    print(f"\n=== Fase 3: Metadados IPFS ===")
    meta_dir = os.path.join(OUT_META, "metadata")
    os.makedirs(meta_dir, exist_ok=True)

    for card in cards:
        meta = card_to_metadata(card)
        mpath = os.path.join(meta_dir, f"{card['id']:04d}.json")
        json.dump(meta, open(mpath,"w",encoding="utf-8"), ensure_ascii=False, indent=2)

    print(f"  ✅ {len(cards)} metadados gerados em {meta_dir}/")


def generate_collection_metadata():
    print(f"\n=== Fase 4: Metadados da Coleção ===")
    collection = {
        "name": "CryptoÁlbum Copa",
        "description": "1.352 cartas colecionáveis NFT da Copa do Mundo — Jogadores, Técnicos, Bandeiras, Brasões, Mascotes, Curiosidades e Estádios. ERC-1155 com atributos on-chain. 5 raridades: Comum, Rara, Épica, Lendária, Mítica.",
        "image": "ipfs://__CID_PLACEHOLDER__/logo.png",
        "external_link": "https://cryptoalbumcopa.io",
        "seller_fee_basis_points": 500,
        "fee_recipient": "0x0000000000000000000000000000000000000000",
        "total_supply": 1352,
        "countries": len(PAISES),
        "players_per_country": 23,
        "rarities": [
            {"name":"Comum","count":0,"color":"#5C4026"},
            {"name":"Rara","count":0,"color":"#B4BECD"},
            {"name":"Épica","count":0,"color":"#D4A846"},
            {"name":"Lendária","count":0,"color":"#8250C8"},
            {"name":"Mítica","count":0,"color":"#FF5A8C"},
        ],
        "attributes": {
            "types": ["Jogador","Técnico","Bandeira","Brasão","Mascote","Curiosidade","Estádio"],
            "positions": ["GOL","ZAG","LD","LE","VOL","MEI","PD","PE","CAM","ATA"],
        },
        "contract": {
            "network": "Polygon",
            "standard": "ERC-1155",
            "royalties": "ERC-2981 5%",
        }
    }
    path = os.path.join(OUT_META, "collection.json")
    json.dump(collection, open(path,"w",encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"  ✅ Coleção: {path}")

    # stats aggregation for collection metadata
    cards = json.load(open(CATALOGO_PATH, "r", encoding="utf-8"))
    rar_counts = {}
    tipo_counts = {}
    for c in cards:
        rn = RAR_NOME[c["rar"]]
        rar_counts[rn] = rar_counts.get(rn,0)+1
        tn = c["tipo_nome"]
        tipo_counts[tn] = tipo_counts.get(tn,0)+1

    stats = {
        "total": len(cards),
        "by_rarity": rar_counts,
        "by_type": tipo_counts,
        "countries": len(PAISES),
    }
    spath = os.path.join(OUT_META, "stats.json")
    json.dump(stats, open(spath,"w"), indent=2)
    print(f"  ✅ Estatísticas: {spath}")
    return stats


def main():
    ap = argparse.ArgumentParser(description="Pipeline de produção CryptoÁlbum Copa")
    ap.add_argument("--skip-images", action="store_true", help="Pula renderização de imagens")
    ap.add_argument("--skip-metadata", action="store_true", help="Pula geração de metadados")
    ap.add_argument("--resume", action="store_true", help="Retoma renderização (pula já existentes)")
    args = ap.parse_args()

    cards = json.load(open(CATALOGO_PATH, "r", encoding="utf-8"))
    print(f"📦 Catálogo carregado: {len(cards)} cartas")

    generate_logo()

    if not args.skip_images:
        render_all_cards(cards, resume=args.resume)

    if not args.skip_metadata:
        generate_metadata(cards)
        stats = generate_collection_metadata()
        print(f"\n📊 Resumo final:")
        for rn, cnt in stats["by_rarity"].items():
            print(f"  {rn}: {cnt}")
        for tn, cnt in stats["by_type"].items():
            print(f"  {tn}: {cnt}")

    print(f"\n🎉 Pipeline concluído!")
    print(f"  Imagens: {OUT_IMG}/")
    print(f"  Branding: {OUT_LOGO}/")
    print(f"  Metadados IPFS: {OUT_META}/")


if __name__ == "__main__":
    main()
