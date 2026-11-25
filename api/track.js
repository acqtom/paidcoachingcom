// Counts anonymous events per day. No personal data, no visitor IDs.
const { redis, day, ipKey, body, sameOrigin, send } = require("./_lib");
const OK = /^(view|click|click_(hero|proof|framework)|play|w[0-9]|seen|a_[a-z0-9_]{1,40}|sub|book)$/;
const BOT = /bot|crawl|spider|headless|preview|facebookexternalhit|lighthouse|slurp|curl|python/i;
const hits = new Map(); // soft per-IP limit, kept in memory so it costs no storage commands

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405);
  if (!sameOrigin(req)) return send(res, 403);
  if (BOT.test(req.headers["user-agent"] || "bot")) return send(res, 204);
  const who = ipKey(req), now = Date.now(), h = hits.get(who);
  if (hits.size > 5000) hits.clear();
  if (h && now - h.t < 60000) { if (++h.n > 60) return send(res, 429); } else hits.set(who, { t: now, n: 1 });

  const b = body(req);
  const events = [...new Set(Array.isArray(b.e) ? b.e.slice(0, 40) : [])].filter((e) => typeof e === "string" && OK.test(e));
  if (!events.length) return send(res, 204);
  const dev = b.d === "m" ? "m" : "d";
  let src = String(b.s || "").replace(/[^\w .-]/g, "").trim().slice(0, 50) || "Direct / none";
  const k = "d:" + day();
  try {
    if (src !== "Direct / none" && (await redis([["HLEN", k]]))[0] > 4000) src = "Other";
    await redis(events.map((e) => ["HINCRBY", k, dev + "|" + src + "|" + e, 1]));
    return send(res, 204);
  } catch (e) { console.error(e); return send(res, 503); }
};
