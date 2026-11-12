// /audit form
// ---- Config ---------------------------------------------------------------
// Paste the webhook URL (GoHighLevel, Zapier, Make, Close...) here to start saving answers.
// Until it's set, the form validates but shows a "not connected yet" message instead of submitting.
const AUDIT_WEBHOOK_URL = "";
// Optional: send people to another page after a successful submit (e.g. "/confirmation").
// Leave empty to show the thank-you message on this page.
const AUDIT_REDIRECT_URL = "";

(function auditForm() {
  const form = document.getElementById("audit-form");
  if (!form) return;
  const errorBox = form.querySelector(".audit-form__error");
  const submit = form.querySelector(".audit-form__submit");

  // Every "Book A Free Strategy Session" button on this page scrolls to the form
  document.addEventListener("click", (e) => {
    const cta = e.target.closest(".js-cta");
    if (!cta) return;
    e.preventDefault();
    form.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => form.querySelector("input")?.focus({ preventScroll: true }), 500);
  });

  const showError = (msg) => { errorBox.textContent = msg; errorBox.hidden = false; };
  const clearInvalid = (el) => el.closest(".field")?.classList.remove("is-invalid");
  form.addEventListener("input", (e) => clearInvalid(e.target));
  form.addEventListener("change", (e) => clearInvalid(e.target));

  const validate = () => {
    let firstBad = null;
    const mark = (el) => { el.classList.add("is-invalid"); firstBad = firstBad || el; };
    form.querySelectorAll(".field").forEach((f) => f.classList.remove("is-invalid"));
    form.querySelectorAll("input[required]").forEach((input) => {
      if (!input.value.trim() || !input.checkValidity()) mark(input.closest(".field"));
    });
    form.querySelectorAll("[data-required]").forEach((set) => {
      if (!set.querySelector("input:checked")) mark(set);
    });
    return firstBad;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    const bad = validate();
    if (bad) {
      showError("Please fill in the highlighted questions.");
      bad.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const data = new FormData(form);
    const params = new URLSearchParams(location.search);
    const payload = {
      first_name: data.get("first_name").trim(),
      email: data.get("email").trim(),
      phone: data.get("phone").trim(),
      niche: data.get("niche").trim(),
      acquisition: data.getAll("acquisition"),
      monthly_revenue: data.get("monthly_revenue"),
      urgency: data.get("urgency"),
      page: location.href,
      submitted_at: new Date().toISOString(),
    };
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ad_id", "fbclid"].forEach((k) => {
      if (params.get(k)) payload[k] = params.get(k);
    });

    if (!AUDIT_WEBHOOK_URL) {
      showError("This form isn’t connected yet, so your answers weren’t sent.");
      console.warn("[audit] AUDIT_WEBHOOK_URL is empty. Payload:", payload);
      return;
    }

    submit.disabled = true;
    try {
      const res = await fetch(AUDIT_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
    } catch (err) {
      submit.disabled = false;
      showError("Something went wrong sending your answers. Please try again.");
      return;
    }

    if (typeof fbq === "function") fbq("track", "Lead");
    if (AUDIT_REDIRECT_URL) { location.href = AUDIT_REDIRECT_URL; return; }
    form.hidden = true;
    const done = document.getElementById("audit-done");
    done.hidden = false;
    done.scrollIntoView({ behavior: "smooth", block: "center" });
  });
})();
