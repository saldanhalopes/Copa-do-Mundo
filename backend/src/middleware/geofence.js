import {
  detectCountry,
  isBlockedForPacks,
  isBlockedForStaking,
  isVPNRisk,
  getCountryName,
} from "../services/geolocation.js";

const auditLog = [];

export function logBlockedAttempt(req, action, countryCode, reason) {
  const entry = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.socket?.remoteAddress || "unknown",
    countryCode,
    action,
    reason,
    path: req.originalUrl,
    method: req.method,
    userAgent: req.headers["user-agent"],
    user: req.user?.address || null,
  };
  auditLog.push(entry);
  console.warn(`[Geofence] BLOCKED ${action} for ${countryCode} (${reason})`, entry);
}

export function getAuditLog(limit = 100) {
  return auditLog.slice(-limit);
}

export function blockPacks() {
  return (req, res, next) => {
    const geo = detectCountry(req);
    req.geo = geo;

    if (geo.countryCode && isBlockedForPacks(geo.countryCode)) {
      const vpnRisk = isVPNRisk(geo.countryCode, req);
      if (vpnRisk) {
        logBlockedAttempt(req, "pack_purchase", geo.countryCode, "vpn_detected");
        return res.status(403).json({
          error: "GEO_BLOCKED_VPN",
          message: "VPN detected. Please disable your VPN to purchase packs.",
          countryCode: geo.countryCode,
        });
      }

      logBlockedAttempt(req, "pack_purchase", geo.countryCode, "jurisdiction_blocked");
      return res.status(403).json({
        error: "GEO_BLOCKED",
        message: `Pack purchases are not available in ${getCountryName(geo.countryCode)}`,
        countryCode: geo.countryCode,
      });
    }

    if (!geo.countryCode && req.method !== "OPTIONS") {
      console.warn(`[Geofence] No country detected for ${req.ip}: packs allowed but logged`);
    }

    next();
  };
}

export function blockStaking() {
  return (req, res, next) => {
    const geo = detectCountry(req);
    req.geo = geo;

    if (geo.countryCode && isBlockedForStaking(geo.countryCode)) {
      logBlockedAttempt(req, "staking", geo.countryCode, "jurisdiction_blocked");
      return res.status(403).json({
        error: "GEO_BLOCKED",
        message: `Staked matches are not available in ${getCountryName(geo.countryCode)}`,
        countryCode: geo.countryCode,
      });
    }

    next();
  };
}

export function geoStatus(req, res, next) {
  const geo = detectCountry(req);
  req.geo = geo;
  next();
}

export function getGeoStatus(req) {
  const geo = detectCountry(req);
  return {
    countryCode: geo.countryCode,
    countryName: geo.countryCode ? getCountryName(geo.countryCode) : null,
    source: geo.source,
    packsAllowed: !geo.countryCode || !isBlockedForPacks(geo.countryCode),
    stakingAllowed: !geo.countryCode || !isBlockedForStaking(geo.countryCode),
    vpnRisk: geo.countryCode ? isVPNRisk(geo.countryCode, req) : false,
  };
}
