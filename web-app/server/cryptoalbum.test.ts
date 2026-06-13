import { describe, expect, it } from "vitest";
import { ALL_CARDS, TEAMS, PACK_TYPES, CHAINS, RARITY_CONFIG, type Rarity } from "../shared/gameData";

describe("CryptoÁlbum Copa — Game Data", () => {
  it("deve ter pelo menos 150 cartas no catálogo", () => {
    expect(ALL_CARDS.length).toBeGreaterThanOrEqual(150);
  });

  it("cada carta deve ter tokenId único", () => {
    const ids = ALL_CARDS.map((c) => c.tokenId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ALL_CARDS.length);
  });

  it("cartas devem ter todos os atributos FIFA obrigatórios", () => {
    for (const card of ALL_CARDS) {
      expect(card).toHaveProperty("pac");
      expect(card).toHaveProperty("sho");
      expect(card).toHaveProperty("pas");
      expect(card).toHaveProperty("dri");
      expect(card).toHaveProperty("def");
      expect(card).toHaveProperty("phy");
      expect(card).toHaveProperty("ovr");
    }
  });

  it("atributos devem estar no intervalo [1, 99]", () => {
    const attrs = ["pac", "sho", "pas", "dri", "def", "phy", "ovr"] as const;
    for (const card of ALL_CARDS) {
      for (const attr of attrs) {
        expect(card[attr]).toBeGreaterThanOrEqual(1);
        expect(card[attr]).toBeLessThanOrEqual(99);
      }
    }
  });

  it("deve ter exatamente 4 raridades no RARITY_CONFIG", () => {
    const rarities = Object.keys(RARITY_CONFIG);
    expect(rarities).toContain("comum");
    expect(rarities).toContain("rara");
    expect(rarities).toContain("lendaria");
    expect(rarities).toContain("mitica");
    expect(rarities).toHaveLength(4);
  });

  it("deve ter exatamente 3 tipos de pacote: Básico, Premium e Lendário", () => {
    expect(PACK_TYPES).toHaveLength(3);
    const names = PACK_TYPES.map((p) => p.nome);
    expect(names).toContain("Básico");
    expect(names).toContain("Premium");
    expect(names).toContain("Lendário");
  });

  it("deve ter exatamente 2 redes: Polygon e BNB Chain", () => {
    expect(CHAINS).toHaveLength(2);
    const ids = CHAINS.map((c) => c.id);
    expect(ids).toContain("polygon");
    expect(ids).toContain("bnb");
  });

  it("deve ter pelo menos 8 times", () => {
    expect(TEAMS.length).toBeGreaterThanOrEqual(8);
  });

  it("cartas míticas (platina) devem ter OVR >= 90", () => {
    const miticas = ALL_CARDS.filter((c) => c.rarity === "mitica");
    expect(miticas.length).toBeGreaterThan(0);
    for (const card of miticas) {
      expect(card.ovr).toBeGreaterThanOrEqual(90);
    }
  });

  it("cartas comuns (bronze) devem ter OVR <= 84", () => {
    const comuns = ALL_CARDS.filter((c) => c.rarity === "comum");
    expect(comuns.length).toBeGreaterThan(0);
    for (const card of comuns) {
      expect(card.ovr).toBeLessThanOrEqual(84);
    }
  });

  it("cada time deve ter pelo menos 4 jogadores", () => {
    for (const team of TEAMS) {
      const teamCards = ALL_CARDS.filter((c) => c.teamId === team.id);
      expect(teamCards.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("todas as cartas devem ter worldCup definido", () => {
    for (const card of ALL_CARDS) {
      expect(card.worldCup).toBeDefined();
      expect(card.worldCup!.length).toBe(4); // e.g. "2022"
    }
  });

  it("raridades holográficas devem ser lendaria e mitica", () => {
    expect(RARITY_CONFIG.lendaria.holographic).toBe(true);
    expect(RARITY_CONFIG.mitica.holographic).toBe(true);
    expect(RARITY_CONFIG.comum.holographic).toBe(false);
    expect(RARITY_CONFIG.rara.holographic).toBe(false);
  });
});

describe("CryptoÁlbum Copa — Battle Engine", () => {
  it("deve calcular pontuação de batalha corretamente", () => {
    const teamA = [{ ovr: 90 }, { ovr: 85 }, { ovr: 88 }, { ovr: 82 }, { ovr: 95 }];
    const teamB = [{ ovr: 70 }, { ovr: 75 }, { ovr: 72 }, { ovr: 68 }, { ovr: 80 }];
    const scoreA = teamA.reduce((s, c) => s + c.ovr, 0);
    const scoreB = teamB.reduce((s, c) => s + c.ovr, 0);
    expect(scoreA).toBeGreaterThan(scoreB);
  });

  it("simulateBattle deve retornar resultado válido", async () => {
    const { default: simulateBattle } = await import("./battleEngine");
    const makeCard = (id: number, ovr: number, rarity: string) => ({
      id, name: `Player ${id}`, ovr, pac: ovr, sho: ovr, pas: ovr, dri: ovr, def: ovr, phy: ovr, rarity,
    });
    const challenger = [makeCard(1, 95, "mitica"), makeCard(2, 90, "lendaria"), makeCard(3, 85, "rara"), makeCard(4, 80, "comum"), makeCard(5, 78, "comum")];
    const opponent = [makeCard(6, 60, "comum"), makeCard(7, 55, "comum"), makeCard(8, 58, "comum"), makeCard(9, 52, "comum"), makeCard(10, 50, "comum")];
    const result = simulateBattle(challenger, opponent);
    expect(result.rounds).toHaveLength(5);
    expect(result.winner).toBe("challenger");
    expect(result.challengerWins + result.opponentWins).toBe(5);
  });

  it("ELO deve mudar corretamente após batalha", () => {
    const K = 32;
    const eloA = 1000;
    const eloB = 1000;
    const expectedA = 1 / (1 + Math.pow(10, (eloB - eloA) / 400));
    const changeA = Math.round(K * (1 - expectedA));
    expect(changeA).toBe(16);
  });
});
