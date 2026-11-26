// Ad metrics for the dashboard (logic in _meta.js). Needs META_ACCESS_TOKEN + META_AD_ACCOUNT_ID in Vercel.
const { range, send, authed } = require("./_lib");
const { metaReport, metaError } = require("./_meta");

module.exports = async (req, res) => {
  if (!authed(req)) return send(res, 401);
  const { since, until, dates } = range(req.query, 7);
  try { return send(res, 200, await metaReport(since, until, dates)); }
  catch (e) { console.error(e); return send(res, 200, { connected: true, error: metaError(e) }); }
};
