// Anonymous page stats for /dashboard. Nothing is stored beyond this browser tab's visit; no IDs are sent.
(function () {
  let ignore = false, seen = {};
  try { ignore = localStorage.getItem("pc_ignore") === "1"; } catch (e) {}
  if (ignore || navigator.webdriver) return;
  try { seen = JSON.parse(sessionStorage.getItem("pc_seen") || "{}"); } catch (e) {}
  const q = new URLSearchParams(location.search);
  if (!seen._src) seen._src = q.get("utm_content") || q.get("utm_campaign") || q.get("utm_source") || "-";
  const dev = matchMedia("(max-width: 760px)").matches ? "m" : "d";
  let queue = [], timer = 0, far = -1, dur = 0;
  function flush() {
    clearTimeout(timer); timer = 0;
    // furthest second of the VSL watched this visit: replace the old value, so each visit counts once
    const rep = seen._far ?? -1;
    if (far > rep) { if (rep >= 0) queue.push("u" + rep); queue.push("s" + far); seen._far = far; try { sessionStorage.setItem("pc_seen", JSON.stringify(seen)); } catch (e) {} }
    if (!queue.length) return;
    const data = JSON.stringify({ d: dev, s: seen._src === "-" ? "" : seen._src, e: queue, dur: dur || undefined });
    queue = [];
    if (!(navigator.sendBeacon && navigator.sendBeacon("/api/track", data))) fetch("/api/track", { method: "POST", body: data, keepalive: true }).catch(() => {});
  }
  function hit(name, now) { // each event counts once per visit
    if (seen[name]) return;
    seen[name] = 1; queue.push(name);
    try { sessionStorage.setItem("pc_seen", JSON.stringify(seen)); } catch (e) {}
    if (now) flush(); else if (!timer) timer = setTimeout(flush, 8000);
  }
  addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
  if (document.prerendering) document.addEventListener("prerenderingchange", () => hit("view", true), { once: true }); else hit("view", true);

  // Buttons
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest(".js-cta");
    if (!b) return;
    hit("click");
    hit("click_" + (b.closest(".hero") ? "hero" : b.parentElement.querySelector("#results") ? "proof" : "framework"));
  }, true);

  // VSL: listen inside the player's shadow root. w0–w9 = that tenth of the video was actually played
  const watched = new WeakMap();
  function media(e) {
    const v = e.target;
    if (!v || v.tagName !== "VIDEO" || !(v.duration > 30) || v.loop || v.paused) return;
    hit("play");
    const b = Math.min(9, Math.floor((v.currentTime / v.duration) * 10)), m = watched.get(v) || {};
    if (m.b !== b) { m.b = b; m.n = 0; }
    m.n = (m.n || 0) + 1; watched.set(v, m);
    if (m.n >= 4) hit("w" + b); // about a second of playback, so skipping past doesn't count
    // seconds: only count time reached by actually playing, not by jumping ahead
    const t = v.currentTime, step = t - (m.last ?? t);
    if (step >= 0 && step <= 2.5) far = Math.max(far, Math.floor(t));
    m.last = t; dur = Math.round(v.duration);
    if (!timer) timer = setTimeout(flush, 8000);
  }
  const attach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function () {
    const root = attach.apply(this, arguments);
    root.addEventListener("timeupdate", media, true);
    return root;
  };
  document.addEventListener("timeupdate", media, true);

  // Form
  document.addEventListener("apply:answered", (e) => hit("a_" + e.detail));
  document.addEventListener("apply:submitted", () => hit("sub", true));
  document.addEventListener("apply:booked", () => hit("book", true));
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("apply-form");
    if (!form || !window.IntersectionObserver) return;
    const io = new IntersectionObserver((x) => { if (x.some((i) => i.isIntersecting)) { hit("seen"); io.disconnect(); } }, { threshold: 0.4 });
    io.observe(form);
  });
})();
