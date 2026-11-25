// Dashboard button: sends one test message to every Slack channel that's set up, and says which aren't.
const { send, authed, sameOrigin } = require("./_lib");
const { post, HOOKS } = require("./_slack");
const NAMES = { leads: "New leads", booked: "Booked calls", scoring: "Lead scoring", metrics: "Daily metrics", dropoff: "Form drop-offs" };

module.exports = async (req, res) => {
  if (!authed(req)) return send(res, 401);
  if (req.method !== "POST" || !sameOrigin(req)) return send(res, 405);
  const out = {};
  await Promise.all(Object.keys(HOOKS).map(async (k) => {
    out[NAMES[k]] = process.env[HOOKS[k]] ? ((await post(k, `:white_check_mark: Test from paidcoaching.com/dashboard. This channel gets: ${NAMES[k]}.`)) ? "sent" : "failed") : "not set up (" + HOOKS[k] + ")";
  }));
  out["Morning report timer"] = process.env.CRON_SECRET ? "set up" : "not set up (CRON_SECRET)";
  return send(res, 200, out);
};
