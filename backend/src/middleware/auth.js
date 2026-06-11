import jwt from "jsonwebtoken";
import config from "../config.js";

const API_KEYS = new Map(
  (process.env.API_KEYS || "").split(",").filter(Boolean).map((k) => [k.trim(), true])
);

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header required" });
  }

  const [scheme, token] = authHeader.split(" ");
  if (!token) {
    return res.status(401).json({ error: "Malformed authorization header" });
  }

  if (scheme.toLowerCase() === "bearer") {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.user = decoded;
      req.authType = "jwt";
      return next();
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  }

  if (scheme.toLowerCase() === "apikey") {
    if (API_KEYS.has(token)) {
      req.user = { role: "api", apiKey: token };
      req.authType = "apikey";
      return next();
    }
    return res.status(401).json({ error: "Invalid API key" });
  }

  return res.status(401).json({ error: "Unsupported authorization scheme" });
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
