const { redis, range, send, authed, TZ } = require("./_lib");
module.exports = async (req, res) => {
  if (!authed(req)) return send(res, 401);
  const { dates: days, since, until } = range(req.query, 30);
  try {
    const rows = await redis([...days.map((d) => ["HGETALL", "d:" + d]), ...days.map((d) => ["HGETALL", "v:" + d]), ["GET", "vsl:dur"]]);
    const map = (r) => { const f = {}; if (Array.isArray(r)) for (let j = 0; j < r.length; j += 2) f[r[j]] = Number(r[j + 1]); else for (const k in r || {}) f[k] = Number(r[k]); return f; };
    const out = days.map((d, i) => ({ day: d, f: map(rows[i]), v: map(rows[days.length + i]) }));
    const vslDuration = Number(rows[rows.length - 1]) || 0;
    return send(res, 200, { tz: TZ, since, until, days: out, vslDuration });
  } catch (e) { console.error(e); return send(res, 503, { error: "Storage isn’t reachable." }); }
};
