const { redis, ipKey, body, sameOrigin, send, same, session, authed } = require("./_lib");
const cookie = (v, age) => `pc_dash=${v}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;

module.exports = async (req, res) => {
  if (req.method === "GET") return send(res, 200, { ok: authed(req) });
  if (!sameOrigin(req)) return send(res, 403);
  if (req.method === "DELETE") { res.setHeader("Set-Cookie", cookie("", 0)); return send(res, 204); }
  if (req.method !== "POST") return send(res, 405);
  if (!process.env.DASHBOARD_PASSWORD) return send(res, 503, { error: "DASHBOARD_PASSWORD isn’t set in Vercel." });
  try {
    const rl = "rl:login:" + ipKey(req);
    const [n] = await redis([["INCR", rl], ["EXPIRE", rl, 900, "NX"]]);
    if (n > 10) return send(res, 429, { error: "Too many tries. Wait 15 minutes." });
    if (!same(body(req).password || "", process.env.DASHBOARD_PASSWORD)) return send(res, 401, { error: "Wrong password." });
    await redis([["DEL", rl]]);
  } catch (e) { console.error(e); return send(res, 503, { error: "Storage isn’t reachable." }); }
  res.setHeader("Set-Cookie", cookie(session(), 7 * 86400));
  return send(res, 204);
};
