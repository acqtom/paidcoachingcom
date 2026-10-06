// ---- Config ---------------------------------------------------------------
// Where every "Schedule My Free Strategy Session" button goes (Calendly, typeform, etc.)
const BOOKING_URL = "#";

// Result screenshots for the carousel. Drop images into assets/results/.
const RESULTS = [
  { name: "Felix", meta: "$12k USD / month", img: "assets/results/felix.jpg", stat: "$12k/mo" },
  { name: "Ali", meta: "Monetized in 45 days", img: "assets/results/ali.jpg", stat: "45 days" },
  { name: "Jax", meta: "$8,083 in one month", img: "assets/results/jax.jpg", stat: "$8,083" },
  { name: "Lucas", meta: "21.6M views on one Short", img: "assets/results/lucas.jpg", stat: "21.6M" },
  { name: "Shani", meta: "$6,691 in a single day", img: "assets/results/shani.jpg", stat: "$6,691" },
  { name: "Ethan", meta: "84M views in one month", img: "assets/results/ethan.jpg", stat: "84M" },
  { name: "Jibrail", meta: "29.3M views in 90 days", img: "assets/results/jibrail.jpg", stat: "29.3M" },
  { name: "Gulbil", meta: "$7,900 in 28 days", img: "assets/results/gulbil.jpg", stat: "$7,900" },
  { name: "Caleb", meta: "$1,408 in 7 days", img: "assets/results/caleb.jpg", stat: "$1,408" },
  { name: "Felix", meta: "100.7M views in June", img: "assets/results/felix-views.jpg", stat: "100.7M" },
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

// ---- Results carousel -----------------------------------------------------
(function carousel() {
  const track = document.getElementById("carousel-track");
  const bar = document.getElementById("carousel-bar");
  const count = document.getElementById("carousel-count");
  const prev = document.getElementById("carousel-prev");
  const next = document.getElementById("carousel-next");

  track.innerHTML = RESULTS.map((r, i) => `
    <article class="slide">
      <div class="slide__head"><b>${r.name}</b> · ${r.meta}</div>
      <div class="slide__media">
        <img src="${r.img}" alt="${r.name} result: ${r.meta}" loading="lazy"
             onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'slide__ph',innerHTML:'<strong>${r.stat}</strong>${r.meta}'}))" />
        <button class="slide__zoom" type="button" data-i="${i}" aria-label="Enlarge">↗</button>
      </div>
    </article>`).join("");

  const slides = [...track.children];
  const total = slides.length;
  const step = () => slides[0].offsetWidth + 16;
  const current = () => Math.min(total - 1, Math.round(track.scrollLeft / step()));

  function update() {
    const i = current();
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    const shown = atEnd ? total : i + 1;
    count.textContent = `${shown} / ${total}`;
    bar.style.width = (shown / total) * 100 + "%";
    prev.disabled = track.scrollLeft <= 4;
    next.disabled = atEnd;
  }
  prev.addEventListener("click", () => track.scrollBy({ left: -step(), behavior: "smooth" }));
  next.addEventListener("click", () => track.scrollBy({ left: step(), behavior: "smooth" }));
  track.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
  window.addEventListener("resize", update);
  update();

  // Lightbox
  const box = document.getElementById("lightbox");
  const boxImg = box.querySelector("img");
  track.addEventListener("click", (e) => {
    const btn = e.target.closest(".slide__zoom");
    if (!btn) return;
    const img = btn.parentElement.querySelector("img");
    if (!img) return;
    boxImg.src = img.src;
    boxImg.alt = img.alt;
    box.hidden = false;
  });
  box.addEventListener("click", (e) => { if (e.target !== boxImg) box.hidden = true; });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") box.hidden = true; });
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
