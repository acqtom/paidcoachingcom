// Morning report to Slack: yesterday's numbers vs the day before.
// Vercel Cron calls this at 09:00 and 10:00 UTC; it sends once, at the first run that's 5am or later in New York,
// so it lands at 5am Eastern in both winter and summer time.
const { redis, day, send, authed, TZ } = require("./_lib");
const { post, section, context, esc, QUESTIONS } = require("./_slack");
const { metaReport, metaError } = require("./_meta");

const pct = (a, b) => (b ? (Math.min(1, a / b) * 100).toFixed(1).replace(/\.0$/, "") + "%" : "–");
const pct2 = (a, b) => (b ? (Math.min(1, a / b) * 100).toFixed(2) + "%" : "–");
function totals(f) {
  const t = {}, bySrc = {};
  for (const [k, v] of Object.entries(f)) {
    const [, src, m] = k.split("|");
    t[m] = (t[m] || 0) + v;
    if (m === "view" || m === "book" || m === "sub") { bySrc[src] = bySrc[src] || {}; bySrc[src][m] = (bySrc[src][m] || 0) + v; }
  }
  return { t: new Proxy(t, { get: (o, k) => o[k] || 0 }), bySrc };
}
const parse = (r) => { const f = {}; if (Array.isArray(r)) for (let j = 0; j < r.length; j += 2) f[r[j]] = Number(r[j + 1]); else for (const k in r || {}) f[k] = Number(r[k]); return f; };
const BUTTONS = [["click_hero", "Under the video"], ["click_proof", "Under the proof cards"], ["click_framework", "Under the 3-part framework"]];
const shift = (d, n) => new Date(new Date(d + "T12:00:00Z").getTime() + n * 864e5).toISOString().slice(0, 10);
const clock = (sec) => Math.floor(sec / 60) + ":" + String(Math.floor(sec % 60)).padStart(2, "0");

// Everything the dashboard shows, for one day
async function dayStats(date, dur) {
  const [a, v] = await redis([["HGETALL", "d:" + date], ["HGETALL", "v:" + date]]);
  const { t, bySrc } = totals(parse(a));
  // VSL: viewers by furthest second
  const h = {};
  for (const [k, c] of Object.entries(parse(v))) { const sec = Number(k.split("|")[2]); h[sec] = (h[sec] || 0) + Math.max(0, c); }
  const plays = Object.values(h).reduce((x, y) => x + y, 0);
  const avg = plays ? Object.entries(h).reduce((x, [sec, n]) => x + sec * n, 0) / plays : 0;
  const stillAt = (sec) => (plays ? Object.entries(h).filter(([s2]) => Number(s2) >= sec).reduce((x, [, n]) => x + n, 0) / plays : 0);
  let eng;
  if (plays && dur) eng = Math.min(1, avg / dur);
  else { let w = 0; for (let i = 0; i < 10; i++) w += t["w" + i]; eng = t.play ? w / (t.play * 10) : 0; }
  return { t, bySrc, plays, avg, stillAt, eng };
}

async function report(date) {
  const prev = shift(date, -1);
  const [durRaw] = await redis([["GET", "vsl:dur"]]);
  const dur = Number(durRaw) || 0;
  const [D, P] = await Promise.all([dayStats(date, dur), dayStats(prev, dur)]);
  const t = D.t, y = P.t;
  let meta = null, metaY = null, metaErr = "";
  try { [meta, metaY] = await Promise.all([metaReport(date, date, [date]), metaReport(prev, prev, [prev])]); }
  catch (e) { console.error(e); metaErr = metaError(e); }

  const r = (x, n) => (n ? x / n : null);
  const arrow = (now, before, kind, better) => {
    if (now == null || before == null) return "";
    const d = now - before;
    if (Math.abs(d) < 1e-9) return "  _(same)_";
    const up = d > 0, good = better === "down" ? !up : up;
    if (better === "neutral") return `  ⚪ ${up ? "▲" : "▼"} ${kind === "money" ? money(Math.abs(d)) : Math.abs(d)}`;
    const amt = kind === "rate" ? Math.abs(d * 100).toFixed(1) + " pts" : kind === "money" ? money(Math.abs(d)) : Math.abs(d).toLocaleString("en-US");
    return `  ${good ? "🟢" : "🔴"} ${up ? "▲" : "▼"} ${amt}`;
  };
  const cur = (meta && meta.currency) || "USD";
  const money = (v, dp = 2) => (v == null || !isFinite(v) ? "–" : new Intl.NumberFormat("en-US", { style: "currency", currency: cur, minimumFractionDigits: dp, maximumFractionDigits: dp }).format(v));
  const goal = (val, lo, hi) => (val == null ? "" : val >= lo ? "  ✅ target " + (hi ? Math.round(lo * 100) + "–" + Math.round(hi * 100) : Math.round(lo * 100)) + "%" : "  ❌ target " + (hi ? Math.round(lo * 100) + "–" + Math.round(hi * 100) : Math.round(lo * 100)) + "%");
  const L = (label, shown, extra = "") => `• *${label}:* ${shown}${extra}`;

  // ---- Ad metrics
  let adBlock;
  if (metaErr) adBlock = metaErr;
  else if (!meta || !meta.connected) adBlock = "Meta isn’t connected.";
  else {
    const A = meta.total, B = metaY.total, s = meta.site, sy = metaY.site;
    const per = (sp, n) => (n ? sp / n : null);
    adBlock = [
      L("Ad spend", money(A.spend), arrow(A.spend, B.spend, "money", "neutral")),
      L("Cost per click", money(per(A.spend, A.clicks)), arrow(per(A.spend, A.clicks), per(B.spend, B.clicks), "money", "down") + `  (${A.clicks} link clicks)`),
      L("Ad CTR", pct(A.clicks, A.impressions), arrow(r(A.clicks, A.impressions), r(B.clicks, B.impressions), "rate") + `  (${A.impressions.toLocaleString("en-US")} impressions)`),
      L("Ad hook rate", pct(A.views3s, A.impressions), arrow(r(A.views3s, A.impressions), r(B.views3s, B.impressions), "rate")),
      L("Ad retention rate", pct(A.thruplays, A.views3s), arrow(r(A.thruplays, A.views3s), r(B.thruplays, B.views3s), "rate")),
      L("Cost per lead", money(per(A.spend, s.sub)), arrow(per(A.spend, s.sub), per(B.spend, sy.sub), "money", "down") + `  (${s.sub} leads)`),
      L("Cost per call", money(per(A.spend, s.book)), arrow(per(A.spend, s.book), per(B.spend, sy.book), "money", "down") + `  (${s.book} calls)`),
      L("⭐ Cost per qualified call", money(per(A.spend, s.qualified)), arrow(per(A.spend, s.qualified), per(B.spend, sy.qualified), "money", "down") + `  (${s.qualified} qualified)`),
    ].join("\n");
  }

  // ---- Funnel metrics
  const st = (x) => x["a_" + QUESTIONS[0][0]];
  const funnel = [
    L("⭐ Page visit → booked call", pct2(t.book, t.view), arrow(r(t.book, t.view), r(y.book, y.view), "rate") + goal(r(t.book, t.view) ?? null, 0.03, 0.05)),
    L("Page visits", t.view.toLocaleString("en-US"), arrow(t.view, y.view)),
    L("VSL play rate", pct(t.play, t.view), arrow(r(t.play, t.view), r(y.play, y.view), "rate") + goal(r(t.play, t.view), 0.5)),
    L("VSL engagement", (D.eng * 100).toFixed(1) + "%", arrow(t.play ? D.eng : null, y.play ? P.eng : null, "rate") + goal(t.play ? D.eng : null, 0.5)),
    L("Button click rate", pct(t.click, t.view), arrow(r(t.click, t.view), r(y.click, y.view), "rate")),
    L("Form completion", pct(t.sub, st(t)) + `  (${t.sub} of ${st(t)} who started)`, arrow(r(t.sub, st(t)), r(y.sub, st(y)), "rate")),
    L("Calls booked", t.book.toLocaleString("en-US"), arrow(t.book, y.book)),
    L("Submits that booked", pct(t.book, t.sub), arrow(r(t.book, t.sub), r(y.book, y.sub), "rate") + goal(r(t.book, t.sub), 0.84)),
  ].join("\n");

  // ---- Charts, summarized
  let reached = t.seen;
  const drops = QUESTIONS.map(([id, q], i) => { const done = t["a_" + id], left = Math.max(0, reached - done), line = `Q${i + 1} ${q.replace(" (then Submit)", "")}: *${left}* left of ${reached} (${pct(left, reached)})`; reached = done; return line; });
  drops.push(`Calendar (submitted, didn’t book): *${Math.max(0, t.sub - t.book)}* of ${t.sub} (${pct(Math.max(0, t.sub - t.book), t.sub)})`);
  const vsl = D.plays
    ? [`Plays tracked: ${D.plays}`, `Average watched: ${clock(D.avg)}${dur ? " of " + clock(dur) : ""}`, ...(dur ? [0.25, 0.5, 0.75, 0.95].map((f) => `Still watching at ${Math.round(f * 100)}% (${clock(dur * f)}): ${(D.stillAt(dur * f) * 100).toFixed(1)}%`) : [])].join("\n")
    : "No VSL plays with second-by-second tracking yesterday.";
  const buttons = BUTTONS.map(([k, l]) => `${l}: *${t[k]}* (${pct(t[k], t.view)})`).join("\n");
  const srcRows = Object.entries(D.bySrc).filter(([, v]) => v.view || v.sub).sort((a2, b2) => (b2[1].view || 0) - (a2[1].view || 0)).slice(0, 8)
    .map(([s2, v]) => `${esc(s2)}: ${v.view || 0} visits, ${v.sub || 0} submits, ${v.book || 0} booked (${pct2(v.book || 0, v.view || 0)})`);
  const adRows = meta && meta.connected && !metaErr ? meta.ads.filter((x) => x.spend > 0).slice(0, 8).map((x) => `${esc(x.name)}: ${money(x.spend, 0)} spend, CTR ${pct(x.clicks, x.impressions)}, hook ${pct(x.views3s, x.impressions)}, ${x.site.sub} leads, ${x.site.book} calls (${x.site.qualified} qualified)${x.site.book ? ", " + money(x.spend / x.site.book) + "/call" : ""}`) : [];

  // Top 3 ads by cost per qualified call (only ads that produced at least one)
  let top = [];
  if (meta && meta.connected && !metaErr) {
    top = meta.ads.filter((x) => x.site.qualified > 0).map((x) => ({ ...x, cpq: x.spend / x.site.qualified }))
      .sort((p1, p2) => p1.cpq - p2.cpq || p2.site.qualified - p1.site.qualified).slice(0, 3)
      .map((x, i) => `${["🥇", "🥈", "🥉"][i]} *${esc(x.name)}*: ${x.site.qualified} qualified call${x.site.qualified === 1 ? "" : "s"} at *${money(x.cpq)}* each  (${money(x.spend, 0)} spend)`);
  }
  const topBlock = "*🏆 Top 3 ads by cost per qualified call*\n" + (metaErr || !meta || !meta.connected ? "Meta isn’t connected." : top.length ? top.join("\n") : "No ad produced a qualified call yesterday.");
  const nice = new Date(date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
  const divider = { type: "divider" };
  const blocks = [
    section(`:bar_chart: *Daily metrics: ${nice}*`),
    section("*📣 Ad metrics*\n" + adBlock),
    section(topBlock),
    divider,
    section("*🧭 Funnel metrics*\n" + (t.view || t.sub ? funnel : "No visits were recorded.")),
    divider,
    section("*🚪 Where people left the form*\n" + drops.join("\n")),
    section("*🎬 VSL watch time*\n" + vsl),
    section("*👆 Button clicks*\n" + buttons),
    ...(adRows.length ? [section("*💸 By ad (Meta)*\n" + adRows.join("\n"))] : []),
    ...(srcRows.length ? [section("*🔗 By ad / source (site)*\n" + srcRows.join("\n"))] : []),
    context(`Changes are vs the day before (🟢 better, 🔴 worse). Days run midnight to midnight ${TZ.split("/").pop().replace("_", " ")} time; Meta uses the ad account’s time zone. Full dashboard: paidcoaching.com/dashboard`),
  ];
  return post("metrics", `Daily metrics: ${nice}`, blocks);
}

module.exports = async (req, res) => {
  const cron = process.env.CRON_SECRET && req.headers.authorization === "Bearer " + process.env.CRON_SECRET;
  if (!cron && !authed(req)) return send(res, 401);
  const today = day(), yesterday = new Date(new Date(today + "T12:00:00Z").getTime() - 864e5).toISOString().slice(0, 10);
  try {
    if (!cron) { // "Send now" from the dashboard
      if (req.method !== "POST") return send(res, 405);
      return send(res, 200, { sent: await report(yesterday) });
    }
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(new Date()));
    if (hour < 5) return send(res, 200, { skipped: "before 5am" });
    const [first] = await redis([["SET", "report:" + yesterday, "1", "NX", "EX", 86400 * 3]]);
    if (!first) return send(res, 200, { skipped: "already sent" });
    const ok = await report(yesterday);
    if (!ok) await redis([["DEL", "report:" + yesterday]]); // let the second run try again
    return send(res, 200, { sent: ok });
  } catch (e) { console.error(e); return send(res, 503); }
};
