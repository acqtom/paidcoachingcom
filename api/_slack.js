// Slack messages. Each channel is an incoming webhook set in Vercel; an unset one is simply skipped.
const HOOKS = {
  leads: "SLACK_WEBHOOK_URL",
  booked: "SLACK_BOOKED_WEBHOOK_URL",
  scoring: "SLACK_SCORING_WEBHOOK_URL",
  metrics: "SLACK_METRICS_WEBHOOK_URL",
  dropoff: "SLACK_DROPOFF_WEBHOOK_URL",
};
// Same ids and order as APPLY_QUESTIONS in /apply-form.js
const QUESTIONS = [
  ["has_high_ticket_offer", "Do you have a high-ticket offer right now?"],
  ["situation", "Which best describes your current situation?"],
  ["niche", "What niche are you in, and what do you do?"],
  ["contact", "Name, phone and email"],
  ["monthly_revenue", "Estimated monthly revenue"],
  ["capital", "Capital to build the mentorship (then Submit)"],
];

// Escape text so it can't ping @channel or break formatting
const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const cut = (v, n) => { v = String(v ?? ""); return v.length > n ? v.slice(0, n - 1) + "…" : v; };

async function post(channel, text, blocks) {
  const url = process.env[HOOKS[channel]];
  if (!url || !/^https:\/\/hooks\.slack\.com\//.test(url)) return false;
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(blocks ? { text, blocks } : { text }), signal: AbortSignal.timeout(4000) });
    if (!res.ok) console.error("slack", channel, res.status, await res.text());
    return res.ok;
  } catch (e) { console.error("slack", channel, e.message); return false; }
}
const section = (md) => ({ type: "section", text: { type: "mrkdwn", text: cut(md, 2900) } });
const fields = (pairs) => ({ type: "section", fields: pairs.filter(([, v]) => v !== undefined && v !== "").slice(0, 10).map(([k, v]) => ({ type: "mrkdwn", text: cut("*" + k + "*\n" + esc(v), 1900) })) });
const context = (md) => ({ type: "context", elements: [{ type: "mrkdwn", text: cut(md, 2900) }] });
const source = (l) => [l.utm_content && "Ad: " + l.utm_content, l.utm_campaign && "Campaign: " + l.utm_campaign, l.utm_source && "Source: " + l.utm_source].filter(Boolean).map(esc).join("  ·  ") || "No UTM tags (direct or untagged link)";

// ---- Lead scoring (out of 10). Edit the points here.
// A "qualified call" = a booked call from someone with $3k+ capital (see qualified()).
const qualified = (l) => /^\$(3k|6k|10k)/.test(l.capital || "");
function score(l) {
  const why = [];
  let s = 0;
  const rev = l.monthly_revenue || "";
  const revPts = /^\$0/.test(rev) ? 0 : /^\$10k/.test(rev) ? 1 : /^\$20k/.test(rev) ? 2 : rev ? 3 : 0;
  s += revPts; why.push(`Revenue ${rev || "not given"}: +${revPts}`);
  const offer = /^yes/i.test(l.has_high_ticket_offer || "") ? 1 : 0;
  s += offer; why.push(`High-ticket offer now (${l.has_high_ticket_offer || "no answer"}): +${offer}`);
  const sit = l.situation || "";
  const sitPts = /currently selling/i.test(sit) ? 2 : /personal brand/i.test(sit) ? 1 : 0;
  s += sitPts; why.push(`Situation: +${sitPts}`);
  const niche = l.niche && l.niche.trim().length >= 3 ? 1 : 0;
  s += niche; why.push(`Answered the niche question: +${niche}`);
  const cap = l.capital || "";
  const capPts = /^\$3k/.test(cap) ? 2 : /^\$(6k|10k)/.test(cap) ? 3 : /^\$1k/.test(cap) ? 1 : 0;
  s += capPts; why.push(`Capital ${cap || "not given"}: +${capPts}`);
  const label = s >= 7 ? "🔥 Hot" : s >= 4 ? "🟠 Warm" : "🔵 Cold";
  return { score: s, label, why };
}

function leadMessages(l) {
  const sc = score(l), who = esc(l.first_name);
  const contact = [["Email", l.email], ["Phone", l.phone]];
  const answers = [["High-ticket offer now", l.has_high_ticket_offer], ["Situation", l.situation], ["Monthly revenue", l.monthly_revenue], ["Capital", l.capital], ["SMS consent", l.sms_consent ? "Yes" : "No"]];
  return {
    lead: [`New application: ${l.first_name}`, [
      section(`:inbox_tray: *New application: ${who}*  ·  ${sc.label} (${sc.score}/10)`),
      fields([...contact, ...answers]),
      ...(l.niche ? [section("*Niche and what they do*\n" + esc(cut(l.niche, 1500)))] : []),
      context(source(l)),
    ]],
    score: [`${sc.label} lead (${sc.score}/10): ${l.first_name}`, [
      section(`*${sc.label} lead: ${who}*  ·  *${sc.score}/10*\n${esc(l.email)}  ·  ${esc(l.phone)}`),
      section(sc.why.map((w) => "• " + esc(w)).join("\n")),
      context(source(l)),
    ]],
  };
}
async function newLead(l) {
  const m = leadMessages(l);
  await Promise.all([post("leads", ...m.lead), post("scoring", ...m.score)]);
}
async function booked(l) {
  const sc = score(l);
  await post("booked", `Call booked: ${l.first_name}`, [
    section(`:calendar: *Call booked: ${esc(l.first_name)}*  ·  ${sc.label} (${sc.score}/10)`),
    fields([["Email", l.email], ["Phone", l.phone], ["Monthly revenue", l.monthly_revenue], ["Capital", l.capital], ["Situation", l.situation]]),
    context(source(l) + "  ·  Call time is in Calendly"),
  ]);
}
module.exports = { qualified, post, section, fields, context, esc, cut, score, newLead, booked, source, QUESTIONS, HOOKS };
