// ---- Config ---------------------------------------------------------------
// Paid vs organic results. Put screenshots in assets/compare/ (anything in [brackets] is a placeholder).
// Each stat row reads: inputs joined by "+"  →  outputs. Set `main: true` on the headline output.
const COMPARISONS = [
  {
    title: "$6K/Month To $101K/Month",
    tags: ["B2C Coaching Offer", "Music Production Niche", "$4K–$8K Ticket"],
    before: { label: "Before", img: "assets/compare/1-before.png", caption: "Amount Won $6K · ROAS 1", text: "This music production coach had a known name in his space, so getting calls wasn’t the problem. Getting the right people on them was. His funnel attracted people who loved the idea of getting results, but were highly skeptical of a high-ticket program. The few who bought could only afford small split payments. His average order value was around $500, and he was stuck at 6K–10K a month." },
    after: { label: "After", img: "assets/compare/1-paid.png", caption: "Amount Won $101.99K · ROAS 12", text: "We rebuilt everything from the ground up, tailored to buyers who could actually afford it. We built a new VSL, landing page, application, pre-call warm-up, and our Direct Offer ads around them. Better leads started booking, his average order value jumped from $500 to $4,000, and that justified scaling. He went from $6K a month to breaking $100K a month on 100% cold traffic, averaging an 8-12x ROAS." },
    inputs: [["$6K/mo", "Before"]],
    outputs: [["$101K/mo", "After"], ["8–12x", "ROAS", true]],
  },
  {
    title: "10x ROAS First 30 Days",
    tags: ["B2C Mentorship Offer", "Real Estate Niche", "$8K–$12K Ticket"],
    before: { label: "Before", img: "assets/compare/2-organic.jpg", caption: "Before: $21K from YouTube · 18 bookings · 31 opt-ins · 1,113 clicks", text: "This real estate mentor had validated his first $21K on organic, but most of his calls weren’t with buyers. They were with people who wanted to network, pick his brain, or talk deals without any capital to back it up. Only a handful could actually afford an $8K–$12K program, and he had no way to control who came through, or when." },
    after: { label: "After", img: "assets/compare/2-paid.jpg", caption: "After: $40K cash collected · $3,483.62 ad spend · 9.47x Meta ROAS", text: "We built him a paid funnel from the ground up: a new VSL, landing page, application, pre-call warm-up, and our Direct Offer ads speaking directly to investors with capital ready to deploy. His first $3K in ad spend turned into $33K, a 10x ROAS in month one. We scaled the next month to $49K at an 8.6x ROAS, with his team closing nearly 40% of calls." },
    inputs: [["$3K", "Ad spend"]],
    outputs: [["$33K", "Cash collected"], ["10x", "ROAS", true]],
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

