#!/usr/bin/env python3
"""
Renderizador Profissional de Cartas — CryptoÁlbum Copa
========================================================
Gera cartas com qualidade visual de produção:
  - Gradientes ricos e texturas por raridade
  - Brilho holográfico nas lendárias/míticas
  - Layout polido estilo FIFA Ultimate Team
  - Painel de atributos com barras de progresso
  - Efeitos de luz e moldura premium

Uso: python render_pro.py [--count N]
Saída: output_pro/{id}.png
"""
import os
import math
import argparse
from PIL import Image, ImageDraw, ImageFont, ImageFilter

# importa o catálogo
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from paises import PAISES, POSICOES_23

W, H = 600, 840  # alta resolução
ATTR = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"]

# Paletas por raridade: (cor_topo, cor_base, cor_destaque, holografico)
PALETAS = {
    0: ((92, 64, 38), (58, 40, 24), (210, 180, 140), False),    # Bronze
    1: ((180, 190, 205), (120, 130, 148), (240, 245, 250), False),  # Prata
    2: ((212, 168, 70), (150, 110, 35), (255, 230, 150), False),    # Ouro
    3: ((130, 80, 200), (70, 35, 130), (200, 160, 255), True),      # Lendária
    4: ((255, 90, 140), (180, 40, 90), (255, 200, 120), True),      # Mítica
}
RAR_NOME = ["COMUM", "RARA", "ÉPICA", "LENDÁRIA", "MÍTICA"]


def font(size, bold=True):
    paths = [
        f"/usr/share/fonts/truetype/dejavu/DejaVuSans{'-Bold' if bold else ''}.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for p in paths:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def gradient(w, h, top, bottom, diagonal=True):
    """Gradiente vertical ou diagonal suave."""
    base = Image.new("RGB", (w, h))
    px = base.load()
    for y in range(h):
        for x in range(0, w, 1):
            if diagonal:
                t = (x / w * 0.35 + y / h * 0.65)
            else:
                t = y / h
            t = max(0, min(1, t))
            px[x, y] = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
    return base


def holographic_overlay(w, h, intensity=0.5):
    """Camada holográfica em arco-íris para cartas lendárias/míticas."""
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    px = overlay.load()
    for y in range(h):
        for x in range(w):
            ang = (x + y) / (w + h) * math.pi * 6
            r = int((math.sin(ang) * 0.5 + 0.5) * 255)
            g = int((math.sin(ang + 2.1) * 0.5 + 0.5) * 255)
            b = int((math.sin(ang + 4.2) * 0.5 + 0.5) * 255)
            a = int(40 * intensity)
            px[x, y] = (r, g, b, a)
    return overlay


def radial_glow(w, h, center, color, radius, alpha=120):
    """Brilho radial (luz por trás do jogador)."""
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    cx, cy = center
    for r in range(radius, 0, -2):
        a = int(alpha * (1 - r / radius) ** 2)
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (a,))
    return glow.filter(ImageFilter.GaussianBlur(8))


def draw_attr_bar(draw, x, y, label, value, accent, w=200):
    """Atributo com barra de progresso."""
    f_val = font(34)
    f_lbl = font(24, bold=False)
    # valor
    draw.text((x, y), f"{value:02d}", font=f_val, fill=(255, 255, 255))
    draw.text((x + 60, y + 6), label, font=f_lbl, fill=(255, 255, 255, 220))
    # barra
    bar_x, bar_y, bar_w, bar_h = x, y + 42, w, 8
    draw.rounded_rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + bar_h], radius=4, fill=(0, 0, 0, 90))
    fill_w = int(bar_w * value / 99)
    draw.rounded_rectangle([bar_x, bar_y, bar_x + fill_w, bar_y + bar_h], radius=4, fill=accent)


def render_card(card, out_path):
    rar = card["rar"]
    top, bottom, accent, holo = PALETAS[rar]
    c1 = hex_rgb(card["c1"])
    c2 = hex_rgb(card["c2"])

    # base com gradiente
    img = gradient(W, H, top, bottom).convert("RGBA")

    # brilho radial atrás do "jogador"
    glow = radial_glow(W, H, (W // 2, 300), c1, 220, alpha=90)
    img = Image.alpha_composite(img, glow)

    # holográfico para lendária/mítica
    if holo:
        img = Image.alpha_composite(img, holographic_overlay(W, H, 0.6))

    draw = ImageDraw.Draw(img)

    # moldura premium dupla
    draw.rounded_rectangle([10, 10, W - 10, H - 10], radius=32, outline=accent + (255,), width=5)
    draw.rounded_rectangle([20, 20, W - 20, H - 20], radius=26, outline=(255, 255, 255, 60), width=2)

    is_jogador = card["tipo_nome"] == "Jogador"

    if is_jogador:
        a = card["attrs"]
        # OVR grande (topo esquerdo)
        draw.text((48, 44), str(card["ovr"]), font=font(96), fill=(255, 255, 255))
        draw.text((54, 150), card["pos"], font=font(40), fill=accent + (255,))
        # linha decorativa
        draw.line([(50, 200), (170, 200)], fill=accent + (200,), width=3)

    # badge da seleção (topo direito)
    draw.rounded_rectangle([W - 160, 48, W - 48, 120], radius=12, fill=c1 + (255,))
    bb = draw.textbbox((0, 0), card["pais"], font=font(40))
    draw.text((W - 104 - (bb[2] - bb[0]) // 2, 60), card["pais"], font=font(40), fill=c2 + (255,))

    # "retrato" — emblema circular com número/inicial
    cx, cy = W // 2, 340
    draw.ellipse([cx - 95, cy - 95, cx + 95, cy + 95], fill=c1 + (255,), outline=(255, 255, 255, 230), width=5)
    if is_jogador:
        label = "10" if card.get("pos") == "CAM" and card.get("camisa") == 11 else str(card.get("camisa", 1))
    else:
        label = card["pais"][:2]
    bb = draw.textbbox((0, 0), label, font=font(72))
    draw.text((cx - (bb[2] - bb[0]) // 2, cy - (bb[3] - bb[1]) // 2 - 8), label, font=font(72), fill=c2 + (255,))

    # nome
    nome = card["nome"].upper()
    f_nome = font(44)
    bb = draw.textbbox((0, 0), nome, font=f_nome)
    while bb[2] - bb[0] > W - 100 and f_nome.size > 24:
        f_nome = font(f_nome.size - 2)
        bb = draw.textbbox((0, 0), nome, font=f_nome)
    draw.text((cx - (bb[2] - bb[0]) // 2, 470), nome, font=f_nome, fill=(255, 255, 255))
    draw.line([(80, 540), (W - 80, 540)], fill=(255, 255, 255, 100), width=2)

    if is_jogador:
        a = card["attrs"]
        col1 = [("PAC", a["PAC"]), ("SHO", a["SHO"]), ("PAS", a["PAS"])]
        col2 = [("DRI", a["DRI"]), ("DEF", a["DEF"]), ("PHY", a["PHY"])]
        for i, (lbl, val) in enumerate(col1):
            draw_attr_bar(draw, 90, 570 + i * 70, lbl, val, accent)
        for i, (lbl, val) in enumerate(col2):
            draw_attr_bar(draw, 320, 570 + i * 70, lbl, val, accent)
    elif card.get("texto"):
        # cartas informativas (curiosidade/estádio): texto centralizado
        f_txt = font(28, bold=False)
        words = card["texto"].split()
        lines, cur = [], ""
        for w_ in words:
            if draw.textlength(cur + " " + w_, font=f_txt) < W - 140:
                cur = (cur + " " + w_).strip()
            else:
                lines.append(cur); cur = w_
        if cur: lines.append(cur)
        for i, ln in enumerate(lines):
            bb = draw.textbbox((0, 0), ln, font=f_txt)
            draw.text((cx - (bb[2] - bb[0]) // 2, 590 + i * 40), ln, font=f_txt, fill=(255, 255, 255, 230))

    # rodapé: raridade + id
    f_foot = font(26)
    foot = f"#{card['id']:04d}   ·   {RAR_NOME[rar]}"
    bb = draw.textbbox((0, 0), foot, font=f_foot)
    draw.text((cx - (bb[2] - bb[0]) // 2, H - 70), foot, font=f_foot, fill=accent + (255,))

    img.convert("RGB").save(out_path, "PNG", quality=95)


def build_demo_cards():
    """Cartas de exemplo das 5 raridades para preview."""
    cards = []
    sample = PAISES[0]  # Brasil
    nomes = ["Tonhão", "Bira Costa", "Mariola", "Rei Arthur", "O Fenômeno"]
    posicoes = ["GOL", "ZAG", "MEI", "CAM", "ATA"]
    for rar in range(5):
        ovr_base = [65, 75, 83, 90, 96][rar]
        cards.append({
            "id": rar + 1, "tipo_nome": "Jogador", "nome": nomes[rar],
            "pais": sample[0], "pos": posicoes[rar], "rar": rar, "ovr": ovr_base,
            "camisa": [1, 4, 8, 10, 9][rar],
            "attrs": {"PAC": ovr_base - 3, "SHO": ovr_base + 2, "PAS": ovr_base - 1,
                      "DRI": ovr_base, "DEF": ovr_base - 10 if rar > 2 else ovr_base,
                      "PHY": ovr_base - 5},
            "c1": sample[2], "c2": sample[3],
        })
    return cards


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true", help="Gera só as 5 cartas de exemplo")
    args = ap.parse_args()

    base = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(base, "output_pro")
    os.makedirs(out, exist_ok=True)

    cards = build_demo_cards()
    for c in cards:
        path = os.path.join(out, f"rar{c['rar']}_{RAR_NOME[c['rar']].lower()}.png")
        render_card(c, path)
        print(f"✅ {RAR_NOME[c['rar']]}: {path}")

    print(f"\n{len(cards)} cartas de demonstração geradas em {out}/")


if __name__ == "__main__":
    main()
