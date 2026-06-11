import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { app, server } from "../src/server.js";
import http from "http";

function request(method, path, body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "localhost",
      port: 3098,
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

describe("Geofencing", () => {
  let token;

  before(async () => {
    process.env.NODE_ENV = "test";
    process.env.PORT = "3098";
    server.close();
    server.listen(3098);
    const res = await request("POST", "/auth/login", { address: "0xgeo_test_user", role: "admin" });
    token = res.body.token;
  });

  after(() => {
    server.close();
  });

  it("GET /compliance/geofence-status should return geo status", async () => {
    const res = await request("GET", "/compliance/geofence-status");
    assert.equal(res.status, 200);
    assert.ok(res.body.countryCode === null || typeof res.body.countryCode === "string");
    assert.equal(typeof res.body.packsAllowed, "boolean");
    assert.equal(typeof res.body.stakingAllowed, "boolean");
    assert.equal(typeof res.body.vpnRisk, "boolean");
    assert.ok(res.body.blockedJurisdictions);
  });

  it("GET /compliance/blocked-jurisdictions should return jurisdiction config", async () => {
    const res = await request("GET", "/compliance/blocked-jurisdictions");
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.blockedForPacks));
    assert.ok(Array.isArray(res.body.blockedForStaking));
    assert.ok(res.body.blockedForPacks.includes("BE"));
  });

  it("GET /compliance/geofence-audit should require admin auth", async () => {
    const res = await request("GET", "/compliance/geofence-audit");
    assert.equal(res.status, 401);
  });

  it("POST /compliance/geofence-reload should require admin auth", async () => {
    const res = await request("POST", "/compliance/geofence-reload");
    assert.equal(res.status, 401);
  });

  it("POST /purchase/check should block blocked jurisdiction with CF header", async () => {
    const res = await request("POST", "/purchase/check", {
      amountUsd: 10,
      txType: "purchase",
    }, {
      Authorization: `Bearer ${token}`,
      "cf-ipcountry": "BE",
    });
    assert.equal(res.status, 403);
    assert.equal(res.body.error, "GEO_BLOCKED");
    assert.equal(res.body.countryCode, "BE");
  });

  it("POST /purchase/check should allow non-blocked jurisdiction", async () => {
    const res = await request("POST", "/purchase/check", {
      amountUsd: 10,
      txType: "purchase",
    }, {
      Authorization: `Bearer ${token}`,
      "cf-ipcountry": "BR",
    });
    assert.equal(res.status, 200);
    assert.equal(typeof res.body.allowed, "boolean");
  });

  it("POST /purchase/check should return 401 without auth", async () => {
    const res = await request("POST", "/purchase/check", {
      amountUsd: 10,
    });
    assert.equal(res.status, 401);
  });
});
