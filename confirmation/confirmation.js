// ---- Config ---------------------------------------------------------------
// Area code / number your setters call or text from.
const CALL_NUMBER = "+XXX";

// Step 4 client results. Replace the bracketed placeholders with real numbers.
// `tall: true` uses a vertical (9:16) player, for Reels/Shorts-style testimonials.
const CASES = [
  {
    icon: "chart", name: "[Client Name]", tag: "Client Success Story", tall: true,
    desc: "[Niche] coach – first paid funnel ever",
    result: "[e.g. 5.2x ROAS in 30 days]",
    button: "Funnel Breakdown",
    breakdown: [["Ad spend", "[$X]"], ["Calls booked", "[X]"], ["Cash collected", "[$X]"], ["ROAS", "[X]x"]],
    youtube: "", mp4: "",
  },
  {
    icon: "grid", name: "[Client Name]", tag: "",
    desc: "[Offer type] – moved from organic DMs to paid",
    result: "[e.g. $X cash collected in 30 days]",
    button: "Cost Breakdown",
    breakdown: [["Ad spend", "[$X]"], ["Cost per call", "[$X]"], ["Close rate", "[X%]"], ["Cash collected", "[$X]"]],
    youtube: "", mp4: "",
  },
];

// ---- Icons (24×24 stroke paths) --------------------------------------------
const ICONS = {
  map: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>',
  activity: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 7 5-3 5 3-1.5-7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  cap: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
  play: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m10 9 5 3-5 3z"/>',
  refresh: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  message: '<path d="M4 4h16v12H8l-4 4z"/>',
  tag: '<path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  expand: '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  grid: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
  building: '<path d="M4 21V5l8-2v18M12 7l8 2v12M2 21h20M7 9h2M7 13h2M7 17h2M15 13h2M15 17h2"/>',
  home: '<path d="m3 11 9-7 9 7v10H3z"/><path d="M9 21v-6h6v6"/>',
};
const icon = (name) => `<span class="icon-box"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ""}</svg></span>`;

// ---- Video players: thumbnail + play button, loads the video on click -------
const PLAY_SVG = '<svg viewBox="0 0 24 24"><path d="M6 4v16l14-8z"/></svg>';
function player({ youtube, mp4, tall }, label) {
  const thumb = youtube ? `<img src="https://i.ytimg.com/vi/${youtube}/hqdefault.jpg" alt="" loading="lazy" />` : "";
  const soon = youtube || mp4 ? "" : '<span class="player__soon">Video coming soon</span>';
  return `<div class="player${tall ? " player--tall" : ""}" data-youtube="${youtube || ""}" data-mp4="${mp4 || ""}">
      ${thumb}
      <button class="player__play" type="button" aria-label="Play: ${label}" ${youtube || mp4 ? "" : "disabled"}><span>${PLAY_SVG}</span></button>
      ${soon}
    </div>`;
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".player__play");
  if (!btn) return;
  const box = btn.parentElement;
  const { youtube, mp4 } = box.dataset;
  if (youtube) {
    box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Video"></iframe>`;
  } else if (mp4) {
    box.innerHTML = `<video src="${mp4}" controls autoplay playsinline></video>`;
  }
});

// ---- Render ---------------------------------------------------------------
document.getElementById("call-number").textContent = CALL_NUMBER;
document.getElementById("year").textContent = new Date().getFullYear();


document.getElementById("cases").innerHTML = CASES.map((c) => `
  <article class="case">
    <div>
      ${icon(c.icon)}
      <div class="case__title"><h3>${c.name}</h3>${c.tag ? `<span class="case__tag">${c.tag}</span>` : ""}</div>
      <p class="case__desc">${c.desc}</p>
      <p class="case__result">${c.result}</p>
      <details>
        <summary>${c.button}</summary>
        <dl>${c.breakdown.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
      </details>
    </div>
    ${player(c, c.name)}
  </article>`).join("");


// ---- Star field -----------------------------------------------------------
(function stars() {
  const layer = document.querySelector(".stars");
  for (let i = 0; i < 90; i++) {
    const s = document.createElement("span");
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.opacity = (0.25 + Math.random() * 0.6).toFixed(2);
    layer.appendChild(s);
  }
})();

// First-30-days chart. `roas` sets the height of each point (0–5x).
// Labels sit under the chart, beneath each point. Use \n to break a label onto two lines.
const MILESTONES = [
  { when: "Today", roas: 0, label: "Funnel Audit\n& Onboarding" },
  { when: "Day 7", roas: 0, label: "Cold Funnel Set Up\nComplete, New Ad\nScripts Ready" },
  { when: "Day 14", roas: 0.6, label: "Ads Live" },
  { when: "Day 21", roas: 2.2, label: "Closes Begin,\nDouble Down On\nWinning Ads" },
  { when: "Day 30", roas: 5, label: "More Closes,\nProfitable Campaign\nReady To Scale" },
];

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
