// Called by the form when someone leaves part-way. Answers before the contact step are anonymous.
const { redis, ipKey, body, sameOrigin, send } = require("./_lib");
const { post, section, fields, context, esc, cut, QUESTIONS } = require("./_slack");
const IDS = QUESTIONS.map((q) => q[0]);
const UUID = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;

module.exports = async (req, res) => {
  if (req.method !== "POST") return send(res, 405);
  if (!sameOrigin(req)) return send(res, 403);
  const b = body(req);
  const step = String(b.step || "");
  if (step !== "calendar" && !IDS.includes(step)) return send(res, 400);
  try {
    const rl = "rl:drop:" + ipKey(req);
    const [n] = await redis([["INCR", rl], ["EXPIRE", rl, 3600, "NX"]]);
    if (n > 20) return send(res, 429);
    const src = cut(String(b.s || "").replace(/[^\w .-]/g, ""), 60) || "No UTM tags";
    const where = (b.d === "m" ? "Phone" : "Desktop") + "  ·  " + esc(src) + (Number(b.secs) > 0 ? "  ·  " + Math.round(Number(b.secs)) + "s on the form" : "");

    if (step === "calendar") { // submitted but didn't book: we know who they are
      if (!UUID.test(b.id || "")) return send(res, 400);
      const [raw, booked] = await redis([["GET", "lead:" + b.id], ["HGET", "leads:booked", b.id]]);
      if (!raw || booked) return send(res, 204);
      const [first] = await redis([["SET", "drop:" + b.id, "1", "NX", "EX", 86400 * 30]]);
      if (!first) return send(res, 204);
      const l = typeof raw === "string" ? JSON.parse(raw) : raw;
      await post("dropoff", `Dropped off at the calendar: ${l.first_name}`, [
        section(`:door: *Dropped off at: the booking calendar*\n${esc(l.first_name)} submitted the form but didn’t book a call.`),
        fields([["Email", l.email], ["Phone", l.phone], ["Monthly revenue", l.monthly_revenue], ["Capital", l.capital]]),
        context(where),
      ]);
      return send(res, 204);
    }

    const i = IDS.indexOf(step), a = b.answers && typeof b.answers === "object" ? b.answers : {};
    const given = QUESTIONS.slice(0, i).filter(([id]) => id !== "contact" && typeof a[id] === "string" && a[id].trim()).map(([id, q]) => [q, cut(a[id].trim(), 300)]);
    if (!i) return send(res, 204); // must have answered at least question 1
    await post("dropoff", `Dropped off at question ${i + 1}`, [
      section(`:door: *Dropped off at question ${i + 1}:* ${esc(QUESTIONS[i][1])}`),
      ...(given.length ? [fields(given.map(([q, v]) => [q, v]))] : []),
      context(where + (i > 3 ? "  ·  Contact details aren’t sent until they submit" : "")),
    ]);
    return send(res, 204);
  } catch (e) { console.error(e); return send(res, 503); }
};
