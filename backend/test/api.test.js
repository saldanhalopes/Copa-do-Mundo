import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { app, server } from "../src/server.js";
import http from "http";

const BASE = `http://localhost:3099`;

function request(method, path, body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "localhost",
      port: 3099,
      path,
      method,
      headers: { "Content-Type": "application/json", ...extraHeaders },
    };
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe("API Server", () => {
  before(() => {
    process.env.NODE_ENV = "test";
    process.env.PORT = "3099";
    server.close();
    server.listen(3099);
  });

  after(() => {
    server.close();
  });

  it("GET /health should return ok", async () => {
    const res = await request("GET", "/health");
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(typeof res.body.uptime, "number");
    assert.equal(typeof res.body.db, "object");
  });

  it("GET /metrics should return Prometheus text", async () => {
    const res = await request("GET", "/metrics");
    assert.equal(res.status, 200);
    assert(res.body.includes("cryptoalbum_uptime_seconds"));
    assert(res.body.includes("cryptoalbum_requests_total"));
    assert(res.body.includes("cryptoalbum_active_connections"));
  });

  it("POST /auth/login should return a token", async () => {
    const res = await request("POST", "/auth/login", {
      address: "0xabc123",
    });
    assert.equal(res.status, 200);
    assert.equal(typeof res.body.token, "string");
    assert.equal(res.body.address, "0xabc123");
  });

  it("POST /auth/login should reject missing address", async () => {
    const res = await request("POST", "/auth/login", {});
    assert.equal(res.status, 400);
    assert.equal(res.body.error, "Address is required");
  });

  it("GET /leaderboard should return paginated results", async () => {
    const res = await request("GET", "/leaderboard?limit=10&offset=0");
    assert.equal(res.status, 200);
    assert.equal(Array.isArray(res.body.data), true);
    assert.equal(res.body.limit, 10);
  });

  it("GET /elo/:address should return default ELO for unknown player", async () => {
    const res = await request("GET", "/elo/0xunknown123");
    assert.equal(res.status, 200);
    assert.equal(res.body.elo, 1000);
  });

  it("GET /matches should return match list", async () => {
    const res = await request("GET", "/matches?limit=5");
    assert.equal(res.status, 200);
    assert.equal(Array.isArray(res.body.data), true);
  });

  it("GET /history/:address should return match history", async () => {
    const res = await request("GET", "/history/0xabc123?limit=5");
    assert.equal(res.status, 200);
    assert.equal(Array.isArray(res.body.data), true);
  });

  it("should set rate limit headers", async () => {
    const res = await request("GET", "/health");
    assert.equal(res.status, 200);
    assert(res.headers["x-ratelimit-limit"] !== undefined);
    assert(res.headers["x-ratelimit-remaining"] !== undefined);
    assert(res.headers["x-ratelimit-reset"] !== undefined);
  });

  // ─── Age Verification Tests (within same server lifecycle) ───

  const adultAddr = "0xAGE_ADULT_" + Date.now();
  const minorAddr = "0xAGE_MINOR_" + Date.now();
  const childAddr = "0xAGE_CHILD_" + Date.now();
  let adultToken;
  let coppaConsentToken;

  it("POST /auth/register should register an adult", async () => {
    const res = await request("POST", "/auth/register", {
      address: adultAddr,
      dateOfBirth: "1990-06-01",
    });
    assert.equal(res.status, 200);
    assert.equal(typeof res.body.token, "string");
    assert.equal(res.body.age, 36);
    assert.equal(res.body.purchaseLimits.requireParental, false);
    adultToken = res.body.token;
  });

  it("POST /auth/register should reject missing DOB", async () => {
    const res = await request("POST", "/auth/register", {
      address: "0xmissing_dob",
    });
    assert.equal(res.status, 400);
    assert.equal(res.body.error, "dateOfBirth is required");
  });

  it("POST /auth/register should reject under 13 (COPPA)", async () => {
    const res = await request("POST", "/auth/register", {
      address: childAddr,
      dateOfBirth: "2020-01-01",
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.error, "COPPA_REQUIRED");
  });

  it("POST /kyc/parental-consent/init should create consent request", async () => {
    const res = await request("POST", "/kyc/parental-consent/init", {
      minorAddress: childAddr,
      parentEmail: "parent@example.com",
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(typeof res.body.consentToken, "string");
    coppaConsentToken = res.body.consentToken;
  });

  it("POST /kyc/parental-consent/confirm should confirm consent", async () => {
    const res = await request("POST", "/kyc/parental-consent/confirm", {
      consentToken: coppaConsentToken,
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
  });

  it("POST /auth/register-coppa should register under-13 with consent", async () => {
    const res = await request("POST", "/auth/register-coppa", {
      address: childAddr,
      dateOfBirth: "2020-01-01",
      parentEmail: "parent@example.com",
      consentToken: coppaConsentToken,
    });
    assert.equal(res.status, 200);
    assert.equal(typeof res.body.token, "string");
    assert.equal(res.body.parentalConsent, true);
    assert.equal(res.body.purchaseLimits.requireParental, true);
    assert.equal(res.body.purchaseLimits.maxDaily, 0);
  });

  it("POST /kyc/age should record age verification", async () => {
    const res = await request("POST", "/kyc/age", {
      dateOfBirth: "1990-06-01",
      method: "self_declared",
    }, { Authorization: `Bearer ${adultToken}` });
    assert.equal(res.status, 200);
    assert.equal(res.body.ok, true);
    assert.equal(res.body.age, 36);
  });

  it("GET /kyc/purchase-limits should return age-based limits", async () => {
    const res = await request("GET", "/kyc/purchase-limits", null, { Authorization: `Bearer ${adultToken}` });
    assert.equal(res.status, 200);
    assert.equal(res.body.verified, true);
    assert.equal(res.body.age, 36);
    assert.equal(res.body.limits.requireParental, false);
  });
});
