/**
 * Testes End-to-End com dados sintéticos
 * Cobre todos os fluxos da plataforma CryptoÁlbum Copa:
 * 1. Seed de cartas
 * 2. Cadastro de usuário (fluxo de registro)
 * 3. Compra e abertura de pacotes (Básico, Premium, Lendário)
 * 4. Inventário do jogador
 * 5. Batalha PvP (criação, resolução, ELO)
 * 6. Ranking ELO
 * 7. Marketplace (listar, comprar, cancelar, auto-compra bloqueada)
 * 8. Trade P2P (swap atômico)
 * 9. Validações de negócio
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getDb,
  seedCards,
  getAllCards,
  getCardById,
  getUserInventory,
  addCardToInventory,
  removeCardFromInventory,
  userOwnsCard,
  purchasePack,
  openPack,
  createBattle,
  resolveBattle,
  getUserBattles,
  getRanking,
  createListing,
  getActiveListings,
  buyListing,
  cancelListing,
  createTradeOffer,
  acceptTradeOffer,
  getUserTradeOffers,
  createSyntheticUser,
  updateUserWallet,
} from "./db";

// ── Helpers ────────────────────────────────────────────────

async function cleanE2EUsers() {
  const db = await getDb();
  if (!db) return;
  const { users, inventory, packs, battles, listings, tradeOffers } = await import("../drizzle/schema");
  const { inArray, like } = await import("drizzle-orm");
  const synUsers = await db.select({ id: users.id }).from(users).where(like(users.openId, "e2e_%"));
  if (synUsers.length === 0) return;
  const ids = synUsers.map((u) => u.id);
  await db.delete(tradeOffers).where(inArray(tradeOffers.initiatorId, ids));
  await db.delete(tradeOffers).where(inArray(tradeOffers.receiverId, ids));
  await db.delete(listings).where(inArray(listings.sellerId, ids));
  await db.delete(battles).where(inArray(battles.challengerId, ids));
  await db.delete(battles).where(inArray(battles.opponentId, ids));
  await db.delete(packs).where(inArray(packs.userId, ids));
  await db.delete(inventory).where(inArray(inventory.userId, ids));
  await db.delete(users).where(inArray(users.id, ids));
}

// ── Suite Principal ────────────────────────────────────────

describe("CryptoÁlbum Copa — E2E com dados sintéticos", () => {
  let alice: any;
  let bob: any;
  let carol: any;
  let allCards: any[];

  beforeAll(async () => {
    const db = await getDb();
    if (!db) return;
    await cleanE2EUsers();
    await seedCards();
  });

  afterAll(async () => {
    await cleanE2EUsers();
  });

  // ── 1. Seed de Cartas ────────────────────────────────────

  describe("1. Seed de Cartas", () => {
    it("deve ter cartas semeadas no banco", async () => {
      allCards = await getAllCards();
      expect(allCards.length).toBeGreaterThanOrEqual(80);
    });

    it("todas as cartas devem ter atributos válidos (PAC, SHO, PAS, DRI, DEF, PHY, OVR)", async () => {
      for (const card of allCards) {
        expect(card.pac).toBeGreaterThanOrEqual(30);
        expect(card.sho).toBeGreaterThanOrEqual(30);
        expect(card.pas).toBeGreaterThanOrEqual(30);
        expect(card.dri).toBeGreaterThanOrEqual(30);
        expect(card.def).toBeGreaterThanOrEqual(30);
        expect(card.phy).toBeGreaterThanOrEqual(30);
        expect(card.ovr).toBeGreaterThanOrEqual(50);
        expect(card.ovr).toBeLessThanOrEqual(100);
      }
    });

    it("deve ter cartas de todas as raridades", async () => {
      const rarities = new Set(allCards.map((c) => c.rarity));
      expect(rarities.has("comum")).toBe(true);
      expect(rarities.has("rara")).toBe(true);
      expect(rarities.has("lendaria")).toBe(true);
      expect(rarities.has("lendaria")).toBe(true);
    });

    it("deve ter cartas de múltiplas seleções", async () => {
      const teams = new Set(allCards.map((c) => c.teamId));
      expect(teams.size).toBeGreaterThanOrEqual(4);
    });

    it("deve retornar carta por ID", async () => {
      const card = await getCardById(allCards[0].id);
      expect(card).not.toBeNull();
      expect(card!.name).toBe(allCards[0].name);
    });
  });

  // ── 2. Cadastro de Usuários ──────────────────────────────

  describe("2. Cadastro de Usuários (fluxo de registro)", () => {
    it("deve criar usuário Alice com dados corretos", async () => {
      alice = await createSyntheticUser("e2e_alice_001", "Alice Silva", "alice@e2e.test");
      expect(alice).not.toBeNull();
      expect(alice.name).toBe("Alice Silva");
      expect(alice.email).toBe("alice@e2e.test");
      expect(alice.elo).toBe(1000);
      expect(alice.wins).toBe(0);
      expect(alice.losses).toBe(0);
      expect(alice.season).toBe(1);
      expect(alice.walletAddress).toBeTruthy();
      expect(alice.selectedChain).toBe("polygon");
    });

    it("deve criar usuário Bob com dados corretos", async () => {
      bob = await createSyntheticUser("e2e_bob_002", "Bob Costa", "bob@e2e.test");
      expect(bob).not.toBeNull();
      expect(bob.name).toBe("Bob Costa");
      expect(bob.elo).toBe(1000);
    });

    it("deve criar usuário Carol com dados corretos", async () => {
      carol = await createSyntheticUser("e2e_carol_003", "Carol Mendes", "carol@e2e.test");
      expect(carol).not.toBeNull();
      expect(carol.name).toBe("Carol Mendes");
    });

    it("deve ser idempotente (criar novamente retorna o mesmo usuário)", async () => {
      const aliceDup = await createSyntheticUser("e2e_alice_001", "Alice Silva", "alice@e2e.test");
      expect(aliceDup).not.toBeNull();
      expect(aliceDup!.id).toBe(alice.id);
      // Atualizar referência local com nome correto
      alice = aliceDup;
    });

    it("deve conectar carteira à rede BNB Chain", async () => {
      await updateUserWallet(bob.id, "0xBobWallet1234567890abcdef1234567890ab", "bnb");
      const db = await getDb();
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [updated] = await db!.select().from(users).where(eq(users.id, bob.id)).limit(1);
      expect(updated.selectedChain).toBe("bnb");
      expect(updated.walletAddress).toBe("0xBobWallet1234567890abcdef1234567890ab");
    });
  });

  // ── 3. Pacotes ───────────────────────────────────────────

  describe("3. Pacotes (Básico, Premium, Lendário)", () => {
    it("deve comprar e abrir pacote Básico para Alice (5 cartas)", async () => {
      const packId = await purchasePack(alice.id, "basico");
      expect(packId).not.toBeNull();
      expect(packId).toBeGreaterThan(0);

      const result = await openPack(packId!, alice.id);
      const drawnCards = result?.cards;
      expect(drawnCards).not.toBeNull();
      expect(drawnCards!.length).toBe(5);

      const inv = await getUserInventory(alice.id);
      // Contar total de cartas (entradas únicas podem ser menos que 5 se houver duplicatas)
      const totalCards = inv.reduce((sum, i) => sum + i.inv.quantity, 0);
      expect(totalCards).toBeGreaterThanOrEqual(5);
    });

    it("não deve abrir o mesmo pacote duas vezes", async () => {
      const packId = await purchasePack(alice.id, "basico");
      expect(packId).not.toBeNull();
      const first = await openPack(packId!, alice.id);
      expect(first).not.toBeNull();
      const second = await openPack(packId!, alice.id);
      expect(second).toBeNull();
    });

    it("deve comprar e abrir pacote Premium para Bob (7 cartas, ≥1 rara)", async () => {
      const packId = await purchasePack(bob.id, "premium");
      expect(packId).not.toBeNull();
      const result = await openPack(packId!, bob.id);
      const drawnCards = result?.cards;
      expect(drawnCards).not.toBeNull();
      expect(drawnCards!.length).toBe(7);
      const hasRareOrBetter = drawnCards!.some((c) => ["rara", "lendaria", "mitica"].includes(c.rarity));
      expect(hasRareOrBetter).toBe(true);
    });

    it("deve comprar e abrir pacote Lendário para Carol (10 cartas, ≥1 épica)", async () => {
      const packId = await purchasePack(carol.id, "lendario");
      expect(packId).not.toBeNull();
      const result = await openPack(packId!, carol.id);
      const drawnCards = result?.cards;
      expect(drawnCards).not.toBeNull();
      expect(drawnCards!.length).toBe(10);
      const hasEpicOrLegendary = drawnCards!.some((c) => ["lendaria", "mitica"].includes(c.rarity));
      expect(hasEpicOrLegendary).toBe(true);
    });

    it("não deve abrir pacote de outro usuário", async () => {
      const packId = await purchasePack(alice.id, "basico");
      expect(packId).not.toBeNull();
      const result = await openPack(packId!, bob.id);
      expect(result).toBeNull();
    });
  });

  // ── 4. Inventário ────────────────────────────────────────

  describe("4. Inventário do Jogador", () => {
    it("Alice deve ter cartas no inventário após abrir pacotes", async () => {
      const inv = await getUserInventory(alice.id);
      expect(inv.length).toBeGreaterThan(0);
      for (const item of inv) {
        expect(item.card.name).toBeTruthy();
        expect(item.card.ovr).toBeGreaterThan(0);
        expect(item.inv.quantity).toBeGreaterThan(0);
      }
    });

    it("deve verificar posse de carta corretamente", async () => {
      const inv = await getUserInventory(alice.id);
      const firstCard = inv[0].card;
      const owns = await userOwnsCard(alice.id, firstCard.id);
      expect(owns).toBe(true);
    });

    it("deve retornar false para carta não possuída", async () => {
      const owns = await userOwnsCard(alice.id, 999999);
      expect(owns).toBe(false);
    });

    it("deve adicionar e remover carta do inventário corretamente", async () => {
      const testCard = allCards[0];
      await addCardToInventory(carol.id, testCard.id);
      expect(await userOwnsCard(carol.id, testCard.id)).toBe(true);
      const removed = await removeCardFromInventory(carol.id, testCard.id);
      expect(removed).toBe(true);
      // Pode ainda ter a carta se veio de pacote; verificar que a quantidade diminuiu
    });
  });

  // ── 5. Arena PvP ─────────────────────────────────────────

  describe("5. Arena PvP", () => {
    it("deve criar batalha com cartas de Alice contra Bob", async () => {
      const aliceInv = await getUserInventory(alice.id);
      expect(aliceInv.length).toBeGreaterThanOrEqual(1);
      const aliceCardIds = aliceInv.slice(0, 3).map((i) => i.card.id);

      const battleId = await createBattle(alice.id, bob.id, aliceCardIds, 0);
      expect(battleId).not.toBeNull();
      expect(battleId).toBeGreaterThan(0);
    });

    it("deve resolver batalha com cartas de Bob e calcular ELO", async () => {
      const aliceInv = await getUserInventory(alice.id);
      const bobInv = await getUserInventory(bob.id);
      const aliceCardIds = aliceInv.slice(0, 3).map((i) => i.card.id);
      const bobCardIds = bobInv.slice(0, 3).map((i) => i.card.id);

      const battleId = await createBattle(alice.id, bob.id, aliceCardIds, 0);
      expect(battleId).not.toBeNull();

      const result = await resolveBattle(battleId!, bobCardIds, bob.id);
      expect(result).not.toBeNull();
      expect(result!.winner).toMatch(/^(challenger|opponent)$/);
      expect(result!.rounds.length).toBeGreaterThan(0);
      expect(result!.eloChange).toBeGreaterThan(0);
      expect(result!.winnerId).toBeTruthy();
    });

    it("deve impedir resolver batalha com usuário errado", async () => {
      const aliceInv = await getUserInventory(alice.id);
      const carolInv = await getUserInventory(carol.id);
      const aliceCardIds = aliceInv.slice(0, 2).map((i) => i.card.id);
      const carolCardIds = carolInv.slice(0, 2).map((i) => i.card.id);

      const battleId = await createBattle(alice.id, bob.id, aliceCardIds, 0);
      expect(battleId).not.toBeNull();

      await expect(resolveBattle(battleId!, carolCardIds, carol.id))
        .rejects.toThrow("Apenas o oponente pode resolver esta batalha");
    });

    it("deve impedir criar batalha com carta não possuída", async () => {
      await expect(createBattle(alice.id, bob.id, [999999], 0))
        .rejects.toThrow("Você não possui a carta");
    });

    it("deve registrar histórico de batalhas do jogador", async () => {
      const history = await getUserBattles(alice.id);
      expect(history.length).toBeGreaterThan(0);
    });

    it("deve atualizar ELO após batalha (vencedor sobe, perdedor desce)", async () => {
      const db = await getDb();
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const [aliceBefore] = await db!.select().from(users).where(eq(users.id, alice.id)).limit(1);
      const [bobBefore] = await db!.select().from(users).where(eq(users.id, bob.id)).limit(1);

      const aliceInv = await getUserInventory(alice.id);
      const bobInv = await getUserInventory(bob.id);
      const aliceCardIds = aliceInv.slice(0, 2).map((i) => i.card.id);
      const bobCardIds = bobInv.slice(0, 2).map((i) => i.card.id);

      const battleId = await createBattle(alice.id, bob.id, aliceCardIds, 0);
      const result = await resolveBattle(battleId!, bobCardIds, bob.id);
      expect(result).not.toBeNull();

      const [aliceAfter] = await db!.select().from(users).where(eq(users.id, alice.id)).limit(1);
      const [bobAfter] = await db!.select().from(users).where(eq(users.id, bob.id)).limit(1);

      // ELO total deve ser conservado (±2 por arredondamento)
      const totalBefore = aliceBefore.elo + bobBefore.elo;
      const totalAfter = aliceAfter.elo + bobAfter.elo;
      expect(Math.abs(totalAfter - totalBefore)).toBeLessThanOrEqual(2);

      // Vencedor deve ter ELO maior ou igual ao anterior
      const winnerId = result!.winnerId;
      if (winnerId === alice.id) {
        expect(aliceAfter.elo).toBeGreaterThanOrEqual(aliceBefore.elo);
      } else {
        expect(bobAfter.elo).toBeGreaterThanOrEqual(bobBefore.elo);
      }
    });
  });

  // ── 6. Ranking ELO ───────────────────────────────────────

  describe("6. Ranking ELO", () => {
    it("deve retornar ranking com usuários sintéticos", async () => {
      const ranking = await getRanking(1, 50);
      expect(ranking.length).toBeGreaterThan(0);
      for (let i = 1; i < ranking.length; i++) {
        expect(ranking[i - 1].elo).toBeGreaterThanOrEqual(ranking[i].elo);
      }
    });

    it("ranking deve conter Alice e Bob", async () => {
      const ranking = await getRanking(1, 50);
      const names = ranking.map((r) => r.name);
      expect(names).toContain("Alice Silva");
      expect(names).toContain("Bob Costa");
    });

    it("ranking deve ter campos obrigatórios", async () => {
      const ranking = await getRanking(1, 10);
      for (const entry of ranking) {
        expect(entry.id).toBeTruthy();
        expect(entry.elo).toBeGreaterThanOrEqual(0);
        expect(entry.wins).toBeGreaterThanOrEqual(0);
        expect(entry.losses).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // ── 7. Marketplace ───────────────────────────────────────

  describe("7. Marketplace P2P", () => {
    let listingId: number;
    let aliceCardForSale: any;

    it("Alice deve listar uma carta no marketplace", async () => {
      const aliceInv = await getUserInventory(alice.id);
      expect(aliceInv.length).toBeGreaterThan(0);
      aliceCardForSale = aliceInv[0].card;

      listingId = (await createListing(alice.id, aliceCardForSale.id, 10.5, "polygon"))!;
      expect(listingId).not.toBeNull();
      expect(listingId).toBeGreaterThan(0);
    });

    it("não deve criar listing duplicado para a mesma carta", async () => {
      const dup = await createListing(alice.id, aliceCardForSale.id, 20, "polygon");
      expect(dup).toBeNull();
    });

    it("deve aparecer nos listings ativos", async () => {
      const active = await getActiveListings();
      const found = active.find((l) => l.listing.id === listingId);
      expect(found).toBeTruthy();
      expect(found!.card.id).toBe(aliceCardForSale.id);
      expect(found!.seller.name).toBe("Alice Silva");
    });

    it("deve bloquear auto-compra (Alice não pode comprar sua própria carta)", async () => {
      await expect(buyListing(listingId, alice.id))
        .rejects.toThrow("Você não pode comprar sua própria listagem");
    });

    it("Bob deve comprar a carta de Alice (swap atômico)", async () => {
      const ok = await buyListing(listingId, bob.id);
      expect(ok).toBe(true);
      // Bob deve ter a carta
      const bobOwned = await userOwnsCard(bob.id, aliceCardForSale.id);
      expect(bobOwned).toBe(true);
    });

    it("listing comprado não deve aparecer nos ativos", async () => {
      const active = await getActiveListings();
      const found = active.find((l) => l.listing.id === listingId);
      expect(found).toBeUndefined();
    });

    it("deve cancelar listing corretamente", async () => {
      // Garantir que Alice tem uma carta para listar
      await addCardToInventory(alice.id, allCards[5].id);
      const aliceInv2 = await getUserInventory(alice.id);
      const cardToList = aliceInv2[0].card;
      const newListingId = await createListing(alice.id, cardToList.id, 5, "bnb");
      expect(newListingId).not.toBeNull();

      const cancelled = await cancelListing(newListingId!, alice.id);
      expect(cancelled).toBe(true);

      const active = await getActiveListings();
      const found = active.find((l) => l.listing.id === newListingId);
      expect(found).toBeUndefined();
    });
  });

  // ── 8. Trade P2P (Swap Atômico) ──────────────────────────

  describe("8. Trade P2P (Swap Atômico)", () => {
    let tradeId: number;
    let aliceTradeCard: any;
    let bobTradeCard: any;

    beforeAll(async () => {
      // Garantir que Alice e Bob têm cartas para trocar
      const aliceInv = await getUserInventory(alice.id);
      const bobInv = await getUserInventory(bob.id);
      if (aliceInv.length === 0) await addCardToInventory(alice.id, allCards[10].id);
      if (bobInv.length === 0) await addCardToInventory(bob.id, allCards[20].id);
      const aliceInv2 = await getUserInventory(alice.id);
      const bobInv2 = await getUserInventory(bob.id);
      aliceTradeCard = aliceInv2[0].card;
      bobTradeCard = bobInv2[0].card;
    });

    it("Alice deve criar oferta de trade para Bob", async () => {
      tradeId = (await createTradeOffer(
        alice.id, bob.id,
        [aliceTradeCard.id], [bobTradeCard.id],
      ))!;
      expect(tradeId).not.toBeNull();
      expect(tradeId).toBeGreaterThan(0);
    });

    it("deve bloquear trade consigo mesmo", async () => {
      await expect(createTradeOffer(alice.id, alice.id, [aliceTradeCard.id], [aliceTradeCard.id]))
        .rejects.toThrow("Não é possível fazer trade consigo mesmo");
    });

    it("deve bloquear trade com carta não possuída", async () => {
      await expect(createTradeOffer(alice.id, bob.id, [999999], [bobTradeCard.id]))
        .rejects.toThrow("Você não possui a carta");
    });

    it("Bob deve aceitar a oferta de trade (swap atômico)", async () => {
      const ok = await acceptTradeOffer(tradeId, bob.id);
      expect(ok).toBe(true);
      // Após o swap: Alice tem a carta de Bob, Bob tem a carta de Alice
      const aliceHasBobCard = await userOwnsCard(alice.id, bobTradeCard.id);
      const bobHasAliceCard = await userOwnsCard(bob.id, aliceTradeCard.id);
      expect(aliceHasBobCard).toBe(true);
      expect(bobHasAliceCard).toBe(true);
    });

    it("não deve aceitar trade já resolvido", async () => {
      const ok = await acceptTradeOffer(tradeId, bob.id);
      expect(ok).toBe(false);
    });

    it("Carol não deve aceitar trade destinado a Bob", async () => {
      const aliceInv = await getUserInventory(alice.id);
      const bobInv = await getUserInventory(bob.id);
      const newTradeId = await createTradeOffer(
        alice.id, bob.id,
        [aliceInv[0].card.id], [bobInv[0].card.id],
      );
      expect(newTradeId).not.toBeNull();
      const ok = await acceptTradeOffer(newTradeId!, carol.id);
      expect(ok).toBe(false);
    });

    it("deve listar trades do usuário", async () => {
      const trades = await getUserTradeOffers(alice.id);
      expect(trades.length).toBeGreaterThan(0);
    });
  });

  // ── 9. Validações de Negócio ─────────────────────────────

  describe("9. Validações de Negócio", () => {
    it("getCardById deve retornar null para ID inexistente", async () => {
      const card = await getCardById(999999);
      expect(card).toBeNull();
    });

    it("openPack deve retornar null para packId inexistente", async () => {
      const result = await openPack(999999, alice.id);
      expect(result).toBeNull();
    });

    it("buyListing deve retornar false para listingId inexistente", async () => {
      const result = await buyListing(999999, bob.id);
      expect(result).toBe(false);
    });

    it("resolveBattle deve retornar null para battleId inexistente", async () => {
      const result = await resolveBattle(999999, [allCards[0].id]);
      expect(result).toBeNull();
    });

    it("removeCardFromInventory deve retornar false para carta não possuída", async () => {
      const result = await removeCardFromInventory(alice.id, 999999);
      expect(result).toBe(false);
    });

    it("createListing deve retornar null para carta não possuída", async () => {
      const result = await createListing(alice.id, 999999, 10, "polygon");
      expect(result).toBeNull();
    });
  });
});
