// One-question-at-a-time application form (#apply-form), then a Calendly booking step
// ---- Config ---------------------------------------------------------------
// type: "choice" (pick one) | "long" (typed, Shift+Enter for a new line) | "contact" (name, phone, email, SMS consent)
const APPLY_QUESTIONS = [
  { id: "has_high_ticket_offer", type: "choice", label: "Do You Have A High-Ticket Coaching / Consulting Offer Right Now?", options: ["Yes", "No - looking to start"] },
  { id: "situation", type: "choice", label: "Which Best Describes Your Current Situation?", options: ["I’m currently selling a course/digital product and want to sell high ticket", "I have a personal brand but not many sales", "I have no brand and sell nothing right now"] },
  { id: "niche", type: "long", optional: true, label: "What Niche Are You In, And What Do You Do?" },
  { id: "contact", type: "contact", label: "How Can We Reach You?" },
  { id: "monthly_revenue", type: "choice", label: "What Is Your Estimated Monthly Revenue?", note: "This is 100% confidential. We only ask to help us prepare a strategy for your call.", options: ["$0 - $10k/mo", "$10k - $20k/mo", "$20k - $50k/mo", "$50k - $150k/mo", "$150k - $500k/mo", "$500k - $1M/mo"] },
];
const APPLY_CALENDLY_URL = ""; // e.g. "https://calendly.com/name/event". Shown after the last question.
const APPLY_WEBHOOK_URL = "";  // where answers are saved. Empty = answers are not saved anywhere.
const APPLY_BOOKED_URL = "";   // page to open once a call is booked, e.g. "/confirmation"
const APPLY_START_PERCENT = 50; // progress bar starts here and reaches 100 at the booking step
const APPLY_CONSENT_HTML = 'You agree to receive automated follow-up and reminder SMS messages with varying frequency from Helmbury LLC (Paidcoaching.com). Txt and data rates may apply. Reply STOP to end. Text HELP for help. Click for <a href="/tos" target="_blank" rel="noopener">Terms of Service</a>, <a href="/pp" target="_blank" rel="noopener">Privacy Policy</a>.';
// ISO code, dial code (first one is the default)
const APPLY_COUNTRIES = "US1 CA1 GB44 AU61 NZ64 IE353 ZA27 AE971 SA966 QA974 KW965 IL972 IN91 PK92 BD880 LK94 SG65 MY60 PH63 ID62 TH66 VN84 HK852 JP81 KR82 TW886 DE49 FR33 ES34 PT351 IT39 NL31 BE32 LU352 CH41 AT43 SE46 NO47 DK45 FI358 IS354 PL48 CZ420 SK421 HU36 RO40 BG359 GR30 CY357 MT356 HR385 SI386 RS381 EE372 LV371 LT370 UA380 TR90 EG20 MA212 NG234 GH233 KE254 BR55 MX52 AR54 CL56 CO57 PE51 CR506 PA507".split(" ").map((c) => [c.slice(0, 2), c.slice(2)]);

(function applyForm() {
  const root = document.getElementById("apply-form");
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const stage = $(".apply__stage"), bar = $(".apply__bar span"), num = $(".apply__num"), pct = $(".apply__pct"), track = $(".apply__bar");
  const answers = { contact: { country: APPLY_COUNTRIES[0][0], first_name: "", phone: "", email: "", sms: false } };
  const total = APPLY_QUESTIONS.length;
  let step = 0, busy = false, sent = false;

  // Every application button on the page scrolls here
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".js-cta")) return;
    e.preventDefault();
    document.getElementById("apply").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  const progress = (done) => {
    const p = Math.round(APPLY_START_PERCENT + (100 - APPLY_START_PERCENT) * (done / total));
    bar.style.width = p + "%"; pct.textContent = p + "%"; track.setAttribute("aria-valuenow", p);
  };
  const valid = (q) => {
    if (q.type === "contact") {
      const c = answers.contact;
      return !!c.first_name.trim() && c.phone.replace(/\D/g, "").length >= 7 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim());
    }
    return !!q.optional || !!(answers[q.id] || "").trim();
  };
  const fullPhone = () => {
    const c = answers.contact, raw = c.phone.trim();
    if (raw.startsWith("+")) return "+" + raw.replace(/\D/g, "");
    let digits = raw.replace(/\D/g, "");
    const dial = (APPLY_COUNTRIES.find((x) => x[0] === c.country) || ["", ""])[1];
    if (!dial) return digits;
    if (dial === "1" && digits.length === 11 && digits[0] === "1") digits = digits.slice(1);
    if (c.country !== "IT") digits = digits.replace(/^0/, "");
    return "+" + dial + digits;
  };

  function choiceField(q, sync, go) {
    const group = el("div", "apply__options");
    group.setAttribute("role", "radiogroup"); group.setAttribute("aria-labelledby", "apply-q");
    q.options.forEach((opt, i) => {
      const lab = el("label", "apply__option"), input = el("input"), box = el("span"), key = el("i", "", String.fromCharCode(65 + i));
      key.setAttribute("aria-hidden", "true");
      input.type = "radio"; input.name = q.id; input.value = opt; input.checked = answers[q.id] === opt;
      input.addEventListener("change", () => { answers[q.id] = opt; sync(); });
      // tapping an answer moves on by itself; keyboard users press Continue
      box.addEventListener("click", () => { const at = step; setTimeout(() => { if (step === at) go(); }, 280); });
      box.append(key, el("em", "", opt)); lab.append(input, box); group.append(lab);
    });
    return group;
  }
  function longField(q, sync, go) {
    const t = el("textarea", "apply__input"); t.rows = 2; t.name = q.id; t.placeholder = "Type your answer here..."; t.value = answers[q.id] || "";
    t.setAttribute("aria-labelledby", "apply-q");
    t.addEventListener("input", () => { answers[q.id] = t.value; sync(); });
    t.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); go(); } });
    const wrap = el("div"); wrap.append(t, el("p", "apply__hint", "Shift + Enter to make a line break"));
    return wrap;
  }
  function contactField(sync) {
    const c = answers.contact, wrap = el("div", "apply__contact");
    const field = (label, control) => { const l = el("label", "apply__field"); l.append(el("span", "apply__label", label), control); return l; };
    const text = (key, type, ph, ac) => {
      const i = el("input", "apply__input"); i.type = type; i.name = key; i.placeholder = ph; i.autocomplete = ac; i.value = c[key];
      i.addEventListener("input", () => { c[key] = i.value; sync(); });
      return i;
    };
    const sel = el("select", "apply__input apply__country"); sel.setAttribute("aria-label", "Country code"); sel.name = "country";
    APPLY_COUNTRIES.forEach(([iso, dial]) => {
      const flag = String.fromCodePoint(...[...iso].map((ch) => 127397 + ch.charCodeAt(0)));
      const o = el("option", "", `${flag} ${iso} +${dial}`); o.value = iso; sel.append(o);
    });
    const other = el("option", "", "Other (type + and code)"); other.value = "other"; sel.append(other);
    sel.value = c.country;
    sel.addEventListener("change", () => { c.country = sel.value; });
    const phone = text("phone", "tel", "(201) 555-0123", "tel"); phone.setAttribute("aria-label", "Phone number");
    const phoneRow = el("div", "apply__phone"); phoneRow.append(sel, phone);
    const phoneWrap = el("div", "apply__field"); phoneWrap.append(el("span", "apply__label", "Phone Number*"), phoneRow);
    const legal = el("p", "apply__legal"); legal.innerHTML = APPLY_CONSENT_HTML;
    const agree = el("label", "apply__agree"), box = el("input"); box.type = "checkbox"; box.name = "sms_consent"; box.checked = c.sms;
    box.addEventListener("change", () => { c.sms = box.checked; });
    agree.append(box, el("span", "", "I agree to receive transactional SMS (appointment confirmations, application/status updates)"));
    wrap.append(field("First Name*", text("first_name", "text", "John", "given-name")), phoneWrap, field("Email*", text("email", "email", "name@example.com", "email")), legal, agree);
    return wrap;
  }

  function render(focus) {
    const q = APPLY_QUESTIONS[step];
    num.textContent = "Question " + (step + 1);
    progress(step);
    const form = el("form", "apply__step"); form.noValidate = true;
    const title = el("h3", "apply__q", q.label); title.id = "apply-q"; title.tabIndex = -1;
    form.append(title);
    if (q.note) form.append(el("p", "apply__note", q.note));
    const next = el("button", "cta apply__next", "Continue "); next.type = "submit"; next.append(el("span", "cta__arrow", "→"));
    const sync = () => { next.disabled = !valid(q); };
    const go = () => {
      if (busy || !valid(q)) return;
      if (step < total - 1) { step++; render(true); } else finish(next, error);
    };
    const error = el("p", "apply__error"); error.setAttribute("role", "alert"); error.hidden = true;
    form.append(q.type === "choice" ? choiceField(q, sync, go) : q.type === "long" ? longField(q, sync, go) : contactField(sync));
    const row = el("div", "apply__actions"); row.append(next);
    if (step > 0) {
      const back = el("button", "apply__back", "← Back"); back.type = "button";
      back.addEventListener("click", () => { if (busy) return; step--; render(true); });
      row.append(back);
    }
    form.append(row, error);
    form.addEventListener("submit", (e) => { e.preventDefault(); go(); });
    sync();
    stage.replaceChildren(form);
    if (focus) {
      (form.querySelector("input[type=text], textarea") || title).focus({ preventScroll: true });
      if (root.getBoundingClientRect().top < 0) root.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function finish(btn, error) {
    if (!APPLY_CALENDLY_URL && !APPLY_WEBHOOK_URL) {
      // Until booking is connected, hand over to the Typeform popup so no applicant is lost
      if (window.openApplyPopup) {
        if (!sent && typeof fbq === "function") fbq("track", "Lead");
        sent = true; progress(total); window.openApplyPopup();
        return;
      }
      error.textContent = "Booking isn’t connected yet, so your answers weren’t sent."; error.hidden = false;
      return;
    }
    busy = true; btn.disabled = true;
    const c = answers.contact, params = new URLSearchParams(location.search);
    const payload = { has_high_ticket_offer: answers.has_high_ticket_offer, situation: answers.situation, niche: answers.niche || "", first_name: c.first_name.trim(), phone: fullPhone(), email: c.email.trim(), sms_consent: c.sms, monthly_revenue: answers.monthly_revenue, page: location.href, submitted_at: new Date().toISOString() };
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ad_id", "fbclid"].forEach((k) => { if (params.get(k)) payload[k] = params.get(k); });
    if (APPLY_WEBHOOK_URL && !sent) {
      try {
        const res = await fetch(APPLY_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error("HTTP " + res.status);
        sent = true;
      } catch (err) {
        if (!APPLY_CALENDLY_URL) { busy = false; btn.disabled = false; error.textContent = "Something went wrong sending your answers. Please try again."; error.hidden = false; return; }
        console.error("[apply] answers not saved:", err); // still let them book
      }
    }
    if (typeof fbq === "function") fbq("track", "Lead");
    progress(total);
    if (!APPLY_CALENDLY_URL) { num.textContent = "Done"; stage.replaceChildren(el("h3", "apply__q", "Got It, Thanks!"), el("p", "apply__note", "We’ve received your application and will be in touch shortly.")); return; }
    num.textContent = "Last Step";
    const url = new URL(APPLY_CALENDLY_URL);
    url.searchParams.set("name", payload.first_name); url.searchParams.set("email", payload.email);
    url.searchParams.set("hide_gdpr_banner", "1"); url.searchParams.set("embed_type", "Inline"); url.searchParams.set("embed_domain", location.hostname);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => { if (payload[k]) url.searchParams.set(k, payload[k]); });
    const frame = el("iframe", "apply__calendar"); frame.src = url.href; frame.title = "Pick a time for your call";
    stage.replaceChildren(el("h3", "apply__q", "Book Your Call"), frame);
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  window.addEventListener("message", (e) => {
    if (e.origin !== "https://calendly.com" || !e.data || e.data.event !== "calendly.event_scheduled") return;
    if (APPLY_BOOKED_URL) location.href = APPLY_BOOKED_URL;
  });

  render(false);
})();
