import config from "../config.js";

const startTime = Date.now();
const requestCounts = { total: 0, byStatus: {} };
let activeConnections = 0;

export function requestLogger(req, res, next) {
  const start = Date.now();
  activeConnections++;

  res.on("finish", () => {
    const duration = Date.now() - start;
    requestCounts.total++;
    const statusGroup = `${Math.floor(res.statusCode / 100)}xx`;
    requestCounts.byStatus[statusGroup] = (requestCounts.byStatus[statusGroup] || 0) + 1;
    activeConnections--;

    if (config.NODE_ENV !== "test") {
      console.log(
        `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
      );
    }
  });

  next();
}

export function requestTimer(req, res, next) {
  const start = Date.now();
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    res.locals.duration = Date.now() - start;
    return originalJson(body);
  };
  next();
}

export function metricsMiddleware(req, res) {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const lines = [
    "# HELP cryptoalbum_uptime_seconds Server uptime in seconds",
    "# TYPE cryptoalbum_uptime_seconds gauge",
    `cryptoalbum_uptime_seconds ${uptime}`,
    "",
    "# HELP cryptoalbum_requests_total Total HTTP requests",
    "# TYPE cryptoalbum_requests_total counter",
    `cryptoalbum_requests_total ${requestCounts.total}`,
    "",
    "# HELP cryptoalbum_requests_by_status Requests by status group",
    "# TYPE cryptoalbum_requests_by_status counter",
    ...Object.entries(requestCounts.byStatus).map(
      ([group, count]) => `cryptoalbum_requests_by_status{status="${group}"} ${count}`
    ),
    "",
    "# HELP cryptoalbum_active_connections Active connections",
    "# TYPE cryptoalbum_active_connections gauge",
    `cryptoalbum_active_connections ${activeConnections}`,
  ];

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(lines.join("\n"));
}
