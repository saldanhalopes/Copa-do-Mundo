#!/usr/bin/env python3
"""
Base de dados das 48 seleções da Copa 2026 — CryptoÁlbum Copa.
Cada país: sigla, nome, cores (primária/secundária), mascote, estádio-sede fictício, curiosidade.
Jogadores e técnicos são fictícios (gerados) para evitar questões de licenciamento.
"""

# (sigla, nome, cor_primaria_hex, cor_secundaria_hex, mascote, estadio, curiosidade)
PAISES = [
    ("BRA","Brasil","#009C3B","#FFDF00","Canarinho","Estádio do Maracanã","Único país a vencer 5 Copas do Mundo."),
    ("ARG","Argentina","#75AADB","#FFFFFF","El Gaucho","Estádio Monumental","Terra de craques e do tango."),
    ("FRA","França","#002395","#ED2939","Le Coq","Stade de France","Bicampeã mundial em 1998 e 2018."),
    ("ALE","Alemanha","#000000","#DD0000","Der Adler","Allianz Arena","Tetracampeã e máquina de eficiência."),
    ("ESP","Espanha","#AA151B","#F1BF00","El Toro","Santiago Bernabéu","Estilo 'tiki-taka' encantou o mundo."),
    ("ITA","Itália","#0066CC","#FFFFFF","Il Lupo","Stadio Olimpico","Defesa lendária, o 'catenaccio'."),
    ("ING","Inglaterra","#FFFFFF","#CF081F","The Lion","Estádio de Wembley","Berço do futebol moderno."),
    ("POR","Portugal","#006600","#FF0000","O Galo","Estádio da Luz","Os Navegadores do futebol."),
    ("NED","Holanda","#FF6200","#FFFFFF","De Leeuw","Johan Cruyff Arena","Inventora do 'futebol total'."),
    ("BEL","Bélgica","#000000","#FDDA24","Le Diable","Stade Roi Baudouin","A 'Geração de Ouro'."),
    ("CRO","Croácia","#FF0000","#FFFFFF","Vatreni","Stadion Maksimir","Vice-campeã em 2018, time xadrez."),
    ("URU","Uruguai","#5CBFEB","#FFFFFF","La Garra","Estádio Centenário","Primeira campeã da história, 1930."),
    ("MEX","México","#006847","#CE1126","El Águila","Estádio Azteca","Sede de duas finais de Copa."),
    ("USA","Estados Unidos","#0A3161","#B31942","The Eagle","MetLife Stadium","Co-sede da Copa de 2026."),
    ("CAN","Canadá","#FF0000","#FFFFFF","Le Castor","BMO Field","Co-sede da Copa de 2026."),
    ("JPN","Japão","#BC002D","#FFFFFF","Samurai Blue","Estádio de Tóquio","Disciplina dos 'Samurais Azuis'."),
    ("KOR","Coreia do Sul","#CD2E3A","#0047A0","Taegeuk","Estádio de Seul","Semifinalista em casa, 2002."),
    ("SEN","Senegal","#00853F","#FDEF42","Le Lion","Stade Léopold Senghor","Os 'Leões de Teranga'."),
    ("MAR","Marrocos","#C1272D","#006233","Atlas","Stade Mohammed V","Primeiro semifinalista africano, 2022."),
    ("GHA","Gana","#006B3F","#FCD116","Black Star","Accra Sports Stadium","As 'Estrelas Negras'."),
    ("NGA","Nigéria","#008751","#FFFFFF","Super Eagle","Estádio Nacional","As 'Super Águias'."),
    ("CMR","Camarões","#007A5E","#CE1126","Le Lion","Stade Olembe","Os 'Leões Indomáveis'."),
    ("EGY","Egito","#CE1126","#000000","Pharaoh","Cairo Stadium","Recordista de títulos africanos."),
    ("CIV","Costa do Marfim","#FF8200","#009E60","L'Éléphant","Stade Alassane","Os 'Elefantes'."),
    ("AUS","Austrália","#00843D","#FFCD00","Socceroo","Stadium Australia","Os 'Socceroos'."),
    ("KSA","Arábia Saudita","#006C35","#FFFFFF","El Halcón","King Fahd Stadium","Os 'Falcões Verdes'."),
    ("IRN","Irã","#239F40","#DA0000","Team Melli","Azadi Stadium","Potência asiática 'Team Melli'."),
    ("QAT","Catar","#8A1538","#FFFFFF","El Annabi","Lusail Stadium","Sede da Copa de 2022."),
    ("COL","Colômbia","#FCD116","#003893","El Cóndor","Estádio El Campín","O ritmo e a alegria cafeteira."),
    ("CHI","Chile","#0039A6","#D52B1E","La Roja","Estádio Nacional","Bicampeã da Copa América."),
    ("PER","Peru","#D91023","#FFFFFF","El Inca","Estádio Nacional","A 'Blanquirroja'."),
    ("ECU","Equador","#FFDD00","#034EA2","La Tri","Estádio Casa Blanca","A 'Tricolor' andina."),
    ("PAR","Paraguai","#D52B1E","#0038A8","La Albirroja","Defensores del Chaco","A 'Albirroja' guerreira."),
    ("POL","Polônia","#DC143C","#FFFFFF","Orzel","Stadion Narodowy","As 'Águias Brancas'."),
    ("SRB","Sérvia","#C6363C","#0C4076","Orlovi","Stadion Rajko Mitic","As 'Águias' dos Bálcãs."),
    ("SUI","Suíça","#FF0000","#FFFFFF","La Nati","St. Jakob-Park","Precisão suíça em campo."),
    ("DEN","Dinamarca","#C60C30","#FFFFFF","De Rod","Parken Stadium","A 'Dinamite Dinamarquesa'."),
    ("SWE","Suécia","#006AA7","#FECC00","Blagult","Friends Arena","Os 'Azul e Amarelo'."),
    ("AUT","Áustria","#ED2939","#FFFFFF","Das Team","Ernst-Happel","Tradição do futebol europeu."),
    ("TUR","Turquia","#E30A17","#FFFFFF","Ay-Yildiz","Atatürk Stadium","A 'Lua e Estrela'."),
    ("WAL","País de Gales","#C8102E","#00B140","Y Ddraig","Cardiff City Stadium","O 'Dragão Vermelho'."),
    ("SCO","Escócia","#005EB8","#FFFFFF","The Thistle","Hampden Park","Berço de rivalidades históricas."),
    ("UKR","Ucrânia","#005BBB","#FFD500","Zhovto","Olimpiyskiy","Os 'Azul e Amarelo' do leste."),
    ("CRC","Costa Rica","#002B7F","#CE1126","La Sele","Estadio Nacional","Surpresa das quartas em 2014."),
    ("PAN","Panamá","#005293","#D21034","La Marea","Estadio Rommel","A 'Maré Vermelha'."),
    ("JAM","Jamaica","#009B3A","#FED100","Reggae Boy","Independence Park","Os 'Reggae Boyz'."),
    ("NZL","Nova Zelândia","#FFFFFF","#000000","All White","Eden Park","Os 'All Whites'."),
    ("ALG","Argélia","#006233","#FFFFFF","Fennec","Stade 5 Juillet","As 'Raposas do Deserto'."),
]

# Posições (formação base de 23 jogadores: 3 GOL, 8 DEF, 6 MEI, 6 ATA)
POSICOES_23 = (
    ["GOL", "GOL", "GOL"] +
    ["ZAG", "ZAG", "ZAG", "ZAG", "LD", "LD", "LE", "LE"] +
    ["VOL", "VOL", "MEI", "MEI", "MEI", "CAM"] +
    ["PD", "PD", "PE", "PE", "ATA", "ATA"]
)

assert len(POSICOES_23) == 23, f"esperado 23 posições, got {len(POSICOES_23)}"
assert len(PAISES) == 48, f"esperado 48 países, got {len(PAISES)}"

# Estádios extras (figurinhas NFT próprias, além do estádio-sede no país)
ESTADIOS_ESPECIAIS = [
    ("Maracanã", "Rio de Janeiro", "Templo do futebol mundial."),
    ("Azteca", "Cidade do México", "Palco de Pelé e Maradona."),
    ("Wembley", "Londres", "O estádio dos sonhos."),
    ("MetLife", "Nova Jersey", "Sede da final de 2026."),
    ("Lusail", "Catar", "Sede da final de 2022."),
    ("Santiago Bernabéu", "Madri", "Casa de gigantes."),
    ("Allianz Arena", "Munique", "A arena que muda de cor."),
    ("Camp Nou", "Barcelona", "O maior da Europa."),
]

if __name__ == "__main__":
    print(f"{len(PAISES)} países, {len(POSICOES_23)} jogadores cada")
    print(f"Por país: 23 jogadores + 1 técnico + 1 bandeira + 1 brasão + 1 mascote = 27")
    print(f"Total jogadores+país: {len(PAISES) * 27}")
    print(f"+ {len(ESTADIOS_ESPECIAIS)} estádios especiais")
