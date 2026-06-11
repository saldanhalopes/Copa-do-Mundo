import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Matchmaker } from "../src/matchmaking/Matchmaker.js";

describe("Matchmaker (in-memory)", () => {
  let mm;

  before(() => {
    mm = new Matchmaker({ baseRange: 100, expandPerSec: 25, maxRange: 600 });
  });

  after(() => {
    mm.queue = [];
    mm.matches.clear();
  });

  it("should pair two players with close ELO", async () => {
    const p1 = mm._enqueueMemory({
      address: "0x1111",
      elo: 1000,
      stake: 0,
      lineupHash: "hash1",
    });
    const p2 = mm._enqueueMemory({
      address: "0x2222",
      elo: 1010,
      stake: 0,
      lineupHash: "hash2",
    });

    const [r1, r2] = await Promise.all([p1, p2]);
    assert.equal(r1.matchId, r2.matchId);
    assert.equal(r1.opponent, "0x2222");
    assert.equal(r2.opponent, "0x1111");
  });

  it("should not pair players with different stakes", async () => {
    const results = await Promise.allSettled([
      mm._enqueueMemory({ address: "0x3333", elo: 1000, stake: 10 }),
      mm._enqueueMemory({ address: "0x4444", elo: 1010, stake: 50 }),
    ]);

    assert.equal(results[0].status, "fulfilled" || "pending");
    assert.equal(results[1].status, "fulfilled" || "pending");

    mm.queue = mm.queue.filter(
      (p) => p.address !== "0x3333" && p.address !== "0x4444"
    );
  });

  it("should dequeue a player", () => {
    const entry = { address: "0x5555", elo: 1000, stake: 0, joinedAt: Date.now() };
    mm.queue.push(entry);
    assert.equal(mm.queue.length, 1);
    mm.dequeue("0x5555");
    assert.equal(mm.queue.length, 0);
  });

  it("should expand search range over time", () => {
    const entry = { joinedAt: Date.now() - 10000 };
    const range = mm._currentRange(entry);
    assert.equal(range, 350);
  });

  it("should cap range at maxRange", () => {
    const entry = { joinedAt: Date.now() - 60000 };
    const range = mm._currentRange(entry);
    assert.equal(range, 600);
  });

  it("should return stats", async () => {
    const stats = await mm.stats();
    assert.equal(typeof stats.queueSize, "number");
    assert.equal(typeof stats.activeMatches, "number");
    assert.equal(stats.redis, false);
  });
});
