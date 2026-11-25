// Morning report to Slack: yesterday's numbers vs the day before.
// Vercel Cron calls this at 09:00 and 10:00 UTC; it sends once, at the first run that's 5am or later in New York,
// so it lands at 5am Eastern in both winter and summer time.
const { redis, day, send, authed, TZ } = require("./_lib");
const { post, section, context, esc, QUESTIONS } = require("./_slack");

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
const engagement = (t) => { let w = 0; for (let i = 0; i < 10; i++) w += t["w" + i]; return t.play ? w / (t.play * 10) : 0; };

async function report(date) {
  const prev = new Date(new Date(date + "T12:00:00Z").getTime() - 864e5).toISOString().slice(0, 10);
  const [a, b] = await redis([["HGETALL", "d:" + date], ["HGETALL", "d:" + prev]]);
  const { t, bySrc } = totals(parse(a)), y = totals(parse(b)).t;
  const change = (now, before, isRate) => {
    if (before === null || before === undefined) return "";
    const d = now - before;
    if (!d) return "  (same)";
    return "  (" + (d > 0 ? "▲ " : "▼ ") + (isRate ? Math.abs(d * 100).toFixed(1) + " pts" : Math.abs(d)) + ")";
  };
  const r = (x, n) => (n ? x / n : 0);
  const line = (label, value, now, before, isRate) => `• *${label}:* ${value}${y.view || !isRate ? change(now, before, isRate) : ""}`;
  const started = t["a_" + QUESTIONS[0][0]];
  const lines = [
    line("Page visit → booked call", pct2(t.book, t.view), r(t.book, t.view), r(y.book, y.view), true),
    line("Page visits", t.view, t.view, y.view),
    line("Calls booked", t.book, t.book, y.book),
    line("Applications submitted", t.sub, t.sub, y.sub),
    line("VSL play rate", pct(t.play, t.view), r(t.play, t.view), r(y.play, y.view), true),
    line("VSL engagement", (engagement(t) * 100).toFixed(1) + "%", engagement(t), engagement(y), true),
    line("Button click rate", pct(t.click, t.view), r(t.click, t.view), r(y.click, y.view), true),
    line("Form completion", pct(t.sub, started) + ` (${t.sub} of ${started} who started)`, r(t.sub, started), r(y.sub, started ? y["a_" + QUESTIONS[0][0]] : 0) && r(y.sub, y["a_" + QUESTIONS[0][0]]), true),
  ];
  // where people left the form
  let reached = t.seen;
  const drops = QUESTIONS.map(([id], i) => { const done = t["a_" + id], left = Math.max(0, reached - done); reached = done; return `Q${i + 1}: ${left}`; });
  drops.push("Calendar: " + Math.max(0, t.sub - t.book));
  const ads = Object.entries(bySrc).filter(([, v]) => v.view).sort((x, z) => (z[1].book || 0) - (x[1].book || 0) || z[1].view - x[1].view).slice(0, 5)
    .map(([s, v]) => `• ${esc(s)}: ${v.view} visits, ${v.sub || 0} submits, ${v.book || 0} booked (${pct2(v.book || 0, v.view)})`);
  const nice = new Date(date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: "UTC" });
  const blocks = [
    section(`:bar_chart: *Daily metrics: ${nice}*`),
    section(t.view || t.sub ? lines.join("\n") : "No visits were recorded yesterday."),
    ...(t.seen ? [section("*Where people left the form:* " + drops.join("  ·  "))] : []),
    ...(ads.length ? [section("*Top ads / sources*\n" + ads.join("\n"))] : []),
    context(`Compared with the day before. Days run midnight to midnight ${TZ.split("/").pop().replace("_", " ")} time. Full numbers: paidcoaching.com/dashboard`),
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
