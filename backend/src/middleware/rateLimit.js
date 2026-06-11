import config from "../config.js";

let Redis;
try {
  Redis = (await import("ioredis")).default;
} catch {
  Redis = null;
}

const hits = new Map();
let redisClient = null;

const KEY_PREFIX = "rl:";

async function getRedisClient() {
  if (redisClient) return redisClient;
  if (config.REDIS_URL && Redis) {
    try {
      redisClient = new Redis(config.REDIS_URL);
      await redisClient.ping();
      console.log("[RateLimit] Redis connected");
      return redisClient;
    } catch {
      console.warn("[RateLimit] Redis unavailable, falling back to in-memory");
      redisClient = null;
    }
  }
  return null;
}

export function rateLimit({
  windowMs = config.RATE_LIMIT_WINDOW_MS,
  max = config.RATE_LIMIT_MAX,
} = {}) {
  return async (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const windowSec = Math.ceil(windowMs / 1000);

    const rl = await getRedisClient();
    if (rl) {
      try {
        const key = `${KEY_PREFIX}${ip}`;
        const result = await rl
          .multi()
          .incr(key)
          .ttl(key)
          .exec();

        const count = result[0][1];
        let ttl = result[1][1];

        if (ttl === -1) {
          await rl.expire(key, windowSec);
          ttl = windowSec;
        }

        const remaining = Math.max(0, max - count);
        res.setHeader("X-RateLimit-Limit", max);
        res.setHeader("X-RateLimit-Remaining", remaining);
        res.setHeader("X-RateLimit-Reset", new Date(now + ttl * 1000).toISOString());

        if (count > max) {
          return res.status(429).json({ error: "Too many requests, please try again later" });
        }
        return next();
      } catch {
        console.warn("[RateLimit] Redis error, falling back to in-memory");
      }
    }

    let record = hits.get(ip);
    if (!record || now - record.windowStart > windowMs) {
      record = { windowStart: now, count: 0 };
      hits.set(ip, record);
    }

    record.count++;

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, max - record.count));
    res.setHeader("X-RateLimit-Reset", new Date(record.windowStart + windowMs).toISOString());

    if (record.count > max) {
      return res.status(429).json({ error: "Too many requests, please try again later" });
    }

    next();
  };
}

export function resetRateLimit(ip) {
  hits.delete(ip);
}

export async function resetRateLimitRedis(ip) {
  const rl = await getRedisClient();
  if (rl) {
    await rl.del(`${KEY_PREFIX}${ip}`);
  }
  resetRateLimit(ip);
}
