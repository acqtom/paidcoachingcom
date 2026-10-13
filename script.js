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

