import { eq, and, desc, sql, inArray, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, cards, inventory, packs, battles, listings, tradeOffers } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { ALL_CARDS } from "../shared/gameData";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users ──────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((f) => {
    const v = user[f];
    if (v === undefined) return;
    const n = v ?? null;
    values[f] = n;
    updateSet[f] = n;
  });

  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result[0];
}

export async function updateUserWallet(userId: number, walletAddress: string, chain: "polygon" | "bnb") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ walletAddress, selectedChain: chain }).where(eq(users.id, userId));
}

// ── Cards ──────────────────────────────────────────────────

export async function seedCards() {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select({ id: cards.id }).from(cards).limit(1);
  if (existing.length > 0) return; // já semeado

  // Inserir em lotes de 10 para evitar timeout
  const batchSize = 10;
  for (let i = 0; i < ALL_CARDS.length; i += batchSize) {
    const batch = ALL_CARDS.slice(i, i + batchSize);
    await db.insert(cards).values(batch.map((c) => ({
      tokenId: c.tokenId,
      name: c.name,
      teamId: c.teamId,
      teamName: c.teamName,
      position: c.position,
      rarity: c.rarity,
      pac: c.pac,
      sho: c.sho,
      pas: c.pas,
      dri: c.dri,
      def: c.def,
      phy: c.phy,
      ovr: c.ovr,
    })));
  }
  console.log(`[Seed] ${ALL_CARDS.length} cartas semeadas com sucesso.`);
}

export async function getAllCards() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cards).orderBy(cards.teamId, cards.tokenId);
}

export async function getCardById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const r = await db.select().from(cards).where(eq(cards.id, id)).limit(1);
  return r[0] ?? null;
}

export async function getCardsByTeam(teamId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cards).where(eq(cards.teamId, teamId));
}

// ── Inventory ──────────────────────────────────────────────

export async function getUserInventory(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ inv: inventory, card: cards })
    .from(inventory)
    .innerJoin(cards, eq(inventory.cardId, cards.id))
    .where(eq(inventory.userId, userId))
    .orderBy(desc(cards.ovr));
}

export async function addCardToInventory(userId: number, cardId: number) {
  const db = await getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.userId, userId), eq(inventory.cardId, cardId)))
    .limit(1);
  if (existing.length > 0) {
    await db
      .update(inventory)
      .set({ quantity: sql`${inventory.quantity} + 1` })
      .where(and(eq(inventory.userId, userId), eq(inventory.cardId, cardId)));
  } else {
    await db.insert(inventory).values({ userId, cardId, quantity: 1 });
  }
}

export async function removeCardFromInventory(userId: number, cardId: number) {
  const db = await getDb();
  if (!db) return false;
  const existing = await db
    .select()
    .from(inventory)
    .where(and(eq(inventory.userId, userId), eq(inventory.cardId, cardId)))
    .limit(1);
  if (!existing[0] || existing[0].quantity <= 0) return false;
  if (existing[0].quantity === 1) {
    await db.delete(inventory).where(and(eq(inventory.userId, userId), eq(inventory.cardId, cardId)));
  } else {
    await db.update(inventory).set({ quantity: sql`${inventory.quantity} - 1` }).where(and(eq(inventory.userId, userId), eq(inventory.cardId, cardId)));
  }
  return true;
}

export async function userOwnsCard(userId: number, cardId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const r = await db.select({ qty: inventory.quantity }).from(inventory)
    .where(and(eq(inventory.userId, userId), eq(inventory.cardId, cardId)))
    .limit(1);
  return (r[0]?.qty ?? 0) > 0;
}

// ── Packs ──────────────────────────────────────────────────

export async function purchasePack(userId: number, type: "basico" | "premium" | "lendario") {
  const db = await getDb();
  if (!db) return null;
  const r = await db.insert(packs).values({ userId, type }) as any;
  return (r[0]?.insertId ?? null) as number | null;
}

export async function openPack(packId: number, userId: number, walletAddress?: string) {
  const db = await getDb();
  if (!db) return null;
  const packRows = await db.select().from(packs).where(and(eq(packs.id, packId), eq(packs.userId, userId))).limit(1);
  const pack = packRows[0];
  if (!pack || pack.opened) return null;

  // Sortear cartas com VRF (aleatoriedade verificável)
  const allCards = await getAllCards();
  if (allCards.length === 0) return null;
  
  const { openPackWithVRF, getAuditData } = await import("./vrfRandomness");
  const userAddr = walletAddress || `0x${userId.toString(16).padStart(40, "0")}`;
  const cardsInPack = pack.type === "lendario" ? 10 : pack.type === "premium" ? 7 : 5;
  
  // Gerar aleatoriedade verificável via commit-reveal + VRF
  const vrfResult = openPackWithVRF(userAddr, allCards.length, cardsInPack);
  const auditData = getAuditData(vrfResult);
  
  // Usar os números VRF para selecionar cartas com raridade ponderada
  const drawnCards = drawCardsWithVRF(allCards, pack.type, vrfResult.randomNumbers);

  // Adicionar ao inventário
  for (const card of drawnCards) {
    await addCardToInventory(userId, card.id);
  }

  await db.update(packs).set({
    opened: true,
    openedAt: new Date(),
    cardsReceived: drawnCards.map((c) => c.id) as any,
  }).where(eq(packs.id, packId));

  return {
    cards: drawnCards,
    vrf: {
      commitHash: auditData.commitHash,
      blockHash: auditData.blockHash,
      randomValue: auditData.randomValue,
      proof: auditData.proof,
      isValid: auditData.isValid,
      verificationSteps: auditData.verificationSteps,
    },
  };
}

/**
 * Sorteia cartas usando números VRF (aleatoriedade verificável).
 * Cada número VRF determina a raridade e o índice da carta.
 */
function drawCardsWithVRF(allCards: any[], type: string, vrfNumbers: number[]) {
  const byRarity = {
    comum: allCards.filter((c) => c.rarity === "comum"),
    rara: allCards.filter((c) => c.rarity === "rara"),
    lendaria: allCards.filter((c) => c.rarity === "lendaria"),
    mitica: allCards.filter((c) => c.rarity === "mitica"),
  };

  if (byRarity.rara.length === 0) byRarity.rara = byRarity.comum;
  if (byRarity.lendaria.length === 0) byRarity.lendaria = byRarity.rara;
  if (byRarity.mitica.length === 0) byRarity.mitica = byRarity.lendaria;

  const drawn: any[] = [];
  const weights = type === "basico" 
    ? [0.8, 0.18, 0.02, 0] 
    : type === "premium" 
      ? [0.6, 0.3, 0.09, 0.01] 
      : [0.4, 0.35, 0.2, 0.05];

  for (let i = 0; i < vrfNumbers.length; i++) {
    const vrfNum = vrfNumbers[i];
    
    // Garantias: Premium = 1ª carta Prata; Lendário = 1ª carta Ouro
    if (i === 0 && type === "premium") {
      drawn.push(byRarity.rara[vrfNum % byRarity.rara.length]);
      continue;
    }
    if (i === 0 && type === "lendario") {
      drawn.push(byRarity.lendaria[vrfNum % byRarity.lendaria.length]);
      continue;
    }

    // Usar VRF para determinar raridade (determinístico a partir do número)
    const rarityRoll = (vrfNum % 10000) / 10000; // 0.0000 - 0.9999
    let pool: any[];
    if (rarityRoll < weights[0]) pool = byRarity.comum;
    else if (rarityRoll < weights[0] + weights[1]) pool = byRarity.rara;
    else if (rarityRoll < weights[0] + weights[1] + weights[2]) pool = byRarity.lendaria;
    else pool = byRarity.mitica;

    // Usar VRF para selecionar carta específica dentro da pool
    const cardIndex = Math.floor(vrfNum / 10000) % pool.length;
    drawn.push(pool[cardIndex]);
  }

  return drawn.filter(Boolean);
}

// Legacy drawCards for backward compatibility (tests)
function drawCards(allCards: any[], type: string) {
  const byRarity = {
    comum: allCards.filter((c) => c.rarity === "comum"),
    rara: allCards.filter((c) => c.rarity === "rara"),
    lendaria: allCards.filter((c) => c.rarity === "lendaria"),
    mitica: allCards.filter((c) => c.rarity === "mitica"),
  };
  if (byRarity.rara.length === 0) byRarity.rara = byRarity.comum;
  if (byRarity.lendaria.length === 0) byRarity.lendaria = byRarity.rara;
  if (byRarity.mitica.length === 0) byRarity.mitica = byRarity.lendaria;

  const drawn: any[] = [];
  if (type === "basico") {
    for (let i = 0; i < 5; i++) drawn.push(pickRandom(pickRarityWeighted([0.8, 0.18, 0.02, 0], byRarity)));
  } else if (type === "premium") {
    drawn.push(pickRandom(byRarity.rara));
    for (let i = 0; i < 4; i++) drawn.push(pickRandom(pickRarityWeighted([0.6, 0.3, 0.09, 0.01], byRarity)));
  } else {
    drawn.push(pickRandom(byRarity.lendaria));
    for (let i = 0; i < 9; i++) drawn.push(pickRandom(pickRarityWeighted([0.4, 0.35, 0.2, 0.05], byRarity)));
  }
  return drawn.filter(Boolean);
}

function pickRarityWeighted(weights: number[], byRarity: any) {
  const r = Math.random();
  if (r < weights[0]) return byRarity.comum;
  if (r < weights[0] + weights[1]) return byRarity.rara;
  if (r < weights[0] + weights[1] + weights[2]) return byRarity.lendaria;
  return byRarity.mitica;
}

function pickRandom(arr: any[]) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Battles / PvP ─────────────────────────────────────────

export async function createBattle(challengerId: number, opponentId: number, challengerCardIds: number[], betAmount = 0) {
  const db = await getDb();
  if (!db) return null;

  // FIX: Validar que o challenger possui todas as cartas
  for (const cid of challengerCardIds) {
    const owns = await userOwnsCard(challengerId, cid);
    if (!owns) throw new Error(`Você não possui a carta #${cid}`);
  }

  const r = await db.insert(battles).values({
    challengerId,
    opponentId,
    challengerCards: challengerCardIds as any,
    opponentCards: [] as any,
    betAmount,
    status: "pending",
  }) as any;
  return (r[0]?.insertId ?? null) as number | null;
}

export async function resolveBattle(battleId: number, opponentCardIds: number[], resolverUserId?: number) {
  const db = await getDb();
  if (!db) return null;

  const battleRows = await db.select().from(battles).where(eq(battles.id, battleId)).limit(1);
  const battle = battleRows[0];
  if (!battle || battle.status !== "pending") return null;

  // FIX: Validar que o resolvedor é o oponente correto (se fornecido)
  if (resolverUserId !== undefined && battle.opponentId !== resolverUserId) {
    throw new Error("Apenas o oponente pode resolver esta batalha");
  }

  // FIX: Validar que o oponente possui as cartas
  for (const cid of opponentCardIds) {
    const owns = await userOwnsCard(battle.opponentId, cid);
    if (!owns) throw new Error(`Oponente não possui a carta #${cid}`);
  }

  const challengerCardIds: number[] = Array.isArray(battle.challengerCards)
    ? battle.challengerCards
    : JSON.parse(battle.challengerCards as string);

  const challengerCards = await db.select().from(cards).where(inArray(cards.id, challengerCardIds));
  const opponentCards = await db.select().from(cards).where(inArray(cards.id, opponentCardIds));

  // Resolver batalha por comparação de atributos
  const result = simulateBattle(challengerCards, opponentCards);
  const winnerId = result.winner === "challenger" ? battle.challengerId : battle.opponentId;
  const loserId = result.winner === "challenger" ? battle.opponentId : battle.challengerId;

  // Calcular ELO
  const [challenger] = await db.select().from(users).where(eq(users.id, battle.challengerId)).limit(1);
  const [opponent] = await db.select().from(users).where(eq(users.id, battle.opponentId)).limit(1);
  const eloChange = calculateElo(challenger?.elo ?? 1000, opponent?.elo ?? 1000);

  // Atualizar ELO e wins/losses
  await db.update(users).set({
    elo: sql`GREATEST(0, ${users.elo} + ${eloChange})`,
    wins: sql`${users.wins} + 1`,
  }).where(eq(users.id, winnerId));
  await db.update(users).set({
    elo: sql`GREATEST(0, ${users.elo} - ${eloChange})`,
    losses: sql`${users.losses} + 1`,
  }).where(eq(users.id, loserId));

  await db.update(battles).set({
    opponentCards: opponentCardIds as any,
    winnerId,
    eloChange,
    result: result as any,
    status: "completed",
    completedAt: new Date(),
  }).where(eq(battles.id, battleId));

  return { ...result, eloChange, winnerId };
}

function simulateBattle(challengerCards: any[], opponentCards: any[]) {
  const rounds: any[] = [];
  let challengerWins = 0;
  let opponentWins = 0;

  // Bônus por raridade
  const rarityBonus: Record<string, number> = { mitica: 10, lendaria: 6, rara: 3, comum: 0 };

  const maxRounds = Math.min(challengerCards.length, opponentCards.length, 5);
  for (let i = 0; i < maxRounds; i++) {
    const cc = challengerCards[i];
    const oc = opponentCards[i];
    if (!cc || !oc) break;
    const cScore = cc.ovr + (rarityBonus[cc.rarity] ?? 0) + Math.floor(Math.random() * 10);
    const oScore = oc.ovr + (rarityBonus[oc.rarity] ?? 0) + Math.floor(Math.random() * 10);
    const roundWinner = cScore >= oScore ? "challenger" : "opponent";
    if (roundWinner === "challenger") challengerWins++;
    else opponentWins++;
    rounds.push({
      round: i + 1,
      challengerCard: cc.id,
      opponentCard: oc.id,
      challengerScore: cScore,
      opponentScore: oScore,
      winner: roundWinner,
    });
  }

  return {
    rounds,
    challengerWins,
    opponentWins,
    winner: challengerWins >= opponentWins ? "challenger" : "opponent",
  };
}

function calculateElo(winnerElo: number, loserElo: number): number {
  const expected = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  return Math.max(1, Math.round(32 * (1 - expected)));
}

export async function getUserBattles(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(battles)
    .where(sql`${battles.challengerId} = ${userId} OR ${battles.opponentId} = ${userId}`)
    .orderBy(desc(battles.createdAt))
    .limit(20);
}

// ── Ranking ────────────────────────────────────────────────

export async function getRanking(season = 1, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: users.id,
    name: users.name,
    walletAddress: users.walletAddress,
    elo: users.elo,
    wins: users.wins,
    losses: users.losses,
    season: users.season,
  }).from(users)
    .where(eq(users.season, season))
    .orderBy(desc(users.elo))
    .limit(limit);
}

// ── Marketplace ────────────────────────────────────────────

export async function createListing(sellerId: number, cardId: number, price: number, chain: "polygon" | "bnb") {
  const db = await getDb();
  if (!db) return null;

  // Verificar se o vendedor tem a carta
  const inv = await db.select().from(inventory)
    .where(and(eq(inventory.userId, sellerId), eq(inventory.cardId, cardId)))
    .limit(1);
  if (!inv[0] || inv[0].quantity <= 0) return null;

  // FIX: Verificar se já existe listing ativo para esta carta deste vendedor
  const existingListing = await db.select({ id: listings.id }).from(listings)
    .where(and(
      eq(listings.sellerId, sellerId),
      eq(listings.cardId, cardId),
      eq(listings.status, "active"),
    ))
    .limit(1);
  if (existingListing.length > 0) return null; // já listada

  const r = await db.insert(listings).values({
    sellerId,
    cardId,
    price,
    chain,
    currency: chain === "polygon" ? "POL" : "BNB",
  }) as any;
  return (r[0]?.insertId ?? null) as number | null;
}

export async function getActiveListings() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ listing: listings, card: cards, seller: { id: users.id, name: users.name } })
    .from(listings)
    .innerJoin(cards, eq(listings.cardId, cards.id))
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(eq(listings.status, "active"))
    .orderBy(desc(listings.createdAt));
}

export async function buyListing(listingId: number, buyerId: number) {
  const db = await getDb();
  if (!db) return false;

  const listingRows = await db.select().from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.status, "active")))
    .limit(1);
  const listing = listingRows[0];
  if (!listing) return false;

  // FIX: Impedir auto-compra
  if (listing.sellerId === buyerId) throw new Error("Você não pode comprar sua própria listagem");

  // Swap atômico: remover do vendedor, adicionar ao comprador
  const removed = await removeCardFromInventory(listing.sellerId, listing.cardId);
  if (!removed) {
    // Vendedor não tem mais a carta — cancelar listing automaticamente
    await db.update(listings).set({ status: "cancelled" }).where(eq(listings.id, listingId));
    return false;
  }
  await addCardToInventory(buyerId, listing.cardId);
  await db.update(listings).set({ status: "sold", buyerId, soldAt: new Date() }).where(eq(listings.id, listingId));
  return true;
}

export async function cancelListing(listingId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;
  await db.update(listings).set({ status: "cancelled" })
    .where(and(eq(listings.id, listingId), eq(listings.sellerId, userId)));
  return true;
}

// ── Trade Offers (Swap Atômico P2P) ───────────────────────

export async function createTradeOffer(
  initiatorId: number,
  receiverId: number,
  initiatorCardIds: number[],
  receiverCardIds: number[],
) {
  const db = await getDb();
  if (!db) return null;

  // FIX: Não permitir trade consigo mesmo
  if (initiatorId === receiverId) throw new Error("Não é possível fazer trade consigo mesmo");

  // FIX: Validar que o iniciador possui todas as cartas oferecidas
  for (const cid of initiatorCardIds) {
    const owns = await userOwnsCard(initiatorId, cid);
    if (!owns) throw new Error(`Você não possui a carta #${cid}`);
  }

  // FIX: Validar que o receptor possui todas as cartas solicitadas
  for (const cid of receiverCardIds) {
    const owns = await userOwnsCard(receiverId, cid);
    if (!owns) throw new Error(`O outro jogador não possui a carta #${cid}`);
  }

  const r = await db.insert(tradeOffers).values({
    initiatorId,
    receiverId,
    initiatorCardIds: initiatorCardIds as any,
    receiverCardIds: receiverCardIds as any,
  }) as any;
  return (r[0]?.insertId ?? null) as number | null;
}

export async function acceptTradeOffer(offerId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  const offerRows = await db.select().from(tradeOffers)
    .where(and(eq(tradeOffers.id, offerId), eq(tradeOffers.receiverId, userId)))
    .limit(1);
  const offer = offerRows[0];
  if (!offer || offer.status !== "pending") return false;

  const initiatorCardIds: number[] = Array.isArray(offer.initiatorCardIds)
    ? offer.initiatorCardIds
    : JSON.parse(offer.initiatorCardIds as string);
  const receiverCardIds: number[] = Array.isArray(offer.receiverCardIds)
    ? offer.receiverCardIds
    : JSON.parse(offer.receiverCardIds as string);

  // FIX: Validar posses antes do swap atômico
  for (const cid of initiatorCardIds) {
    const owns = await userOwnsCard(offer.initiatorId, cid);
    if (!owns) {
      await db.update(tradeOffers).set({ status: "cancelled", resolvedAt: new Date() }).where(eq(tradeOffers.id, offerId));
      throw new Error("O iniciador não possui mais todas as cartas da oferta");
    }
  }
  for (const cid of receiverCardIds) {
    const owns = await userOwnsCard(offer.receiverId, cid);
    if (!owns) {
      await db.update(tradeOffers).set({ status: "cancelled", resolvedAt: new Date() }).where(eq(tradeOffers.id, offerId));
      throw new Error("Você não possui mais todas as cartas solicitadas");
    }
  }

  // Swap atômico
  for (const cid of initiatorCardIds) {
    await removeCardFromInventory(offer.initiatorId, cid);
    await addCardToInventory(offer.receiverId, cid);
  }
  for (const cid of receiverCardIds) {
    await removeCardFromInventory(offer.receiverId, cid);
    await addCardToInventory(offer.initiatorId, cid);
  }

  await db.update(tradeOffers).set({ status: "accepted", resolvedAt: new Date() }).where(eq(tradeOffers.id, offerId));
  return true;
}

export async function getUserTradeOffers(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tradeOffers)
    .where(sql`${tradeOffers.initiatorId} = ${userId} OR ${tradeOffers.receiverId} = ${userId}`)
    .orderBy(desc(tradeOffers.createdAt));
}

// ── Synthetic Data (para testes E2E) ──────────────────────

export async function createSyntheticUser(openId: string, name: string, email: string) {
  const db = await getDb();
  if (!db) return null;
  await db.insert(users).values({
    openId,
    name,
    email,
    loginMethod: "synthetic",
    role: "user",
    elo: 1000,
    wins: 0,
    losses: 0,
    season: 1,
    walletAddress: "0x" + openId.replace(/[^a-f0-9]/gi, "0").slice(0, 40).padEnd(40, "0"),
    selectedChain: "polygon",
    lastSignedIn: new Date(),
  }).onDuplicateKeyUpdate({ set: { name, email, lastSignedIn: new Date() } });
  const r = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return r[0] ?? null;
}
