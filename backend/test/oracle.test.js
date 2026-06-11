import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { SportsOracle } from "../src/oracle/SportsOracle.js";

describe("SportsOracle", () => {
  let oracle;

  before(() => {
    oracle = new SportsOracle({
      provider: "football",
      cacheTtlMs: 100,
      maxRetries: 1,
    });
  });

  after(() => {
    oracle.clearCache();
  });

  it("should compute points for a forward", () => {
    const stats = { goals: 2, assists: 1, yellowCards: 1 };
    const pts = oracle.computePoints(stats, "ATA");
    assert.equal(pts, 12);
  });

  it("should compute points for a defender with clean sheet", () => {
    const stats = { goals: 1, cleanSheet: true, yellowCards: 0 };
    const pts = oracle.computePoints(stats, "ZAG");
    assert.equal(pts, 12);
  });

  it("should penalize red cards", () => {
    const stats = { goals: 0, redCards: 1 };
    const pts = oracle.computePoints(stats, "MEI");
    assert.equal(pts, -3);
  });

  it("should penalize own goals", () => {
    const stats = { ownGoals: 1 };
    const pts = oracle.computePoints(stats, "GOL");
    assert.equal(pts, -3);
  });

  it("should give bonus saves for goalkeepers", () => {
    const stats = { saves: 4, cleanSheet: true };
    const pts = oracle.computePoints(stats, "GOL");
    assert.equal(pts, 10);
  });

  it("should handle empty stats", () => {
    const pts = oracle.computePoints({}, "ATA");
    assert.equal(pts, 0);
  });

  it("should identify star players (multigol)", () => {
    const fixtures = [
      {
        players: [
          { id: 1, stats: { goals: 2, rating: 7.5 } },
          { id: 2, stats: { goals: 1, rating: 8.5 } },
        ],
      },
    ];
    const stars = oracle.starsForRound(fixtures);
    assert.equal(stars.length, 2);
    assert.equal(stars[0].reason, "multigol");
    assert.equal(stars[1].reason, "craque");
  });

  it("should use and expire cache", () => {
    oracle._setCache("test-key", { data: true });
    assert.deepEqual(oracle._getCache("test-key"), { data: true });

    const oldEntry = oracle.cache.get("test-key");
    oldEntry.ts = Date.now() - 200;
    assert.equal(oracle._getCache("test-key"), null);
  });

  it("should respect rate limiting", () => {
    oracle._rateLimitTokens = 0;
    const allowed = oracle._checkRateLimit();
    assert.equal(allowed, false);
  });

  it("should refill rate limit tokens", () => {
    oracle._rateLimitTokens = 0;
    oracle._lastRateLimitRefill = Date.now() - 2000;
    const allowed = oracle._checkRateLimit();
    assert.equal(allowed, true);
  });

  it("should extract player stats from fixtures", () => {
    const fixtures = [
      {
        players: [{ id: 42, stats: { goals: 1 } }],
      },
    ];
    const stats = oracle._extractStats(fixtures, 42);
    assert.deepEqual(stats, { goals: 1 });
  });

  it("should return null for non-existent player", () => {
    const stats = oracle._extractStats([], 999);
    assert.equal(stats, null);
  });
});
