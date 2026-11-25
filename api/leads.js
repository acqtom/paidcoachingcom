const { redis, send, authed, sameOrigin, body } = require("./_lib");
module.exports = async (req, res) => {
  if (!authed(req)) return send(res, 401);
  try {
    if (req.method === "DELETE") {
      if (!sameOrigin(req)) return send(res, 403);
      const id = String(body(req).id || "");
      if (!/^[0-9a-f-]{36}$/.test(id)) return send(res, 400);
      await redis([["DEL", "lead:" + id], ["ZREM", "leads", id], ["HDEL", "leads:booked", id]]);
      return send(res, 204);
    }
    if (req.method !== "GET") return send(res, 405);
    const page = Math.max(0, parseInt(req.query.page, 10) || 0), size = 200;
    const [ids, total] = await redis([["ZREVRANGE", "leads", page * size, (page + 1) * size - 1], ["ZCARD", "leads"]]);
    if (!ids.length) return send(res, 200, { total, leads: [] });
    const [rows, booked] = await redis([["MGET", ...ids.map((i) => "lead:" + i)], ["HMGET", "leads:booked", ...ids]]);
    const bk = (i) => (Array.isArray(booked) ? booked[i] : booked[ids[i]]) || null;
    const leads = rows.map((r, i) => (r ? { ...(typeof r === "string" ? JSON.parse(r) : r), booked_at: bk(i) } : null)).filter(Boolean);
    return send(res, 200, { total, size, leads });
  } catch (e) { console.error(e); return send(res, 503, { error: "Storage isn’t reachable." }); }
};
