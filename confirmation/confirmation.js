// ---- Config ---------------------------------------------------------------
// Area code / number your setters call or text from.
const CALL_NUMBER = "+XXX";

// ---- Render ---------------------------------------------------------------
document.getElementById("call-number").textContent = CALL_NUMBER;
document.getElementById("year").textContent = new Date().getFullYear();

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
