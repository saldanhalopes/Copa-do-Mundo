import config from "../config.js";

const PROVIDER_CONFIGS = {
  football: {
    baseUrl: config.ORACLE_API_URLS.football,
    apiKey: config.ORACLE_API_KEYS.football,
    headers: { "x-rapidapi-key": "", "x-rapidapi-host": "v3.football.api-sports.io" },
  },
  sportradar: {
    baseUrl: config.ORACLE_API_URLS.sportradar,
    apiKey: config.ORACLE_API_KEYS.sportradar,
    headers: {},
  },
};

export class SportsOracle {
  constructor({
    apiKey,
    registrarDesempenhoFn,
    provider = "football",
    cacheTtlMs = 300000,
    maxRetries = 3,
  } = {}) {
    this.apiKey = apiKey;
    this.registrar = registrarDesempenhoFn;
    this.providerName = provider;

    const providerConfig = PROVIDER_CONFIGS[provider] || PROVIDER_CONFIGS.football;
    this.baseUrl = providerConfig.baseUrl;
    this.apiKey = this.apiKey || providerConfig.apiKey;
    this.headers = { ...providerConfig.headers };
    if (this.apiKey) {
      this.headers["x-rapidapi-key"] = this.apiKey;
    }

    this.cache = new Map();
    this.cacheTtlMs = cacheTtlMs;
    this.maxRetries = maxRetries;

    this._rateLimitTokens = 10;
    this._rateLimitMax = 10;
    this._rateLimitInterval = 1000;
    this._lastRateLimitRefill = Date.now();
  }

  _checkRateLimit() {
    const now = Date.now();
    if (now - this._lastRateLimitRefill > this._rateLimitInterval) {
      this._rateLimitTokens = this._rateLimitMax;
      this._lastRateLimitRefill = now;
    }
    if (this._rateLimitTokens <= 0) {
      return false;
    }
    this._rateLimitTokens--;
    return true;
  }

  _getCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.cacheTtlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  _setCache(key, data) {
    this.cache.set(key, { data, ts: Date.now() });
  }

  async _fetchWithRetry(url, options = {}, retries = this.maxRetries) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (!this._checkRateLimit()) {
        await new Promise((r) => setTimeout(r, this._rateLimitInterval));
        continue;
      }

      try {
        const response = await fetch(url, {
          headers: { ...this.headers, ...options.headers },
          ...options,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (err) {
        if (attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.warn(`[Oracle] Fetch attempt ${attempt + 1} failed, retrying in ${delay}ms: ${err.message}`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }
  }

  async fetchFixtures({ league, season, date, live = false } = {}) {
    const cacheKey = `fixtures:${league}:${season}:${date}:${live}`;
    const cached = this._getCache(cacheKey);
    if (cached) return cached;

    let url;
    if (live) {
      url = `${this.baseUrl}/fixtures?live=all`;
    } else if (date) {
      url = `${this.baseUrl}/fixtures?date=${date}`;
    } else {
      url = `${this.baseUrl}/fixtures?league=${league || ""}&season=${season || ""}`;
    }

    const data = await this._fetchWithRetry(url);
    this._setCache(cacheKey, data);
    return data;
  }

  computePoints(playerStats, position) {
    const isDefender = position === "GOL" || position === "ZAG" || position.startsWith("L");
    let pts = 0;
    pts += (playerStats.goals || 0) * (isDefender ? 8 : 5);
    pts += (playerStats.assists || 0) * 3;
    if (isDefender && playerStats.cleanSheet) pts += 4;
    pts += (playerStats.saves || 0) * 1.5;
    pts -= (playerStats.yellowCards || 0) * 1;
    pts -= (playerStats.redCards || 0) * 3;
    pts -= (playerStats.ownGoals || 0) * 3;
    pts -= (playerStats.penaltiesMissed || 0) * 2;
    return Math.round(pts * 10) / 10;
  }

  async processRound(fixtures, tokenToPlayer) {
    const tokenIds = [];
    const points = [];

    for (const [tokenId, info] of tokenToPlayer.entries()) {
      const stats = this._extractStats(fixtures, info.apiPlayerId);
      if (!stats) continue;
      const pts = this.computePoints(stats, info.position);
      tokenIds.push(tokenId);
      points.push(Math.round(pts * 100));
    }

    if (this.registrar && tokenIds.length > 0) {
      await this.registrar(tokenIds, points);
      console.log(`[Oracle] ${tokenIds.length} performances registered on-chain`);
    }
    return { tokenIds, points };
  }

  _extractStats(fixtures, apiPlayerId) {
    for (const fx of fixtures) {
      const p = (fx.players || []).find((pl) => pl.id === apiPlayerId);
      if (p) return p.stats;
    }
    return null;
  }

  starsForRound(fixtures) {
    const stars = [];
    for (const fx of fixtures) {
      for (const p of fx.players || []) {
        const s = p.stats || {};
        if ((s.goals || 0) >= 2 || (s.rating || 0) >= 8.5) {
          stars.push({ apiPlayerId: p.id, reason: (s.goals >= 2 ? "multigol" : "craque") });
        }
      }
    }
    return stars;
  }

  clearCache() {
    this.cache.clear();
  }
}
