// Same ids and order as APPLY_QUESTIONS in /apply-form.js
const QUESTIONS = [["has_high_ticket_offer", "High-ticket offer right now?"], ["situation", "Current situation"], ["niche", "Niche and what they do (optional)"], ["contact", "Name, phone and email"], ["monthly_revenue", "Monthly revenue + Submit"]];
const BUTTONS = [["click_hero", "Under the video"], ["click_proof", "Under the proof cards"], ["click_framework", "Under the 3-part framework"]];
const $ = (id) => document.getElementById(id);
const el = (tag, cls, ...kids) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  n.append(...kids.filter((k) => k != null).map((k) => (typeof k === "number" ? String(k) : k)));
  return n;
};
const pct = (a, b) => (b ? (Math.round(Math.min(1, a / b) * 1000) / 10).toFixed(1).replace(/\.0$/, "") + "%" : "–");
const pct2 = (a, b) => (b ? (Math.min(1, a / b) * 100).toFixed(2) + "%" : "–"); // small rates need two decimals
let data = null, leads = [], leadTotal = 0;

const fail = (msg) => { $("app-err").textContent = msg; $("app-err").hidden = !msg; };
function show(inside) {
  $("login").hidden = inside; $("app").hidden = !inside;
  if (!inside) $("pw").focus();
}
async function api(path, opt) {
  const r = await fetch(path, { cache: "no-store", ...opt });
  if (r.status === 401 && path !== "/api/login") { show(false); throw new Error("logged out"); }
  return r;
}

// ---- Tooltip
const tip = el("div", "tip");
tip.hidden = true;
document.body.append(tip);
function hint(node, text) {
  node.tabIndex = 0;
  node.setAttribute("role", "img");
  node.setAttribute("aria-label", text);
  const place = (x, y) => {
    tip.textContent = text; tip.hidden = false;
    tip.style.left = Math.max(8, Math.min(x + 14, innerWidth - tip.offsetWidth - 10)) + "px";
    tip.style.top = Math.max(8, y - tip.offsetHeight - 10) + "px";
  };
  node.addEventListener("pointermove", (e) => place(e.clientX, e.clientY));
  node.addEventListener("focus", () => { const b = node.getBoundingClientRect(); place(b.left, b.top); });
  ["pointerleave", "blur"].forEach((ev) => node.addEventListener(ev, () => { tip.hidden = true; }));
  return node;
}
function table(head, rows) {
  const t = el("table"), tr = el("tr"), b = el("tbody");
  head.forEach((h, i) => tr.append(el("th", i ? "n" : "", h)));
  rows.forEach((r) => {
    const x = el("tr");
    r.forEach((c, i) => x.append(el("td", i ? "n" : "", c)));
    b.append(x);
  });
  t.append(el("thead", "", tr), b);
  return el("div", "wrap", t);
}

// ---- Dashboard
function sum(filter) {
  const t = {};
  data.days.forEach((d) => Object.entries(d.f).forEach(([k, v]) => {
    const [dev, src, m] = k.split("|");
    if (filter(dev, src)) t[m] = (t[m] || 0) + v;
  }));
  return new Proxy(t, { get: (o, k) => o[k] || 0 });
}
const sources = () => [...new Set(data.days.flatMap((d) => Object.keys(d.f).map((k) => k.split("|")[1])))].sort();
const engagement = (t) => {
  let w = 0;
  for (let i = 0; i < 10; i++) w += t["w" + i];
  return pct(w, t.play * 10);
};
function renderStats() {
  const dev = $("f-dev").value, src = $("f-src").value;
  const t = sum((d, s) => (!dev || d === dev) && (!src || s === src));
  const out = $("stats");
  out.replaceChildren();
  const tile = (k, v, d) => el("div", "tile", el("p", "tile__k", k), el("p", "tile__v", v), el("p", "tile__d", d));
  const started = t["a_" + QUESTIONS[0][0]];
  const key = tile("Page visit → booked call", pct2(t.book, t.view), t.book + " of " + t.view + " visits booked a call");
  key.classList.add("tile--key");
  out.append(el("div", "tiles", key,
    tile("Page visits", t.view.toLocaleString(), "One per browser visit"),
    tile("VSL play rate", pct(t.play, t.view), t.play + " of " + t.view + " pressed play"),
    tile("VSL engagement", engagement(t), "Average share watched by players"),
    tile("Button click rate", pct(t.click, t.view), t.click + " of " + t.view + " clicked a button"),
    tile("Form completion", pct(t.sub, started), t.sub + " of " + started + " who started it"),
    tile("Calls booked", t.book.toLocaleString(), pct(t.book, t.sub) + " of submits")));
  if (!t.view) out.append(el("div", "card empty", "No visits recorded for this selection yet."));

  // Question drop-off
  const card = el("div", "card", el("h2", "", "Where people leave the form"), el("p", "", "How many reached each question and went no further."));
  const steps = [];
  let reached = t.seen;
  QUESTIONS.forEach(([id, label], i) => {
    const done = t["a_" + id];
    steps.push({ label: (i + 1) + ". " + label, reached, left: Math.max(0, reached - done) });
    reached = done;
  });
  steps.push({ label: "Calendar: submitted but didn’t book", reached: t.sub, left: Math.max(0, t.sub - t.book) });
  const max = Math.max(1, ...steps.map((s) => s.left)), drop = el("div", "drop");
  steps.forEach((s) => {
    const fill = el("i"), share = pct(s.left, s.reached);
    fill.style.width = (s.left / max) * 100 + "%";
    const row = el("div", "drop__row", el("div", "drop__q", s.label, el("small", "", s.reached + " reached it")), el("div", "bar", fill), el("div", "drop__n", el("b", "", s.left), " left (" + share + ")"));
    drop.append(hint(row, s.label + ": " + s.reached + " reached it, " + s.left + " left here (" + share + ")"));
  });
  card.append(drop);
  out.append(card);

  // VSL watch chart + buttons
  const vsl = el("div", "card", el("h2", "", "How much of the VSL gets watched"), el("p", "", "Of everyone who pressed play, the share who watched each tenth of the video."));
  const cols = el("div", "cols"), xs = el("div", "cols__x");
  [0, 25, 50, 75, 100].forEach((y) => {
    const l = el("span", "cols__y", y + "%");
    l.style.bottom = y + "%";
    cols.append(l);
    if (y) { const g = el("span", "cols__g"); g.style.bottom = y + "%"; cols.append(g); }
  });
  for (let i = 0; i < 10; i++) {
    const n = t["w" + i], bar = el("i");
    bar.style.height = (t.play ? Math.min(1, n / t.play) : 0) * 100 + "%";
    cols.append(hint(el("div", "col", bar), i * 10 + "–" + (i * 10 + 10) + "% of the video: watched by " + pct(n, t.play) + " of players (" + n + " of " + t.play + ")"));
    xs.append(el("span", "", i * 10 + "%"));
  }
  vsl.append(cols, xs);
  const btn = el("div", "card", el("h2", "", "Button clicks"), el("p", "", "Visits that clicked each button. One visit can click more than one."), table(["Button", "Visits", "Rate"], BUTTONS.map(([id, l]) => [l, t[id], pct(t[id], t.view)])));
  out.append(el("div", "grid", vsl, btn));

  // By ad / source
  const rows = sources().map((s) => [s, sum((d, x) => x === s && (!dev || d === dev))]).filter((r) => r[1].view || r[1].sub).sort((a, b) => b[1].view - a[1].view).slice(0, 50);
  if (rows.length) {
    out.append(el("div", "card", el("h2", "", "By ad / source"), el("p", "", "From utm_content, else utm_campaign, else utm_source."),
      table(["Ad / source", "Visits", "Play rate", "Engagement", "Click rate", "Submits", "Booked", "Visit → booked"], rows.map(([s, x]) => [s, x.view, pct(x.play, x.view), engagement(x), pct(x.click, x.view), x.sub, x.book, pct2(x.book, x.view)]))));
  }
  out.append(el("p", "note", "Days start at midnight " + data.tz.split("/").pop().replace("_", " ") + " time. Coming back in a new tab counts as a new visit. A visit that’s still open can show as having left."));
}
async function loadStats() {
  fail("");
  try {
    const r = await api("/api/stats?days=" + $("f-days").value);
    if (!r.ok) throw new Error((await r.json()).error);
    data = await r.json();
    const keep = $("f-src").value, all = sources();
    $("f-src").replaceChildren(new Option("All", ""), ...all.map((s) => new Option(s, s)));
    if (all.includes(keep)) $("f-src").value = keep;
    renderStats();
  } catch (e) { if (e.message !== "logged out") fail("Couldn’t load the numbers. " + (e.message || "")); }
}

// ---- Form answers
const COLS = [["at", "Submitted"], ["first_name", "Name"], ["email", "Email"], ["phone", "Phone"], ["booked_at", "Booked"], ["monthly_revenue", "Revenue"], ["has_high_ticket_offer", "High-ticket offer"], ["situation", "Situation"], ["niche", "Niche"], ["sms_consent", "SMS consent"], ["utm_source", "Source"], ["utm_campaign", "Campaign"], ["utm_content", "Ad"]];
const when = (s) => (s ? new Date(s).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "");
function found() {
  const q = $("search").value.trim().toLowerCase();
  return q ? leads.filter((l) => Object.values(l).join(" ").toLowerCase().includes(q)) : leads;
}
async function remove(l) {
  if (!confirm("Permanently delete " + l.first_name + "’s answers?")) return;
  try {
    const r = await api("/api/leads", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: l.id }) });
    if (!r.ok) throw new Error();
    leads = leads.filter((x) => x !== l); leadTotal--;
    renderLeads();
  } catch (e) { fail("Couldn’t delete that entry."); }
}
function renderLeads() {
  const rows = found(), out = $("leads");
  out.replaceChildren();
  if (!rows.length) { out.append(el("div", "card empty", leads.length ? "No answers match that search." : "No one has submitted the form yet.")); return; }
  const t = el("table"), hr = el("tr"), b = el("tbody");
  COLS.forEach(([, h]) => hr.append(el("th", "", h)));
  hr.append(el("th", "", ""));
  t.append(el("thead", "", hr), b);
  rows.forEach((l) => {
    const tr = el("tr");
    COLS.forEach(([k]) => {
      const cls = ["at", "phone", "first_name", "monthly_revenue"].includes(k) ? "nw" : ["niche", "situation"].includes(k) ? "long" : "";
      let v = l[k] || "";
      if (k === "at") v = when(v);
      else if (k === "booked_at") v = el("span", v ? "tag tag--yes" : "tag", v ? "✓ Booked" : "Not booked");
      else if (k === "sms_consent") v = v ? "Yes" : "No";
      else if (k === "email" || k === "phone") {
        const a = el("a", "", v);
        a.href = k === "email" ? "mailto:" + encodeURIComponent(v).replace("%40", "@") : "tel:" + v.replace(/[^\d+]/g, "");
        v = a;
      }
      tr.append(el("td", cls, v));
    });
    const del = el("button", "", "Delete");
    del.type = "button";
    del.addEventListener("click", () => remove(l));
    tr.append(el("td", "", del));
    b.append(tr);
  });
  out.append(el("div", "wrap", t), el("p", "note", rows.length + " of " + leadTotal + " shown."));
  if (leads.length < leadTotal) {
    const more = el("button", "", "Load more");
    more.type = "button";
    more.addEventListener("click", () => loadLeads(true));
    out.append(more);
  }
}
async function loadLeads(more) {
  fail("");
  try {
    const r = await api("/api/leads?page=" + (more ? Math.floor(leads.length / 200) : 0));
    if (!r.ok) throw new Error((await r.json()).error);
    const j = await r.json(), known = new Set(more ? leads.map((l) => l.id) : []);
    leads = (more ? leads : []).concat(j.leads.filter((l) => !known.has(l.id)));
    leadTotal = j.total;
    renderLeads();
  } catch (e) { if (e.message !== "logged out") fail("Couldn’t load the answers. " + (e.message || "")); }
}
$("csv").addEventListener("click", () => {
  const cell = (v) => {
    v = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; // stops spreadsheets running text as a formula
    return '"' + v.replace(/"/g, '""') + '"';
  };
  const lines = [COLS.map((c) => cell(c[1]))].concat(found().map((l) => COLS.map(([k]) => cell(k === "sms_consent" ? (l[k] ? "Yes" : "No") : l[k]))));
  const a = el("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + lines.map((r) => r.join(",")).join("\r\n")], { type: "text/csv" }));
  a.download = "form-answers.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
});
$("search").addEventListener("input", renderLeads);

// ---- Tabs and login
function tab() {
  const t = location.hash === "#answers" ? "answers" : "dashboard";
  ["dashboard", "answers"].forEach((x) => { $("tab-" + x).hidden = x !== t; });
  document.querySelectorAll(".side nav a").forEach((a) => (a.dataset.tab === t ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  if (t === "answers") loadLeads(); else loadStats();
}
addEventListener("hashchange", () => { if (!$("app").hidden) tab(); });
$("f-days").addEventListener("change", loadStats);
$("refresh").addEventListener("click", loadStats);
["f-dev", "f-src"].forEach((i) => $(i).addEventListener("change", () => data && renderStats()));
$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("login-err").hidden = true;
  let msg = "Couldn’t reach the server.";
  try {
    const r = await api("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: $("pw").value }) });
    if (r.ok) { $("pw").value = ""; show(true); return tab(); }
    msg = (await r.json()).error;
  } catch (err) {}
  $("login-err").textContent = msg;
  $("login-err").hidden = false;
});
$("logout").addEventListener("click", async () => {
  try { await fetch("/api/login", { method: "DELETE" }); } catch (e) {}
  data = null; leads = [];
  $("leads").replaceChildren(); $("stats").replaceChildren();
  show(false);
});
async function action(btn, path, done) {
  btn.disabled = true;
  try {
    const r = await api(path, { method: "POST" });
    const j = await r.json().catch(() => ({}));
    alert(r.ok ? done(j) : "That didn’t work. " + (j.error || ""));
  } catch (e) { if (e.message !== "logged out") alert("Couldn’t reach the server."); }
  btn.disabled = false;
}
$("slack-test").addEventListener("click", (e) => action(e.target, "/api/slack-test", (j) => Object.entries(j).map(([k, v]) => k + ": " + v).join("\n")));
$("daily-now").addEventListener("click", (e) => action(e.target, "/api/daily", (j) => (j.sent ? "Sent to the daily metrics channel." : "Not sent. Is SLACK_METRICS_WEBHOOK_URL set in Vercel?")));
try { $("ignore").checked = localStorage.getItem("pc_ignore") === "1"; } catch (e) {}
$("ignore").addEventListener("change", (e) => {
  try { if (e.target.checked) localStorage.setItem("pc_ignore", "1"); else localStorage.removeItem("pc_ignore"); } catch (err) {}
});
fetch("/api/login", { cache: "no-store" }).then((r) => r.json()).then((j) => { show(j.ok); if (j.ok) tab(); }).catch(() => show(false));
