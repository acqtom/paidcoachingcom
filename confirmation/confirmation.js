// ---- Config ---------------------------------------------------------------
// Area code / number your setters call or text from.
const CALL_NUMBER = "+XXX";

// Step 3 videos. For each one set `youtube` (the video ID, e.g. "dQw4w9WgXcQ")
// or `mp4` (a path like "/assets/faq/process.mp4"). Leave both empty to show a placeholder.
const FAQ = [
  { icon: "map", q: "What Exactly Do You Offer?", youtube: "", mp4: "" },
  { icon: "refresh", q: "What Happens If It Doesn't Perform?", youtube: "", mp4: "" },
  { icon: "user", q: "Who Are You Guys, And What Have You Done?", youtube: "", mp4: "" },
  { icon: "cap", q: "Can I Do This If I Don't Know How The System Works?", youtube: "", mp4: "" },
  { icon: "cash", q: "What Are My Running Expenses?", youtube: "", mp4: "" },
  { icon: "eye", q: "What Can I Expect From This?", youtube: "", mp4: "" },
  { icon: "target", q: "Who Is This For?", youtube: "", mp4: "" },
  { icon: "ban", q: "Who Is This NOT For?", youtube: "", mp4: "" },
  { icon: "shield", q: "Will You Help Me Avoid Bleeding Spend?", youtube: "", mp4: "" },
  { icon: "tag", q: "What Is The ROI?", youtube: "", mp4: "" },
  { icon: "activity", q: "How Long Until I See Results?", youtube: "", mp4: "" },
];

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
  {
    icon: "building", name: "[Client Name]", tag: "Client Success Story",
    desc: "[Offer type] – PIF offer to cold traffic",
    result: "[e.g. $X in PIF sales]",
    button: "Funnel Breakdown",
    breakdown: [["Ad spend", "[$X]"], ["Calls booked", "[X]"], ["PIF sales", "[X]"], ["ROAS", "[X]x"]],
    youtube: "", mp4: "",
  },
  {
    icon: "home", name: "[Client Name]", tag: "",
    desc: "[Offer type] – scaled after the first 30 days",
    result: "[e.g. $X / month on paid]",
    button: "Cost Breakdown",
    breakdown: [["Monthly ad spend", "[$X]"], ["Cost per call", "[$X]"], ["Cash collected", "[$X]"], ["ROAS", "[X]x"]],
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

document.getElementById("faq").innerHTML = FAQ.map((f) => `
  <article class="faq__card">
    <div class="faq__head">${icon(f.icon)}<h3>${f.q}</h3></div>
    ${player(f, f.q)}
  </article>`).join("");

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

// ---- Main video: autoplay muted, click to restart with sound ---------------
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
