// Saves one application, or marks it as booked. Writing only; reading needs the dashboard login (api/leads.js).
const { redis, ipKey, body, sameOrigin, send } = require("./_lib");
const slack = require("./_slack");
const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
const FIELDS = { first_name: 100, email: 200, phone: 30, has_high_ticket_offer: 200, situation: 200, niche: 2000, monthly_revenue: 100, utm_source: 200, utm_medium: 200, utm_campaign: 200, utm_content: 200, utm_term: 200, ad_id: 100, fbclid: 500 };

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405);
  if (!sameOrigin(req)) return send(res, 403);
  const b = body(req);
  if (!UUID.test(b.id || "")) return send(res, 400);
  try {
    const rl = "rl:apply:" + ipKey(req);
    const [n] = await redis([["INCR", rl], ["EXPIRE", rl, 3600, "NX"]]);
    if (n > 30) return send(res, 429);
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
    if (!lead.first_name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email || "") || !lead.phone) return send(res, 400);
    // NX: a retry of the same submission never overwrites or duplicates it
    const [saved] = await redis([["SET", "lead:" + b.id, JSON.stringify(lead), "NX"], ["ZADD", "leads", "NX", Date.now(), b.id]]);
    if (saved) await slack.newLead(lead); // only the first time, so a retry doesn't post twice
    return send(res, 204);
  } catch (e) { console.error(e); return send(res, 503); }
};
