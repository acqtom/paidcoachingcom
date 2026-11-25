// One-question-at-a-time application form (#apply-form)
// ---- Config ---------------------------------------------------------------
// type: "text" | "email" | "tel" | "choice" (pick one) | "multi" (pick several). Add optional: true to allow skipping.
const APPLY_QUESTIONS = [
  { id: "first_name", type: "text", label: "What’s Your Name?", autocomplete: "name" },
  { id: "email", type: "email", label: "What’s Your Best Email?", autocomplete: "email" },
  { id: "phone", type: "tel", label: "What’s Your Phone Number?", autocomplete: "tel" },
  { id: "q4", type: "text", label: "[Placeholder Written Question]" },
  { id: "q5", type: "choice", label: "[Placeholder Pick-One Question]", options: ["Option 1", "Option 2", "Option 3", "Option 4"] },
  { id: "q6", type: "multi", label: "[Placeholder Pick-Several Question]", options: ["Option 1", "Option 2", "Option 3"] },
];
const APPLY_WEBHOOK_URL = "";  // where answers are sent. Empty = nothing is saved.
const APPLY_REDIRECT_URL = ""; // page to open after a successful submit. Empty = thank-you message.
const APPLY_START_PERCENT = 50; // progress bar starts here and reaches 100 at the end

(function applyForm() {
  const root = document.getElementById("apply-form");
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const stage = $(".apply__stage"), bar = $(".apply__bar span"), num = $(".apply__num"), pct = $(".apply__pct"), track = $(".apply__bar");
  const answers = {};
  const total = APPLY_QUESTIONS.length;
  let step = 0, locked = false;

  // Every application button on the page scrolls here
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".js-cta")) return;
    e.preventDefault();
    document.getElementById("apply").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => stage.querySelector("input")?.focus({ preventScroll: true }), 650);
  });

  const progress = (done) => {
    const p = Math.round(APPLY_START_PERCENT + (100 - APPLY_START_PERCENT) * (done / total));
    bar.style.width = p + "%"; pct.textContent = p + "%"; track.setAttribute("aria-valuenow", p);
  };
  const valid = (q) => {
    const v = answers[q.id];
    if (q.type === "multi") return q.optional || (v || []).length > 0;
    const t = (v || "").trim();
    if (!t) return !!q.optional;
    if (q.type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(t);
    if (q.type === "tel") return t.replace(/\D/g, "").length >= 7;
    return true;
  };
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };

  function render(focus) {
    const q = APPLY_QUESTIONS[step];
    locked = false;
    num.textContent = "Question " + (step + 1);
    progress(step);
    stage.replaceChildren();
    const form = el("form", "apply__step"); form.noValidate = true;
    const title = el("h3", "apply__q", q.label); title.id = "apply-q";
    form.append(title);

    const next = el("button", "cta apply__next", step === total - 1 ? "Submit " : "Continue "); next.type = "submit";
    next.append(el("span", "cta__arrow", "→"));
    const sync = () => { next.disabled = !valid(q); };

    if (q.type === "choice" || q.type === "multi") {
      const group = el("div", "apply__options");
      group.setAttribute("role", q.type === "choice" ? "radiogroup" : "group");
      group.setAttribute("aria-labelledby", "apply-q");
      q.options.forEach((opt) => {
        const lab = el("label", "apply__option"), input = el("input"), span = el("span", "", opt);
        input.type = q.type === "choice" ? "radio" : "checkbox"; input.name = q.id; input.value = opt;
        input.checked = q.type === "choice" ? answers[q.id] === opt : (answers[q.id] || []).includes(opt);
        input.addEventListener("change", () => {
          answers[q.id] = q.type === "choice" ? opt : [...group.querySelectorAll("input:checked")].map((i) => i.value);
          sync();
        });
        lab.append(input, span); group.append(lab);
      });
      form.append(group);
    } else {
      const input = el("input", "apply__input");
      input.type = q.type; input.name = q.id; input.placeholder = q.placeholder || "Type your answer..."; input.value = answers[q.id] || "";
      if (q.autocomplete) input.autocomplete = q.autocomplete;
      input.setAttribute("aria-labelledby", "apply-q");
      input.addEventListener("input", () => { answers[q.id] = input.value; sync(); });
      form.append(input);
    }

    const row = el("div", "apply__actions");
    row.append(next);
    if (step > 0) {
      const back = el("button", "apply__back", "← Back"); back.type = "button";
      back.addEventListener("click", () => { step--; render(true); });
      row.append(back);
    }
    const error = el("p", "apply__error"); error.setAttribute("role", "alert"); error.hidden = true;
    form.append(row, error);
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (locked || !valid(q)) return;
      if (step < total - 1) { step++; render(true); } else submit(next, error);
    });
    sync();
    stage.append(form);
    if (focus) form.querySelector("input")?.focus({ preventScroll: true });
  }

  async function submit(btn, error) {
    locked = true; btn.disabled = true; error.hidden = true;
    const fail = (msg) => { locked = false; btn.disabled = false; error.textContent = msg; error.hidden = false; };
    if (!APPLY_WEBHOOK_URL) return fail("This form isn’t connected yet, so your answers weren’t sent.");
    const payload = { ...answers, page: location.href, submitted_at: new Date().toISOString() };
    const params = new URLSearchParams(location.search);
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ad_id", "fbclid"].forEach((k) => { if (params.get(k)) payload[k] = params.get(k); });
    try {
      const res = await fetch(APPLY_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch (err) {
      return fail("Something went wrong sending your answers. Please try again.");
    }
    progress(total);
    if (typeof fbq === "function") fbq("track", "Lead");
    if (APPLY_REDIRECT_URL) { location.href = APPLY_REDIRECT_URL; return; }
    num.textContent = "Done";
    stage.replaceChildren(el("h3", "apply__q", "Got It, Thanks!"), el("p", "apply__thanks", "We’ve received your application and will be in touch shortly."));
  }

  render(false);
})();
