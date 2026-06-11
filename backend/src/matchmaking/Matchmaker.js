import config from "../config.js";
import { v4 as uuidv4 } from "uuid";

let Redis;
try {
  Redis = (await import("ioredis")).default;
} catch {
  Redis = null;
}

const MATCH_TIMEOUT_MS = 5 * 60 * 1000;

export class Matchmaker {
  constructor({ baseRange = 100, expandPerSec = 25, maxRange = 600 } = {}) {
    this.baseRange = baseRange;
    this.expandPerSec = expandPerSec;
    this.maxRange = maxRange;
    this._nextId = 1;

    this.useRedis = !!(config.REDIS_URL && Redis);

    if (this.useRedis) {
      this.redis = new Redis(config.REDIS_URL);
      this.pub = new Redis(config.REDIS_URL);
      this.sub = new Redis(config.REDIS_URL);
      this.queueKey = "mm:queue";
      this.matchesKey = "mm:matches";
      this.channel = "mm:matched";

      this.sub.subscribe(this.channel);
      this.sub.on("message", (ch, message) => {
        if (ch === this.channel) {
          const data = JSON.parse(message);
          this._handleRemoteMatch(data);
        }
      });

      this._cleanupOldEntries();
      setInterval(() => this._cleanupOldEntries(), 60000);
    } else {
      this.queue = [];
      this.matches = new Map();
    }

    this._pendingResolves = new Map();
  }

  async _cleanupOldEntries() {
    if (this.useRedis) {
      const now = Date.now();
      const entries = await this.redis.lrange(this.queueKey, 0, -1);
      for (const raw of entries) {
        const entry = JSON.parse(raw);
        if (now - entry.joinedAt > MATCH_TIMEOUT_MS) {
          await this.redis.lrem(this.queueKey, 0, raw);
        }
      }
    } else {
      const now = Date.now();
      this.queue = this.queue.filter(
        (e) => now - e.joinedAt < MATCH_TIMEOUT_MS
      );
    }
  }

  async enqueue(player) {
    if (this.useRedis) {
      return this._enqueueRedis(player);
    }
    return this._enqueueMemory(player);
  }

  _enqueueMemory(player) {
    return new Promise((resolve) => {
      const entry = { ...player, joinedAt: Date.now(), resolve };
      const opponent = this._findOpponent(entry);
      if (opponent) {
        this._pair(entry, opponent);
      } else {
        this.queue.push(entry);
      }
    });
  }

  async _enqueueRedis(player) {
    const entry = { ...player, joinedAt: Date.now() };
    const raw = JSON.stringify(entry);
    const resolvePromise = new Promise((resolve) => {
      this._pendingResolves.set(player.address, resolve);
    });

    await this.redis.rpush(this.queueKey, raw);
    await this._tryMatchRedis();

    const timeout = setTimeout(() => {
      this._pendingResolves.delete(player.address);
      this.redis.lrem(this.queueKey, 0, raw);
      resolvePromise({ timeout: true });
    }, MATCH_TIMEOUT_MS);

    const result = await resolvePromise;
    clearTimeout(timeout);
    return result;
  }

  async _tryMatchRedis() {
    const entries = await this.redis.lrange(this.queueKey, 0, -1);
    const parsed = entries.map((r, i) => ({ entry: JSON.parse(r), raw: r, index: i }));

    for (let i = 0; i < parsed.length; i++) {
      for (let j = i + 1; j < parsed.length; j++) {
        const a = parsed[i].entry;
        const b = parsed[j].entry;
        if (a.address === b.address) continue;
        if (a.stake !== b.stake) continue;

        const rangeA = this._currentRange(a);
        const rangeB = this._currentRange(b);
        const range = Math.max(rangeA, rangeB);
        const diff = Math.abs(a.elo - b.elo);

        if (diff <= range) {
          await this.redis.lrem(this.queueKey, 0, parsed[i].raw);
          await this.redis.lrem(this.queueKey, 0, parsed[j].raw);

          const match = this._createMatchRecord(a, b);
          await this.redis.hset(this.matchesKey, match.matchId, JSON.stringify(match));

          const payloadA = { matchId: match.matchId, stake: a.stake, opponent: b.address, opponentElo: b.elo };
          const payloadB = { matchId: match.matchId, stake: b.stake, opponent: a.address, opponentElo: a.elo };

          await this.pub.publish(this.channel, JSON.stringify({ address: a.address, payload: payloadA }));
          await this.pub.publish(this.channel, JSON.stringify({ address: b.address, payload: payloadB }));

          const resolveA = this._pendingResolves.get(a.address);
          const resolveB = this._pendingResolves.get(b.address);
          if (resolveA) { resolveA(payloadA); this._pendingResolves.delete(a.address); }
          if (resolveB) { resolveB(payloadB); this._pendingResolves.delete(b.address); }

          return;
        }
      }
    }
  }

  _handleRemoteMatch({ address, payload }) {
    const resolve = this._pendingResolves.get(address);
    if (resolve) {
      resolve(payload);
      this._pendingResolves.delete(address);
    }
  }

  _createMatchRecord(a, b) {
    const matchId = uuidv4();
    return { matchId, a: a.address, b: b.address, stake: a.stake, createdAt: Date.now() };
  }

  dequeue(address) {
    if (this.useRedis) {
      return this._dequeueRedis(address);
    }
    this.queue = this.queue.filter((p) => p.address !== address);
  }

  async _dequeueRedis(address) {
    const entries = await this.redis.lrange(this.queueKey, 0, -1);
    for (const raw of entries) {
      const entry = JSON.parse(raw);
      if (entry.address === address) {
        await this.redis.lrem(this.queueKey, 0, raw);
        const resolve = this._pendingResolves.get(address);
        if (resolve) {
          resolve({ cancelled: true });
          this._pendingResolves.delete(address);
        }
        break;
      }
    }
  }

  _currentRange(entry) {
    const waitedSec = (Date.now() - entry.joinedAt) / 1000;
    return Math.min(this.maxRange, this.baseRange + waitedSec * this.expandPerSec);
  }

  _findOpponent(entry) {
    let best = null;
    let bestDiff = Infinity;
    for (const other of this.queue) {
      if (other.address === entry.address) continue;
      if (other.stake !== entry.stake) continue;
      const diff = Math.abs(other.elo - entry.elo);
      const range = Math.max(this._currentRange(entry), this._currentRange(other));
      if (diff <= range && diff < bestDiff) {
        best = other;
        bestDiff = diff;
      }
    }
    return best;
  }

  _pair(a, b) {
    this.queue = this.queue.filter((p) => p !== a && p !== b);
    const matchId = this._nextId++;
    const match = { matchId, a: a.address, b: b.address, stake: a.stake, createdAt: Date.now() };
    this.matches.set(matchId, match);
    const payload = { matchId, stake: a.stake };
    a.resolve({ ...payload, opponent: b.address, opponentElo: b.elo });
    b.resolve({ ...payload, opponent: a.address, opponentElo: a.elo });
    return match;
  }

  async tick() {
    if (this.useRedis) {
      await this._tryMatchRedis();
      return;
    }
    const sorted = [...this.queue].sort((x, y) => x.joinedAt - y.joinedAt);
    for (const entry of sorted) {
      if (!this.queue.includes(entry)) continue;
      const opp = this._findOpponent(entry);
      if (opp) this._pair(entry, opp);
    }
  }

  async stats() {
    if (this.useRedis) {
      const queueSize = await this.redis.llen(this.queueKey);
      const activeMatches = await this.redis.hlen(this.matchesKey);
      return { queueSize, activeMatches, redis: true };
    }
    return { queueSize: this.queue.length, activeMatches: this.matches.size, redis: false };
  }
}
