// Dashboard "Reset data": deletes every visit/VSL/form-step count. Saved form answers are kept.
const { redis, send, authed, sameOrigin, body } = require("./_lib");

module.exports = async (req, res) => {
  if (!authed(req)) return send(res, 401);
  if (req.method !== "POST" || !sameOrigin(req)) return send(res, 405);
  if (body(req).confirm !== "RESET") return send(res, 400, { error: "Not confirmed." });
  try {
    let deleted = 0;
    for (const pattern of ["d:*", "v:*"]) {
      let cursor = "0";
      do {
        const [[next, keys]] = await redis([["SCAN", cursor, "MATCH", pattern, "COUNT", 500]]);
        cursor = String(next);
        if (keys.length) { await redis([["DEL", ...keys]]); deleted += keys.length; }
      } while (cursor !== "0");
    }
    await redis([["DEL", "vsl:dur"]]);
    return send(res, 200, { deleted });
  } catch (e) { console.error(e); return send(res, 503, { error: "Storage isn’t reachable." }); }
};
