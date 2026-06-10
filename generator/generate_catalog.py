#!/usr/bin/env python3
"""
Gerador de Catálogo — CryptoÁlbum Copa 2026 (48 países)
========================================================
Estrutura por país (27 figurinhas):
  - 23 jogadores (com atributos FIFA + OVR)
  - 1 técnico (dá bônus de força ao time no PvP)
  - 1 bandeira (NFT colecionável)
  - 1 brasão/escudo (NFT)
  - 1 mascote (NFT)
Categorias extras (NFT):
  - Estádios especiais
  - Curiosidades de cada país

Saídas:
  output/catalogo.json   — catálogo completo para o app
  output/stats.json      — atributos empacotados para CardStats.sol
  output/metadata/{id}.json (opcional, --full)
"""
import json
import os
import random
import sys
from paises import PAISES, POSICOES_23, ESTADIOS_ESPECIAIS

random.seed(2026)

# Tipos de figurinha
TIPO_JOGADOR, TIPO_TECNICO, TIPO_BANDEIRA, TIPO_BRASAO, TIPO_MASCOTE, TIPO_ESTADIO, TIPO_CURIOSIDADE = range(7)
TIPO_NOME = {0:"Jogador",1:"Técnico",2:"Bandeira",3:"Brasão",4:"Mascote",5:"Estádio",6:"Curiosidade"}

# Enums de posição (para CardStats)
POS_ENUM = {"GOL":0,"ZAG":1,"LD":2,"LE":3,"VOL":4,"MEI":5,"PD":6,"PE":7,"CAM":8,"ATA":9}

# Raridade -> faixa de OVR
OVR_RANGE = [(60,69),(70,79),(80,86),(87,92),(93,99)]
RAR_NOME = ["Comum","Rara","Épica","Lendária","Mítica"]

PERFIS = {
    "GOL":(0.6,0.3,0.7,0.5,1.4,1.2),"ZAG":(0.8,0.4,0.7,0.6,1.5,1.3),
    "LD":(1.3,0.6,1.1,1.0,1.2,1.0),"LE":(1.3,0.6,1.1,1.0,1.2,1.0),
    "VOL":(0.9,0.7,1.2,1.0,1.3,1.2),"MEI":(1.0,1.1,1.3,1.2,0.7,0.9),
    "PD":(1.4,1.1,1.0,1.3,0.5,0.8),"PE":(1.4,1.1,1.0,1.3,0.5,0.8),
    "CAM":(1.1,1.3,1.3,1.4,0.5,0.8),"ATA":(1.2,1.4,0.9,1.2,0.4,0.9),
}
OVR_PESOS = {
    "GOL":(.05,.05,.10,.10,.40,.30),"ZAG":(.10,.05,.10,.10,.40,.25),
    "LD":(.20,.10,.20,.15,.25,.10),"LE":(.20,.10,.20,.15,.25,.10),
    "VOL":(.10,.10,.25,.15,.25,.15),"MEI":(.10,.20,.25,.25,.10,.10),
    "PD":(.25,.20,.15,.25,.05,.10),"PE":(.25,.20,.15,.25,.05,.10),
    "CAM":(.15,.25,.25,.25,.05,.05),"ATA":(.25,.30,.10,.20,.05,.10),
}
ATTR = ["PAC","SHO","PAS","DRI","DEF","PHY"]

# nomes fictícios genéricos (combinados por país via seed)
PRENOMES = ["Léo","Bruno","Diego","Kael","Nико","Tariq","Yann","Omar","Luca","Eros","Ivo","Aki","Sami","Noé","Tomás","Rui","Jonas","Pavel","Igor","Hugo","Aron","Dário","Caio","Ze","Bira"]
SOBRENOMES = ["Silva","Costa","Mendez","Kovač","Diallo","Sato","Müller","Rossi","Okafor","Hassan","Park","Nilsson","Vidić","Aguirre","Laval","Bauer","Petrov","Haidar","Cruz","Santos","Lund","Reyes","Adeyemi","Toth","Bjørn"]

def nome_para(seed):
    rnd = random.Random(seed)
    return f"{rnd.choice(PRENOMES)} {rnd.choice(SOBRENOMES)}"

def raridade_jogador(idx):
    """idx 0..22 dentro do elenco do país."""
    if idx == 22: return 3   # craque (último) lendário
    if idx in (0,):  return 2  # goleiro titular épico
    if idx in (14, 17, 21): return 1  # algumas raras
    return 0

def gerar_attrs(pos, rar, seed):
    rnd = random.Random(seed)
    omin, omax = OVR_RANGE[rar]
    alvo = rnd.randint(omin, omax)
    perfil = PERFIS[pos]
    vals = []
    for peso in perfil:
        v = round(alvo*(0.7+0.3*peso) + rnd.uniform(-6,6))
        vals.append(max(30,min(99,v)))
    pesos = OVR_PESOS[pos]
    ovr = round(sum(a*p for a,p in zip(vals,pesos)))
    ovr = max(omin, min(omax, ovr))
    return dict(zip(ATTR, vals)), ovr

def pack_stats(a, ovr, pos_enum, rar, sel_enum):
    return (a["PAC"] | (a["SHO"]<<8) | (a["PAS"]<<16) | (a["DRI"]<<24)
            | (a["DEF"]<<32) | (a["PHY"]<<40) | (ovr<<48)
            | (pos_enum<<56) | (rar<<64) | (sel_enum<<72))

def construir():
    cartas = []
    num = 1
    for sel_enum, (sigla, nome, c1, c2, mascote, estadio, curiosidade) in enumerate(PAISES):
        # 23 jogadores
        for i in range(23):
            pos = POSICOES_23[i]
            rar = raridade_jogador(i)
            a, ovr = gerar_attrs(pos, rar, num*31+7)
            cartas.append({
                "id": num, "tipo": TIPO_JOGADOR, "tipo_nome": "Jogador",
                "nome": nome_para(num*13), "pais": sigla, "pais_nome": nome,
                "sel_enum": sel_enum, "pos": pos, "rar": rar, "rar_nome": RAR_NOME[rar],
                "ovr": ovr, "attrs": a, "camisa": i+1,
                "packed": str(pack_stats(a, ovr, POS_ENUM[pos], rar, sel_enum)),
                "c1": c1, "c2": c2,
            })
            num += 1
        # técnico (bônus de time)
        cartas.append({
            "id": num, "tipo": TIPO_TECNICO, "tipo_nome": "Técnico",
            "nome": "Téc. " + nome_para(num*17), "pais": sigla, "pais_nome": nome,
            "sel_enum": sel_enum, "pos": "TEC", "rar": 2, "rar_nome": "Épica",
            "ovr": random.randint(78,90), "bonus": random.randint(3,8),
            "c1": c1, "c2": c2, "packed": "0",
        }); num += 1
        # bandeira
        cartas.append({"id":num,"tipo":TIPO_BANDEIRA,"tipo_nome":"Bandeira","nome":f"Bandeira {nome}","pais":sigla,"pais_nome":nome,"sel_enum":sel_enum,"rar":0,"rar_nome":"Comum","c1":c1,"c2":c2,"packed":"0"}); num+=1
        # brasão
        cartas.append({"id":num,"tipo":TIPO_BRASAO,"tipo_nome":"Brasão","nome":f"Brasão {nome}","pais":sigla,"pais_nome":nome,"sel_enum":sel_enum,"rar":1,"rar_nome":"Rara","c1":c1,"c2":c2,"packed":"0"}); num+=1
        # mascote
        cartas.append({"id":num,"tipo":TIPO_MASCOTE,"tipo_nome":"Mascote","nome":mascote,"pais":sigla,"pais_nome":nome,"sel_enum":sel_enum,"rar":2,"rar_nome":"Épica","c1":c1,"c2":c2,"packed":"0"}); num+=1
        # curiosidade (NFT informativa)
        cartas.append({"id":num,"tipo":TIPO_CURIOSIDADE,"tipo_nome":"Curiosidade","nome":f"Você sabia? {nome}","texto":curiosidade,"pais":sigla,"pais_nome":nome,"sel_enum":sel_enum,"rar":1,"rar_nome":"Rara","c1":c1,"c2":c2,"packed":"0"}); num+=1

    # estádios especiais (não atrelados a um país)
    for (en, cidade, desc) in ESTADIOS_ESPECIAIS:
        cartas.append({"id":num,"tipo":TIPO_ESTADIO,"tipo_nome":"Estádio","nome":en,"cidade":cidade,"texto":desc,"pais":"FIFA","pais_nome":"Mundial","sel_enum":255,"rar":3,"rar_nome":"Lendária","c1":"#0A2E22","c2":"#FFDF00","packed":"0"}); num+=1

    return cartas

def main():
    base = os.path.dirname(os.path.abspath(__file__))
    out = os.path.join(base, "output"); os.makedirs(out, exist_ok=True)
    cartas = construir()

    # stats só dos jogadores (têm atributos on-chain)
    stats = {"tokenIds":[], "packedStats":[]}
    for c in cartas:
        if c["tipo"] == TIPO_JOGADOR:
            stats["tokenIds"].append(c["id"])
            stats["packedStats"].append(c["packed"])

    json.dump(cartas, open(os.path.join(out,"catalogo.json"),"w",encoding="utf-8"), ensure_ascii=False)
    json.dump(stats, open(os.path.join(out,"stats.json"),"w"), indent=1)

    # resumo
    por_tipo = {}
    for c in cartas: por_tipo[c["tipo_nome"]] = por_tipo.get(c["tipo_nome"],0)+1
    print(f"✅ {len(cartas)} figurinhas geradas ({len(PAISES)} países)")
    for t,n in por_tipo.items(): print(f"   {t}: {n}")
    print(f"   Jogadores com atributos on-chain: {len(stats['tokenIds'])}")

if __name__ == "__main__":
    main()
