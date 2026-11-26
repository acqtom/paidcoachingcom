// Saves one application (or a partial one after each answered question), or marks it as booked. Writing only; reading needs the dashboard login (api/leads.js).
const { redis, ipKey, body, sameOrigin, send } = require("./_lib");
const slack = require("./_slack");
const STEPS = slack.QUESTIONS.map((q) => q[0]);
const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const FIELDS = { first_name: 100, email: 200, phone: 30, has_high_ticket_offer: 200, situation: 200, niche: 2000, monthly_revenue: 100, capital: 100, utm_source: 200, utm_medium: 200, utm_campaign: 200, utm_content: 200, utm_term: 200, ad_id: 100, fbclid: 500 };

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405);
  if (!sameOrigin(req)) return send(res, 403);
  const b = body(req);
  if (!UUID.test(b.id || "")) return send(res, 400);
  try {
    const rl = "rl:apply:" + ipKey(req);
    const [n] = await redis([["INCR", rl], ["EXPIRE", rl, 3600, "NX"]]);
    if (n > (b.partial === true ? 120 : 30)) return send(res, 429);
    if (b.booked === true) {
      const [raw] = await redis([["GET", "lead:" + b.id]]);
      if (raw) {
        const [isNew] = await redis([["HSETNX", "leads:booked", b.id, new Date().toISOString()]]);
        if (isNew) await slack.booked(typeof raw === "string" ? JSON.parse(raw) : raw);
      }
      return send(res, 204);
    }
    const lead = { id: b.id, at: new Date().toISOString(), sms_consent: b.sms_consent === true };
    for (const [k, max] of Object.entries(FIELDS)) if (typeof b[k] === "string" && b[k].trim()) lead[k] = b[k].trim().slice(0, max);
    const [old] = await redis([["GET", "lead:" + b.id]]);
    const prev = old ? (typeof old === "string" ? JSON.parse(old) : old) : null;
    if (prev && !prev.partial) return send(res, 204); // already submitted: never overwrite, never post twice

    if (b.partial === true) { // progress so far; the full submit replaces it
      if (!STEPS.includes(b.stopped_at)) return send(res, 400);
      lead.partial = true; lead.stopped_at = b.stopped_at;
      if (prev) lead.started = prev.started || prev.at;
      await redis([["SET", "lead:" + b.id, JSON.stringify(lead), "EX", 86400 * 400], ["ZADD", "leads", Date.now(), b.id]]);
      return send(res, 204);
    }
    if (!lead.first_name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email || "") || !lead.phone) return send(res, 400);
    if (prev) lead.started = prev.started || prev.at;
    await redis([["SET", "lead:" + b.id, JSON.stringify(lead)], ["ZADD", "leads", Date.now(), b.id]]);
    await slack.newLead(lead);
    return send(res, 204);
  } catch (e) { console.error(e); return send(res, 503); }
};
