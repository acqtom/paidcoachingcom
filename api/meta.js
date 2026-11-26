// Ad metrics for the dashboard: Meta Ads numbers + this site's submits/bookings for the same days.
// Needs META_ACCESS_TOKEN (read-only, ads_read) and META_AD_ACCOUNT_ID ("act_123…") in Vercel.
const { redis, day, send, authed, TZ } = require("./_lib");
const { score } = require("./_slack");
const GRAPH = "https://graph.facebook.com/v21.0/";
const QUALIFIED = 3; // a "qualified call" = booked by a lead scoring at least this (Warm or Hot, out of 7)

const num = (v) => Number(v) || 0;
const act = (list, type) => num((list || []).find((a) => a.action_type === type)?.value);
async function graph(path, params) {
  const u = new URL(GRAPH + path);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, typeof v === "string" ? v : JSON.stringify(v));
  u.searchParams.set("access_token", process.env.META_ACCESS_TOKEN);
  const r = await fetch(u, { signal: AbortSignal.timeout(15000) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error((j.error && j.error.message) || "Meta HTTP " + r.status);
  return j;
}
const metrics = (x) => ({
  spend: num(x.spend), impressions: num(x.impressions), clicks: num(x.inline_link_clicks),
  views3s: act(x.actions, "video_view"), thruplays: act(x.video_thruplay_watched_actions, "video_view"),
});

module.exports = async (req, res) => {
  if (!authed(req)) return send(res, 401);
  let account = String(process.env.META_AD_ACCOUNT_ID || "").trim();
  if (!process.env.META_ACCESS_TOKEN || !account) return send(res, 200, { connected: false });
  if (!account.startsWith("act_")) account = "act_" + account.replace(/\D/g, "");
  const n = Math.min(365, Math.max(1, parseInt(req.query.days, 10) || 7));
  const until = day(), since = new Date(new Date(until + "T12:00:00Z").getTime() - (n - 1) * 864e5).toISOString().slice(0, 10);
  const cacheKey = `meta:${account}:${since}:${until}`;
  try {
    const [cached] = await redis([["GET", cacheKey]]);
    if (cached && req.query.fresh !== "1") return send(res, 200, JSON.parse(cached));

    const fields = "spend,impressions,inline_link_clicks,actions,video_thruplay_watched_actions";
    const time_range = { since, until };
    const [info, total, perAd] = await Promise.all([
      graph(account, { fields: "currency,name,timezone_name" }),
      graph(account + "/insights", { fields, time_range, level: "account" }),
      graph(account + "/insights", { fields: fields + ",ad_id,ad_name", time_range, level: "ad", limit: 200, sort: "spend_descending" }),
    ]);

    // This site's submits and bookings for the same days (all devices and sources)
    const dates = [];
    for (let i = 0; i < n; i++) dates.push(new Date(new Date(since + "T12:00:00Z").getTime() + i * 864e5).toISOString().slice(0, 10));
    const [rows, bookedAll] = await Promise.all([redis(dates.map((d) => ["HGETALL", "d:" + d])), redis([["HGETALL", "leads:booked"]]).then((r) => r[0])]);
    const site = { sub: 0, book: 0, qualified: 0, byAd: {} };
    const addAd = (ad, k, v) => { if (!ad) return; site.byAd[ad] = site.byAd[ad] || { sub: 0, book: 0, qualified: 0 }; site.byAd[ad][k] += v; };
    rows.forEach((r) => {
      const f = {}; if (Array.isArray(r)) for (let j = 0; j < r.length; j += 2) f[r[j]] = Number(r[j + 1]); else Object.assign(f, r || {});
      for (const [k, v] of Object.entries(f)) {
        const [, src, m] = k.split("|");
        if (m === "sub" || m === "book") { site[m] += Number(v); addAd(src, m, Number(v)); }
      }
    });
    // qualified calls: bookings in this period from leads scoring Warm or Hot
    const booked = {};
    if (Array.isArray(bookedAll)) for (let j = 0; j < bookedAll.length; j += 2) booked[bookedAll[j]] = bookedAll[j + 1]; else Object.assign(booked, bookedAll || {});
    const ids = Object.entries(booked).filter(([, at]) => { const d = day(new Date(at)); return d >= since && d <= until; }).map(([id]) => id);
    if (ids.length) {
      const [leads] = await redis([["MGET", ...ids.map((id) => "lead:" + id)]]);
      leads.forEach((raw) => {
        if (!raw) return;
        const l = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (score(l).score >= QUALIFIED) { site.qualified++; addAd(l.utm_content || l.utm_campaign || l.utm_source, "qualified", 1); }
      });
    }

    const out = {
      connected: true, since, until, tz: TZ, accountTz: info.timezone_name, currency: info.currency || "USD", account: info.name,
      total: metrics((total.data || [])[0] || {}), site: { sub: site.sub, book: site.book, qualified: site.qualified },
      ads: (perAd.data || []).map((a) => ({ id: a.ad_id, name: a.ad_name, ...metrics(a), site: site.byAd[a.ad_name] || site.byAd[a.ad_id] || { sub: 0, book: 0, qualified: 0 } })),
      more: !!(perAd.paging && perAd.paging.next),
    };
    await redis([["SET", cacheKey, JSON.stringify(out), "EX", 600]]); // Meta data is cached for 10 minutes
    return send(res, 200, out);
  } catch (e) {
    console.error(e);
    return send(res, 200, { connected: true, error: /token|OAuth|session|permission/i.test(e.message) ? "Meta rejected the access key. Check META_ACCESS_TOKEN in Vercel (it needs ads_read)." : "Couldn’t load from Meta: " + e.message });
  }
};
