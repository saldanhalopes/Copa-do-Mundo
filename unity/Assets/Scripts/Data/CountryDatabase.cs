using System;
using System.Collections.Generic;

namespace CryptoAlbumCopa.Data
{
    /// <summary>
    /// Base das 48 seleções + estádios. Espelha generator/paises.py.
    /// </summary>
    public static class CountryDatabase
    {
        // sigla, nome, cor1, cor2, mascote, estádio, curiosidade
        public static readonly string[][] Paises = new string[][]
        {
            new[]{"BRA","Brasil","#009C3B","#FFDF00","Canarinho","Maracanã","Único pentacampeão mundial."},
            new[]{"ARG","Argentina","#75AADB","#FFFFFF","El Gaucho","Monumental","Terra do tango e dos craques."},
            new[]{"FRA","França","#002395","#ED2939","Le Coq","Stade de France","Bicampeã em 1998 e 2018."},
            new[]{"ALE","Alemanha","#1A1A1A","#DD0000","Der Adler","Allianz Arena","Tetracampeã e eficiente."},
            new[]{"ESP","Espanha","#AA151B","#F1BF00","El Toro","Bernabéu","O encanto do tiki-taka."},
            new[]{"ITA","Itália","#0066CC","#FFFFFF","Il Lupo","Olimpico","Mestre do catenaccio."},
            new[]{"ING","Inglaterra","#E5E5E5","#CF081F","The Lion","Wembley","Berço do futebol moderno."},
            new[]{"POR","Portugal","#006600","#FF0000","O Galo","Estádio da Luz","Os Navegadores."},
            new[]{"NED","Holanda","#FF6200","#FFFFFF","De Leeuw","Cruyff Arena","Pátria do futebol total."},
            new[]{"BEL","Bélgica","#1A1A1A","#FDDA24","Le Diable","Roi Baudouin","A Geração de Ouro."},
            new[]{"CRO","Croácia","#FF0000","#FFFFFF","Vatreni","Maksimir","Vice em 2018, o xadrez."},
            new[]{"URU","Uruguai","#5CBFEB","#FFFFFF","La Garra","Centenário","Primeira campeã, 1930."},
            new[]{"MEX","México","#006847","#CE1126","El Águila","Azteca","Sede de duas finais."},
            new[]{"USA","EUA","#0A3161","#B31942","The Eagle","MetLife","Co-sede de 2026."},
            new[]{"CAN","Canadá","#FF0000","#FFFFFF","Le Castor","BMO Field","Co-sede de 2026."},
            new[]{"JPN","Japão","#BC002D","#FFFFFF","Samurai","Tóquio","Os Samurais Azuis."},
            new[]{"KOR","Coreia do Sul","#CD2E3A","#0047A0","Taegeuk","Seul","Semifinal em 2002."},
            new[]{"SEN","Senegal","#00853F","#FDEF42","Le Lion","Senghor","Leões de Teranga."},
            new[]{"MAR","Marrocos","#C1272D","#006233","Atlas","Mohammed V","Semifinalista em 2022."},
            new[]{"GHA","Gana","#006B3F","#FCD116","Black Star","Accra","As Estrelas Negras."},
            new[]{"NGA","Nigéria","#008751","#FFFFFF","Super Eagle","Nacional","As Super Águias."},
            new[]{"CMR","Camarões","#007A5E","#CE1126","Le Lion","Olembe","Leões Indomáveis."},
            new[]{"EGY","Egito","#CE1126","#1A1A1A","Pharaoh","Cairo","Rei da África."},
            new[]{"CIV","Costa do Marfim","#FF8200","#009E60","L'Éléphant","Alassane","Os Elefantes."},
            new[]{"AUS","Austrália","#00843D","#FFCD00","Socceroo","Stadium Australia","Os Socceroos."},
            new[]{"KSA","Arábia Saudita","#006C35","#FFFFFF","El Halcón","King Fahd","Os Falcões Verdes."},
            new[]{"IRN","Irã","#239F40","#DA0000","Team Melli","Azadi","Potência Team Melli."},
            new[]{"QAT","Catar","#8A1538","#FFFFFF","El Annabi","Lusail","Sede de 2022."},
            new[]{"COL","Colômbia","#FCD116","#003893","El Cóndor","El Campín","Ritmo cafeteiro."},
            new[]{"CHI","Chile","#0039A6","#D52B1E","La Roja","Nacional","Bi da Copa América."},
            new[]{"PER","Peru","#D91023","#FFFFFF","El Inca","Nacional","A Blanquirroja."},
            new[]{"ECU","Equador","#FFDD00","#034EA2","La Tri","Casa Blanca","A Tricolor andina."},
            new[]{"PAR","Paraguai","#D52B1E","#0038A8","Albirroja","Del Chaco","Guerreiros guaranis."},
            new[]{"POL","Polônia","#DC143C","#FFFFFF","Orzel","Narodowy","As Águias Brancas."},
            new[]{"SRB","Sérvia","#C6363C","#0C4076","Orlovi","Rajko Mitic","As Águias balcânicas."},
            new[]{"SUI","Suíça","#FF0000","#FFFFFF","La Nati","St. Jakob","Precisão suíça."},
            new[]{"DEN","Dinamarca","#C60C30","#FFFFFF","De Rod","Parken","A Dinamite."},
            new[]{"SWE","Suécia","#006AA7","#FECC00","Blagult","Friends Arena","Azul e amarelo."},
            new[]{"AUT","Áustria","#ED2939","#FFFFFF","Das Team","Ernst-Happel","Tradição europeia."},
            new[]{"TUR","Turquia","#E30A17","#FFFFFF","Ay-Yildiz","Atatürk","A Lua e Estrela."},
            new[]{"WAL","País de Gales","#C8102E","#00B140","Y Ddraig","Cardiff","O Dragão Vermelho."},
            new[]{"SCO","Escócia","#005EB8","#FFFFFF","The Thistle","Hampden","Rivalidades históricas."},
            new[]{"UKR","Ucrânia","#005BBB","#FFD500","Zhovto","Olimpiyskiy","Azul e amarelo do leste."},
            new[]{"CRC","Costa Rica","#002B7F","#CE1126","La Sele","Nacional","Surpresa de 2014."},
            new[]{"PAN","Panamá","#005293","#D21034","La Marea","Rommel","A Maré Vermelha."},
            new[]{"JAM","Jamaica","#009B3A","#FED100","Reggae Boy","Independence","Os Reggae Boyz."},
            new[]{"NZL","Nova Zelândia","#E5E5E5","#1A1A1A","All White","Eden Park","Os All Whites."},
            new[]{"ALG","Argélia","#006233","#FFFFFF","Fennec","5 Juillet","Raposas do Deserto."},
        };

        // nome, cidade, descrição
        public static readonly string[][] Estadios = new string[][]
        {
            new[]{"Maracanã","Rio de Janeiro","Templo do futebol mundial."},
            new[]{"Azteca","Cidade do México","Palco de Pelé e Maradona."},
            new[]{"Wembley","Londres","O estádio dos sonhos."},
            new[]{"MetLife","Nova Jersey","Sede da final de 2026."},
            new[]{"Lusail","Catar","Sede da final de 2022."},
            new[]{"Bernabéu","Madri","Casa de gigantes."},
            new[]{"Allianz Arena","Munique","A arena que muda de cor."},
            new[]{"Camp Nou","Barcelona","O maior da Europa."},
        };

        public static readonly Position[] Posicoes23 = new Position[]
        {
            Position.GOL, Position.GOL, Position.GOL,
            Position.ZAG, Position.ZAG, Position.ZAG, Position.ZAG,
            Position.LD, Position.LD, Position.LE, Position.LE,
            Position.VOL, Position.VOL, Position.MEI, Position.MEI, Position.MEI, Position.CAM,
            Position.PD, Position.PD, Position.PE, Position.PE, Position.ATA, Position.ATA
        };

        public const int CountryCount = 48;
        public const int PlayersPerCountry = 23;
        public const int CardsPerCountry = 28; // 23 jog + tec + bandeira + brasao + mascote + curiosidade
    }
}
