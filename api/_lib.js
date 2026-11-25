// Shared helpers for the API (files starting with _ are not routes)
const crypto = require("crypto");
const TZ = process.env.DASHBOARD_TZ || "Pacific/Auckland"; // when a "day" starts on the dashboard

async function redis(cmds) {
  const url = process.env.KV_REST_API_URL, token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("storage not configured");
  const res = await fetch(url.replace(/\/$/, "") + "/pipeline", {
    method: "POST", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(cmds), signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error("storage HTTP " + res.status);
  return (await res.json()).map((r) => { if (r.error) throw new Error("storage: " + r.error); return r.result; });
}
const day = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
const sha = (s) => crypto.createHash("sha256").update(s).digest();
const ip = (req) => String(req.headers["x-real-ip"] || req.headers["x-forwarded-for"] || "?").split(",")[0].trim();
const ipKey = (req) => sha("pc:" + ip(req) + (process.env.KV_REST_API_TOKEN || "")).toString("hex").slice(0, 20); // never store raw IPs
function body(req) {
  const b = req.body;
  if (b && typeof b === "object" && !Buffer.isBuffer(b)) return b;
  try { return JSON.parse(String(b || "")) || {}; } catch (e) { return {}; }
}
function sameOrigin(req) {
  try { return new URL(req.headers.origin).host === req.headers.host; } catch (e) { return false; }
}
function send(res, code, data) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  if (data === undefined) return res.status(code).end();
  return res.status(code).json(data);
}
// ---- Login: signed cookie, valid 7 days; changing DASHBOARD_PASSWORD signs everyone out
const key = () => sha("pc-dashboard:" + process.env.DASHBOARD_PASSWORD);
const sign = (v) => crypto.createHmac("sha256", key()).update(v).digest("hex");
const same = (a, b) => crypto.timingSafeEqual(sha(String(a)), sha(String(b)));
function session() { const exp = String(Date.now() + 7 * 864e5); return exp + "." + sign(exp); }
function authed(req) {
  if (!process.env.DASHBOARD_PASSWORD) return false;
  const m = /(?:^|;\s*)pc_dash=([0-9]+)\.([0-9a-f]{64})/.exec(req.headers.cookie || "");
  return !!m && Number(m[1]) > Date.now() && same(m[2], sign(m[1]));
}
module.exports = { redis, day, ipKey, body, sameOrigin, send, same, session, authed, TZ };
