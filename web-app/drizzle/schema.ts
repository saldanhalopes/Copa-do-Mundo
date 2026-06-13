import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  bigint,
  float,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  walletAddress: varchar("walletAddress", { length: 64 }),
  selectedChain: mysqlEnum("selectedChain", ["polygon", "bnb"]).default("polygon"),
  elo: int("elo").default(1000).notNull(),
  wins: int("wins").default(0).notNull(),
  losses: int("losses").default(0).notNull(),
  season: int("season").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Cartas/Figurinhas
export const cards = mysqlTable("cards", {
  id: int("id").autoincrement().primaryKey(),
  tokenId: int("tokenId").notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(),
  teamId: varchar("teamId", { length: 8 }).notNull(),
  teamName: varchar("teamName", { length: 64 }).notNull(),
  position: varchar("position", { length: 8 }).notNull(),
  rarity: mysqlEnum("rarity", ["comum", "rara", "lendaria", "mitica"]).notNull(),
  pac: int("pac").notNull(),
  sho: int("sho").notNull(),
  pas: int("pas").notNull(),
  dri: int("dri").notNull(),
  def: int("def").notNull(),
  phy: int("phy").notNull(),
  ovr: int("ovr").notNull(),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Card = typeof cards.$inferSelect;

// Inventário do jogador
export const inventory = mysqlTable("inventory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  cardId: int("cardId").notNull(),
  quantity: int("quantity").default(1).notNull(),
  acquiredAt: timestamp("acquiredAt").defaultNow().notNull(),
});

export type Inventory = typeof inventory.$inferSelect;

// Pacotes
export const packs = mysqlTable("packs", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["basico", "premium", "lendario"]).notNull(),
  userId: int("userId").notNull(),
  opened: boolean("opened").default(false).notNull(),
  openedAt: timestamp("openedAt"),
  cardsReceived: json("cardsReceived"),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
});

export type Pack = typeof packs.$inferSelect;

// Batalhas PvP
export const battles = mysqlTable("battles", {
  id: int("id").autoincrement().primaryKey(),
  challengerId: int("challengerId").notNull(),
  opponentId: int("opponentId").notNull(),
  challengerCards: json("challengerCards").notNull(),
  opponentCards: json("opponentCards").notNull(),
  winnerId: int("winnerId"),
  betAmount: float("betAmount").default(0),
  eloChange: int("eloChange").default(0),
  season: int("season").default(1).notNull(),
  result: json("result"),
  status: mysqlEnum("status", ["pending", "active", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Battle = typeof battles.$inferSelect;

// Marketplace listings
export const listings = mysqlTable("listings", {
  id: int("id").autoincrement().primaryKey(),
  sellerId: int("sellerId").notNull(),
  cardId: int("cardId").notNull(),
  price: float("price").notNull(),
  currency: varchar("currency", { length: 8 }).default("POL").notNull(),
  chain: mysqlEnum("chain", ["polygon", "bnb"]).default("polygon").notNull(),
  status: mysqlEnum("status", ["active", "sold", "cancelled"]).default("active").notNull(),
  buyerId: int("buyerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  soldAt: timestamp("soldAt"),
});

export type Listing = typeof listings.$inferSelect;

// Trade offers (swap atômico P2P)
export const tradeOffers = mysqlTable("tradeOffers", {
  id: int("id").autoincrement().primaryKey(),
  initiatorId: int("initiatorId").notNull(),
  receiverId: int("receiverId").notNull(),
  initiatorCardIds: json("initiatorCardIds").notNull(),
  receiverCardIds: json("receiverCardIds").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "rejected", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type TradeOffer = typeof tradeOffers.$inferSelect;
