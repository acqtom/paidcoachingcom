// ---- Config ---------------------------------------------------------------
// Where every "Schedule My Free Strategy Session" button goes (Calendly, typeform, etc.)
const BOOKING_URL = "#";

// Paid vs organic results. Put screenshots in assets/compare/ (anything in [brackets] is a placeholder).
// Each stat row reads: inputs joined by "+"  →  outputs. Set `main: true` on the headline output.
const COMPARISONS = [
  {
    title: "From Organic To 12x ROAS In 30 Days",
    tags: ["B2C coaching offer", "Music niche", "$4k–$8k ticket", "100% cold traffic"],
    before: { label: "Organic", img: "assets/compare/1-organic.jpg", caption: "Screenshot: organic month (DMs, calendar or Stripe)" },
    after: { label: "Paid", img: "assets/compare/1-paid.jpg", caption: "Amount Won $97.29K · ROAS 12", fit: "contain" },
    body: "A B2C coaching offer in the music niche, selling at $4k–$8k, running on 100% cold traffic. We adapted the offer for paid, scripted the ads and VSL, and built the funnel. In 30 days, $8,000 of ad spend turned into $97K in cash collected. A 12x return on every dollar.",
    inputs: [["$8,000", "Ad spend"], ["30", "Days"]],
    outputs: [["$97K", "Cash collected"], ["12x", "ROAS", true]],
  },
  {
    title: "You Don't Have To Post More To Grow",
    before: { label: "Organic", img: "assets/compare/2-organic.jpg", caption: "Screenshot: organic results" },
    after: { label: "Paid", img: "assets/compare/2-paid.jpg", caption: "Screenshot: paid results" },
    body: "[Client] had hit the ceiling of their content. More posts weren't bringing more calls, and every slow week showed up in their revenue. We turned their best organic angles into paid ads and pointed them at a PIF offer built for cold traffic. Same offer, same coach. [$X] in, [$X] out, and a calendar that fills whether they post or not.",
    inputs: [["[$X]", "Ad spend"], ["[X]", "PIF sales"]],
    outputs: [["[$X]", "Cash collected"], ["[X]x", "ROAS", true]],
  },
  {
    title: "Stop Letting The Algorithm Decide Your Income",
    before: { label: "Organic", img: "assets/compare/3-organic.jpg", caption: "Screenshot: organic results" },
    after: { label: "Paid", img: "assets/compare/3-paid.jpg", caption: "Screenshot: paid results" },
    body: "[Client] had great months and empty months, and no way of knowing which was coming. One post would go viral, the next ten wouldn't, and their revenue followed. We built a paid funnel that runs every day regardless of reach. Within 30 days they were booking [X] calls a week from ads alone, and the swings were gone.",
    inputs: [["[$X]", "Ad spend"], ["[X]", "Calls / week"]],
    outputs: [["[$X]", "Cash collected"], ["[X]x", "ROAS", true]],
  },
];

// First-30-days chart. `roas` sets the height of each point (0–5x). Use \n in a label to wrap it.
const MILESTONES = [
  { when: "Today", roas: 0, label: "Onboarding & Audit" },
  { when: "Week 1", roas: 0.3, label: "DFY Setup Complete,\nAds Live" },
  { when: "Week 2", roas: 1.2, label: "Performance Review\n& Iteration" },
  { when: "Week 3", roas: 2.8, label: "Double Down" },
  { when: "Week 4", roas: 5, label: "A Profitable 5x ROAS\nPaid Funnel" },
];

// ---- CTAs -----------------------------------------------------------------
document.querySelectorAll(".js-cta").forEach((a) => {
  a.href = BOOKING_URL;
  if (/^https?:/.test(BOOKING_URL)) a.target = "_blank";
});
document.getElementById("year").textContent = new Date().getFullYear();

// ---- Star field -----------------------------------------------------------
(function stars() {
  const layer = document.querySelector(".stars");
  const frag = document.createDocumentFragment();
  for (let i = 0; i < 90; i++) {
    const s = document.createElement("span");
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.opacity = (0.25 + Math.random() * 0.6).toFixed(2);
    if (Math.random() < 0.2) s.style.width = s.style.height = "1px";
    frag.appendChild(s);
  }
  layer.appendChild(frag);
})();

// ---- VSL: autoplay muted, click to restart with sound ----------------------
(function vsl() {
  const wrap = document.getElementById("vsl");
  const video = document.getElementById("vsl-video");
  document.getElementById("vsl-unmute").addEventListener("click", () => {
    video.currentTime = 0;
    video.muted = false;
    video.loop = false;
    video.controls = true;
    video.play().catch(() => {});
    wrap.classList.add("is-unmuted");
  });
})();

// ---- Paid vs organic results ---------------------------------------------
(function results() {
  const media = (side, cls) => `
    <figure class="result__img">
      <span class="result__label ${cls}">${side.label}</span>
      <img src="${side.img}" alt="${side.label} results: ${side.caption}" loading="lazy"${side.fit ? ` style="object-fit:${side.fit}"` : ""} onerror="this.remove()" />
      <figcaption>${side.caption}</figcaption>
    </figure>`;
  const tile = ([value, label, main], cls) =>
    `<div class="stat ${cls}${main ? " stat--main" : ""}"><strong>${value}</strong><span>${label}</span></div>`;

  document.getElementById("results").innerHTML = COMPARISONS.map((c) => `
    <article class="result panel">
      <h3 class="result__pill">${c.title}</h3>
      ${c.tags ? `<ul class="result__tags">${c.tags.map((t) => `<li>${t}</li>`).join("")}</ul>` : ""}
      <div class="result__pair">${media(c.before, "result__label--organic")}${media(c.after, "result__label--paid")}</div>
      <p class="result__body">${c.body}</p>
      <div class="equation">
        ${c.inputs.map((i) => tile(i, "stat--in")).join('<span class="equation__op">+</span>')}
        <span class="equation__op equation__arrow">→</span>
        ${c.outputs.map((o) => tile(o, "stat--out")).join("")}
      </div>
    </article>`).join("");
})();

// ---- Growth chart ---------------------------------------------------------
(function chart() {
  const svg = document.getElementById("growth-chart");
  const W = 860, H = 420;
  const L = 70, R = 815, T = 95, B = 370, MAX = 5;
  const x = (i) => L + (i / (MILESTONES.length - 1)) * (R - L);
  const y = (v) => B - (v / MAX) * (B - T);
  const pts = MILESTONES.map((m, i) => [x(i), y(m.roas)]);

  // Smooth curve through points (Catmull-Rom → cubic Bézier)
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, Math.min(B, p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, Math.min(B, p2[1] - (p3[1] - p1[1]) / 6)];
    d += ` C${c1},${c2},${p2}`;
  }

  let out = `
    <defs>
      <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#0050e6" stop-opacity="0.35"/>
        <stop offset="1" stop-color="#0050e6" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="halo"><stop offset="0" stop-color="#0050e6" stop-opacity="0.35"/><stop offset="1" stop-color="#0050e6" stop-opacity="0"/></radialGradient>
    </defs>
    <text x="${L}" y="${T - 34}" fill="rgba(17,17,17,0.7)" font-size="11" letter-spacing="1.5" font-weight="600">ROAS</text>`;

  for (let v = 0; v <= MAX; v++) {
    out += `<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(17,17,17,${v === 0 ? 0.35 : 0.12})"/>`;
    out += `<text x="${L - 14}" y="${y(v) + 4}" fill="rgba(17,17,17,0.75)" font-size="12" text-anchor="end">${v === 0 ? "0" : v + "x"}</text>`;
  }
  MILESTONES.forEach((m, i) => {
    out += `<text x="${x(i)}" y="${B + 24}" fill="rgba(17,17,17,0.75)" font-size="12" text-anchor="middle">${m.when}</text>`;
  });

  out += `<path d="${d} L${R},${B} L${L},${B} Z" fill="url(#area)"/>`;
  out += `<path d="${d}" fill="none" stroke="#0050e6" stroke-width="3" stroke-linecap="round"/>`;

  MILESTONES.forEach((m, i) => {
    const [px, py] = pts[i];
    out += `<line x1="${px}" x2="${px}" y1="${py}" y2="${B}" stroke="#0050e6" stroke-opacity="0.5" stroke-dasharray="3 4"/>`;
    out += `<circle cx="${px}" cy="${py}" r="18" fill="url(#halo)"/>`;
    out += `<circle cx="${px}" cy="${py}" r="8" fill="#0050e6" stroke="#ffffff" stroke-width="2.5"/>`;
    out += `<circle cx="${px}" cy="${py}" r="3" fill="#ffffff"/>`;

    // Callout box above the point, kept inside the plot area.
    // Points that sit low on the curve alternate heights so neighbours don't overlap.
    const lines = m.label.split("\n");
    const w = Math.max(90, Math.max(...lines.map((l) => l.length)) * 8.6 + 26), h = 28 + lines.length * 18;
    let bx = px - w / 2;
    if (i === MILESTONES.length - 1) bx = px - w + 4; // last one hangs left
    bx = Math.max(L, Math.min(R - w, bx));
    const lift = py > B - 60 && i % 2 === 1 ? 62 : 0;
    const by = py - h - 18 - lift;
    out += `<g>
      <rect x="${bx}" y="${by}" width="${w}" height="${h}" rx="7" fill="#111111" stroke="#111111"/>
      <text x="${bx + 13}" y="${by + 18}" fill="#ecf0f1" font-size="10" font-weight="600" letter-spacing="1.2">${m.when.toUpperCase()}</text>
      ${lines.map((l, k) => `<text x="${bx + 13}" y="${by + 36 + k * 18}" fill="#ffffff" font-size="14" font-weight="700" font-family="Figtree, sans-serif">${l}</text>`).join("")}
    </g>`;
  });

  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  svg.innerHTML = out;
})();
