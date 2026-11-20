// ---- Config ---------------------------------------------------------------
// Paid vs organic results. Put screenshots in assets/compare/ (anything in [brackets] is a placeholder).
// Each stat row reads: inputs joined by "+"  →  outputs. Set `main: true` on the headline output.
const COMPARISONS = [
  {
    card: { photo: "/assets/clients/stephen.jpg", who: "Stephen", meta: "Music Production Coaching · $4K–$8K ticket", metric: "$500 Course → $101K/Month Mentorship", blurb: "Plenty of leads, wrong offer and service. We rebuilt what he was offering and he went from $6K/mo to $101K/mo." },
    title: "$6K/Month To $101K/Month",
    tags: ["B2C Coaching Offer", "Music Production Niche", "$4K–$8K Ticket"],
    before: { label: "Before", img: "/assets/compare/1-before.png", caption: "Amount Won $6K · ROAS 1", text: "This music production coach had a known name in his space, so getting attention wasn’t the problem. What he was selling was. His main offer was a $500 course, so even with plenty of leads coming in, every sale was small and he was stuck at $6K–$10K a month. The people who wanted real results needed more than a course could give them, and he had nothing built for them." },
    after: { label: "After", img: "/assets/compare/1-paid.png", caption: "Amount Won $101.49K · ROAS 10", text: "We rebuilt what he was offering from the ground up. We turned what he already knew into a high-ticket mentorship built around the result his students actually wanted, packaged and priced so it was truly worth it, then set up the marketing and sales process to sell it. His average order value jumped from $500 to $4,000, and he went from $6K a month to $101K a month." },
    inputs: [["$6K/mo", "Before"]],
    outputs: [["$101K/mo", "After"], ["10x", "ROAS", true]],
  },
  {
    card: { photo: "/assets/clients/adriel.jpg", who: "Adriel", meta: "Real Estate Mentorship · $7K–$12K ticket", metric: "$997 Course → $100K In 90 Days", blurb: "His first time launching a mentorship. We built and managed everything." },
    title: "$997 Course To $100K In 90 Days",
    tags: ["B2C Mentorship Offer", "Real Estate Niche", "$8K–$12K Ticket"],
    before: { label: "Before", img: "/assets/compare/2-before-courses.png", fit: "contain", bg: "#ffffff", caption: "Before: $997 courses", text: "This real estate educator was selling $997 courses on new construction, commercial flipping, wholesaling and small apartments. He had real knowledge and an audience that trusted him, but every sale was a one-off $997 purchase, so growing his income meant finding more and more buyers." },
    after: { label: "After", img: "/assets/compare/2-after-115k.png", fit: "contain", thin: true, bg: "#111111", caption: "After: $115,000 cash collected · 18 new customers", text: "This was his first time launching a mentorship. We built his high-ticket offer around what he already knew and managed everything from the marketing to the sales process. He went from $997 course sales to $100K in his first 90 days, with $115,000 cash collected from 18 new customers." },
    inputs: [["$997", "Course"]],
    outputs: [["$100K", "First 90 days", true]],
  },
  {
    card: { photo: "/assets/clients/alex.jpg", who: "Alex", meta: "YouTube Automation Mentorship · $2K–$4K ticket", metric: "$12 Skool → $200K Cash Collected", blurb: "He was underselling his knowledge in a $12 Skool. We built him a high-ticket mentorship and he’s booking calls every day with people ready to pay him $3K–$6K." },
    title: "$12 Skool To $200K Cash Collected",
    tags: ["B2C Mentorship Offer", "YouTube Automation Niche", "$2K–$4K Ticket"],
    before: { label: "Before", img: "/assets/compare/3-before.png", fit: "contain", thin: true, bg: "#333333", caption: "Before: $12/month Skool · 101 members" },
    after: { label: "After", img: "/assets/compare/3-after.png", fit: "contain", thin: true, bg: "#0a0a0a", caption: "After: $202,889.01 cash collected · 91 new customers" },
    inputs: [["$12/mo", "Skool"]],
    outputs: [["$200K", "Cash collected", true]],
  },
  {
    card: { photo: "/assets/clients/brem.jpg", who: "Brem", meta: "High-ticket mentorship", metric: "$49 Whop → $44K Cash Collected", blurb: "He was selling a $49 Whop and working hard for every sale. We built him a high-ticket mentorship and he’s collected $44K since launching it." },
  },
  {
    card: { who: "Zych", meta: "High-ticket mentorship", metric: "$19 Ebook → $20K Mentorship", blurb: "His only offer was a $19 ebook. We turned what he knew into a high-ticket mentorship and he’s made $20,000 from it." },
  },
];


// ---- CTAs: open the application form popup --------------------------------
(function applyPopup() {
  const modal = document.getElementById("apply-modal");
  if (!modal) return; // pages without the Typeform popup (e.g. /audit)
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
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".js-cta")) return;
    // Meta Pixel conversion: every click on a button that opens the application form
    if (typeof fbq === "function") fbq("track", "Lead");
    open(e);
  });
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
    <figure class="result__img${side.thin ? " result__img--thin" : ""}"${side.bg ? ` style="background:${side.bg}"` : ""}>
      <span class="result__label ${cls}">${side.label}</span>
      <img src="${side.img}" alt="${side.label} results: ${side.caption}" loading="lazy"${side.fit ? ` style="object-fit:${side.fit}"` : ""} onerror="this.remove()" />
      <figcaption>${side.caption}</figcaption>
    </figure>`;
  const side = (s, cls) => `
    <div class="result__side">
      ${media(s, cls)}
      ${s.text ? `<p class="result__text"><strong>${s.label}:</strong> ${s.text}</p>` : ""}
    </div>`;
  const tile = ([value, label, main], cls) =>
    `<div class="stat ${cls}${main ? " stat--main" : ""}"><strong>${value}</strong><span>${label}</span></div>`;

  // vturb player in its own frame (scripts added through innerHTML wouldn't run), with Smart Autoplay and the resume prompt (both in Portuguese) off so it's click-to-play
  const VTURB_ACCOUNT = "3b9d5e0c-cdfa-409b-9c8d-b0d07c3dcb14";
  const videoFrame = ({ vturb, ratio }, who) => {
    const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;background:#000;overflow:hidden}vturb-smartplayer{max-width:none!important}</style></head><body>` +
      `<vturb-smartplayer id="vid-${vturb}" style="display: block; margin: 0 auto; width: 100%; "><div class="vturb-player-placeholder" style="position: relative; width: 100%; padding: ${ratio}% 0 0; z-index: 0; background-color: black;"></div></vturb-smartplayer>` +
      `<script>(function(){var el=document.getElementById("vid-${vturb}"),fn;Object.defineProperty(el,"start",{configurable:true,get:function(){return fn},set:function(f){fn=function(n){try{n.smartAutoPlay={active:false,items:[]};n.resume.active=false}catch(e){}return f.call(this,n)}}});})();<\/script>` +
      `<script>var s=document.createElement("script");s.src="https://scripts.converteai.net/${VTURB_ACCOUNT}/players/${vturb}/v4/player.js";s.async=true;document.head.appendChild(s);<\/script></body></html>`;
    const attr = doc.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    return `<div class="result__video" style="aspect-ratio: 100 / ${ratio}"><iframe title="${who} video testimonial" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen srcdoc="${attr}"></iframe></div>`;
  };

  const full = (c) => `
    <article class="result">
      <h3 class="result__pill">${c.title}</h3>
      ${c.tags ? `<ul class="result__tags">${c.tags.map((t) => `<li>${t}</li>`).join("")}</ul>` : ""}
      ${c.video ? videoFrame(c.video, c.card.who) : ""}
      <div class="result__pair">${side(c.before, "result__label--organic")}${side(c.after, "result__label--paid")}</div>
      <div class="equation">
        ${c.inputs.map((i) => tile(i, "stat--in")).join('<span class="equation__op">+</span>')}
        <span class="equation__op equation__arrow">→</span>
        ${c.outputs.map((o) => tile(o, "stat--out")).join("")}
      </div>
      <a class="cta js-cta" href="#apply">Start Building My Mentorship Program <span class="cta__arrow">→</span></a>
    </article>`;

  // Summary cards
  document.getElementById("results").innerHTML = COMPARISONS.map((c, i) => c.title ? `
    <button class="story" type="button" data-story="${i}">${cardInner(c)}
      <span class="story__more">See full story →</span>
    </button>` : `
    <div class="story story--static">${cardInner(c)}
    </div>`).join("");
  function cardInner(c) { return `
      <span class="story__head">
        <span class="story__pfp">${c.card.photo ? `<img src="${c.card.photo}" alt="" loading="lazy" onerror="this.remove()" />` : ""}${c.card.who[0]}</span>
        <span class="story__who"><strong>${c.card.who}</strong><br />${c.card.meta}</span>
      </span>
      <span class="story__metric">${c.card.metric}</span>
      ${c.card.sub ? `<span class="story__sub">${c.card.sub}</span>` : ""}
      ${c.card.blurb ? `<span class="story__blurb">${c.card.blurb}</span>` : ""}`; }

  // Full story popup
  const modal = document.getElementById("story-modal");
  const body = document.getElementById("story-body");
  const applyModal = document.getElementById("apply-modal");
  const open = (i) => {
    body.innerHTML = full(COMPARISONS[i]);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    modal.querySelector(".story-modal__panel").scrollTop = 0;
  };
  const close = () => {
    body.querySelectorAll("iframe").forEach((f) => f.remove()); // stops any video still playing
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (!applyModal || !applyModal.classList.contains("is-open")) document.body.style.overflow = "";
  };
  document.getElementById("results").addEventListener("click", (e) => {
    const card = e.target.closest("button.story");
    if (card) open(+card.dataset.story);
  });
  modal.querySelector(".story-modal__close").addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
    if (e.target.closest(".js-cta")) close(); // the apply popup opens on top
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal.classList.contains("is-open")) close(); });
})();

