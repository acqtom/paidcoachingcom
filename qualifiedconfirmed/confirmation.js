// ---- Config ---------------------------------------------------------------
// Area code / number your setters call or text from.
const CALL_NUMBER = "(714)";

// Step 4 client results. Replace the bracketed placeholders with real numbers.
// `tall: true` uses a vertical (9:16) player, for Reels/Shorts-style testimonials.
const CASES = [
  {
    icon: "chart", name: "Stephen", tag: "Client Success Story",
    vturb: "6adaacdcb5b8cc79020c865b", ratio: 62.45654692931634,
    desc: "Music production coach",
    result: "$100K in 30 days [10x ROAS]",
    button: "Funnel Breakdown",
    breakdown: [["Ad spend", "$9.7K"], ["Cash collected", "$101.49K"], ["ROAS", "10x"], ["Timeframe", "30 days"]],
    breakdownImg: "/assets/cases/stephen-breakdown.png",
    youtube: "", mp4: "",
  },
  {
    icon: "grid", name: "Adriel", tag: "Client Success Story",
    desc: "Real Estate Development Coach",
    result: "$33,000 in first 30 days (10x ROAS)",
    button: "Cost Breakdown",
    youtube: "Naet6oekdaI",
    breakdown: [["Ad spend", "$3,450"], ["Cash collected (from ads)", "$33,000"], ["ROAS", "10x"], ["Timeframe", "First 30 days"]],
    mp4: "",
  },
  {
    // Vertical video on the right, screenshots under the text
    icon: "play", name: "Alex", tag: "Client Success Story",
    desc: "YouTube Automation Coach",
    result: "$12/month Skool → $200K cash collected",
    shots: [
      ["/assets/compare/3-before.png", "Alex's Skool before: $12/month, 101 members"],
      ["/assets/compare/3-after.png", "Alex's dashboard after: $202,889.01 cash collected, 91 new customers"],
    ],
    tall: true, vturb: "6aeb9e10653f10da78260d68", ratio: 179.25925925925924, youtube: "", mp4: "",
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
// vturb players in their own frame. vturb has some of these saved with aspectRatio 5625
// (instead of the real ratio), vertical mode, another video's thumbnail or Portuguese prompts, so correct them inside the frame.
const VTURB_ACCOUNT = "3b9d5e0c-cdfa-409b-9c8d-b0d07c3dcb14";
const escAttr = (str) => str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function vturbFrame(id, ratio, label) {
  const cover = `https://images.converteai.net/${VTURB_ACCOUNT}/players/${id}/cover.jpg`;
  const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;background:#000;overflow:hidden}vturb-smartplayer{max-width:none!important}.thumbnail{padding-top:${ratio}%!important}.thumbnail-image{content:url(${cover})}</style></head><body>` +
    `<script>var _as=Element.prototype.attachShadow;Element.prototype.attachShadow=function(o){var r=_as.call(this,o),s=document.createElement("style");s.textContent='[style*="5625%"]{padding-top:${ratio}%!important}';r.appendChild(s);return r};<\/script>` +
    `<vturb-smartplayer id="vid-${id}" style="display: block; margin: 0 auto; width: 100%; "><div class="vturb-player-placeholder" style="position: relative; width: 100%; padding: ${ratio}% 0 0; z-index: 0; background-color: black;"></div></vturb-smartplayer>` +
    `<script>(function(){var el=document.getElementById("vid-${id}"),fn;Object.defineProperty(el,"start",{configurable:true,get:function(){return fn},set:function(f){fn=function(n){try{n.playerInit.aspectRatio=${ratio};n.playerInit.verticalVideo=false;n.playerInit.thumbnailKey="${VTURB_ACCOUNT}/players/${id}/cover.jpg";n.smartAutoPlay={active:false,items:[]};n.resume.active=false}catch(e){}return f.call(this,n)}}});})();<\/script>` +
    `<script>var s=document.createElement("script");s.src="https://scripts.converteai.net/${VTURB_ACCOUNT}/players/${id}/v4/player.js";s.async=true;document.head.appendChild(s);<\/script></body></html>`;
  return `<div class="player player--vturb" style="aspect-ratio: 100 / ${ratio}"><iframe title="${escAttr(label)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen srcdoc="${escAttr(doc)}"></iframe></div>`;
}

// Vertical vturb player in its own frame. Its size is saved correctly in vturb; Smart Autoplay and the resume prompt (both in Portuguese) are switched off so it is click-to-play like the others.
function vturbVertical(id, ratio, label) {
  const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;background:#000;overflow:hidden}vturb-smartplayer{max-width:none!important}</style></head><body>` +
    `<vturb-smartplayer id="vid-${id}" style="display: block; margin: 0 auto; width: 100%; "><div class="vturb-player-placeholder" style="position: relative; width: 100%; padding: ${ratio}% 0 0; z-index: 0; background-color: black;"></div></vturb-smartplayer>` +
    `<script>(function(){var el=document.getElementById("vid-${id}"),fn;Object.defineProperty(el,"start",{configurable:true,get:function(){return fn},set:function(f){fn=function(n){try{n.smartAutoPlay={active:false,items:[]};n.resume.active=false}catch(e){}return f.call(this,n)}}});})();<\/script>` +
    `<script>var s=document.createElement("script");s.src="https://scripts.converteai.net/${VTURB_ACCOUNT}/players/${id}/v4/player.js";s.async=true;document.head.appendChild(s);<\/script></body></html>`;
  return `<div class="player player--vturb player--tall" style="aspect-ratio: 100 / ${ratio}"><iframe title="${escAttr(label)}" loading="lazy" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen srcdoc="${escAttr(doc)}"></iframe></div>`;
}

function player({ youtube, mp4, tall, vturb, ratio }, label) {
  if (vturb && tall) return vturbVertical(vturb, ratio, label);
  if (vturb) return vturbFrame(vturb, ratio || 56.25, label);
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
// Videos in the page itself: <div class="player" data-vturb="PLAYER_ID"></div>
document.querySelectorAll("[data-vturb]").forEach((el) => {
  const title = el.closest(".faq__card")?.querySelector("h3")?.textContent || "Video";
  el.outerHTML = vturbFrame(el.dataset.vturb, 56.25, title);
});
document.getElementById("call-number").textContent = CALL_NUMBER;
document.getElementById("year").textContent = new Date().getFullYear();


const caseShots = (c) => `<div class="case__shots">${c.shots.map(([src, alt]) => `<img class="case__shot" src="${src}" alt="${alt}" loading="lazy" />`).join("")}</div>`;
const hasVideo = (c) => c.vturb || c.youtube || c.mp4;
document.getElementById("cases").innerHTML = CASES.map((c) => `
  <article class="case">
    <div>
      ${icon(c.icon)}
      <div class="case__title"><h3>${c.name}</h3>${c.tag ? `<span class="case__tag">${c.tag}</span>` : ""}</div>
      <p class="case__desc">${c.desc}</p>
      <p class="case__result">${c.result}</p>
      ${c.button ? `<details>
        <summary>${c.button}</summary>
        ${c.breakdown ? `<dl>${c.breakdown.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>` : ""}
        ${c.breakdownImg ? `<img class="case__shot" src="${c.breakdownImg}" alt="${c.name} funnel dashboard" loading="lazy" />` : ""}
      </details>` : ""}
      ${c.shots && hasVideo(c) ? caseShots(c) : ""}
    </div>
    ${c.shots && !hasVideo(c) ? caseShots(c) : player(c, c.name)}
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
