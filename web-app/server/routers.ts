import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  upsertUser, getUserByOpenId, getUserById, updateUserWallet,
  getAllCards, getCardById, getCardsByTeam,
  getUserInventory, seedCards,
  purchasePack, openPack,
  createBattle, resolveBattle, getUserBattles,
  getRanking,
  createListing, getActiveListings, buyListing, cancelListing,
  createTradeOffer, acceptTradeOffer, getUserTradeOffers,
  createSyntheticUser,
} from "./db";
import { ALL_CARDS, TEAMS, PACK_TYPES, CHAINS } from "../shared/gameData";

// Seed automático ao iniciar
seedCards().catch(console.error);

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Game Data ────────────────────────────────────────────
  game: router({
    teams: publicProcedure.query(() => TEAMS),
    packTypes: publicProcedure.query(() => PACK_TYPES),
    chains: publicProcedure.query(() => CHAINS),
    allCards: publicProcedure.query(() => ALL_CARDS),
  }),

  // ── Cards ────────────────────────────────────────────────
  cards: router({
    list: publicProcedure.query(() => getAllCards()),
    byId: publicProcedure.input(z.object({ id: z.number() })).query(({ input }) => getCardById(input.id)),
    byTeam: publicProcedure.input(z.object({ teamId: z.string() })).query(({ input }) => getCardsByTeam(input.teamId)),
  }),

  // ── Player ───────────────────────────────────────────────
  player: router({
    connectWallet: protectedProcedure
      .input(z.object({ walletAddress: z.string(), chain: z.enum(["polygon", "bnb"]) }))
      .mutation(async ({ ctx, input }) => {
        await updateUserWallet(ctx.user.id, input.walletAddress, input.chain);
        return { success: true };
      }),

    inventory: protectedProcedure.query(async ({ ctx }) => {
      return getUserInventory(ctx.user.id);
    }),

    stats: protectedProcedure.query(async ({ ctx }) => {
      const inv = await getUserInventory(ctx.user.id);
      const allCards = ALL_CARDS;
      const owned = new Set(inv.map((i) => i.card.tokenId));
      const byRarity = { comum: 0, rara: 0, lendaria: 0, mitica: 0 };
      inv.forEach((i) => { byRarity[i.card.rarity as keyof typeof byRarity]++; });
      return {
        totalOwned: inv.length,
        totalCards: allCards.length,
        completionPct: Math.round((owned.size / allCards.length) * 100),
        byRarity,
        elo: ctx.user.elo,
        wins: ctx.user.wins,
        losses: ctx.user.losses,
      };
    }),

    giveStarterPack: protectedProcedure.mutation(async ({ ctx }) => {
      // Dar 5 cartas iniciais ao novo jogador
      const inv = await getUserInventory(ctx.user.id);
      if (inv.length > 0) return { success: false, message: "Você já tem cartas" };
      const packId = await purchasePack(ctx.user.id, "basico");
      if (!packId) return { success: false, message: "Erro ao criar pacote" };
      const drawn = await openPack(packId, ctx.user.id);
      return { success: true, cards: drawn };
    }),
  }),

  // ── Packs ────────────────────────────────────────────────
  packs: router({
    purchase: protectedProcedure
      .input(z.object({ type: z.enum(["basico", "premium", "lendario"]) }))
      .mutation(async ({ ctx, input }) => {
        const packId = await purchasePack(ctx.user.id, input.type);
        return { packId };
      }),

    open: protectedProcedure
      .input(z.object({ packId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const cards = await openPack(input.packId, ctx.user.id);
        if (!cards) throw new Error("Pacote inválido ou já aberto");
        return { cards };
      }),

    buyAndOpen: protectedProcedure
      .input(z.object({ type: z.enum(["basico", "premium", "lendario"]) }))
      .mutation(async ({ ctx, input }) => {
        const packId = await purchasePack(ctx.user.id, input.type);
        if (!packId) throw new Error("Erro ao criar pacote");
        const result = await openPack(packId, ctx.user.id, ctx.user.walletAddress ?? undefined);
        if (!result) throw new Error("Erro ao abrir pacote");
        return result; // { cards, vrf }
      }),
  }),

  // ── PvP / Arena ──────────────────────────────────────────
  pvp: router({
    challenge: protectedProcedure
      .input(z.object({ opponentId: z.number(), cardIds: z.array(z.number()).min(1).max(5), betAmount: z.number().default(0) }))
      .mutation(async ({ ctx, input }) => {
        const battleId = await createBattle(ctx.user.id, input.opponentId, input.cardIds, input.betAmount);
        return { battleId };
      }),

    resolve: protectedProcedure
      .input(z.object({ battleId: z.number(), cardIds: z.array(z.number()).min(1).max(5) }))
      .mutation(async ({ ctx, input }) => {
        const result = await resolveBattle(input.battleId, input.cardIds, ctx.user.id);
        if (!result) throw new Error("Batalha inválida ou você não é o oponente");
        return result;
      }),

    quickBattle: protectedProcedure
      .input(z.object({ myCardIds: z.array(z.number()).min(1).max(5) }))
      .mutation(async ({ ctx, input }) => {
        // Batalha rápida contra bot (usa cartas aleatórias)
        const allCards = await getAllCards();
        const botCards = allCards.sort(() => Math.random() - 0.5).slice(0, input.myCardIds.length);
        const myCards = await Promise.all(input.myCardIds.map((id) => getCardById(id)));
        const { default: simulateBattleLocal } = await import("./battleEngine");
        const result = simulateBattleLocal(myCards.filter(Boolean), botCards);
        return { result, botCards };
      }),

    history: protectedProcedure.query(async ({ ctx }) => {
      return getUserBattles(ctx.user.id);
    }),
  }),

  // ── Admin / Synthetic ────────────────────────────────────
  admin: router({
    seedSyntheticData: publicProcedure.mutation(async () => {
      const syntheticUsers = [
        { openId: "synthetic_alice_001", name: "Alice Silva", email: "alice@synthetic.test" },
        { openId: "synthetic_bob_002", name: "Bob Costa", email: "bob@synthetic.test" },
        { openId: "synthetic_carol_003", name: "Carol Mendes", email: "carol@synthetic.test" },
        { openId: "synthetic_dave_004", name: "Dave Rocha", email: "dave@synthetic.test" },
      ];
      const created = [];
      for (const u of syntheticUsers) {
        const user = await createSyntheticUser(u.openId, u.name, u.email);
        if (!user) continue;
        // Dar 2 pacotes básicos a cada usuário sintético
        const inv = await getUserInventory(user.id);
        if (inv.length === 0) {
          const p1 = await purchasePack(user.id, "basico");
          if (p1) await openPack(p1, user.id);
          const p2 = await purchasePack(user.id, "premium");
          if (p2) await openPack(p2, user.id);
        }
        created.push({ id: user.id, name: user.name });
      }
      return { created };
    }),

    listSyntheticUsers: publicProcedure.query(async () => {
      const users = await Promise.all([
        "synthetic_alice_001", "synthetic_bob_002",
        "synthetic_carol_003", "synthetic_dave_004",
      ].map((oid) => getUserByOpenId(oid)));
      return users.filter(Boolean);
    }),
  }),

  // ── Ranking ──────────────────────────────────────────────
  ranking: router({
    leaderboard: publicProcedure
      .input(z.object({ season: z.number().default(1), limit: z.number().default(50) }))
      .query(({ input }) => getRanking(input.season, input.limit)),
  }),

  // ── Marketplace ──────────────────────────────────────────
  marketplace: router({
    listings: publicProcedure.query(() => getActiveListings()),

    list: protectedProcedure
      .input(z.object({ cardId: z.number(), price: z.number().positive(), chain: z.enum(["polygon", "bnb"]) }))
      .mutation(async ({ ctx, input }) => {
        const id = await createListing(ctx.user.id, input.cardId, input.price, input.chain);
        if (!id) throw new Error("Você não possui esta carta ou ela já está listada");
        return { listingId: id };
      }),

    buy: protectedProcedure
      .input(z.object({ listingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const ok = await buyListing(input.listingId, ctx.user.id);
        if (!ok) throw new Error("Listing não encontrado ou já vendido");
        return { success: true };
      }),

    cancel: protectedProcedure
      .input(z.object({ listingId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await cancelListing(input.listingId, ctx.user.id);
        return { success: true };
      }),

    createTrade: protectedProcedure
      .input(z.object({
        receiverId: z.number(),
        myCardIds: z.array(z.number()),
        theirCardIds: z.array(z.number()),
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await createTradeOffer(ctx.user.id, input.receiverId, input.myCardIds, input.theirCardIds);
        return { tradeId: id };
      }),

    acceptTrade: protectedProcedure
      .input(z.object({ tradeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const ok = await acceptTradeOffer(input.tradeId, ctx.user.id);
        if (!ok) throw new Error("Oferta inválida");
        return { success: true };
      }),

    myTrades: protectedProcedure.query(async ({ ctx }) => {
      return getUserTradeOffers(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
