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
const APPLY_CALENDLY_URL = "https://calendly.com/staff-paidcoaching/30min?hide_event_type_details=1&hide_gdpr_banner=1"; // calendar shown after Submit
const APPLY_WEBHOOK_URL = "/api/apply"; // saves answers for /dashboard → Form answers
const APPLY_BOOKED_URL = "";   // page to open once a call is booked, e.g. "/confirmation"
const APPLY_START_PERCENT = 50; // progress bar starts here and reaches 100 at the booking step
const APPLY_CONSENT_HTML = 'You agree to receive automated follow-up and reminder SMS messages with varying frequency from Helmbury LLC (Paidcoaching.com). Txt and data rates may apply. Reply STOP to end. Text HELP for help. Click for <a href="/tos" target="_blank" rel="noopener">Terms of Service</a>, <a href="/pp" target="_blank" rel="noopener">Privacy Policy</a>.';
// ISO code, dial code (first one is the default)
const APPLY_COUNTRIES = "US1 CA1 GB44 AU61 NZ64 IE353 ZA27 AE971 SA966 QA974 KW965 IL972 IN91 PK92 BD880 LK94 SG65 MY60 PH63 ID62 TH66 VN84 HK852 JP81 KR82 TW886 DE49 FR33 ES34 PT351 IT39 NL31 BE32 LU352 CH41 AT43 SE46 NO47 DK45 FI358 IS354 PL48 CZ420 SK421 HU36 RO40 BG359 GR30 CY357 MT356 HR385 SI386 RS381 EE372 LV371 LT370 UA380 TR90 EG20 MA212 NG234 GH233 KE254 BR55 MX52 AR54 CL56 CO57 PE51 CR506 PA507".split(" ").map((c) => [c.slice(0, 2), c.slice(2)]);

// How many digits a number has after the country code (and without a leading 0), as [min, max]
const APPLY_PHONE_DIGITS = { US: [10, 10], CA: [10, 10], GB: [9, 10], AU: [9, 9], NZ: [8, 10], IE: [7, 9], ZA: [9, 9], AE: [8, 9], SA: [8, 9], QA: [8, 8], KW: [8, 8], IL: [8, 9], IN: [10, 10], PK: [9, 10], BD: [8, 10], LK: [9, 9], SG: [8, 8], MY: [8, 10], PH: [8, 10], ID: [8, 12], TH: [8, 9], VN: [9, 10], HK: [8, 8], JP: [9, 10], KR: [8, 10], TW: [8, 9], DE: [7, 12], FR: [9, 9], ES: [9, 9], PT: [9, 9], IT: [6, 11], NL: [9, 9], BE: [8, 9], LU: [6, 11], CH: [9, 9], AT: [7, 13], SE: [7, 10], NO: [8, 8], DK: [8, 8], FI: [6, 12], IS: [7, 9], PL: [9, 9], CZ: [9, 9], SK: [9, 9], HU: [8, 9], RO: [9, 9], BG: [7, 9], GR: [10, 10], CY: [8, 8], MT: [8, 8], HR: [8, 9], SI: [8, 8], RS: [7, 10], EE: [7, 8], LV: [8, 8], LT: [8, 8], UA: [9, 9], TR: [10, 10], EG: [8, 10], MA: [9, 9], NG: [8, 10], GH: [9, 9], KE: [7, 10], BR: [10, 11], MX: [10, 10], AR: [10, 11], CL: [9, 9], CO: [10, 10], PE: [8, 9], CR: [8, 8], PA: [7, 8] };

(function applyForm() {
  const root = document.getElementById("apply-form");
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const stage = $(".apply__stage"), bar = $(".apply__bar span"), num = $(".apply__num"), pct = $(".apply__pct"), track = $(".apply__bar");
  const answers = { contact: { country: APPLY_COUNTRIES[0][0], first_name: "", phone: "", email: "", sms: false } };
  const total = APPLY_QUESTIONS.length;
  let step = 0, busy = false, sent = false;
  const leadId = crypto.randomUUID ? crypto.randomUUID() : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16));
  const tell = (name, detail) => document.dispatchEvent(new CustomEvent("apply:" + name, { detail })); // for track.js

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
      return !!c.first_name.trim() && !!c.phone.trim() && !phoneProblem() && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim());
    }
    return !!q.optional || !!(answers[q.id] || "").trim();
  };
  // ---- Phone: formatting and checks ----
  const onlyDigits = (v) => v.replace(/\D/g, "");
  const dialOf = (iso) => (APPLY_COUNTRIES.find((x) => x[0] === iso) || ["", ""])[1];
  const nanp = (iso) => iso === "US" || iso === "CA"; // (201) 555-0123 numbering
  // digits after the country code, without the leading 0 people dial at home
  const national = (digits, iso) => {
    if (nanp(iso)) return digits.replace(/^1/, "");
    if (iso === "HU") return digits.replace(/^06/, "");
    return iso === "IT" ? digits : digits.replace(/^0/, "");
  };
  const phoneProblem = () => {
    const raw = answers.contact.phone.trim(), digits = onlyDigits(raw), iso = answers.contact.country;
    const wrong = "This phone number looks incorrect. ";
    if (iso === "other") {
      if (!raw.startsWith("+")) return wrong + "Start with + and your country code.";
      return digits.length < 8 ? wrong + "It’s missing some digits." : digits.length > 15 ? wrong + "It has too many digits." : "";
    }
    let body = digits;
    if (raw.startsWith("+")) {
      if (!digits.startsWith(dialOf(iso))) return wrong + "It doesn’t match the country you picked.";
      body = digits.slice(dialOf(iso).length);
    }
    const n = national(body, iso), [min, max] = APPLY_PHONE_DIGITS[iso];
    if (n.length < min) return wrong + "It’s missing some digits.";
    if (n.length > max) return wrong + "It has too many digits.";
    if (nanp(iso) && !/^[2-9]\d\d[2-9]/.test(n)) return wrong + "Please check the area code.";
    if (/^(\d)\1+$/.test(n)) return wrong + "Please check it.";
    return "";
  };
  const fullPhone = () => {
    const raw = answers.contact.phone.trim(), digits = onlyDigits(raw), iso = answers.contact.country;
    if (raw.startsWith("+") || iso === "other") return "+" + digits;
    return "+" + dialOf(iso) + national(digits, iso);
  };
  const prettyPhone = (v, iso) => {
    const d = onlyDigits(v);
    if (v.trim().startsWith("+")) return "+" + d;
    if (nanp(iso)) {
      const n = d.replace(/^1/, "");
      if (n.length < 4) return n ? "(" + n : "";
      return "(" + n.slice(0, 3) + ") " + n.slice(3, 6) + (n.length > 6 ? "-" + n.slice(6) : "");
    }
    // UK mobiles 07700 900123, Australian mobiles 0412 345 678
    const own = iso === "GB" && d[0] === "0" ? [5, 11] : iso === "AU" && d[0] === "0" ? [4, 7] : null;
    if (own) return [d.slice(0, own[0]), d.slice(own[0], own[1]), d.slice(own[1])].filter(Boolean).join(" ");
    // everyone else: groups of 3, then whatever is left (up to 4)
    const out = []; let rest = d;
    while (rest.length > 4) { out.push(rest.slice(0, 3)); rest = rest.slice(3); }
    if (rest) out.push(rest);
    return out.join(" ");
  };

  function choiceField(q, sync, go) {
    const group = el("div", "apply__options");
    group.setAttribute("role", "radiogroup"); group.setAttribute("aria-labelledby", "apply-q");
    q.options.forEach((opt, i) => {
      const lab = el("label", "apply__option"), input = el("input"), box = el("span"), key = el("i", "", String.fromCharCode(65 + i));
      key.setAttribute("aria-hidden", "true");
      input.type = "radio"; input.name = q.id; input.value = opt; input.checked = answers[q.id] === opt;
      input.addEventListener("change", () => { answers[q.id] = opt; sync(); });
      // tapping an answer moves on by itself (except on the last question, which needs Submit)
      if (step < total - 1) box.addEventListener("click", () => { const at = step; setTimeout(() => { if (step === at) go(); }, 280); });
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
    const phone = text("phone", "tel", "(201) 555-0123", "tel"); phone.setAttribute("aria-label", "Phone number");
    const bad = el("p", "apply__bad"); bad.id = "apply-phone-error"; bad.setAttribute("role", "alert"); bad.hidden = true;
    const showProblem = (msg) => {
      bad.textContent = msg; bad.hidden = !msg;
      phone.classList.toggle("is-bad", !!msg); phone.setAttribute("aria-invalid", msg ? "true" : "false");
      if (msg) phone.setAttribute("aria-describedby", bad.id); else phone.removeAttribute("aria-describedby");
    };
    const problem = () => (c.phone.trim() ? phoneProblem() : "");
    const setPhone = (v) => { phone.value = c.phone = v; };
    const placeholder = () => { phone.placeholder = nanp(c.country) ? "(201) 555-0123" : c.country === "other" ? "+ country code and number" : "Phone number"; };
    // A full international number (typed, pasted or autofilled) picks its own country
    const tidy = () => {
      const raw = c.phone.trim();
      if (raw.startsWith("+")) {
        const d = onlyDigits(raw);
        const keep = dialOf(c.country) && d.startsWith(dialOf(c.country)) ? c.country : "";
        const hit = keep || (APPLY_COUNTRIES.filter((x) => d.startsWith(x[1])).sort((x, y) => y[1].length - x[1].length)[0] || [""])[0];
        if (hit) { c.country = sel.value = hit; placeholder(); const rest = d.slice(dialOf(hit).length); setPhone(prettyPhone(rest, hit)); return; }
      }
      setPhone(prettyPhone(raw, c.country));
    };
    // Add ( ) - and spaces while typing without moving the cursor; leave the text alone while deleting
    phone.addEventListener("input", (e) => {
      const kind = e.inputType || "";
      if (!kind.startsWith("delete") && !e.isComposing) {
        const atEnd = phone.selectionStart === phone.value.length;
        const before = phone.value.slice(0, phone.selectionStart).replace(/[^\d+]/g, "").length;
        if (!kind || kind === "insertFromPaste" || kind === "insertReplacementText") tidy(); else setPhone(prettyPhone(phone.value, c.country));
        let pos = phone.value.length;
        if (!atEnd) { pos = 0; for (let n = 0; pos < phone.value.length && n < before; pos++) if (/[\d+]/.test(phone.value[pos])) n++; }
        if (document.activeElement === phone) phone.setSelectionRange(pos, pos);
      }
      const msg = problem();
      if (!msg || msg.includes("too many") || !bad.hidden) showProblem(msg); // don't nag about missing digits mid-typing
      sync();
    });
    phone.addEventListener("blur", () => { if (c.phone.trim()) tidy(); showProblem(problem()); sync(); });
    sel.addEventListener("change", () => { c.country = sel.value; placeholder(); if (c.phone.trim()) setPhone(prettyPhone(c.phone, c.country)); showProblem(problem()); sync(); });
    placeholder(); showProblem(problem());
    const phoneRow = el("div", "apply__phone"); phoneRow.append(sel, phone);
    const phoneWrap = el("div", "apply__field"); phoneWrap.append(el("span", "apply__label", "Phone Number*"), phoneRow, bad);
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
    const next = el("button", "cta apply__next", step === total - 1 ? "Submit " : "Continue "); next.type = "submit"; next.append(el("span", "cta__arrow", "→"));
    const sync = () => { next.disabled = !valid(q); };
    const go = () => {
      if (busy || !valid(q)) return;
      tell("answered", q.id);
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
    const payload = { id: leadId, has_high_ticket_offer: answers.has_high_ticket_offer, situation: answers.situation, niche: answers.niche || "", first_name: c.first_name.trim(), phone: fullPhone(), email: c.email.trim(), sms_consent: c.sms, monthly_revenue: answers.monthly_revenue, page: location.href, submitted_at: new Date().toISOString() };
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ad_id", "fbclid"].forEach((k) => { if (params.get(k)) payload[k] = params.get(k); });
    if (APPLY_WEBHOOK_URL && !sent) {
      const save = async () => {
        const res = await fetch(APPLY_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), keepalive: true, signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined });
        if (!res.ok) throw new Error("HTTP " + res.status);
      };
      try {
        await save().catch(save); // one retry; the same id is never saved twice
        sent = true;
      } catch (err) {
        if (!APPLY_CALENDLY_URL) { busy = false; btn.disabled = false; error.textContent = "Something went wrong sending your answers. Please try again."; error.hidden = false; return; }
        console.error("[apply] answers not saved:", err); // still let them book
      }
    }
    tell("submitted");
    if (typeof fbq === "function") fbq("track", "Lead");
    progress(total);
    if (!APPLY_CALENDLY_URL) { num.textContent = "Done"; stage.replaceChildren(el("h3", "apply__q", "Got It, Thanks!"), el("p", "apply__note", "We’ve received your application and will be in touch shortly.")); return; }
    num.textContent = "Last Step";
    const url = new URL(APPLY_CALENDLY_URL);
    url.searchParams.set("name", payload.first_name); url.searchParams.set("email", payload.email); url.searchParams.set("a1", payload.phone); // a1 = the event’s first question, phone number
    url.searchParams.set("hide_gdpr_banner", "1"); url.searchParams.set("embed_type", "Inline"); url.searchParams.set("embed_domain", location.hostname);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => { if (payload[k]) url.searchParams.set(k, payload[k]); });
    const frame = el("iframe", "apply__calendar"); frame.src = url.href; frame.title = "Pick a time for your call";
    stage.replaceChildren(el("h3", "apply__q", "Book Your Mentorship Planning Call"), frame);
    root.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  // Tell /api/dropoff where someone left (for the Slack drop-off channel). Contact details are never sent from here.
  let reported = false, booked = false, startedAt = 0;
  root.addEventListener("click", () => { startedAt = startedAt || Date.now(); }, { once: true });
  addEventListener("pagehide", () => {
    if (reported || booked) return;
    const q = APPLY_QUESTIONS[step], given = {};
    ["has_high_ticket_offer", "situation", "niche", "monthly_revenue"].forEach((k) => { if (typeof answers[k] === "string" && answers[k].trim()) given[k] = answers[k]; });
    let data;
    if (sent) data = { step: "calendar", id: leadId };
    else if (step > 0 && !busy) data = { step: q.id, answers: given };
    if (!data) return;
    reported = true;
    const p = new URLSearchParams(location.search);
    data.d = matchMedia("(max-width: 760px)").matches ? "m" : "d";
    data.s = p.get("utm_content") || p.get("utm_campaign") || p.get("utm_source") || "";
    if (startedAt) data.secs = (Date.now() - startedAt) / 1000;
    const json = JSON.stringify(data);
    if (!(navigator.sendBeacon && navigator.sendBeacon("/api/dropoff", new Blob([json], { type: "application/json" })))) fetch("/api/dropoff", { method: "POST", headers: { "Content-Type": "application/json" }, body: json, keepalive: true }).catch(() => {});
  });
  window.addEventListener("message", (e) => {
    if (e.origin !== "https://calendly.com" || !e.data || e.data.event !== "calendly.event_scheduled") return;
    tell("booked");
    booked = true;
    if (sent) fetch(APPLY_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: leadId, booked: true }), keepalive: true }).catch(() => {});
    if (APPLY_BOOKED_URL) location.href = APPLY_BOOKED_URL;
  });

  render(false);
})();
