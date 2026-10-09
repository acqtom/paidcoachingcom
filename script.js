// ---- Config ---------------------------------------------------------------
// Paid vs organic results. Put screenshots in assets/compare/ (anything in [brackets] is a placeholder).
// Each stat row reads: inputs joined by "+"  →  outputs. Set `main: true` on the headline output.
const COMPARISONS = [
  {
    title: "Bleeding Cash To 12x ROAS",
    tags: ["B2C coaching offer", "Music niche", "$4k–$8k ticket", "100% cold traffic"],
    before: { label: "Organic", img: "assets/compare/1-organic.jpg", caption: "Screenshot: organic month (DMs, calendar or Stripe)", text: "This music production coach had a notable name in the space, so getting people to book calls wasn’t the issue. The problem was they were all financially unqualified. Anyone who had just heard of him recently threw more objections than typical warm traffic leads, came in more skeptical of the offer, and ultimately had to settle for small split payments of $250. His entire messaging could only close warm leads and that’s not scalable." },
    after: { label: "Paid", img: "assets/compare/1-paid.png", caption: "Amount Won $101.99K · ROAS 12", text: "We rebuilt the entire funnel from the ground up: VSL, Headlines, Landing Page Copy, Offer, Pre-Call Warm up Sequence, Setting Process, Closer Frameworks, Facebook Ads, Pixel Optimization, Confirmation Page, Email Marketing, Pricing Strategy, Student Testimonials, ICP, etc. The result was a business doing consistent $100k/months on pure cold traffic with an 8-12x monthly ROAS." },
    inputs: [["$8,000", "Ad spend"], ["30", "Days"]],
    outputs: [["$97K", "Cash collected"], ["12x", "ROAS", true]],
  },
  {
    title: "From $0/Month → $100K/Month",
    tags: ["B2C coaching offer", "Real estate niche", "$10k–$12k ticket", "90% cold traffic"],
    before: { label: "Before", img: "assets/compare/2-organic.jpg", caption: "Before: $0 cash collected from paid", text: "This was a partner we started fresh with. Validated the first $30k on organic, but leads were moving slow, we couldn't control the exact person coming through, and most couldn't afford the $12k ticket we were selling at." },
    after: { label: "After", img: "assets/compare/2-paid.jpg", caption: "After: $114,000 cash collected · 5.66x ROAS", text: "So we moved straight to paid traffic. We rebuilt everything to optimize for a cold audience. Tightened the VSL, tested ads, headline and funnel copy to target our richest ICP, and finalized our pre-call sequences and sales flows. A few months later, we had an offer vehicle printing $100k/month on autopilot whether the offer owner was on holiday, at construction sites, or only posting 1x YouTube video per month." },
    inputs: [["$15.2K", "Ad spend"]],
    outputs: [["$114K", "Cash collected"], ["5.66x", "ROAS", true]],
  },
  {
    title: "Stop Letting The Algorithm Decide Your Income",
    before: { label: "Organic", img: "assets/compare/3-organic.jpg", caption: "Screenshot: organic results", text: "[Client] had great months and empty months, and no way of knowing which was coming. One post would go viral, the next ten wouldn't, and their revenue followed." },
    after: { label: "Paid", img: "assets/compare/3-paid.jpg", caption: "Screenshot: paid results", text: "We built a paid funnel that runs every day regardless of reach. Within 30 days they were booking [X] calls a week from ads alone, and the swings were gone." },
    inputs: [["[$X]", "Ad spend"], ["[X]", "Calls / week"]],
    outputs: [["[$X]", "Cash collected"], ["[X]x", "ROAS", true]],
  },
];

// First-30-days chart. `roas` sets the height of each point (0–5x).
// Labels sit under the chart, beneath each point. Use \n to break a label onto two lines.
const MILESTONES = [
  { when: "Today", roas: 0, label: "Funnel Audit\n& Onboarding" },
  { when: "Day 7", roas: 0, label: "Cold Funnel Set Up\nComplete, New Ad\nScripts Ready" },
  { when: "Day 14", roas: 0.6, label: "Ads Live" },
  { when: "Day 21", roas: 2.2, label: "Closes Begin,\nDouble Down On\nWinning Ads" },
  { when: "Day 30", roas: 5, label: "More Closes,\nProfitable Campaign\nReady To Scale" },
];

// ---- CTAs: open the application form popup --------------------------------
(function applyPopup() {
  const modal = document.getElementById("apply-modal");
  const open = (e) => {
    if (e) e.preventDefault();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };
  const close = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (location.hash === "#apply") history.replaceState(null, "", location.pathname + location.search);
  };
  document.querySelectorAll(".js-cta").forEach((a) => a.addEventListener("click", open));
  modal.querySelector(".tf-modal__close").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) close(); });
  // Links straight to the form (e.g. from an ad) can use paidcoaching.com/#apply
  if (location.hash === "#apply") open();
})();
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
  const side = (s, cls) => `
    <div class="result__side">
      ${media(s, cls)}
      <p class="result__text"><strong>${s.label}:</strong> ${s.text}</p>
    </div>`;
  const tile = ([value, label, main], cls) =>
    `<div class="stat ${cls}${main ? " stat--main" : ""}"><strong>${value}</strong><span>${label}</span></div>`;

  document.getElementById("results").innerHTML = COMPARISONS.map((c) => `
    <article class="result panel">
      <h3 class="result__pill">${c.title}</h3>
      ${c.tags ? `<ul class="result__tags">${c.tags.map((t) => `<li>${t}</li>`).join("")}</ul>` : ""}
      <div class="result__pair">${side(c.before, "result__label--organic")}${side(c.after, "result__label--paid")}</div>
      <div class="equation">
        ${c.inputs.map((i) => tile(i, "stat--in")).join('<span class="equation__op">+</span>')}
        <span class="equation__op equation__arrow">→</span>
        ${c.outputs.map((o) => tile(o, "stat--out")).join("")}
      </div>
    </article>`).join("");
})();

// ---- Growth chart ---------------------------------------------------------
// Desktop: captions sit under each point. Phones: a compact chart that fits the
// screen width, with the steps listed underneath it as a timeline.
(function chart() {
  const svg = document.getElementById("growth-chart");
  const steps = document.getElementById("chart-steps");
  const last = MILESTONES.length - 1;
  const phone = window.matchMedia("(max-width: 600px)");

  steps.innerHTML = MILESTONES.map((m, i) => `
    <li class="${i === last ? "is-goal" : ""}"><span>${m.when}</span>${m.label.replaceAll("\n", " ")}</li>`).join("");

  function draw() {
    const small = phone.matches;
    const W = small ? 360 : 880, H = small ? 250 : 420;
    const L = small ? 38 : 110, R = small ? 336 : 790, T = small ? 26 : 46, B = small ? 206 : 290, MAX = 5;
    const x = (i) => L + (i / last) * (R - L);
    const y = (v) => B - (v / MAX) * (B - T);
    const pts = MILESTONES.map((m, i) => [x(i), y(m.roas)]);

    // Smooth curve through points (Catmull-Rom → cubic Bézier), never dipping below the axis
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < last; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, Math.min(B, p1[1] + (p2[1] - p0[1]) / 6)];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, Math.min(B, p2[1] - (p3[1] - p1[1]) / 6)];
      d += ` C${c1},${c2},${p2}`;
    }

    let out = `
      <defs>
        <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0050e6" stop-opacity="0.3"/>
          <stop offset="1" stop-color="#0050e6" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <text x="${small ? 2 : L - 10}" y="${T - (small ? 14 : 22)}" fill="rgba(17,17,17,0.6)" font-size="${small ? 10 : 11}" letter-spacing="1.5" font-weight="600" text-anchor="${small ? "start" : "end"}">ROAS</text>`;

    for (let v = 0; v <= MAX; v++) {
      out += `<line x1="${L}" x2="${R}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(17,17,17,${v === 0 ? 0.3 : 0.08})"/>`;
      out += `<text x="${L - 10}" y="${y(v) + 4}" fill="rgba(17,17,17,0.6)" font-size="${small ? 11 : 12}" text-anchor="end">${v === 0 ? "0" : v + "x"}</text>`;
    }

    out += `<path d="${d} L${R},${B} L${L},${B} Z" fill="url(#area)"/>`;
    out += `<path d="${d}" fill="none" stroke="#0050e6" stroke-width="3" stroke-linecap="round"/>`;

    MILESTONES.forEach((m, i) => {
      const [px, py] = pts[i];
      const end = i === last;
      out += `<line x1="${px}" x2="${px}" y1="${py + 9}" y2="${B + (small ? 6 : 14)}" stroke="#0050e6" stroke-opacity="0.35" stroke-dasharray="3 4"/>`;
      if (end) out += `<circle cx="${px}" cy="${py}" r="${small ? 15 : 18}" fill="#0050e6" fill-opacity="0.15"/>`;
      out += `<circle cx="${px}" cy="${py}" r="${end ? (small ? 8 : 9) : (small ? 6 : 7)}" fill="#0050e6" stroke="#ffffff" stroke-width="2.5"/>`;

      if (small) {
        // Short axis labels; the full step names are in the list under the chart
        const short = m.when.replace("Week ", "Wk ");
        const anchor = i === 0 ? "start" : i === last ? "end" : "middle";
        const tx = i === 0 ? px - 6 : i === last ? px + 6 : px;
        out += `<text x="${tx}" y="${B + 26}" text-anchor="${anchor}" fill="#0050e6" font-size="11" font-weight="700" letter-spacing="0.8">${short.toUpperCase()}</text>`;
      } else {
        const cy = B + 40;
        out += `<text x="${px}" y="${cy}" text-anchor="middle" fill="#0050e6" font-size="11" font-weight="700" letter-spacing="1.4">${m.when.toUpperCase()}</text>`;
        m.label.split("\n").forEach((line, k) => {
          out += `<text x="${px}" y="${cy + 22 + k * 19}" text-anchor="middle" fill="#111111" font-size="${end ? 15 : 14}" font-weight="700" font-family="Figtree, sans-serif">${line}</text>`;
        });
      }
    });

    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = out;
  }

  draw();
  phone.addEventListener("change", draw);
})();
