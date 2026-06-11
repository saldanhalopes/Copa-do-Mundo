import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let geoData = null;

function loadGeoData() {
  if (geoData) return geoData;
  try {
    const raw = fs.readFileSync(
      path.join(__dirname, "..", "..", "blocked-jurisdictions.json"),
      "utf-8"
    );
    geoData = JSON.parse(raw);
    return geoData;
  } catch {
    console.warn("[GeoLocation] Could not load blocked-jurisdictions.json, using defaults");
    geoData = { blockedForPacks: ["BE", "NL"], countryNames: { BE: "Belgium", NL: "Netherlands" } };
    return geoData;
  }
}

const PRIVATE_RANGES = [
  { start: "10.0.0.0", end: "10.255.255.255" },
  { start: "172.16.0.0", end: "172.31.255.255" },
  { start: "192.168.0.0", end: "192.168.255.255" },
  { start: "127.0.0.0", end: "127.255.255.255" },
];

function ipToLong(ip) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

function isPrivateIP(ip) {
  const long = ipToLong(ip);
  return PRIVATE_RANGES.some((r) => {
    const start = ipToLong(r.start);
    const end = ipToLong(r.end);
    return long >= start && long <= end;
  });
}

const VPN_IP_RANGES = [];

export function detectCountry(req) {
  const cfCountry = req.headers["cf-ipcountry"];
  if (cfCountry && cfCountry.length === 2) {
    return { countryCode: cfCountry.toUpperCase(), source: "cloudflare" };
  }

  const xff = req.headers["x-forwarded-for"];
  const ip = xff ? xff.split(",")[0].trim() : req.ip || req.socket?.remoteAddress;

  if (!ip || isPrivateIP(ip)) {
    return { countryCode: null, source: "private_or_unknown" };
  }

  const testCountry = req.query?.countryCode;
  if (testCountry && testCountry.length === 2) {
    return { countryCode: testCountry.toUpperCase(), source: "query_param" };
  }

  return { countryCode: null, source: "unknown" };
}

export function isVPNRisk(countryCode, req) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
    || req.ip || req.socket?.remoteAddress;
  if (!ip || isPrivateIP(ip)) return false;

  const long = ipToLong(ip);
  const inVpnRange = VPN_IP_RANGES.some((r) => {
    if (r.countries?.includes(countryCode)) return false;
    const start = ipToLong(r.start);
    const end = ipToLong(r.end);
    return long >= start && long <= end;
  });
  if (inVpnRange) return true;

  const threshold = geoData?.riskFlags?.defaultVPNThreshold || 30;
  const rttMs = req._geofenceRttMs || 0;
  if (rttMs > threshold) return true;

  return false;
}

export function isBlockedForPacks(countryCode) {
  if (!countryCode) return false;
  const data = loadGeoData();
  return data.blockedForPacks.includes(countryCode);
}

export function isBlockedForStaking(countryCode) {
  if (!countryCode) return false;
  const data = loadGeoData();
  return data.blockedForStaking.includes(countryCode);
}

export function getCountryName(countryCode) {
  const data = loadGeoData();
  return data.countryNames?.[countryCode] || countryCode;
}

export function getBlockedJurisdictions() {
  return loadGeoData();
}

export function reloadJurisdictions() {
  geoData = null;
  return loadGeoData();
}
