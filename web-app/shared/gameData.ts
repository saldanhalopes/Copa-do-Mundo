// ============================================================
// CryptoÁlbum Copa — Catálogo de Jogadores Reais (1930–2022)
// Raridades: Comum (Bronze), Rara (Prata), Lendária (Ouro ✨), Mítica (Platina ✨)
// ============================================================

export type Rarity = "comum" | "rara" | "lendaria" | "mitica";

export interface CardData {
  tokenId: number;
  name: string;
  teamId: string;
  teamName: string;
  position: string;
  rarity: Rarity;
  worldCup: string;
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
  ovr: number;
}

export interface TeamData {
  id: string;
  nome: string;
  flag: string;
  cor: string;
  cor2: string;
  texto: string;
}

// ============================================================
// SELEÇÕES
// ============================================================
export const TEAMS: TeamData[] = [
  { id: "BRA", nome: "Brasil", flag: "🇧🇷", cor: "#009C3B", cor2: "#FFDF00", texto: "#FFFFFF" },
  { id: "ARG", nome: "Argentina", flag: "🇦🇷", cor: "#75AADB", cor2: "#FFFFFF", texto: "#1C3A5F" },
  { id: "ALE", nome: "Alemanha", flag: "🇩🇪", cor: "#1A1A1A", cor2: "#FFCE00", texto: "#FFFFFF" },
  { id: "ITA", nome: "Itália", flag: "🇮🇹", cor: "#0066B3", cor2: "#FFFFFF", texto: "#FFFFFF" },
  { id: "FRA", nome: "França", flag: "🇫🇷", cor: "#002654", cor2: "#ED2939", texto: "#FFFFFF" },
  { id: "ESP", nome: "Espanha", flag: "🇪🇸", cor: "#AA151B", cor2: "#F1BF00", texto: "#FFFFFF" },
  { id: "ENG", nome: "Inglaterra", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", cor: "#CF081F", cor2: "#FFFFFF", texto: "#1C2C5B" },
  { id: "POR", nome: "Portugal", flag: "🇵🇹", cor: "#006847", cor2: "#FF0000", texto: "#FFFFFF" },
  { id: "HOL", nome: "Holanda", flag: "🇳🇱", cor: "#FF6600", cor2: "#FFFFFF", texto: "#FFFFFF" },
  { id: "URU", nome: "Uruguai", flag: "🇺🇾", cor: "#0038A8", cor2: "#FFFFFF", texto: "#FFFFFF" },
  { id: "CRO", nome: "Croácia", flag: "🇭🇷", cor: "#FF0000", cor2: "#FFFFFF", texto: "#FFFFFF" },
  { id: "COL", nome: "Colômbia", flag: "🇨🇴", cor: "#FCD116", cor2: "#003893", texto: "#003893" },
  { id: "MAR", nome: "Marrocos", flag: "🇲🇦", cor: "#C1272D", cor2: "#006233", texto: "#FFFFFF" },
  { id: "CMR", nome: "Camarões", flag: "🇨🇲", cor: "#007A5E", cor2: "#CE1126", texto: "#FFFFFF" },
  { id: "NGA", nome: "Nigéria", flag: "🇳🇬", cor: "#008751", cor2: "#FFFFFF", texto: "#FFFFFF" },
  { id: "KOR", nome: "Coreia do Sul", flag: "🇰🇷", cor: "#CD2E3A", cor2: "#FFFFFF", texto: "#FFFFFF" },
  { id: "JPN", nome: "Japão", flag: "🇯🇵", cor: "#000080", cor2: "#BC002D", texto: "#FFFFFF" },
  { id: "MEX", nome: "México", flag: "🇲🇽", cor: "#006847", cor2: "#CE1126", texto: "#FFFFFF" },
  { id: "USA", nome: "Estados Unidos", flag: "🇺🇸", cor: "#002868", cor2: "#BF0A30", texto: "#FFFFFF" },
  { id: "CHI", nome: "Chile", flag: "🇨🇱", cor: "#D52B1E", cor2: "#FFFFFF", texto: "#FFFFFF" },
];

// ============================================================
// CONFIGURAÇÃO DE RARIDADES
// ============================================================
export const RARITY_CONFIG: Record<Rarity, {
  label: string;
  tier: string;
  color: string;
  gradient: string;
  holographic: boolean;
  supply: string;
}> = {
  comum: {
    label: "BRONZE",
    tier: "Comum",
    color: "#CD7F32",
    gradient: "linear-gradient(145deg, #CD7F32, #8B4513, #A0522D, #CD7F32)",
    holographic: false,
    supply: "50.000",
  },
  rara: {
    label: "PRATA",
    tier: "Rara",
    color: "#C0C0C0",
    gradient: "linear-gradient(145deg, #C0C0C0, #808080, #A8A8A8, #E8E8E8)",
    holographic: false,
    supply: "10.000",
  },
  lendaria: {
    label: "OURO",
    tier: "Lendária",
    color: "#FFD700",
    gradient: "linear-gradient(145deg, #FFD700, #B8860B, #DAA520, #FFD700)",
    holographic: true,
    supply: "2.500",
  },
  mitica: {
    label: "PLATINA",
    tier: "Mítica",
    color: "#E5E4E2",
    gradient: "linear-gradient(145deg, #E5E4E2, #B0C4DE, #87CEEB, #E5E4E2, #B0C4DE)",
    holographic: true,
    supply: "500",
  },
};

// ============================================================
// PACOTES
// ============================================================
export const PACK_TYPES = [
  {
    id: "basico",
    nome: "Básico",
    preco: 4,
    precoSymbol: "POL",
    qtd: 5,
    garantia: "comum" as Rarity,
    garantiaLabel: "5 figurinhas aleatórias",
    desc: "Perfeito para começar sua coleção",
    color: "#CD7F32",
    gradient: "from-amber-800 to-amber-950",
    rarityOdds: { comum: 75, rara: 20, lendaria: 4, mitica: 1 },
  },
  {
    id: "premium",
    nome: "Premium",
    preco: 16,
    precoSymbol: "POL",
    qtd: 7,
    garantia: "rara" as Rarity,
    garantiaLabel: "≥1 Prata garantida + chance de Ouro",
    desc: "Chances aumentadas de cartas especiais",
    color: "#C0C0C0",
    gradient: "from-gray-400 to-gray-700",
    popular: true,
    rarityOdds: { comum: 50, rara: 35, lendaria: 12, mitica: 3 },
  },
  {
    id: "lendario",
    nome: "Lendário",
    preco: 50,
    precoSymbol: "POL",
    qtd: 10,
    garantia: "lendaria" as Rarity,
    garantiaLabel: "≥1 Ouro garantido + chance de Platina",
    desc: "A melhor chance de obter Míticas",
    color: "#FFD700",
    gradient: "from-yellow-500 to-amber-800",
    rarityOdds: { comum: 30, rara: 35, lendaria: 25, mitica: 10 },
  },
];

// ============================================================
// CHAINS
// ============================================================
export const CHAINS = [
  {
    id: "polygon",
    nome: "Polygon",
    symbol: "POL",
    cor: "#8247E5",
    vrf: "Chainlink VRF v2.5",
    market: "OpenSea / Magic Eden",
    logo: "⬟",
    chainId: 137,
    rpc: "https://polygon-rpc.com",
  },
  {
    id: "bnb",
    nome: "BNB Chain",
    symbol: "BNB",
    cor: "#F0B90B",
    vrf: "Binance Oracle VRF",
    market: "Binance NFT Marketplace",
    logo: "◈",
    chainId: 56,
    rpc: "https://bsc-dataseed.binance.org",
  },
];

// ============================================================
// CATÁLOGO DE JOGADORES REAIS — Todas as Copas (1930–2022)
// ============================================================

let _id = 0;
function c(
  name: string, teamId: string, teamName: string, position: string,
  rarity: Rarity, worldCup: string,
  pac: number, sho: number, pas: number, dri: number, def: number, phy: number, ovr: number
): CardData {
  _id++;
  return { tokenId: _id, name, teamId, teamName, position, rarity, worldCup, pac, sho, pas, dri, def, phy, ovr };
}

export const ALL_CARDS: CardData[] = [
  // ═══════════════════════════════════════════════════════════
  // 🇧🇷 BRASIL
  // ═══════════════════════════════════════════════════════════
  c("Pelé", "BRA", "Brasil", "ATA", "mitica", "1970", 92, 96, 93, 96, 42, 78, 98),
  c("Garrincha", "BRA", "Brasil", "PD", "mitica", "1962", 97, 82, 85, 96, 38, 72, 95),
  c("Ronaldo", "BRA", "Brasil", "ATA", "mitica", "2002", 93, 96, 78, 92, 32, 80, 96),
  c("Ronaldinho", "BRA", "Brasil", "MEI", "mitica", "2002", 88, 85, 93, 96, 38, 72, 94),
  c("Romário", "BRA", "Brasil", "ATA", "mitica", "1994", 90, 95, 80, 93, 30, 68, 95),
  c("Carlos Alberto", "BRA", "Brasil", "LD", "lendaria", "1970", 90, 72, 78, 82, 85, 82, 91),
  c("Jairzinho", "BRA", "Brasil", "PD", "lendaria", "1970", 93, 88, 75, 90, 35, 76, 90),
  c("Rivaldo", "BRA", "Brasil", "MEI", "lendaria", "2002", 82, 92, 88, 92, 42, 74, 92),
  c("Cafu", "BRA", "Brasil", "LD", "lendaria", "2002", 92, 58, 78, 82, 85, 82, 90),
  c("Roberto Carlos", "BRA", "Brasil", "LE", "lendaria", "2002", 93, 82, 78, 82, 80, 82, 91),
  c("Rivellino", "BRA", "Brasil", "ME", "lendaria", "1970", 78, 88, 88, 90, 45, 74, 90),
  c("Didi", "BRA", "Brasil", "MC", "lendaria", "1958", 72, 80, 92, 88, 62, 74, 90),
  c("Kaká", "BRA", "Brasil", "MEI", "lendaria", "2006", 90, 82, 88, 90, 40, 72, 91),
  c("Neymar", "BRA", "Brasil", "PE", "lendaria", "2014", 93, 85, 86, 95, 32, 60, 91),
  c("Bebeto", "BRA", "Brasil", "ATA", "rara", "1994", 88, 85, 82, 88, 32, 70, 86),
  c("Taffarel", "BRA", "Brasil", "GOL", "rara", "1994", 45, 12, 35, 28, 22, 82, 85),
  c("Dunga", "BRA", "Brasil", "VOL", "rara", "1994", 65, 62, 78, 72, 85, 82, 84),
  c("Vinícius Jr", "BRA", "Brasil", "PE", "lendaria", "2022", 95, 82, 78, 93, 30, 65, 89),
  c("Casemiro", "BRA", "Brasil", "VOL", "rara", "2022", 65, 68, 75, 72, 90, 85, 87),
  c("Thiago Silva", "BRA", "Brasil", "ZAG", "rara", "2014", 62, 30, 72, 68, 92, 82, 86),
  c("Richarlison", "BRA", "Brasil", "ATA", "rara", "2022", 85, 82, 68, 80, 38, 78, 84),
  c("Adriano", "BRA", "Brasil", "ATA", "rara", "2006", 82, 90, 65, 78, 30, 85, 85),
  c("Alisson", "BRA", "Brasil", "GOL", "comum", "2022", 42, 12, 38, 30, 22, 85, 79),
  c("Marquinhos", "BRA", "Brasil", "ZAG", "comum", "2022", 68, 35, 62, 62, 85, 80, 79),
  c("Paquetá", "BRA", "Brasil", "MEI", "comum", "2022", 72, 72, 78, 80, 55, 68, 78),
  c("Fred", "BRA", "Brasil", "VOL", "comum", "2022", 62, 55, 72, 68, 78, 78, 76),

  // ═══════════════════════════════════════════════════════════
  // 🇦🇷 ARGENTINA
  // ═══════════════════════════════════════════════════════════
  c("Diego Maradona", "ARG", "Argentina", "MEI", "mitica", "1986", 88, 90, 92, 97, 40, 72, 97),
  c("Lionel Messi", "ARG", "Argentina", "PD", "mitica", "2022", 85, 92, 95, 96, 38, 65, 96),
  c("Mario Kempes", "ARG", "Argentina", "ATA", "lendaria", "1978", 88, 90, 72, 85, 35, 80, 90),
  c("Daniel Passarella", "ARG", "Argentina", "ZAG", "lendaria", "1978", 72, 65, 72, 68, 92, 85, 89),
  c("Gabriel Batistuta", "ARG", "Argentina", "ATA", "lendaria", "1998", 82, 93, 72, 82, 32, 82, 90),
  c("Javier Zanetti", "ARG", "Argentina", "LD", "lendaria", "2002", 88, 55, 78, 80, 88, 82, 88),
  c("Ángel Di María", "ARG", "Argentina", "PD", "lendaria", "2022", 90, 82, 85, 88, 35, 62, 87),
  c("Emiliano Martínez", "ARG", "Argentina", "GOL", "lendaria", "2022", 42, 12, 38, 30, 22, 88, 88),
  c("Julián Álvarez", "ARG", "Argentina", "ATA", "rara", "2022", 85, 82, 72, 82, 42, 75, 84),
  c("Rodrigo De Paul", "ARG", "Argentina", "MC", "rara", "2022", 78, 72, 82, 80, 78, 78, 84),
  c("Osvaldo Ardiles", "ARG", "Argentina", "MC", "rara", "1978", 80, 70, 85, 82, 72, 68, 84),
  c("Enzo Fernández", "ARG", "Argentina", "MC", "comum", "2022", 72, 72, 80, 78, 75, 72, 78),
  c("Nicolás Otamendi", "ARG", "Argentina", "ZAG", "comum", "2022", 55, 35, 52, 48, 82, 82, 77),
  c("Alexis Mac Allister", "ARG", "Argentina", "MC", "comum", "2022", 72, 72, 82, 80, 68, 68, 78),

  // ═══════════════════════════════════════════════════════════
  // 🇩🇪 ALEMANHA
  // ═══════════════════════════════════════════════════════════
  c("Franz Beckenbauer", "ALE", "Alemanha", "ZAG", "mitica", "1974", 80, 72, 88, 88, 93, 82, 96),
  c("Gerd Müller", "ALE", "Alemanha", "ATA", "mitica", "1974", 82, 97, 65, 82, 30, 80, 94),
  c("Lothar Matthäus", "ALE", "Alemanha", "MC", "mitica", "1990", 82, 85, 88, 85, 85, 82, 93),
  c("Miroslav Klose", "ALE", "Alemanha", "ATA", "lendaria", "2014", 82, 88, 72, 78, 35, 80, 88),
  c("Oliver Kahn", "ALE", "Alemanha", "GOL", "lendaria", "2002", 45, 12, 35, 28, 22, 92, 90),
  c("Manuel Neuer", "ALE", "Alemanha", "GOL", "lendaria", "2014", 48, 15, 55, 42, 22, 90, 90),
  c("Philipp Lahm", "ALE", "Alemanha", "LD", "lendaria", "2014", 82, 55, 82, 80, 88, 72, 88),
  c("Karl-Heinz Rummenigge", "ALE", "Alemanha", "ATA", "lendaria", "1982", 88, 90, 78, 85, 32, 78, 90),
  c("Fritz Walter", "ALE", "Alemanha", "MC", "lendaria", "1954", 78, 82, 85, 85, 65, 75, 89),
  c("Thomas Müller", "ALE", "Alemanha", "ATA", "rara", "2014", 78, 82, 82, 80, 55, 72, 86),
  c("Toni Kroos", "ALE", "Alemanha", "MC", "rara", "2014", 55, 78, 92, 82, 72, 68, 87),
  c("Schweinsteiger", "ALE", "Alemanha", "MC", "rara", "2014", 72, 75, 85, 80, 82, 82, 86),
  c("Jürgen Klinsmann", "ALE", "Alemanha", "ATA", "rara", "1990", 88, 88, 72, 82, 32, 78, 86),
  c("Joshua Kimmich", "ALE", "Alemanha", "VOL", "comum", "2022", 72, 68, 82, 78, 82, 72, 79),
  c("Jamal Musiala", "ALE", "Alemanha", "MEI", "comum", "2022", 78, 72, 80, 88, 42, 55, 79),
  c("Kai Havertz", "ALE", "Alemanha", "ATA", "comum", "2022", 72, 78, 72, 78, 42, 68, 77),

  // ═══════════════════════════════════════════════════════════
  // 🇮🇹 ITÁLIA
  // ═══════════════════════════════════════════════════════════
  c("Paolo Maldini", "ITA", "Itália", "LE", "mitica", "1994", 82, 35, 72, 78, 96, 85, 95),
  c("Franco Baresi", "ITA", "Itália", "ZAG", "mitica", "1994", 75, 38, 72, 78, 95, 82, 94),
  c("Roberto Baggio", "ITA", "Itália", "MEI", "mitica", "1994", 82, 88, 88, 92, 38, 65, 93),
  c("Andrea Pirlo", "ITA", "Itália", "MC", "lendaria", "2006", 55, 78, 93, 88, 65, 68, 90),
  c("Gianluigi Buffon", "ITA", "Itália", "GOL", "lendaria", "2006", 45, 12, 38, 30, 22, 92, 91),
  c("Fabio Cannavaro", "ITA", "Itália", "ZAG", "lendaria", "2006", 72, 30, 58, 62, 93, 82, 89),
  c("Francesco Totti", "ITA", "Itália", "MEI", "lendaria", "2006", 72, 85, 90, 90, 38, 68, 90),
  c("Paolo Rossi", "ITA", "Itália", "ATA", "lendaria", "1982", 85, 90, 72, 82, 30, 72, 89),
  c("Giuseppe Meazza", "ITA", "Itália", "ATA", "lendaria", "1938", 85, 88, 82, 88, 35, 72, 91),
  c("Del Piero", "ITA", "Itália", "ATA", "rara", "2006", 82, 88, 82, 88, 35, 65, 87),
  c("Dino Zoff", "ITA", "Itália", "GOL", "rara", "1982", 42, 10, 32, 25, 20, 90, 86),
  c("Marco Tardelli", "ITA", "Itália", "MC", "rara", "1982", 78, 78, 78, 75, 78, 80, 85),
  c("Verratti", "ITA", "Itália", "MC", "comum", "2014", 62, 55, 85, 85, 72, 55, 78),
  c("Insigne", "ITA", "Itália", "PE", "comum", "2014", 85, 78, 78, 85, 28, 52, 77),

  // ═══════════════════════════════════════════════════════════
  // 🇫🇷 FRANÇA
  // ═══════════════════════════════════════════════════════════
  c("Zinedine Zidane", "FRA", "França", "MEI", "mitica", "1998", 78, 82, 92, 96, 55, 78, 96),
  c("Kylian Mbappé", "FRA", "França", "ATA", "mitica", "2022", 97, 90, 80, 92, 35, 75, 93),
  c("Michel Platini", "FRA", "França", "MEI", "mitica", "1986", 78, 88, 92, 90, 48, 72, 94),
  c("Thierry Henry", "FRA", "França", "ATA", "lendaria", "1998", 94, 90, 80, 90, 35, 72, 92),
  c("Just Fontaine", "FRA", "França", "ATA", "lendaria", "1958", 90, 95, 68, 82, 28, 75, 90),
  c("Lilian Thuram", "FRA", "França", "LD", "lendaria", "1998", 85, 42, 65, 68, 90, 85, 88),
  c("Patrick Vieira", "FRA", "França", "VOL", "lendaria", "1998", 78, 72, 80, 78, 85, 88, 88),
  c("N'Golo Kanté", "FRA", "França", "VOL", "lendaria", "2018", 82, 55, 75, 78, 92, 82, 88),
  c("Raymond Kopa", "FRA", "França", "MEI", "lendaria", "1958", 85, 78, 88, 90, 42, 68, 89),
  c("Griezmann", "FRA", "França", "ATA", "rara", "2018", 82, 85, 82, 85, 52, 68, 87),
  c("Hugo Lloris", "FRA", "França", "GOL", "rara", "2018", 42, 12, 38, 30, 22, 85, 84),
  c("Deschamps", "FRA", "França", "VOL", "rara", "1998", 68, 55, 78, 72, 82, 80, 82),
  c("Pogba", "FRA", "França", "MC", "comum", "2018", 72, 75, 82, 82, 68, 80, 79),
  c("Varane", "FRA", "França", "ZAG", "comum", "2018", 72, 30, 52, 55, 88, 82, 78),
  c("Giroud", "FRA", "França", "ATA", "comum", "2022", 55, 82, 62, 62, 35, 82, 77),

  // ═══════════════════════════════════════════════════════════
  // 🇪🇸 ESPANHA
  // ═══════════════════════════════════════════════════════════
  c("Xavi Hernández", "ESP", "Espanha", "MC", "mitica", "2010", 62, 72, 96, 90, 72, 65, 92),
  c("Andrés Iniesta", "ESP", "Espanha", "MC", "mitica", "2010", 78, 78, 92, 95, 65, 62, 93),
  c("Iker Casillas", "ESP", "Espanha", "GOL", "lendaria", "2010", 45, 12, 38, 30, 22, 90, 89),
  c("Sergio Ramos", "ESP", "Espanha", "ZAG", "lendaria", "2010", 72, 55, 62, 62, 92, 85, 88),
  c("David Villa", "ESP", "Espanha", "ATA", "lendaria", "2010", 85, 90, 78, 85, 30, 72, 88),
  c("Carles Puyol", "ESP", "Espanha", "ZAG", "lendaria", "2010", 68, 30, 55, 58, 92, 88, 88),
  c("Raúl González", "ESP", "Espanha", "ATA", "lendaria", "2002", 85, 88, 78, 85, 32, 68, 88),
  c("Fernando Torres", "ESP", "Espanha", "ATA", "rara", "2010", 90, 85, 72, 82, 30, 72, 85),
  c("Busquets", "ESP", "Espanha", "VOL", "rara", "2010", 42, 55, 85, 80, 85, 72, 85),
  c("Butragueño", "ESP", "Espanha", "ATA", "rara", "1986", 88, 85, 78, 85, 28, 65, 85),
  c("Pedri", "ESP", "Espanha", "MC", "comum", "2022", 72, 65, 85, 88, 68, 55, 79),
  c("Gavi", "ESP", "Espanha", "MC", "comum", "2022", 78, 65, 78, 82, 72, 68, 78),

  // ═══════════════════════════════════════════════════════════
  // 🏴󠁧󠁢󠁥󠁮󠁧󠁿 INGLATERRA
  // ═══════════════════════════════════════════════════════════
  c("Bobby Charlton", "ENG", "Inglaterra", "MC", "mitica", "1966", 82, 92, 85, 85, 62, 78, 93),
  c("Bobby Moore", "ENG", "Inglaterra", "ZAG", "mitica", "1966", 68, 35, 78, 72, 95, 82, 92),
  c("Gordon Banks", "ENG", "Inglaterra", "GOL", "lendaria", "1966", 42, 10, 35, 28, 20, 92, 90),
  c("Gary Lineker", "ENG", "Inglaterra", "ATA", "lendaria", "1986", 90, 90, 68, 80, 28, 68, 88),
  c("Alan Shearer", "ENG", "Inglaterra", "ATA", "lendaria", "1998", 78, 92, 65, 75, 35, 85, 88),
  c("David Beckham", "ENG", "Inglaterra", "MD", "lendaria", "2002", 72, 78, 92, 82, 62, 72, 87),
  c("Wayne Rooney", "ENG", "Inglaterra", "ATA", "lendaria", "2006", 82, 88, 78, 85, 52, 82, 88),
  c("Geoff Hurst", "ENG", "Inglaterra", "ATA", "lendaria", "1966", 82, 88, 68, 75, 35, 80, 87),
  c("Harry Kane", "ENG", "Inglaterra", "ATA", "rara", "2022", 68, 92, 78, 80, 48, 78, 87),
  c("Steven Gerrard", "ENG", "Inglaterra", "MC", "rara", "2006", 78, 82, 82, 80, 78, 82, 86),
  c("Jude Bellingham", "ENG", "Inglaterra", "MC", "comum", "2022", 78, 78, 82, 82, 68, 75, 80),
  c("Phil Foden", "ENG", "Inglaterra", "MEI", "comum", "2022", 78, 78, 82, 88, 42, 55, 79),
  c("Bukayo Saka", "ENG", "Inglaterra", "PD", "comum", "2022", 85, 78, 78, 85, 52, 62, 79),

  // ═══════════════════════════════════════════════════════════
  // 🇵🇹 PORTUGAL
  // ═══════════════════════════════════════════════════════════
  c("Cristiano Ronaldo", "POR", "Portugal", "ATA", "mitica", "2022", 85, 95, 82, 88, 35, 80, 94),
  c("Eusébio", "POR", "Portugal", "ATA", "mitica", "1966", 92, 95, 78, 90, 32, 78, 95),
  c("Luís Figo", "POR", "Portugal", "PD", "lendaria", "2006", 85, 78, 88, 92, 42, 72, 90),
  c("Rui Costa", "POR", "Portugal", "MEI", "lendaria", "2002", 75, 78, 90, 88, 42, 65, 87),
  c("Deco", "POR", "Portugal", "MC", "rara", "2006", 72, 78, 88, 85, 55, 65, 85),
  c("Pepe", "POR", "Portugal", "ZAG", "rara", "2022", 62, 30, 52, 55, 90, 88, 85),
  c("Bruno Fernandes", "POR", "Portugal", "MEI", "rara", "2022", 72, 82, 85, 82, 62, 72, 85),
  c("Bernardo Silva", "POR", "Portugal", "MEI", "comum", "2022", 75, 72, 85, 90, 55, 62, 79),
  c("Rafael Leão", "POR", "Portugal", "PE", "comum", "2022", 92, 75, 72, 85, 28, 62, 79),

  // ═══════════════════════════════════════════════════════════
  // 🇳🇱 HOLANDA
  // ═══════════════════════════════════════════════════════════
  c("Johan Cruyff", "HOL", "Holanda", "ATA", "mitica", "1974", 90, 85, 90, 96, 48, 68, 96),
  c("Marco van Basten", "HOL", "Holanda", "ATA", "mitica", "1990", 82, 96, 78, 90, 28, 75, 94),
  c("Ruud Gullit", "HOL", "Holanda", "MC", "lendaria", "1990", 82, 82, 82, 85, 72, 85, 91),
  c("Dennis Bergkamp", "HOL", "Holanda", "ATA", "lendaria", "1998", 78, 85, 88, 92, 35, 68, 90),
  c("Robin van Persie", "HOL", "Holanda", "ATA", "lendaria", "2014", 82, 92, 78, 85, 28, 72, 88),
  c("Arjen Robben", "HOL", "Holanda", "PD", "lendaria", "2014", 92, 85, 78, 92, 32, 62, 89),
  c("Frank Rijkaard", "HOL", "Holanda", "VOL", "lendaria", "1990", 72, 65, 78, 75, 88, 85, 88),
  c("Johan Neeskens", "HOL", "Holanda", "MC", "lendaria", "1974", 82, 80, 82, 82, 78, 80, 88),
  c("Wesley Sneijder", "HOL", "Holanda", "MC", "rara", "2010", 72, 82, 88, 82, 55, 68, 86),
  c("Virgil van Dijk", "HOL", "Holanda", "ZAG", "rara", "2022", 72, 42, 65, 62, 92, 88, 87),
  c("Frenkie de Jong", "HOL", "Holanda", "MC", "comum", "2022", 78, 62, 85, 88, 72, 62, 79),
  c("Memphis Depay", "HOL", "Holanda", "ATA", "comum", "2022", 82, 82, 72, 82, 28, 72, 78),

  // ═══════════════════════════════════════════════════════════
  // 🇺🇾 URUGUAI
  // ═══════════════════════════════════════════════════════════
  c("Juan A. Schiaffino", "URU", "Uruguai", "MC", "mitica", "1950", 80, 85, 88, 85, 55, 72, 90),
  c("Luis Suárez", "URU", "Uruguai", "ATA", "lendaria", "2022", 78, 90, 78, 85, 42, 78, 88),
  c("Diego Forlán", "URU", "Uruguai", "ATA", "lendaria", "2010", 82, 90, 78, 82, 30, 72, 88),
  c("Enzo Francescoli", "URU", "Uruguai", "MEI", "lendaria", "1986", 82, 82, 85, 88, 42, 68, 88),
  c("Obdulio Varela", "URU", "Uruguai", "MC", "lendaria", "1950", 72, 62, 80, 78, 85, 88, 88),
  c("Alcides Ghiggia", "URU", "Uruguai", "PD", "rara", "1950", 90, 78, 72, 82, 30, 68, 84),
  c("Edinson Cavani", "URU", "Uruguai", "ATA", "rara", "2018", 82, 88, 62, 78, 42, 80, 85),
  c("Federico Valverde", "URU", "Uruguai", "MC", "rara", "2022", 88, 78, 80, 82, 78, 82, 86),
  c("Darwin Núñez", "URU", "Uruguai", "ATA", "comum", "2022", 88, 82, 55, 72, 28, 78, 78),

  // ═══════════════════════════════════════════════════════════
  // 🇭🇷 CROÁCIA
  // ═══════════════════════════════════════════════════════════
  c("Luka Modrić", "CRO", "Croácia", "MC", "mitica", "2018", 78, 75, 92, 92, 72, 68, 91),
  c("Davor Šuker", "CRO", "Croácia", "ATA", "lendaria", "1998", 85, 92, 75, 85, 28, 68, 88),
  c("Zvonimir Boban", "CRO", "Croácia", "MC", "rara", "1998", 75, 75, 85, 82, 68, 72, 84),
  c("Ivan Rakitić", "CRO", "Croácia", "MC", "rara", "2018", 68, 78, 85, 80, 72, 72, 85),
  c("Joško Gvardiol", "CRO", "Croácia", "ZAG", "comum", "2022", 78, 42, 62, 68, 85, 82, 79),
  c("Kovačić", "CRO", "Croácia", "MC", "comum", "2022", 72, 62, 82, 82, 72, 72, 78),

  // ═══════════════════════════════════════════════════════════
  // 🇨🇴 COLÔMBIA
  // ═══════════════════════════════════════════════════════════
  c("Carlos Valderrama", "COL", "Colômbia", "MC", "lendaria", "1990", 62, 62, 92, 88, 55, 68, 86),
  c("James Rodríguez", "COL", "Colômbia", "MEI", "lendaria", "2014", 72, 85, 88, 85, 42, 62, 87),
  c("René Higuita", "COL", "Colômbia", "GOL", "rara", "1990", 55, 18, 55, 55, 22, 82, 82),
  c("Radamel Falcao", "COL", "Colômbia", "ATA", "rara", "2018", 78, 88, 62, 78, 28, 78, 84),
  c("Luis Díaz", "COL", "Colômbia", "PE", "comum", "2022", 92, 78, 72, 85, 35, 62, 79),

  // ═══════════════════════════════════════════════════════════
  // 🇲🇦 MARROCOS
  // ═══════════════════════════════════════════════════════════
  c("Achraf Hakimi", "MAR", "Marrocos", "LD", "lendaria", "2022", 95, 62, 72, 82, 78, 72, 85),
  c("Hakim Ziyech", "MAR", "Marrocos", "PD", "rara", "2022", 72, 78, 85, 85, 42, 55, 83),
  c("Yassine Bounou", "MAR", "Marrocos", "GOL", "rara", "2022", 42, 12, 35, 28, 22, 85, 84),
  c("Sofyan Amrabat", "MAR", "Marrocos", "VOL", "comum", "2022", 68, 55, 72, 72, 82, 82, 78),

  // ═══════════════════════════════════════════════════════════
  // 🇨🇲 CAMARÕES
  // ═══════════════════════════════════════════════════════════
  c("Roger Milla", "CMR", "Camarões", "ATA", "lendaria", "1990", 82, 85, 68, 82, 28, 75, 86),
  c("Samuel Eto'o", "CMR", "Camarões", "ATA", "lendaria", "2010", 90, 88, 72, 85, 35, 78, 89),
  c("Thomas N'Kono", "CMR", "Camarões", "GOL", "rara", "1990", 42, 10, 32, 28, 20, 85, 83),
  c("Rigobert Song", "CMR", "Camarões", "ZAG", "comum", "1998", 72, 30, 52, 55, 82, 85, 77),

  // ═══════════════════════════════════════════════════════════
  // 🇳🇬 NIGÉRIA
  // ═══════════════════════════════════════════════════════════
  c("Jay-Jay Okocha", "NGA", "Nigéria", "MEI", "lendaria", "1998", 82, 78, 82, 92, 42, 68, 87),
  c("Nwankwo Kanu", "NGA", "Nigéria", "ATA", "rara", "1998", 78, 82, 75, 82, 35, 75, 84),
  c("Rashidi Yekini", "NGA", "Nigéria", "ATA", "rara", "1994", 82, 85, 55, 72, 28, 80, 82),
  c("Victor Moses", "NGA", "Nigéria", "PD", "comum", "2018", 85, 72, 68, 80, 55, 72, 78),

  // ═══════════════════════════════════════════════════════════
  // 🇰🇷 COREIA DO SUL
  // ═══════════════════════════════════════════════════════════
  c("Son Heung-min", "KOR", "Coreia do Sul", "PE", "lendaria", "2022", 92, 88, 78, 88, 35, 68, 88),
  c("Park Ji-Sung", "KOR", "Coreia do Sul", "MC", "rara", "2002", 88, 68, 75, 78, 75, 82, 83),
  c("Cha Bum-kun", "KOR", "Coreia do Sul", "ATA", "lendaria", "1986", 82, 85, 72, 82, 32, 75, 86),
  c("Hong Myung-bo", "KOR", "Coreia do Sul", "ZAG", "comum", "2002", 68, 35, 65, 62, 85, 80, 78),

  // ═══════════════════════════════════════════════════════════
  // 🇯🇵 JAPÃO
  // ═══════════════════════════════════════════════════════════
  c("Hidetoshi Nakata", "JPN", "Japão", "MC", "rara", "2002", 78, 75, 82, 82, 65, 68, 83),
  c("Keisuke Honda", "JPN", "Japão", "MEI", "rara", "2014", 68, 78, 78, 78, 55, 72, 80),
  c("Takefusa Kubo", "JPN", "Japão", "PD", "comum", "2022", 85, 72, 75, 85, 35, 55, 78),
  c("Shunsuke Nakamura", "JPN", "Japão", "MC", "comum", "2006", 62, 75, 85, 82, 42, 55, 78),

  // ═══════════════════════════════════════════════════════════
  // 🇲🇽 MÉXICO
  // ═══════════════════════════════════════════════════════════
  c("Hugo Sánchez", "MEX", "México", "ATA", "lendaria", "1986", 88, 92, 72, 85, 28, 72, 90),
  c("Cuauhtémoc Blanco", "MEX", "México", "MEI", "rara", "2006", 62, 78, 82, 88, 35, 68, 84),
  c("Rafael Márquez", "MEX", "México", "ZAG", "rara", "2006", 62, 45, 72, 68, 85, 80, 84),
  c("Jorge Campos", "MEX", "México", "GOL", "rara", "1994", 55, 15, 35, 40, 22, 85, 82),
  c("Javier Hernández", "MEX", "México", "ATA", "comum", "2014", 88, 82, 55, 72, 28, 65, 78),

  // ═══════════════════════════════════════════════════════════
  // 🇺🇸 ESTADOS UNIDOS
  // ═══════════════════════════════════════════════════════════
  c("Landon Donovan", "USA", "Estados Unidos", "ATA", "rara", "2010", 85, 78, 78, 82, 42, 68, 83),
  c("Tim Howard", "USA", "Estados Unidos", "GOL", "rara", "2014", 42, 12, 35, 28, 22, 88, 85),
  c("Christian Pulisic", "USA", "Estados Unidos", "PE", "rara", "2022", 88, 75, 78, 85, 38, 62, 83),
  c("Clint Dempsey", "USA", "Estados Unidos", "ATA", "comum", "2014", 78, 80, 72, 78, 42, 72, 78),

  // ═══════════════════════════════════════════════════════════
  // 🇨🇱 CHILE
  // ═══════════════════════════════════════════════════════════
  c("Elías Figueroa", "CHI", "Chile", "ZAG", "lendaria", "1974", 72, 35, 68, 68, 92, 85, 88),
  c("Alexis Sánchez", "CHI", "Chile", "ATA", "rara", "2014", 88, 82, 75, 88, 42, 68, 85),
  c("Arturo Vidal", "CHI", "Chile", "MC", "rara", "2014", 78, 78, 75, 78, 80, 85, 85),
  c("Iván Zamorano", "CHI", "Chile", "ATA", "rara", "1998", 78, 88, 62, 72, 35, 82, 84),
  c("Marcelo Salas", "CHI", "Chile", "ATA", "comum", "1998", 85, 85, 68, 78, 28, 72, 79),
];

// ============================================================
// HELPERS
// ============================================================
export function getCardsByTeam(teamId: string): CardData[] {
  return ALL_CARDS.filter(c => c.teamId === teamId);
}

export function getCardsByRarity(rarity: Rarity): CardData[] {
  return ALL_CARDS.filter(c => c.rarity === rarity);
}

export function getCardsByWorldCup(year: string): CardData[] {
  return ALL_CARDS.filter(c => c.worldCup === year);
}

export function getTeamById(teamId: string): TeamData | undefined {
  return TEAMS.find(t => t.id === teamId);
}

// Estatísticas do catálogo
export const CATALOG_STATS = {
  total: ALL_CARDS.length,
  comum: ALL_CARDS.filter(c => c.rarity === "comum").length,
  rara: ALL_CARDS.filter(c => c.rarity === "rara").length,
  lendaria: ALL_CARDS.filter(c => c.rarity === "lendaria").length,
  mitica: ALL_CARDS.filter(c => c.rarity === "mitica").length,
  teams: TEAMS.length,
};
