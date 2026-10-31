const ATTRIBUTION_STORAGE_KEY = "zq_attribution_v7";
const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "gbraid",
  "wbraid",
  "fbclid",
];
let analyticsModulePromise;

function loadAnalyticsModule() {
  if (!analyticsModulePromise) {
    analyticsModulePromise = import("./analytics.mjs").catch((error) => {
      analyticsModulePromise = undefined;
      throw error;
    });
  }
  return analyticsModulePromise;
}

function withAnalytics(callback) {
  loadAnalyticsModule()
    .then(callback)
    .catch(() => {});
}

function runWhenIdle(callback, timeout = 2500) {
  window.addEventListener(
    "load",
    () => {
      window.setTimeout(() => {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(callback, { timeout: 1500 });
          return;
        }

        callback();
      }, timeout);
    },
    { once: true },
  );
}

function attributionStorageAllowed() {
  const win = typeof window === "undefined" ? null : window;
  let ads = "denied", analytics = "denied";
  for (const entry of win?.dataLayer || []) {
    if (entry?.[0] !== "consent" || !["default", "update"].includes(entry[1])) continue;
    if (entry[2]?.ad_storage) ads = entry[2].ad_storage;
    if (entry[2]?.analytics_storage) analytics = entry[2].analytics_storage;
  }
  return ads === "granted" && analytics === "granted";
}

function getStoredAttribution() {
  if (!attributionStorageAllowed()) return {};
  try {
    const raw = window.sessionStorage?.getItem(ATTRIBUTION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function captureAttributionLite() {
  if (!attributionStorageAllowed()) {
    try { window.sessionStorage?.removeItem(ATTRIBUTION_STORAGE_KEY); } catch {}
    return {};
  }
  let params;
  try {
    params = new URL(window.location.href).searchParams;
  } catch {
    params = null;
  }
  const captured = {};
  ATTRIBUTION_KEYS.forEach((key) => {
    const value = params?.get(key);
    if (value) {
      captured[key] = value;
    }
  });

  if (Object.keys(captured).length === 0) {
    return getStoredAttribution();
  }

  const next = {
    ...getStoredAttribution(),
    ...captured,
    landing_page: `${window.location.pathname}${window.location.search}`,
    captured_at: new Date().toISOString(),
  };

  try {
    window.sessionStorage?.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(next));
  } catch {}

  return next;
}

function scheduleAnalyticsInit() {
  captureAttributionLite();
  runWhenIdle(() => withAnalytics((analytics) => analytics.initAnalytics()), 1500);
}

function trackWhatsAppClick(...args) { withAnalytics((analytics) => analytics.trackWhatsAppClick(...args)); }
function trackCallClick(...args) { withAnalytics((analytics) => analytics.trackCallClick(...args)); }
function trackEmailClick(...args) { withAnalytics((analytics) => analytics.trackEmailClick(...args)); }
function trackQuoteDiagnostic(...args) { withAnalytics((analytics) => analytics.trackQuoteDiagnostic(...args)); }
function trackFormStart(...args) { withAnalytics((analytics) => analytics.trackFormStart(...args)); }
function trackMobileMenuOpen(...args) { withAnalytics((analytics) => analytics.trackMobileMenuOpen(...args)); }
function trackOutboundClick(...args) { withAnalytics((analytics) => analytics.trackOutboundClick(...args)); }
function trackQuoteClick(...args) { withAnalytics((analytics) => analytics.trackQuoteClick(...args)); }
function trackStickyCtaClick(...args) { withAnalytics((analytics) => analytics.trackStickyCtaClick(...args)); }
function trackPricePageCTA(...args) { withAnalytics((analytics) => analytics.trackPricePageCTA(...args)); }
function trackSuburbCTA(...args) { withAnalytics((analytics) => analytics.trackSuburbCTA(...args)); }
function trackServiceCTA(...args) { withAnalytics((analytics) => analytics.trackServiceCTA(...args)); }

// Polyfill for WeakSet to support legacy mobile browsers
if (typeof WeakSet === "undefined") {
  class WeakSetPolyfill {
    constructor(iterable) {
      this._id = "__weakset_" + Math.random().toString(36).slice(2);
      if (iterable) {
        for (const item of iterable) {
          this.add(item);
        }
      }
    }
    add(obj) {
      if (obj && typeof obj === "object") {
        Object.defineProperty(obj, this._id, {
          value: true,
          writable: true,
          configurable: true,
        });
      }
      return this;
    }
    has(obj) {
      return !!(obj && Object.prototype.hasOwnProperty.call(obj, this._id));
    }
    delete(obj) {
      if (this.has(obj)) {
        delete obj[this._id];
        return true;
      }
      return false;
    }
  }
  globalThis.WeakSet = WeakSetPolyfill;
}

document.documentElement.classList.add("js");

const footerYears = document.querySelectorAll("[data-year]");
const siteHeader = document.querySelector(".site-header");
const headerDetails = Array.from(siteHeader?.querySelectorAll("details") ?? []);
const forms = Array.from(document.querySelectorAll("form"));
const quoteForms = Array.from(
  document.querySelectorAll('form[data-quote-form="quote"]'),
);
const quoteDateFields = Array.from(
  document.querySelectorAll('input[type="date"][name*="date"]'),
);
const QUOTE_API_ENDPOINT = "/api/quote/";
const DEFAULT_QUOTE_ERROR_MESSAGE = "Could not send the request or confirm its status. Retry to check, or call ZQ Removals before starting another request.";
const SOCIAL_PROFILES = {
  facebook: "",
  instagram: "",
  linkedin: "",
  youtube: "",
};

function closeDetails(detailsList, keepOpen = null) {
  detailsList.forEach((details) => {
    if (details !== keepOpen) {
      details.open = false;
    }
  });
}

function setCurrentYear() {
  if (footerYears.length === 0) {
    return;
  }

  const year = String(new Date().getFullYear());
  footerYears.forEach((node) => {
    node.textContent = year;
  });
}

function setQuoteDateMinimum() {
  if (quoteDateFields.length === 0) {
    return;
  }

  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  const minDate = today.toISOString().slice(0, 10);

  quoteDateFields.forEach((field) => {
    field.min = minDate;
  });
}

function getTrimmedPayloadValue(payload, field) {
  return String(payload[field] ?? "").trim();
}

function getFirstNonEmptyPayloadValue(payload, fields, fallback = "") {
  for (const field of fields) {
    const value = getTrimmedPayloadValue(payload, field);
    if (value) {
      return value;
    }
  }

  return fallback;
}

function setupHeaderDetails() {
  if (!siteHeader || headerDetails.length === 0) {
    return;
  }

  headerDetails.forEach((details) => {
    const summary = details.querySelector("summary");
    if (summary) {
      summary.setAttribute("aria-expanded", String(details.open));
    }

    details.addEventListener("toggle", () => {
      if (summary) {
        summary.setAttribute("aria-expanded", String(details.open));
      }
      if (!details.open) {
        return;
      }

      if (details.closest(".mobile-nav") && details.querySelector("summary.mobile-menu-trigger")) {
        trackMobileMenuOpen();
        document.body.classList.toggle("menu-open", details.open);
      }

      const siblingDetails = headerDetails.filter((item) => item !== details);
      closeDetails(siblingDetails);
    });

    summary?.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      details.open = false;
      summary.focus();
    });
  });

  siteHeader.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeDetails(headerDetails);
    });
  });

  document.addEventListener("click", (event) => {
    if (siteHeader.contains(event.target)) {
      return;
    }

    closeDetails(headerDetails);
  });

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    const openDetails = headerDetails.filter((details) => details.open);
    if (openDetails.length === 0) {
      return;
    }

    const lastOpen = openDetails.at(-1);
    closeDetails(openDetails);
    lastOpen?.querySelector("summary")?.focus();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 960) {
      const mobileRoot = siteHeader.querySelector(".mobile-nav > details");
      if (mobileRoot) {
        mobileRoot.open = false;
        document.body.classList.remove("menu-open");
      }
    }
  });
}

const submitButtonContents = new WeakMap();

function rememberSubmitButtonContents(button) {
  if (!submitButtonContents.has(button)) {
    submitButtonContents.set(button, Array.from(button.childNodes));
  }
}

function restoreSubmitButtonContents(button) {
  const contents = submitButtonContents.get(button);
  if (contents) button.replaceChildren(...contents);
}

function setupFormState() {
  if (forms.length === 0) {
    return;
  }

  forms.forEach((form) => {
    if (form.getAttribute("data-quote-form") === "quote") {
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) {
      return;
    }

    rememberSubmitButtonContents(submitButton);
    if (!submitButton.dataset.defaultLabel) {
      submitButton.dataset.defaultLabel =
        submitButton.textContent?.trim() ?? "Get My Moving Quote";
    }

    form.addEventListener("submit", (event) => {
      if (submitButton.dataset.submitting === "true") {
        event.preventDefault();
        return;
      }

      submitButton.dataset.submitting = "true";
      submitButton.disabled = true;
      submitButton.textContent = "Sending request...";
    });
  });

  window.addEventListener("pageshow", () => {
    forms.forEach((form) => {
      if (form.getAttribute("data-quote-form") === "quote") return;
      const submitButton = form.querySelector('button[type="submit"]');
      if (!submitButton) {
        return;
      }

      submitButton.disabled = false;
      submitButton.dataset.submitting = "false";
      restoreSubmitButtonContents(submitButton);
    });
  });
}

function updateFormStepAccessibility(form, activeStepIndex) {
  const fieldsets = Array.from(form.querySelectorAll("fieldset.quote-form-group"));
  if (fieldsets.length === 0) {
    return;
  }

  const hasHiddenSteps = form.hasAttribute("data-multi-step-form");
  if (!hasHiddenSteps || activeStepIndex < 0) {
    fieldsets.forEach((fieldset) => {
      fieldset.removeAttribute("aria-hidden");
      fieldset.querySelectorAll("input, select, textarea").forEach((el) => {
        if (el.getAttribute("tabindex") === "-1") {
          el.removeAttribute("tabindex");
        }
      });
    });
    return;
  }

  fieldsets.forEach((fieldset, idx) => {
    if (idx === activeStepIndex) {
      fieldset.removeAttribute("aria-hidden");
      fieldset.querySelectorAll("input, select, textarea").forEach((el) => el.removeAttribute("tabindex"));
    } else {
      fieldset.setAttribute("aria-hidden", "true");
      fieldset.querySelectorAll("input, select, textarea").forEach((el) => el.setAttribute("tabindex", "-1"));
    }
  });
}

function setupQuoteFormStepAccessibility() {
  quoteForms.forEach((form) => {
    const fieldsets = Array.from(form.querySelectorAll("fieldset.quote-form-group"));
    const stepPills = Array.from(form.querySelectorAll(".step-pill"));
    if (fieldsets.length === 0) {
      return;
    }

    const syncActiveStep = (activeStepIndex) => {
      stepPills.forEach((pill, idx) => {
        const isActive = idx === activeStepIndex;
        pill.classList.toggle("is-active", isActive);
        if (isActive) {
          pill.setAttribute("aria-current", "step");
        } else {
          pill.removeAttribute("aria-current");
        }
      });

      updateFormStepAccessibility(
        form,
        form.hasAttribute("data-multi-step-form") ? activeStepIndex : -1,
      );
    };

    syncActiveStep(0);
    fieldsets.forEach((fieldset, idx) => {
      fieldset.addEventListener("focusin", () => syncActiveStep(idx));
    });
  });
}

const MIN_PHONE_NUMBER_LENGTH = 8;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isSupportedFormField(field) {
  return (
    field instanceof HTMLInputElement ||
    field instanceof HTMLSelectElement ||
    field instanceof HTMLTextAreaElement
  );
}

function validateQuoteForm(form) {
  const payload = {};
  const errors = {};
  const fields = Array.from(form.elements).filter((field) => field.name);

  fields.forEach((field) => {
    if (!isSupportedFormField(field)) {
      return;
    }
    payload[field.name] = field.value.trim();
  });

  fields.forEach((field) => {
    if (!isSupportedFormField(field) || !field.required) {
      return;
    }

    if (payload[field.name]) {
      return;
    }

    const labelText = field
      .closest("label")
      ?.querySelector("span")
      ?.textContent?.trim();
    errors[field.name] = labelText ? `Enter ${labelText.toLowerCase()}.` : "Complete this field.";
  });

  if (payload.email && !EMAIL_REGEX.test(payload.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (
    payload.phone &&
    payload.phone.replace(/[^\d+]/g, "").length < MIN_PHONE_NUMBER_LENGTH
  ) {
    errors.phone = "Enter a valid phone number.";
  }

  return { payload, errors };
}

function applyQuoteFormErrors(form, errors) {
  const errorNodes = Array.from(form.querySelectorAll("[data-error-for]"));
  errorNodes.forEach((node) => {
    const fieldName = node.getAttribute("data-error-for") ?? "";
    node.textContent = errors[fieldName] ?? "";
  });

  const fields = Array.from(form.elements).filter((field) => isSupportedFormField(field));
  fields.forEach((field) => {
    if (errors[field.name]) {
      field.setAttribute("aria-invalid", "true");
      return;
    }

    field.removeAttribute("aria-invalid");
  });
}

function setQuoteFormFeedback(form, message, state = "") {
  const feedbackNode = form.querySelector("[data-form-feedback]");
  if (!feedbackNode) {
    return;
  }
  feedbackNode.textContent = message;
  feedbackNode.classList.remove("is-success", "is-error");
  if (state === "success") {
    feedbackNode.classList.add("is-success");
    playEntrance(feedbackNode);
  }
  if (state === "error") {
    feedbackNode.classList.add("is-error");
  }
}

function isServiceContextPage() {
  return document.body.classList.contains("page-service-local")
    || document.body.classList.contains("page-service-furniture")
    || document.body.classList.contains("page-service-operations")
    || document.body.classList.contains("page-service-packing")
    || document.body.classList.contains("page-suburb")
    || document.body.classList.contains("page-guide-article");
}

function isSuburbContextPage() {
  return document.body.classList.contains("page-suburb");
}

function isPriceContextPage() {
  return [
    "/cheap-removalists-adelaide/",
    "/affordable-removalists-adelaide/",
    "/removalist-cost-adelaide/",
    "/moving-quotes-adelaide/",
    "/fixed-price-removalists-adelaide/",
    "/budget-removalists-adelaide/",
  ].includes(window.location.pathname);
}

function inferClickLocation(anchor) {
  const explicitLocation = anchor.getAttribute("data-lead-location");
  if (anchor.closest("#sticky-cta")) {
    return "sticky_cta";
  }
  if (anchor.closest(".site-header")) {
    return "header";
  }
  if (anchor.closest("footer")) {
    return "footer";
  }
  return explicitLocation || document.body.className || window.location.pathname;
}

function buildQuoteSubmissionPayload(payload) {
  const attribution = captureAttributionLite();
  const attributionPayload = attributionStorageAllowed() ? payload : {};
  const fullName = getFirstNonEmptyPayloadValue(payload, ["full_name", "name"]);
  const moveDetails = getFirstNonEmptyPayloadValue(payload, [
    "move_details",
    "message",
    "access_notes",
    "inventory_special_items",
  ]);

  return {
    submission_id: payload.submission_id,
    "cf-turnstile-response": getTrimmedPayloadValue(payload, "cf-turnstile-response"),
    "g-recaptcha-response": getTrimmedPayloadValue(payload, "g-recaptcha-response"),
    subject: getTrimmedPayloadValue(payload, "subject") || "Quote request - ZQ Removals",
    from_name: fullName || getTrimmedPayloadValue(payload, "from_name") || "ZQ Removals Website",
    botcheck: getFirstNonEmptyPayloadValue(payload, ["botcheck"]),
    redirect: getTrimmedPayloadValue(payload, "redirect") || "https://zqremovalsadelaide.com.au/thank-you/",
    source_page: window.location.href,
    utm_source: attribution.utm_source || getTrimmedPayloadValue(attributionPayload, "utm_source"),
    utm_medium: attribution.utm_medium || getTrimmedPayloadValue(attributionPayload, "utm_medium"),
    utm_campaign: attribution.utm_campaign || getTrimmedPayloadValue(attributionPayload, "utm_campaign"),
    utm_content: attribution.utm_content || getTrimmedPayloadValue(attributionPayload, "utm_content"),
    utm_term: attribution.utm_term || getTrimmedPayloadValue(attributionPayload, "utm_term"),
    gclid: attribution.gclid || getTrimmedPayloadValue(attributionPayload, "gclid"),
    gbraid: attribution.gbraid || "",
    wbraid: attribution.wbraid || "",
    fbclid: attribution.fbclid || getTrimmedPayloadValue(attributionPayload, "fbclid"),
    landing_page: attribution.landing_page || getTrimmedPayloadValue(attributionPayload, "landing_page"),
    captured_at: attribution.captured_at || getTrimmedPayloadValue(attributionPayload, "captured_at"),
    move_date: getFirstNonEmptyPayloadValue(payload, ["move_date", "preferred_move_date"]),
    crew_package: getFirstNonEmptyPayloadValue(payload, ["crew_package"]),
    pickup_suburb: getFirstNonEmptyPayloadValue(payload, ["pickup_suburb"]),
    dropoff_suburb: getFirstNonEmptyPayloadValue(payload, ["dropoff_suburb", "delivery_suburb"]),
    move_scope: getFirstNonEmptyPayloadValue(payload, ["move_scope", "move_type"], "not-sure"),
    property_type: getFirstNonEmptyPayloadValue(payload, ["property_type"], "not-sure"),
    move_size: getFirstNonEmptyPayloadValue(payload, ["move_size"], "not-sure"),
    pickup_access: getFirstNonEmptyPayloadValue(payload, ["pickup_access"], "not-sure"),
    dropoff_access: getFirstNonEmptyPayloadValue(payload, ["dropoff_access"], "not-sure"),
    packing_required: getFirstNonEmptyPayloadValue(payload, ["packing_required"], "not-sure"),
    full_name: fullName,
    name: fullName,
    phone: getFirstNonEmptyPayloadValue(payload, ["phone"]),
    email: getFirstNonEmptyPayloadValue(payload, ["email"]),
    move_details: moveDetails,
    message: moveDetails,
    attached_inventory: getTrimmedPayloadValue(payload, "attached_inventory"),
    form_type: getTrimmedPayloadValue(payload, "form_type"),
    page_type: getTrimmedPayloadValue(payload, "page_type"),
    page_title: getTrimmedPayloadValue(payload, "page_title"),
    service_context: getTrimmedPayloadValue(payload, "service_context"),
    location_context: getTrimmedPayloadValue(payload, "location_context"),
    form_location: getTrimmedPayloadValue(payload, "form_location"),
    additional_details: getTrimmedPayloadValue(payload, "additional_details"),
  };
}

function syncQuoteFormHiddenFields() {
  if (quoteForms.length === 0) {
    return;
  }

  const attribution = getStoredAttribution();
  const attributionFieldMap = {
    utm_source: attribution.utm_source || "",
    utm_medium: attribution.utm_medium || "",
    utm_campaign: attribution.utm_campaign || "",
    utm_content: attribution.utm_content || "",
    utm_term: attribution.utm_term || "",
    gclid: attribution.gclid || "",
    fbclid: attribution.fbclid || "",
    landing_page: attribution.landing_page || "",
    captured_at: attribution.captured_at || "",
  };

  quoteForms.forEach((form) => {
    for (const [fieldName, fieldValue] of Object.entries(attributionFieldMap)) {
      const field = form.querySelector(`input[name="${fieldName}"][data-attribution-field="${fieldName}"]`);
      if (field) {
        field.value = fieldValue;
      }
    }

    let sourcePageField = form.querySelector('input[name="source_page"]');
    if (!sourcePageField) {
      sourcePageField = document.createElement("input");
      sourcePageField.type = "hidden";
      sourcePageField.name = "source_page";
      form.appendChild(sourcePageField);
    }
    sourcePageField.value = window.location.href;
  });
}

function setupConversionTracking() {
  if (window.__zqContactTracking) return;
  window.__zqContactTracking = true;
  const trackedForms = new WeakSet();
  const formStartStoragePrefix = "zq_form_started:";

  document.addEventListener("focusin", (event) => {
    const form = event.target?.closest?.('form[data-quote-form="quote"]');
    if (!form || trackedForms.has(form)) {
      return;
    }

    trackedForms.add(form);
    const formName = form.getAttribute("data-form-name") || form.id || "quote_form";
    const storageKey = `${formStartStoragePrefix}${window.location.pathname}:${formName}`;
    if (window.sessionStorage?.getItem(storageKey) === "1") {
      return;
    }
    window.sessionStorage?.setItem(storageKey, "1");
    trackFormStart(formName);
  });

  document.addEventListener("click", (event) => {
    const anchor = event.target?.closest?.("a[href]");
    if (!anchor) {
      return;
    }

    const href = anchor.getAttribute("href") || "";
    if (/^tel:(?:\+?61|0)433[\s-]*819[\s-]*989$/i.test(href.replace(/[() ]/g, ""))) {
      trackCallClick(inferClickLocation(anchor));
      return;
    }

    if (/^https:\/\/(?:wa\.me\/|(?:api|web)\.whatsapp\.com\/send(?:[?\/]|$))/i.test(href)) {
      trackWhatsAppClick(inferClickLocation(anchor));
      return;
    }

    if (href.startsWith("mailto:")) {
      trackEmailClick(inferClickLocation(anchor));
      return;
    }

    const isOutbound = /^https?:\/\//i.test(href) && !href.startsWith(window.location.origin);
    if (isOutbound) {
      trackOutboundClick(href);
      return;
    }

    if (!href.includes("#quote-form") && href !== "#premium-quote" && href !== "/contact-us/") {
      return;
    }

    const location = inferClickLocation(anchor);
    if (anchor.closest("#sticky-cta")) {
      trackStickyCtaClick(location);
    } else {
      trackQuoteClick(location);
    }

    if (isPriceContextPage()) {
      trackPricePageCTA(window.location.pathname);
    } else if (isSuburbContextPage()) {
      trackSuburbCTA(window.location.pathname);
    } else if (isServiceContextPage()) {
      trackServiceCTA(window.location.pathname);
    }
  });
}

function setupFooterSocialLinks() {
  const section = document.querySelector("[data-social-section]");
  const list = document.querySelector("[data-social-links]");
  if (!section || !list) {
    return;
  }

  const entries = Object.entries(SOCIAL_PROFILES).filter(([, url]) => typeof url === "string" && url.trim());
  if (entries.length === 0) {
    section.hidden = true;
    return;
  }

  list.innerHTML = entries
    .map(([network, url]) => `<li><a href="${url}" rel="noopener noreferrer" target="_blank">${network[0].toUpperCase()}${network.slice(1)}</a></li>`)
    .join("");
  section.hidden = false;
}

function setQuoteFormSubmitting(form, isSubmitting) {
  const submitButton = form.querySelector('button[type="submit"]');
  if (!submitButton) {
    return;
  }

  rememberSubmitButtonContents(submitButton);
  if (!submitButton.dataset.defaultLabel) {
    submitButton.dataset.defaultLabel =
      submitButton.textContent?.trim() ?? "Get My Moving Quote";
  }

  submitButton.disabled = isSubmitting;
  submitButton.dataset.submitting = isSubmitting ? "true" : "false";
  if (isSubmitting) submitButton.textContent = "Sending quote...";
  else restoreSubmitButtonContents(submitButton);
}

function quoteRequestStorageKey(form) {
  return `zq_quote_request:${window.location.pathname}:${form.id || quoteForms.indexOf(form)}`;
}

function getQuoteRequestId(form) {
  if (form.dataset.submissionId) return form.dataset.submissionId;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(quoteRequestStorageKey(form)) || "null");
    if (typeof saved?.id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved.id) &&
        Date.now() - saved.at >= 0 && Date.now() - saved.at < 7 * 86400000) {
      return form.dataset.submissionId = saved.id;
    }
  } catch {}
  const id = form.dataset.submissionId = window.crypto.randomUUID();
  try { window.sessionStorage.setItem(quoteRequestStorageKey(form), JSON.stringify({ id, at: Date.now() })); } catch {}
  return id;
}

async function submitQuoteForm(form, payload) {
  // Keep the same logical ID across retries, including ambiguous network outcomes.
  if (!form.dataset) form.dataset = {};
  payload.submission_id = getQuoteRequestId(form);
  let response;
  try {
    response = await fetch(QUOTE_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(buildQuoteSubmissionPayload(payload)),
      signal: AbortSignal.timeout(50000),
    });
  } catch (error) {
    const requestError = new Error(DEFAULT_QUOTE_ERROR_MESSAGE);
    requestError.cause = error;
    throw requestError;
  }

  const responseText = await response.text().catch(() => "");
  const trimmedResponseText = responseText.trim();
  let result;

  try {
    result = JSON.parse(trimmedResponseText);
  } catch {
    result = { success: false, message: DEFAULT_QUOTE_ERROR_MESSAGE, body: responseText };
  }

  if (!response.ok || result?.success !== true || result.submission_status !== "accepted" ||
      result.submission_id !== payload.submission_id ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result.submission_id)) {
    if (result?.status === "rejected") {
      delete form.dataset.submissionId;
      try { window.sessionStorage.removeItem(quoteRequestStorageKey(form)); } catch {}
    }
    const error = new Error(DEFAULT_QUOTE_ERROR_MESSAGE);
    error.payload = { success: false, message: result?.status === "pending"
      ? "Your request may have been received. Please call ZQ Removals to confirm before sending again."
      : result?.status === "rejected"
        ? "Could not send the request: it was rejected. Review your details and try again."
        : result?.status === "conflict"
          ? "This request is already associated with different details. Please call ZQ Removals to confirm before starting another request."
          : DEFAULT_QUOTE_ERROR_MESSAGE };
    throw error;
  }

  return result;
}

// The Ads conversion request leaves 0.45-1s after the accepted event, after GTM's eventCallback,
// so redirecting from the form cancels it. Hand the accepted receipt to /thank-you/, which stays open.
const PENDING_ACCEPTED_QUOTE_KEY = "zq_pending_accepted_quote";
const PENDING_ACCEPTED_QUOTE_MAX_AGE_MS = 10 * 60 * 1000;

function handOffAcceptedQuote(formName, leadId) {
  try {
    window.sessionStorage.setItem(PENDING_ACCEPTED_QUOTE_KEY, JSON.stringify({ formName, leadId, at: Date.now() }));
    return window.sessionStorage.getItem(PENDING_ACCEPTED_QUOTE_KEY) !== null;
  } catch {
    return false;
  }
}

function trackHandedOffAcceptedQuote() {
  if (window.location.pathname !== "/thank-you/") return;
  let pending;
  try {
    const raw = window.sessionStorage.getItem(PENDING_ACCEPTED_QUOTE_KEY);
    // Consume before tracking so a reload or back/forward visit cannot replay it.
    window.sessionStorage.removeItem(PENDING_ACCEPTED_QUOTE_KEY);
    pending = raw ? JSON.parse(raw) : null;
  } catch {
    return;
  }
  if (
    typeof pending?.leadId !== "string" ||
    typeof pending.formName !== "string" ||
    !/^[a-z0-9_-]{1,80}$/i.test(pending.formName) ||
    !(Date.now() - pending.at >= 0 && Date.now() - pending.at <= PENDING_ACCEPTED_QUOTE_MAX_AGE_MS)
  ) {
    return;
  }
  // trackFormSuccess re-validates the UUIDv4 and dedupes by id.
  withAnalytics((analytics) => analytics.trackFormSuccess(pending.formName, pending.leadId));
}

function setupQuoteForms() {
  if (quoteForms.length === 0) {
    return;
  }

  syncQuoteFormHiddenFields();

  quoteForms.forEach((form) => {
    if (form.dataset.quoteBound) return;
    form.dataset.quoteBound = "true";
    if ("IntersectionObserver" in window) {
      const viewObserver = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          trackQuoteDiagnostic("zq_quote_form_view");
          viewObserver.disconnect();
        }
      });
      viewObserver.observe(form);
    }
    setQuoteFormSubmitting(form, false);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      if (form.dataset.quoteAccepted === "true" || submitButton?.dataset.submitting === "true") {
        return;
      }

      const { payload, errors } = validateQuoteForm(form);
      applyQuoteFormErrors(form, errors);

      if (Object.keys(errors).length > 0) {
        trackQuoteDiagnostic("zq_quote_validation_error", "invalid_fields");
        setQuoteFormFeedback(form, "Check the highlighted fields and try again.", "error");
        const firstErrorField = Array.from(form.elements).find(
          (field) => isSupportedFormField(field) && errors[field.name],
        );
        firstErrorField?.focus();
        return;
      }

      setQuoteFormFeedback(form, "");
      setQuoteFormSubmitting(form, true);

      try {
        const result = await submitQuoteForm(form, payload);
        form.dataset.quoteAccepted = "true";
        try { window.sessionStorage.removeItem(quoteRequestStorageKey(form)); } catch {}
        // Only the server's durably stored, provider-accepted receipt qualifies.
        try {
          const leadId = result.submission_id;
          const formName = form.getAttribute("data-form-name") ||
            `${window.location.pathname === "/" ? "home" : window.location.pathname.split("/").filter(Boolean).join("_")}_quote_${quoteForms.indexOf(form) + 1}`;
          if (!handOffAcceptedQuote(formName, leadId)) {
            // No sessionStorage: queue before navigation. Analytics failure must not turn an accepted enquiry into a retry.
            const analytics = await loadAnalyticsModule();
            await new Promise((resolve) => {
              const timeout = window.setTimeout(resolve, 1600);
              const queued = analytics.trackFormSuccess(formName, leadId, () => {
                window.clearTimeout(timeout);
                resolve();
              });
              if (!queued) { window.clearTimeout(timeout); resolve(); }
            });
          }
        } catch { /* Enquiry accepted; tracking may be blocked by the browser. */ }
        applyQuoteFormErrors(form, {});
        form.reset();
        setQuoteDateMinimum();
        setQuoteFormFeedback(
          form,
          "Quote request sent successfully. We will review it and get back to you soon.",
          "success",
        );
        setQuoteFormSubmitting(form, false);
        window.location.assign("/thank-you/");
      } catch (error) {
        trackQuoteDiagnostic("zq_quote_submission_error", "unconfirmed_response");
        setQuoteFormFeedback(
          form,
          error?.payload?.message ||
            error?.payload?.error ||
            error?.payload?.details ||
            error.message ||
            DEFAULT_QUOTE_ERROR_MESSAGE,
          "error",
        );
        setQuoteFormSubmitting(form, false);
      }
    });
  });

  window.addEventListener("pageshow", () => {
    syncQuoteFormHiddenFields();
    quoteForms.forEach((form) => {
      setQuoteFormSubmitting(form, false);
    });
  });
}

function ensureHiddenField(form, name, value) {
  let input = form.querySelector(`input[name="${name}"]`);
  if (!input) {
    input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    form.appendChild(input);
  }

  input.value = value;
}

function toSafeLocalSuccessPath(rawPath, fallbackPath = "/thank-you.html") {
  if (typeof rawPath !== "string" || rawPath.trim() === "") {
    return fallbackPath;
  }

  try {
    const parsed = new URL(rawPath, window.location.origin);
    const protocol = parsed.protocol.toLowerCase();
    const isHttpProtocol = protocol === "http:" || protocol === "https:";
    if (!isHttpProtocol || parsed.origin !== window.location.origin) {
      return fallbackPath;
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallbackPath;
  }
}

function setupLocalFormPreview() {
  const localPreviewHosts = new Set(["127.0.0.1", "localhost"]);
  if (!localPreviewHosts.has(window.location.hostname)) {
    return;
  }

  forms.forEach((form) => {
    if (form.getAttribute("data-quote-form") === "quote") {
      return;
    }

    const successPath = toSafeLocalSuccessPath(
      form.getAttribute("data-dev-success"),
      "/thank-you.html",
    );

    form.addEventListener("submit", (event) => {
      if (!form.reportValidity()) {
        return;
      }

      event.preventDefault();
      window.location.assign(successPath);
    });
  });
}

function setupHeaderState() {
  if (!siteHeader) {
    return;
  }

  const syncState = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  requestAnimationFrame(syncState);
  window.addEventListener("scroll", syncState, { passive: true });
}

// Never pre-hide content: a negative delay starts Animate.css fadeIn already visible.
function playEntrance(node) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  node.classList.add("zq-entrance", "animate__animated", "animate__fadeIn");
  node.addEventListener("animationend", () => {
    node.classList.remove("zq-entrance", "animate__animated", "animate__fadeIn");
  }, { once: true });
}

function setupEntranceAnimations() {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (preference.matches) return;
  const nodes = document.querySelectorAll(
    ".page-home .zqh-service-card, .page-home .zq-v2-service-card, .page-home .zq-v2-trust-cards > article, " +
    ".testimonial-card, .google-review-card, .rate-table"
  );
  // Unsupported browsers retain the fully visible, static experience.
  if (!("IntersectionObserver" in window) || !nodes.length) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      playEntrance(entry.target);
    });
  }, { threshold: 0.08 });
  nodes.forEach((node) => observer.observe(node));
  preference.addEventListener("change", () => {
    if (!preference.matches) return;
    observer.disconnect();
    document.querySelectorAll(".zq-entrance").forEach((node) => {
      node.classList.remove("zq-entrance", "animate__animated", "animate__fadeIn");
    });
  });
}

function setupRevealAnimations() {
  setupEntranceAnimations();
  const revealSelectors = [
    ".home-redesign-section-heading",
    ".home-editorial-service",
    ".home-editorial-process-grid > li",
    ".home-premium-feature-grid > article",
    ".home-premium-stats-grid > article",
    ".home-redesign-review-grid > article",
    ".home-redesign-route-grid > a",
    ".home-redesign-guide-grid > a",
    ".service-card",
    ".value-card",
    ".route-card",
    ".testimonial-card",
    ".timeline-card",
    ".proof-card",
    ".quote-form-shell",
  ];
  const nodes = Array.from(
    document.querySelectorAll(`.reveal-on-scroll, ${revealSelectors.join(", ")}`),
  );
  if (nodes.length === 0) {
    return;
  }

  nodes.forEach((node) => {
    node.classList.add("reveal-on-scroll");
    node.classList.add("is-visible");
    node.style.removeProperty("--reveal-delay");
  });
}

function setupInteractiveSpotlights() {
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches === false) {
    return;
  }

  const targets = document.querySelectorAll(
    "body.page-home .zqh-service-card, body.page-home .zq-v2-service-card, body.page-home .zq-v2-trust-cards article, body.page-home .zq-v2-gallery-grid figure, body.page-home .zqh-gallery figure",
  );

  targets.forEach((target) => {
    target.addEventListener("pointermove", (event) => {
      const bounds = target.getBoundingClientRect();
      target.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
      target.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
    });
    target.addEventListener("pointerleave", () => {
      target.style.removeProperty("--spotlight-x");
      target.style.removeProperty("--spotlight-y");
    });
  });
}

function setupAnimatedCounters() {
  const counters = Array.from(document.querySelectorAll("[data-count]"));
  if (counters.length === 0) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const formatCounter = (node, value) => {
    const decimals = Number.parseInt(node.dataset.decimals ?? "0", 10);
    const suffix = node.dataset.suffix ?? "";
    node.textContent = `${value.toFixed(decimals)}${suffix}`;
  };

  const animateCounter = (node) => {
    const target = Number.parseFloat(node.dataset.count ?? "0");
    if (!Number.isFinite(target) || reduceMotion) {
      formatCounter(node, target || 0);
      return;
    }

    const duration = 1100;
    const startedAt = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      formatCounter(node, target * eased);
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  };

  if (typeof window.IntersectionObserver !== "function") {
    counters.forEach(animateCounter);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.55 },
  );

  counters.forEach((counter) => observer.observe(counter));
}

function setupStickyCta() {
  const stickyCta = document.getElementById("sticky-cta");
  if (!stickyCta) {
    return;
  }

  const syncState = () => {
    // Show after scrolling past roughly the hero height (e.g. 500px)
    stickyCta.classList.toggle("is-visible", window.scrollY > 500);
  };

  syncState();
  window.addEventListener("scroll", syncState, { passive: true });
}

let serviceAreaMapsPromise;

function loadServiceAreaMaps(apiKey) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!serviceAreaMapsPromise) {
    serviceAreaMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => window.google?.maps ? resolve(window.google.maps) : reject(new Error("Google Maps unavailable"));
      script.onerror = () => reject(new Error("Google Maps failed to load"));
      document.head.appendChild(script);
    });
  }
  return serviceAreaMapsPromise;
}

function setupServiceAreaLocator() {
  const locator = document.querySelector("[data-service-area-locator]");
  if (!locator) return;
  let config;
  try { config = JSON.parse(locator.dataset.mapConfig || "{}"); } catch { config = {}; }
  const mapNode = locator.querySelector("[data-service-area-map]");
  const status = locator.querySelector("[data-service-area-status]");
  const links = Array.from(locator.querySelectorAll("[data-service-area-link]"));
  const search = locator.querySelector("[data-service-area-search]");
  const filterAreas = (query) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = links.filter((link) => link.dataset.areaName.toLowerCase().includes(normalizedQuery));
    links.forEach((link) => {
      link.closest("li").hidden = normalizedQuery !== "" && !matches.includes(link);
    });
    if (status && normalizedQuery) {
      status.textContent = matches.length
        ? `${matches.length} service area${matches.length === 1 ? "" : "s"} match your search.`
        : "No matching service area. Try another Adelaide suburb.";
    }
    return matches;
  };
  let map;
  const focusArea = (link) => {
    const position = { lat: Number(link.dataset.lat), lng: Number(link.dataset.lng) };
    if (map) {
      map.panTo(position);
      map.setZoom(12);
    }
    links.forEach((item) => item.removeAttribute("aria-current"));
    link.setAttribute("aria-current", "true");
    if (status) status.textContent = `${link.dataset.areaName} is a ZQ Removals service area.`;
  };
  search?.addEventListener("input", () => filterAreas(search.value));
  search?.addEventListener("change", () => {
    const match = filterAreas(search.value)[0];
    if (match) focusArea(match);
  });
  links.forEach((link) => link.addEventListener("click", () => focusArea(link)));
  const start = () => {
    if (!config.apiKey || !mapNode) {
      if (status) status.textContent = "Choose a service area below to view its removalist page.";
      return;
    }
    loadServiceAreaMaps(config.apiKey).then((maps) => {
      mapNode.replaceChildren();
      const mapOptions = { center: config.center, zoom: config.zoom || 10, fullscreenControl: true, mapTypeControl: false, streetViewControl: false, zoomControl: true };
      if (config.mapId) mapOptions.mapId = config.mapId;
      map = new maps.Map(mapNode, mapOptions);
      links.forEach((link) => {
        const marker = new maps.Marker({ map, position: { lat: Number(link.dataset.lat), lng: Number(link.dataset.lng) }, title: `${link.dataset.areaName} service area` });
        marker.addListener("click", () => focusArea(link));
      });
      if (status) status.textContent = "Select a pin or service area to focus the map.";
    }).catch(() => {
      if (status) status.textContent = "The interactive map is unavailable. Use the service-area links to continue.";
      mapNode.innerHTML = "<p>Map unavailable right now. The service-area links remain available.</p>";
    });
  };
  if (config.apiKey && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { observer.disconnect(); start(); } }, { rootMargin: "300px" });
    observer.observe(locator);
  } else start();
}

function setupHeroEstimator() {
  const form = document.querySelector(".zq-hero-estimator");
  if (!form) return;

  const scopeTabs = form.querySelectorAll(".hero-scope-tab");
  const sizeBtns = form.querySelectorAll(".hero-size-btn");
  const pickupInput = document.getElementById("heroPickup");
  const dropoffInput = document.getElementById("heroDropoff");
  const priceDisplay = document.getElementById("heroEstPrice");
  const subDisplay = document.getElementById("heroEstSub");
  const labelDisplay = document.getElementById("heroEstLabel");

  let currentScope = "local";
  let currentSizeIndex = 1;

  const SIZES = [
    { label: "Two bedrooms", name: "1–2 Bed Unit", truck: "4.5T Truck + 2 Men", rate: "$75 / 30 min ($150/hr)", sub: "Typical total: $375 – $525 inc. GST" },
    { label: "Three bedrooms", name: "3 Bed House", truck: "8T Truck + 2 Men", rate: "$75 / 30 min ($150/hr)", sub: "Typical total: $600 – $825 inc. GST" },
    { label: "Four or more bedrooms", name: "4+ Bed Family", truck: "12T Truck + 3 Men", rate: "$89 / 30 min ($178/hr)", sub: "Typical total: $979 – $1,335 inc. GST" },
    { label: "Furniture or selected items", name: "Few Heavy Items", truck: "Agile Pantech + 2 Men", rate: "$75 / 30 min ($150/hr)", sub: "2-hour minimum booking applies" },
  ];

  const updateEstimates = () => {
    if (!priceDisplay) return;

    if (currentScope === "local") {
      const s = SIZES[currentSizeIndex] || SIZES[1];
      if (labelDisplay) labelDisplay.textContent = "Estimated Crew & Published Rate";
      priceDisplay.innerHTML = `${s.rate} <small>(${s.truck})</small>`;
      if (subDisplay) subDisplay.textContent = s.sub;
    } else if (currentScope === "interstate") {
      if (labelDisplay) labelDisplay.textContent = "Interstate Corridor Transit";
      if (currentSizeIndex === 0) {
        priceDisplay.innerHTML = "Adelaide shared-load enquiry <small>(Part Load)</small>";
        if (subDisplay) subDisplay.textContent = "Timing confirmed with your quote";
      } else if (currentSizeIndex === 1) {
        priceDisplay.innerHTML = "Dedicated 35 m³ Pantech <small>(Full Home)</small>";
        if (subDisplay) subDisplay.textContent = "Route and load reviewed before confirmation";
      } else if (currentSizeIndex === 2) {
        priceDisplay.innerHTML = "Full 50 m³ Linehaul <small>(Family Home)</small>";
        if (subDisplay) subDisplay.textContent = "Route and load reviewed before confirmation";
      } else {
        priceDisplay.innerHTML = "Selected Furniture Linehaul <small>(Quote Required)</small>";
        if (subDisplay) subDisplay.textContent = "Timing confirmed with your quote";
      }
    } else if (currentScope === "office") {
      if (labelDisplay) labelDisplay.textContent = "Commercial Relocation Service";
      priceDisplay.innerHTML = "$89 / 30 min <small>(Commercial Crew + Tail-Lift)</small>";
      if (subDisplay) subDisplay.textContent = "Staged workstation move • Rolling crates available";
    }
  };

  window.setHeroScope = (scope, btn) => {
    currentScope = scope;
    scopeTabs.forEach((tab) => {
      tab.classList.remove("is-active");
      tab.setAttribute("aria-selected", "false");
    });
    const activeTab = btn || document.getElementById(`scope-${scope}`) || Array.from(scopeTabs).find((t) => t.textContent.toLowerCase().includes(scope));
    if (activeTab) {
      activeTab.classList.add("is-active");
      activeTab.setAttribute("aria-selected", "true");
    }

    if (pickupInput && dropoffInput) {
      if (scope === "local") {
        pickupInput.placeholder = "e.g. Glenelg, SA";
        dropoffInput.placeholder = "e.g. Stirling or Norwood";
      } else if (scope === "interstate") {
        pickupInput.placeholder = "e.g. Adelaide, SA";
        dropoffInput.placeholder = "e.g. Melbourne VIC or Sydney NSW";
      } else {
        pickupInput.placeholder = "e.g. Adelaide CBD (Building & Level)";
        dropoffInput.placeholder = "e.g. Norwood or Technology Park";
      }
    }
    updateEstimates();
  };

  window.setHeroSize = (size, btn) => {
    currentSizeIndex = typeof size === "number" ? size : Number.parseInt(size, 10) || 0;
    sizeBtns.forEach((b) => b.classList.remove("is-active"));
    const activeBtn = btn || sizeBtns[currentSizeIndex];
    if (activeBtn) activeBtn.classList.add("is-active");
    updateEstimates();
  };

  window.transferHeroToQuote = () => {
    const targetForm = document.getElementById("quote-form") || document.querySelector('[data-quote-form="quote"]');
    if (!targetForm) return;

    const pickupVal = pickupInput?.value?.trim() || "";
    const dropoffVal = dropoffInput?.value?.trim() || "";

    if (pickupVal) {
      const pickupField = targetForm.querySelector('input[name="pickup_suburb"]');
      if (pickupField) pickupField.value = pickupVal;
    }
    if (dropoffVal) {
      const dropoffField = targetForm.querySelector('input[name="dropoff_suburb"]');
      if (dropoffField) dropoffField.value = dropoffVal;
    }

    const scopeSelect = targetForm.querySelector('select[name="move_scope"]');
    if (scopeSelect) {
      if (currentScope === "interstate") {
        scopeSelect.value = "Interstate move";
      } else if (currentScope === "office") {
        scopeSelect.value = "Office move";
      } else {
        scopeSelect.value = "House move";
      }
    }

    const sizeSelect = targetForm.querySelector('select[name="move_size"]');
    if (sizeSelect) {
      const s = SIZES[currentSizeIndex] || SIZES[1];
      sizeSelect.value = s.label;
    }

    targetForm.scrollIntoView({ behavior: "smooth", block: "start" });
    const nameInput = targetForm.querySelector('input[name="name"]');
    if (nameInput) {
      setTimeout(() => nameInput.focus(), 400);
    }
  };

  updateEstimates();
}

const CALC_CATEGORIES = [
  { id: "living", name: "Living Room" },
  { id: "bedroom", name: "Bedrooms" },
  { id: "kitchen", name: "Kitchen" },
  { id: "dining", name: "Dining" },
  { id: "laundry", name: "Laundry" },
  { id: "garage", name: "Garage" },
  { id: "outdoor", name: "Outdoor" },
  { id: "boxes", name: "Boxes & Cartons" },
  { id: "specialty", name: "Specialty Items" },
];

const CALC_ITEMS = {
  // Living
  sofa_3s: { name: "3-Seater Lounge Sofa", m3: 2.2, cat: "living" },
  sofa_2s: { name: "2-Seater Loveseat", m3: 1.5, cat: "living" },
  armchair: { name: "Armchair / Recliner", m3: 0.8, cat: "living" },
  tv_large: { name: "Large TV (55\"–75\")", m3: 0.4, cat: "living" },
  tv_unit: { name: "Entertainment / TV Unit", m3: 0.9, cat: "living" },
  coffee_tab: { name: "Coffee Table", m3: 0.5, cat: "living" },
  bookcase: { name: "Bookcase / Display Cabinet", m3: 1.0, cat: "living" },
  // Bedroom
  bed_king: { name: "King Bed & Mattress", m3: 2.4, cat: "bedroom" },
  bed_queen: { name: "Queen Bed & Mattress", m3: 2.0, cat: "bedroom" },
  bed_single: { name: "Single Bed & Mattress", m3: 1.2, cat: "bedroom" },
  wardrobe: { name: "Wardrobe / Armoire", m3: 2.0, cat: "bedroom" },
  drawers: { name: "Chest of Drawers", m3: 1.0, cat: "bedroom" },
  bedside: { name: "Bedside Table", m3: 0.3, cat: "bedroom" },
  // Kitchen
  fridge_double: { name: "Double / French Door Fridge", m3: 1.8, cat: "kitchen" },
  fridge_single: { name: "Standard Fridge / Freezer", m3: 1.2, cat: "kitchen" },
  microwave: { name: "Microwave & Countertops", m3: 0.3, cat: "kitchen" },
  kitchen_island: { name: "Kitchen Trolley / Island", m3: 0.8, cat: "kitchen" },
  // Dining
  dining_table_6: { name: "Dining Table (6–8 Seater)", m3: 1.6, cat: "dining" },
  dining_table_4: { name: "Dining Table (4 Seater)", m3: 1.1, cat: "dining" },
  dining_chair: { name: "Dining Chair", m3: 0.25, cat: "dining" },
  buffet: { name: "Sideboard / Buffet", m3: 1.2, cat: "dining" },
  // Laundry
  washing_mach: { name: "Washing Machine", m3: 0.6, cat: "laundry" },
  dryer: { name: "Clothes Dryer", m3: 0.5, cat: "laundry" },
  ironing_board: { name: "Ironing Board & Hamper", m3: 0.2, cat: "laundry" },
  // Garage
  lawnmower: { name: "Lawn Mower", m3: 0.5, cat: "garage" },
  tool_chest: { name: "Tool Chest / Work Bench", m3: 1.0, cat: "garage" },
  bicycle: { name: "Bicycle / E-Bike", m3: 0.5, cat: "garage" },
  ladder: { name: "Ladder / Step Stool", m3: 0.4, cat: "garage" },
  storage_tub: { name: "Storage Tub / Plastic Tote", m3: 0.2, cat: "garage" },
  // Outdoor
  outdoor_setting: { name: "Outdoor Dining Table + Chairs", m3: 2.0, cat: "outdoor" },
  bbq: { name: "4-6 Burner BBQ", m3: 1.0, cat: "outdoor" },
  sun_lounge: { name: "Sun Lounge / Daybed", m3: 0.8, cat: "outdoor" },
  plant_pot: { name: "Large Planter / Pot", m3: 0.3, cat: "outdoor" },
  // Boxes
  box_standard: { name: "Standard Moving Carton (Tea Chest)", m3: 0.12, cat: "boxes" },
  box_book: { name: "Book / Heavy Carton", m3: 0.06, cat: "boxes" },
  box_portarobe: { name: "Port-A-Robe (Hanging Clothes)", m3: 0.4, cat: "boxes" },
  // Specialty
  upright_piano: { name: "Upright Piano", m3: 2.5, cat: "specialty" },
  pool_table: { name: "Slate Pool Table (7ft/8ft)", m3: 3.5, cat: "specialty" },
  safe_heavy: { name: "Heavy Safe (>100kg)", m3: 0.8, cat: "specialty" },
  gym_equipment: { name: "Treadmill / Exercise Bike", m3: 1.2, cat: "specialty" },
};

const CALC_PRESETS = {
  studio: {
    bed_queen: 1, sofa_2s: 1, tv_large: 1, tv_unit: 1, dining_table_4: 1,
    dining_chair: 2, fridge_single: 1, washing_mach: 1, box_standard: 15, box_book: 5,
  },
  "2bed": {
    bed_queen: 1, bed_single: 1, sofa_3s: 1, armchair: 1, tv_large: 1,
    tv_unit: 1, coffee_tab: 1, dining_table_4: 1, dining_chair: 4, fridge_single: 1,
    washing_mach: 1, dryer: 1, drawers: 1, bedside: 2, box_standard: 25, box_book: 10,
  },
  "3bed": {
    bed_king: 1, bed_queen: 1, bed_single: 1, sofa_3s: 1, sofa_2s: 1,
    armchair: 1, tv_large: 1, tv_unit: 1, coffee_tab: 1, bookcase: 1,
    dining_table_6: 1, dining_chair: 6, fridge_double: 1, washing_mach: 1,
    dryer: 1, drawers: 2, bedside: 4, outdoor_setting: 1, bbq: 1,
    box_standard: 35, box_book: 15, box_portarobe: 3,
  },
  "4bed": {
    bed_king: 1, bed_queen: 2, bed_single: 1, sofa_3s: 1, sofa_2s: 2,
    armchair: 2, tv_large: 2, tv_unit: 2, coffee_tab: 1, bookcase: 2,
    dining_table_6: 1, dining_chair: 8, fridge_double: 1, washing_mach: 1,
    dryer: 1, drawers: 3, bedside: 6, outdoor_setting: 1, bbq: 1,
    lawnmower: 1, tool_chest: 1, box_standard: 50, box_book: 25, box_portarobe: 5,
  },
  clear: {},
};

let calcQuantities = {};
let activeCalcCategory = "living";
let calcCurrentTotalM3 = 0;

function setupInventoryCalculator() {
  const calcRoot = document.getElementById("calculator");
  if (!calcRoot) return;

  const tabsContainer = document.getElementById("calcCategoryTabs");
  const itemsContainer = document.getElementById("calcItemsGrid");

  calcQuantities = { ...CALC_PRESETS["3bed"] };

  const renderTabs = () => {
    if (!tabsContainer) return;
    tabsContainer.innerHTML = CALC_CATEGORIES.map(
      (c) => `<button type="button" onclick="window.switchCalcCategory?.('${c.id}')" data-calc-cat="${c.id}" class="calc-cat-btn ${c.id === activeCalcCategory ? "is-active" : ""}" role="tab">${c.name}</button>`
    ).join("");
  };

  const renderItems = () => {
    if (!itemsContainer) return;
    const catItems = Object.entries(CALC_ITEMS).filter(([_, item]) => item.cat === activeCalcCategory);
    itemsContainer.innerHTML = catItems.map(([id, item]) => {
      const qty = calcQuantities[id] || 0;
      return `
        <div class="calc-item-row" data-item-id="${id}">
          <div class="calc-item-meta">
            <span class="calc-item-name">${item.name}</span>
            <span class="calc-item-volume">${item.m3} m³</span>
          </div>
          <div class="calc-stepper" role="group" aria-label="${item.name} quantity">
            <button type="button" onclick="window.adjustItem?.('${id}', -1)" class="calc-step-btn" aria-label="Decrease ${item.name}">&minus;</button>
            <span class="calc-step-val" id="qty-${id}">${qty}</span>
            <button type="button" onclick="window.adjustItem?.('${id}', 1)" class="calc-step-btn" aria-label="Increase ${item.name}">&#43;</button>
          </div>
        </div>
      `;
    }).join("");
  };

  window.switchCalcCategory = (catId) => {
    activeCalcCategory = catId;
    renderTabs();
    renderItems();
  };

  window.adjustItem = (itemId, delta) => {
    calcQuantities[itemId] = Math.max(0, (calcQuantities[itemId] || 0) + delta);
    const qtySpan = document.getElementById(`qty-${itemId}`);
    if (qtySpan) qtySpan.textContent = calcQuantities[itemId];
    window.recalculateVolume();
  };

  window.applyPreset = (presetKey) => {
    const pills = document.querySelectorAll(".calc-preset-pill");
    pills.forEach((p) => p.classList.remove("is-active"));
    const matchPill = Array.from(pills).find((p) => p.getAttribute("onclick")?.includes(presetKey));
    if (matchPill) matchPill.classList.add("is-active");

    calcQuantities = presetKey === "clear" ? {} : { ...CALC_PRESETS[presetKey] };
    renderItems();
    window.recalculateVolume();
  };

  window.recalculateVolume = () => {
    const totalM3 = Object.entries(calcQuantities).reduce((acc, [id, qty]) => acc + (qty * (CALC_ITEMS[id]?.m3 || 0)), 0);
    const totalItems = Object.values(calcQuantities).reduce((acc, qty) => acc + qty, 0);
    calcCurrentTotalM3 = totalM3;

    let truckName = "Select items to calculate";
    let truckCapacity = 20;
    let crewRate = 150;
    let rateText = "$75 / 30 min ($150/hr)";
    let baseHours = 0;

    if (totalM3 > 0) {
      if (totalM3 <= 16) {
        truckName = "4.5T Truck + 2 Men";
        truckCapacity = 20;
        crewRate = 150;
        rateText = "$75 / 30 min ($150/hr)";
        baseHours = Math.max(2.0, totalM3 / 5.0);
      } else if (totalM3 <= 28) {
        truckName = "8-Tonne Pantech + 2 Men";
        truckCapacity = 35;
        crewRate = 150;
        rateText = "$75 / 30 min ($150/hr)";
        baseHours = Math.max(3.0, totalM3 / 5.5);
      } else if (totalM3 <= 45) {
        truckName = "10-12T Heavy Pantech + 3 Men";
        truckCapacity = 50;
        crewRate = 178;
        rateText = "$89 / 30 min ($178/hr)";
        baseHours = Math.max(4.0, totalM3 / 6.5);
      } else {
        truckName = "Semi-Trailer / Multiple Trips + 3 Men";
        truckCapacity = 65;
        crewRate = 178;
        rateText = "$89 / 30 min ($178/hr)";
        baseHours = Math.max(5.5, totalM3 / 7.0);
      }
    }

    const accessSelect = document.getElementById("calcAccess");
    const accessVal = accessSelect?.value || "easy";
    let accessHours = 0;
    if (accessVal === "stairs") accessHours = 0.75;
    else if (accessVal === "lift") accessHours = 0.5;
    else if (accessVal === "steep") accessHours = 0.5;

    const packingSelect = document.getElementById("calcPacking");
    const packingVal = packingSelect?.value || "none";
    let packingCost = 0;
    if (packingVal === "fragile") packingCost = 280;
    else if (packingVal === "full") packingCost = 690;

    let minHours = "2.0";
    let maxHours = "3.0";
    let minCost = 300;
    let maxCost = 450;

    if (totalM3 > 0) {
      const computedMin = Math.max(2.0, Math.round((baseHours + accessHours - 0.4) * 2) / 2);
      const computedMax = Math.max(computedMin + 1.0, Math.round((baseHours + accessHours + 0.6) * 2) / 2);
      minHours = computedMin.toFixed(1);
      maxHours = computedMax.toFixed(1);
      minCost = Math.round(Number(minHours) * crewRate + packingCost);
      maxCost = Math.round(Number(maxHours) * crewRate + packingCost);
    }

    const fillPct = totalM3 > 0 ? Math.min(100, Math.round((totalM3 / truckCapacity) * 100)) : 0;

    const totalM3Node = document.getElementById("calcTotalM3");
    if (totalM3Node) totalM3Node.textContent = totalM3.toFixed(1);

    const btnM3Span = document.getElementById("btnM3Span");
    if (btnM3Span) btnM3Span.textContent = totalM3.toFixed(1);

    const interstateM3Text = document.getElementById("calcInterstateM3Text");
    if (interstateM3Text) interstateM3Text.textContent = `${totalM3.toFixed(1)} m³`;

    const itemCountBadge = document.getElementById("calcItemCountBadge");
    if (itemCountBadge) itemCountBadge.textContent = `${totalItems} Item${totalItems === 1 ? "" : "s"} Selected`;

    const truckNameNode = document.getElementById("calcTruckName");
    if (truckNameNode) truckNameNode.textContent = truckName;

    const fillPctNode = document.getElementById("calcTruckFillPct");
    if (fillPctNode) fillPctNode.textContent = `${fillPct}% of ${truckCapacity} m³ Truck`;

    const fillBarNode = document.getElementById("calcTruckFillBar");
    if (fillBarNode) fillBarNode.style.width = `${fillPct}%`;

    const estHoursNode = document.getElementById("calcEstHours");
    if (estHoursNode) estHoursNode.textContent = totalM3 > 0 ? `${minHours} – ${maxHours} Hours` : "—";

    const hourlyRateNode = document.getElementById("calcHourlyRate");
    if (hourlyRateNode) hourlyRateNode.textContent = rateText;

    const totalCostNode = document.getElementById("calcTotalCostRange");
    if (totalCostNode) totalCostNode.innerHTML = totalM3 > 0 ? `$${minCost} – $${maxCost} <small>inc. GST</small>` : "—";
  };

  window.sendCalculatorToForm = () => {
    const targetForm = document.getElementById("quote-form") || document.querySelector('[data-quote-form="quote"]');
    if (!targetForm) return;

    const totalItems = Object.values(calcQuantities).reduce((acc, qty) => acc + qty, 0);
    if (totalItems === 0) {
      targetForm.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const activeList = Object.entries(calcQuantities)
      .filter(([_, q]) => q > 0)
      .map(([id, q]) => `${CALC_ITEMS[id]?.name || id}: ${q}`)
      .join(", ");

    const accessSelect = document.getElementById("calcAccess");
    const accessLabel = accessSelect?.options[accessSelect.selectedIndex]?.text || "Standard";

    const packingSelect = document.getElementById("calcPacking");
    const packingLabel = packingSelect?.options[packingSelect.selectedIndex]?.text || "Self-Packed";

    const truckName = document.getElementById("calcTruckName")?.textContent || "Truck";
    const estHours = document.getElementById("calcEstHours")?.textContent || "";
    const totalCost = document.getElementById("calcTotalCostRange")?.textContent?.replace(/\s+/g, " ") || "";

    const inventorySummary = `[Attached Inventory: ${calcCurrentTotalM3.toFixed(1)} m³ | ${truckName} | Est: ${estHours} (${totalCost}) | Access: ${accessLabel} | Packing: ${packingLabel}]\nSelected items: ${activeList}`;

    const messageField = targetForm.querySelector('textarea[name="message"]');
    if (messageField) {
      const existing = messageField.value.trim();
      const cleaned = existing.replace(/\[Attached Inventory:[^\]]*\](?:\nSelected items:[^\n]*)?/s, "").trim();
      messageField.value = cleaned ? `${inventorySummary}\n\n${cleaned}` : inventorySummary;
    }

    let hiddenInput = targetForm.querySelector('input[name="attached_inventory"]');
    if (!hiddenInput) {
      hiddenInput = document.createElement("input");
      hiddenInput.type = "hidden";
      hiddenInput.name = "attached_inventory";
      targetForm.appendChild(hiddenInput);
    }
    hiddenInput.value = `${calcCurrentTotalM3.toFixed(1)} m³ (${truckName})`;

    const sizeSelect = targetForm.querySelector('select[name="move_size"]');
    if (sizeSelect) {
      if (calcCurrentTotalM3 <= 15) {
        sizeSelect.value = "Two bedrooms";
      } else if (calcCurrentTotalM3 <= 28) {
        sizeSelect.value = "Three bedrooms";
      } else {
        sizeSelect.value = "Four or more bedrooms";
      }
    }

    const banner = document.getElementById("attachedInventoryBanner");
    const bannerText = document.getElementById("attachedInventoryText");
    if (banner && bannerText) {
      bannerText.textContent = `Attached Calculator Load: ${calcCurrentTotalM3.toFixed(1)} m³ (${truckName.split('+')[0].trim()})`;
      banner.classList.remove("hidden");
    }

    const attachBtn = document.querySelector(".calc-attach-btn");
    if (attachBtn) {
      const origHtml = attachBtn.innerHTML;
      attachBtn.innerHTML = `<span>&#10003; Attached to Quote Form!</span>`;
      setTimeout(() => {
        attachBtn.innerHTML = origHtml;
      }, 2500);
    }

    targetForm.scrollIntoView({ behavior: "smooth", block: "start" });
    const nameInput = targetForm.querySelector('input[name="name"]');
    if (nameInput) setTimeout(() => nameInput.focus(), 400);
  };

  window.clearAttachedInventory = () => {
    const banner = document.getElementById("attachedInventoryBanner");
    if (banner) banner.classList.add("hidden");

    const targetForm = document.getElementById("quote-form") || document.querySelector('[data-quote-form="quote"]');
    if (targetForm) {
      const messageField = targetForm.querySelector('textarea[name="message"]');
      if (messageField) {
        messageField.value = messageField.value.replace(/\[Attached Inventory:[^\]]*\](?:\nSelected items:[^\n]*)?/s, "").trim();
      }
      const hiddenInput = targetForm.querySelector('input[name="attached_inventory"]');
      if (hiddenInput) hiddenInput.value = "";
    }
  };

  renderTabs();
  renderItems();
  window.recalculateVolume();
}

function setupSuburbsExplorer() {
  const grid = document.getElementById("suburbsGrid");
  if (!grid) return;

  const SUBURB_DATA = [
    { name: "Adelaide CBD", region: "cbd", postcode: "5000", features: "Loading docks, lift booking coordination, clearway permits", truckFit: "Medium Pantech / CBD clearance", url: "/removalists-adelaide-cbd/" },
    { name: "North Adelaide", region: "cbd", postcode: "5006", features: "Narrow heritage lanes, cottage access, leafy street parking", truckFit: "4.5T – 6T Agile Truck", url: "/removalists-north-adelaide/" },
    { name: "Glenelg", region: "coastal", postcode: "5045", features: "Beachfront apartments, balcony drops, underground docks", truckFit: "Pantech with tail-lift", url: "/removalists-glenelg/" },
    { name: "Brighton", region: "coastal", postcode: "5048", features: "Esplanade properties, coastal sands protection, tight carports", truckFit: "Standard 8T Pantech", url: "/removalists-brighton-sa/" },
    { name: "Norwood", region: "east", postcode: "5067", features: "Victorian villas, bluestone cottages, tight side-access", truckFit: "Agile 6T Pantech", url: "/removalists-norwood/" },
    { name: "Burnside", region: "east", postcode: "5066", features: "Sprawling family homes, long driveways, high-value antiques", truckFit: "10T Heavy Pantech", url: "/removalists-burnside/" },
    { name: "Stirling", region: "hills", postcode: "5152", features: "Steep terrain, tree canopies, winding access driveways", truckFit: "Low-clearance 6T Truck", url: "/removalists-stirling-sa/" },
    { name: "Mount Barker", region: "hills", postcode: "5251", features: "New residential estates, acreage moves, freeway transit", truckFit: "Large 10-12T Pantech", url: "/removalists-mount-barker/" },
    { name: "Mawson Lakes", region: "north-south", postcode: "5095", features: "Multi-storey townhomes, narrow stairwells, modern estates", truckFit: "8T Pantech + 2 Men", url: "/removalists-mawson-lakes/" },
    { name: "Marion", region: "north-south", postcode: "5043", features: "Suburban family blocks, garage clearances, southern corridor", truckFit: "8T – 10T Pantech", url: "/removalists-marion/" }
  ];

  const renderCards = (regionFilter = "all") => {
    grid.innerHTML = SUBURB_DATA
      .filter((s) => regionFilter === "all" || s.region === regionFilter)
      .map((s) => `
        <article class="zq-suburb-card" data-region="${s.region}">
          <div class="suburb-card-head">
            <h3>${s.name} <small class="text-subtle">SA ${s.postcode}</small></h3>
            <span class="suburb-badge">${s.truckFit}</span>
          </div>
          <p class="suburb-features">${s.features}</p>
          <div class="suburb-card-actions">
            <button type="button" onclick="window.prefillSuburb?.('${s.name}')" class="suburb-prefill-btn">Select for Quote</button>
            <a href="${s.url}" class="suburb-link">Area Details &rarr;</a>
          </div>
        </article>
      `).join("");
  };

  window.filterSuburbs = (region, btn) => {
    const tabs = document.querySelectorAll(".suburb-tab");
    tabs.forEach((tab) => {
      tab.classList.remove("is-active");
      tab.setAttribute("aria-pressed", "false");
    });
    if (btn) {
      btn.classList.add("is-active");
    } else {
      const match = Array.from(tabs).find((t) => t.dataset.region === region);
      if (match) match.classList.add("is-active");
    }
    tabs.forEach((tab) => tab.setAttribute("aria-pressed", String(tab.classList.contains("is-active"))));
    renderCards(region);
  };

  window.prefillSuburb = (suburbName) => {
    const heroPickup = document.getElementById("heroPickup");
    if (heroPickup) heroPickup.value = suburbName;

    const targetForm = document.getElementById("quote-form") || document.querySelector('[data-quote-form="quote"]');
    if (targetForm) {
      const pickupField = targetForm.querySelector('input[name="pickup_suburb"]');
      if (pickupField) pickupField.value = suburbName;
      targetForm.scrollIntoView({ behavior: "smooth", block: "start" });
      const nameInput = targetForm.querySelector('input[name="name"]');
      if (nameInput) setTimeout(() => nameInput.focus(), 400);
    }
  };

  window.filterSuburbs("all");
}

function setupInterstateMatrix() {
  const panel = document.getElementById("routeDetailPanel");
  if (!panel) return;

  const ROUTES = {
    mel: {
      title: "Adelaide ↔ Melbourne Relocations",
      dest: "Melbourne VIC",
      distance: "725 km via Dukes Hwy & Western Hwy",
      transit: "1–2 Days Direct / 2–4 Days Backload",
      departures: "Dates confirmed when your quote is prepared",
      features: [
        "Direct or shared-load options discussed at quote",
        "Furniture protected with blankets and wrap",
        "Inventory reviewed with you before confirmation",
        "Inner-city Melbourne high-rise and apartment lift coordination"
      ]
    },
    syd: {
      title: "Adelaide ↔ Sydney Relocations",
      dest: "Sydney NSW",
      distance: "1,375 km via Sturt Hwy & Hume Hwy",
      transit: "2–3 Days Direct / 3–5 Days Backload",
      departures: "Dates confirmed when your quote is prepared",
      features: [
        "Door-to-door transit between Adelaide and Greater Sydney",
        "Tail-lift pantechs suitable for residential & commercial loads",
        "Items wrapped and strapped for the journey",
        "Flexible delivery scheduling aligned with lease or settlement dates"
      ]
    },
    per: {
      title: "Adelaide ↔ Perth Relocations",
      dest: "Perth WA",
      distance: "2,700 km via Eyre Hwy (Nullarbor Corridor)",
      transit: "4–6 Days Direct / 5–8 Days Shared",
      departures: "Dates confirmed when your quote is prepared",
      features: [
        "Long-distance route planning across the Nullarbor",
        "Vehicle and load options reviewed for the distance",
        "Interstate border requirements raised during planning",
        "Heavy furniture wrapped and strapped for transit"
      ]
    },
    bne: {
      title: "Adelaide ↔ Brisbane & Gold Coast",
      dest: "Brisbane QLD",
      distance: "2,000 km via Newell Hwy Corridor",
      transit: "3–4 Days Direct / 4–6 Days Backload",
      departures: "Dates confirmed when your quote is prepared",
      features: [
        "Direct connection to Brisbane, Gold Coast & Sunshine Coast",
        "Storage assistance can be discussed as part of the plan",
        "Heavy appliances and fragile goods handled with care",
        "Loading inventory prepared for the move"
      ]
    },
    cbr: {
      title: "Adelaide ↔ Canberra Relocations",
      dest: "Canberra ACT",
      distance: "1,160 km via Sturt Hwy & Barton Hwy",
      transit: "2 Days Direct / 3–4 Days Backload",
      departures: "Dates confirmed when your quote is prepared",
      features: [
        "Corporate, government and family relocations catered",
        "Delicate and valuable items handled with care",
        "Flexible delivery scheduling aligned with ACT leasing cycles",
        "Packing and unpacking help can be included in scope"
      ]
    }
  };

  const renderRoute = (routeKey) => {
    const r = ROUTES[routeKey] || ROUTES.mel;
    panel.innerHTML = `
      <div class="route-panel-grid">
        <div class="route-info-col">
          <span class="route-tag">Interstate route</span>
          <h3>${r.title}</h3>
          <div class="route-metrics-grid">
            <div class="route-metric-card">
              <span class="metric-label">Transit Distance</span>
              <strong>${r.distance}</strong>
            </div>
            <div class="route-metric-card">
              <span class="metric-label">Indicative transit</span>
              <strong>${r.transit}</strong>
            </div>
            <div class="route-metric-card">
              <span class="metric-label">Scheduling</span>
              <strong>${r.departures}</strong>
            </div>
          </div>
          <div class="route-actions-row">
            <button type="button" onclick="window.bookInterstateRoute?.('${r.dest}')" class="zq-v2-button zq-v2-button-primary">
              <span>Request Quote for ${r.dest}</span>
              <svg aria-hidden="true"><use href="#zq-i-arrow" /></svg>
            </button>
            <a href="/interstate-removals-adelaide/" class="zq-v2-button zq-v2-button-ghost">View All Routes</a>
          </div>
        </div>
        <div class="route-features-col">
          <h4>What we plan with you</h4>
          <ul class="route-features-list">
            ${r.features.map((f) => `<li><svg aria-hidden="true"><use href="#zq-i-check" /></svg> <span>${f}</span></li>`).join("")}
          </ul>
        </div>
      </div>
    `;
  };

  window.selectInterstateRoute = (routeKey, btn) => {
    const tabs = document.querySelectorAll(".route-tab");
    tabs.forEach((tab) => {
      tab.classList.remove("is-active");
      tab.setAttribute("aria-pressed", "false");
    });
    if (btn) {
      btn.classList.add("is-active");
    } else {
      const match = document.getElementById(`route-tab-${routeKey}`);
      if (match) match.classList.add("is-active");
    }
    tabs.forEach((tab) => tab.setAttribute("aria-pressed", String(tab.classList.contains("is-active"))));
    renderRoute(routeKey);
  };

  window.bookInterstateRoute = (destName) => {
    const targetForm = document.getElementById("quote-form") || document.querySelector('[data-quote-form="quote"]');
    if (!targetForm) return;

    const pickupField = targetForm.querySelector('input[name="pickup_suburb"]');
    if (pickupField) pickupField.value = "Adelaide SA";

    const dropoffField = targetForm.querySelector('input[name="dropoff_suburb"]');
    if (dropoffField) dropoffField.value = destName;

    const scopeSelect = targetForm.querySelector('select[name="move_scope"]');
    if (scopeSelect) scopeSelect.value = "Interstate move";

    targetForm.scrollIntoView({ behavior: "smooth", block: "start" });
    const nameInput = targetForm.querySelector('input[name="name"]');
    if (nameInput) setTimeout(() => nameInput.focus(), 400);
  };

  window.selectInterstateRoute("mel");
}

setCurrentYear();
window.addEventListener("zq:consent-updated", () => {
  captureAttributionLite();
  syncQuoteFormHiddenFields();
});
scheduleAnalyticsInit();
setQuoteDateMinimum();
setupHeaderDetails();
setupFormState();
setupQuoteFormStepAccessibility();
syncQuoteFormHiddenFields();
setupQuoteForms();
trackHandedOffAcceptedQuote();
setupLocalFormPreview();
setupHeaderState();
setupStickyCta();
setupConversionTracking();

function runWhenIdleFast(callback, timeout = 1200) {
  if (typeof window !== "undefined" && typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout });
  } else if (typeof setTimeout === "function") {
    setTimeout(callback, 20);
  } else if (typeof window !== "undefined" && typeof window.setTimeout === "function") {
    window.setTimeout(callback, 20);
  } else {
    callback();
  }
}

runWhenIdleFast(() => {
  setupRevealAnimations();
  setupInteractiveSpotlights();
  setupAnimatedCounters();
  setupServiceAreaLocator();
  setupFooterSocialLinks();
  setupHeroEstimator();
  setupInventoryCalculator();
  setupSuburbsExplorer();
  setupInterstateMatrix();
});
