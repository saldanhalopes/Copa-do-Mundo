#!/usr/bin/env python3
"""
Gerador de Cartas — CryptoÁlbum Copa (estilo FIFA Ultimate Team)
================================================================
Cria as 680 figurinhas com:
  - 6 atributos (PAC, SHO, PAS, DRI, DEF, PHY) por posição
  - OVR (overall) ponderado pela posição
  - Raridade determinando a faixa de OVR
  - Imagem PNG da carta (estilo FIFA)
  - Metadados JSON (compatível OpenSea / Binance NFT)
  - stats empacotados (uint256) para gravar no CardStats.sol

Uso:
    python generate_cards.py
Saída:
    output/images/{id}.png
    output/metadata/{id}.json
    output/stats.json    (para setStatsBatch no contrato)
"""

import json
import os
import random
from PIL import Image, ImageDraw, ImageFont

random.seed(2026)  # determinístico

# ─────────────────────────────────────────────────────────────────
# Configuração
# ─────────────────────────────────────────────────────────────────
SELECOES = [
    ("BRA", "Brasil",    (0, 156, 59),  (255, 223, 0)),
    ("ARG", "Argentina", (117, 170, 219),(255, 255, 255)),
    ("FRA", "França",    (0, 35, 149),  (237, 41, 57)),
    ("ALE", "Alemanha",  (26, 26, 26),  (221, 0, 0)),
]

POSICOES = ["GOL", "ZAG", "ZAG", "LD", "LE", "VOL", "MEI", "MEI", "PD", "PE", "CAM"]
POS_ENUM = {"GOL":0,"ZAG":1,"LD":2,"LE":3,"VOL":4,"MEI":5,"PD":6,"PE":7,"CAM":8}

# Raridade -> (nome, faixa OVR, peso de sorteio)
RARIDADES = [
    ("Comum",    (60, 69)),
    ("Rara",     (70, 79)),
    ("Épica",    (80, 86)),
    ("Lendária", (87, 92)),
    ("Mítica",   (93, 99)),
]

# Perfil de atributos por posição: pesos para distribuir o OVR
# (PAC, SHO, PAS, DRI, DEF, PHY)
PERFIS = {
    "GOL": (0.6, 0.3, 0.7, 0.5, 1.4, 1.2),
    "ZAG": (0.8, 0.4, 0.7, 0.6, 1.5, 1.3),
    "LD":  (1.3, 0.6, 1.1, 1.0, 1.2, 1.0),
    "LE":  (1.3, 0.6, 1.1, 1.0, 1.2, 1.0),
    "VOL": (0.9, 0.7, 1.2, 1.0, 1.3, 1.2),
    "MEI": (1.0, 1.1, 1.3, 1.2, 0.7, 0.9),
    "PD":  (1.4, 1.1, 1.0, 1.3, 0.5, 0.8),
    "PE":  (1.4, 1.1, 1.0, 1.3, 0.5, 0.8),
    "CAM": (1.1, 1.3, 1.3, 1.4, 0.5, 0.8),
}

# Peso de cada atributo no cálculo do OVR por posição
OVR_PESOS = {
    "GOL": (0.05, 0.05, 0.10, 0.10, 0.40, 0.30),
    "ZAG": (0.10, 0.05, 0.10, 0.10, 0.40, 0.25),
    "LD":  (0.20, 0.10, 0.20, 0.15, 0.25, 0.10),
    "LE":  (0.20, 0.10, 0.20, 0.15, 0.25, 0.10),
    "VOL": (0.10, 0.10, 0.25, 0.15, 0.25, 0.15),
    "MEI": (0.10, 0.20, 0.25, 0.25, 0.10, 0.10),
    "PD":  (0.25, 0.20, 0.15, 0.25, 0.05, 0.10),
    "PE":  (0.25, 0.20, 0.15, 0.25, 0.05, 0.10),
    "CAM": (0.15, 0.25, 0.25, 0.25, 0.05, 0.05),
}

ATTR_NAMES = ["PAC", "SHO", "PAS", "DRI", "DEF", "PHY"]


def gerar_atributos(posicao, ovr_alvo):
    """Distribui atributos em torno do OVR alvo seguindo o perfil da posição."""
    perfil = PERFIS[posicao]
    attrs = []
    for peso in perfil:
        # atributo base proporcional ao perfil, com ruído
        base = ovr_alvo * (0.7 + 0.3 * peso)
        valor = int(base + random.uniform(-6, 6))
        valor = max(30, min(99, valor))
        attrs.append(valor)
    return attrs  # [PAC, SHO, PAS, DRI, DEF, PHY]


def calcular_ovr(attrs, posicao):
    pesos = OVR_PESOS[posicao]
    ovr = sum(a * p for a, p in zip(attrs, pesos))
    return max(40, min(99, round(ovr)))


def pack_stats(attrs, ovr, pos_enum, rar, sel_enum):
    """Empacota como o CardStats.sol espera (uint256)."""
    pac, sho, pas, dri, defe, phy = attrs
    return (pac
            | (sho << 8)
            | (pas << 16)
            | (dri << 24)
            | (defe << 32)
            | (phy << 40)
            | (ovr << 48)
            | (pos_enum << 56)
            | (rar << 64)
            | (sel_enum << 72))


# ─────────────────────────────────────────────────────────────────
# Construção do catálogo de cartas
# ─────────────────────────────────────────────────────────────────
NOMES = {
    "BRA": ["Tonhão","Bira Costa","Juvenal","Cacá Lima","Dudu Reis","Zé Henrique","Mariola","Pituca","Ramonzinho","Galego","Rei Arthur"],
    "ARG": ["Goyco","Tano Ferri","El Vasco","Chino Páez","Lucho Sosa","Pipa Galván","Mago Ruiz","Coco Ledesma","Nico Bravo","Tucu Molina","El Diez"],
    "FRA": ["Bastien","Maxence","Théo Laval","Côme Diarra","Iliès Roche","Aurel Niang","Baptiste M.","Eliott Caron","Sofian Bey","Léandre","Le Magicien"],
    "ALE": ["Der Riese","Falk Brandt","Jonas Kühl","Timo Hess","Levin Roth","Karl Steiner","Moritz B.","Anton Vogel","Niko Frey","Emil Wirtz","Der Kaiser"],
}

def raridade_da_carta(idx_jogador):
    """Define raridade pela importância do jogador (camisa 10 = lendária, goleiro = épica)."""
    if idx_jogador == 10:   # camisa 10
        return 3            # Lendária
    if idx_jogador == 0:    # goleiro
        return 2            # Épica
    if idx_jogador in (5, 8):
        return 1            # Rara
    return 0                # Comum


def construir_catalogo():
    cartas = []
    num = 1
    for sel_enum, (sigla, nome_sel, c1, c2) in enumerate(SELECOES):
        for i, nome in enumerate(NOMES[sigla]):
            pos = POSICOES[i]
            rar = raridade_da_carta(i)
            ovr_min, ovr_max = RARIDADES[rar][1]
            ovr_alvo = random.randint(ovr_min, ovr_max)
            attrs = gerar_atributos(pos, ovr_alvo)
            ovr = calcular_ovr(attrs, pos)
            # garante que o OVR final respeita a faixa da raridade
            ovr = max(ovr_min, min(ovr_max, ovr))

            cartas.append({
                "id": num,
                "nome": nome,
                "selecao": sigla,
                "selecao_nome": nome_sel,
                "selecao_enum": sel_enum,
                "posicao": pos,
                "posicao_enum": POS_ENUM[pos],
                "raridade": rar,
                "raridade_nome": RARIDADES[rar][0],
                "ovr": ovr,
                "attrs": dict(zip(ATTR_NAMES, attrs)),
                "packed": str(pack_stats(attrs, ovr, POS_ENUM[pos], rar, sel_enum)),
                "cores": {"primaria": c1, "secundaria": c2},
            })
            num += 1
    return cartas


# ─────────────────────────────────────────────────────────────────
# Renderização da carta (PNG estilo FIFA)
# ─────────────────────────────────────────────────────────────────
RAR_GRADIENTES = {
    0: [(140, 100, 60), (90, 60, 35)],     # bronze
    1: [(200, 205, 215), (140, 150, 165)], # prata
    2: [(230, 190, 90), (180, 140, 40)],   # ouro
    3: [(150, 100, 240), (90, 50, 180)],   # lendária roxo
    4: [(255, 80, 140), (255, 180, 40)],   # mítica
}

def fonte(tam, bold=True):
    candidatos = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for c in candidatos:
        if os.path.exists(c):
            return ImageFont.truetype(c, tam)
    return ImageFont.load_default()

def gradiente_vertical(w, h, top, bottom):
    base = Image.new("RGB", (w, h), top)
    draw = ImageDraw.Draw(base)
    for y in range(h):
        t = y / h
        cor = tuple(int(top[i] * (1 - t) + bottom[i] * t) for i in range(3))
        draw.line([(0, y), (w, y)], fill=cor)
    return base

def render_carta(carta, out_path):
    W, H = 400, 560
    rar = carta["raridade"]
    g1, g2 = RAR_GRADIENTES[rar]
    img = gradiente_vertical(W, H, g1, g2).convert("RGBA")
    draw = ImageDraw.Draw(img)

    # moldura
    draw.rounded_rectangle([8, 8, W-8, H-8], radius=24, outline=(255,255,255,180), width=4)

    # OVR + posição (canto superior esquerdo)
    draw.text((34, 34), str(carta["ovr"]), font=fonte(64), fill=(255,255,255))
    draw.text((40, 104), carta["posicao"], font=fonte(28), fill=(255,255,255))

    # bandeira/seleção (canto superior direito)
    c1 = carta["cores"]["primaria"]; c2 = carta["cores"]["secundaria"]
    draw.rounded_rectangle([W-110, 36, W-36, 92], radius=8, fill=c1)
    draw.text((W-100, 48), carta["selecao"], font=fonte(26), fill=c2)

    # "foto" do jogador (placeholder: número da camisa em círculo)
    cx, cy = W//2, 230
    draw.ellipse([cx-70, cy-70, cx+70, cy+70], fill=c1, outline=(255,255,255), width=4)
    camisa = "10" if carta["posicao_enum"] == 8 else str((carta["id"]-1) % 11 + 1)
    bbox = draw.textbbox((0,0), camisa, font=fonte(56))
    draw.text((cx-(bbox[2]-bbox[0])//2, cy-(bbox[3]-bbox[1])//2-6), camisa, font=fonte(56), fill=c2)

    # nome
    nome = carta["nome"].upper()
    bbox = draw.textbbox((0,0), nome, font=fonte(34))
    draw.text((cx-(bbox[2]-bbox[0])//2, 330), nome, font=fonte(34), fill=(255,255,255))
    draw.line([(60, 378), (W-60, 378)], fill=(255,255,255,120), width=2)

    # 6 atributos em 2 colunas
    attrs = carta["attrs"]
    col1 = ["PAC", "SHO", "PAS"]
    col2 = ["DRI", "DEF", "PHY"]
    y0 = 400
    for j, key in enumerate(col1):
        draw.text((70, y0 + j*46), f"{attrs[key]:>2}  {key}", font=fonte(30), fill=(255,255,255))
    for j, key in enumerate(col2):
        draw.text((230, y0 + j*46), f"{attrs[key]:>2}  {key}", font=fonte(30), fill=(255,255,255))

    # rodapé: id + raridade
    draw.text((34, H-44), f"#{carta['id']:03d}  ·  {carta['raridade_nome']}", font=fonte(20, bold=False), fill=(255,255,255,200))

    img.convert("RGB").save(out_path, "PNG")


# ─────────────────────────────────────────────────────────────────
# Metadados (OpenSea / Binance NFT)
# ─────────────────────────────────────────────────────────────────
def metadata(carta):
    a = carta["attrs"]
    return {
        "name": f"#{carta['id']:03d} {carta['nome']} ({carta['ovr']} OVR)",
        "description": f"Figurinha {carta['raridade_nome']} da {carta['selecao_nome']} — CryptoÁlbum Copa. Atributos imutáveis gravados on-chain.",
        "image": f"ipfs://PLACEHOLDER/images/{carta['id']}.png",
        "attributes": [
            {"trait_type": "Seleção", "value": carta["selecao_nome"]},
            {"trait_type": "Posição", "value": carta["posicao"]},
            {"trait_type": "Raridade", "value": carta["raridade_nome"]},
            {"trait_type": "OVR", "value": carta["ovr"]},
            {"trait_type": "PAC", "value": a["PAC"]},
            {"trait_type": "SHO", "value": a["SHO"]},
            {"trait_type": "PAS", "value": a["PAS"]},
            {"trait_type": "DRI", "value": a["DRI"]},
            {"trait_type": "DEF", "value": a["DEF"]},
            {"trait_type": "PHY", "value": a["PHY"]},
            {"trait_type": "Número no Álbum", "value": carta["id"]},
            {"trait_type": "Edição", "value": "2026"},
        ],
    }


# ─────────────────────────────────────────────────────────────────
def main():
    base = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(base, "output")
    os.makedirs(os.path.join(out, "images"), exist_ok=True)
    os.makedirs(os.path.join(out, "metadata"), exist_ok=True)

    catalogo = construir_catalogo()

    stats_input = {"tokenIds": [], "packedStats": []}
    for carta in catalogo:
        render_carta(carta, os.path.join(out, "images", f"{carta['id']}.png"))
        with open(os.path.join(out, "metadata", f"{carta['id']}.json"), "w", encoding="utf-8") as f:
            json.dump(metadata(carta), f, ensure_ascii=False, indent=2)
        stats_input["tokenIds"].append(carta["id"])
        stats_input["packedStats"].append(carta["packed"])

    # arquivo para alimentar setStatsBatch() no contrato
    with open(os.path.join(out, "stats.json"), "w", encoding="utf-8") as f:
        json.dump(stats_input, f, indent=2)
    # catálogo completo (referência)
    with open(os.path.join(out, "catalogo.json"), "w", encoding="utf-8") as f:
        json.dump(catalogo, f, ensure_ascii=False, indent=2)

    # resumo
    por_rar = {}
    for c in catalogo:
        por_rar[c["raridade_nome"]] = por_rar.get(c["raridade_nome"], 0) + 1
    print(f"✅ {len(catalogo)} cartas geradas (demo: 4 seleções)")
    print("   Distribuição:", por_rar)
    print(f"   OVR médio: {sum(c['ovr'] for c in catalogo)/len(catalogo):.1f}")
    print(f"   Saída em: {out}/")


if __name__ == "__main__":
    main()
