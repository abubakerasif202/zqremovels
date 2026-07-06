import {
  getStoredAttribution,
  initAnalytics,
  trackCallClick,
  trackEmailClick,
  trackFormSuccess,
  trackFormStart,
  trackFormSubmit,
  trackMobileMenuOpen,
  trackOutboundClick,
  trackQuoteClick,
  trackStickyCtaClick,
  trackPricePageCTA,
  trackSuburbCTA,
  trackServiceCTA,
} from "./analytics.mjs";

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
const QUOTE_API_ENDPOINT = "https://api.web3forms.com/submit";
const DEFAULT_QUOTE_ERROR_MESSAGE = "Could not send the request. Please try again.";
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
      }
    }
  });
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

    if (!submitButton.dataset.defaultLabel) {
      submitButton.dataset.defaultLabel =
        submitButton.textContent?.trim() ?? "Get My Fixed-Price Quote";
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
      const submitButton = form.querySelector('button[type="submit"]');
      if (!submitButton) {
        return;
      }

      submitButton.disabled = false;
      submitButton.dataset.submitting = "false";
      submitButton.textContent =
        submitButton.dataset.defaultLabel ?? submitButton.textContent ?? "Get My Fixed-Price Quote";
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
  if (explicitLocation) {
    return explicitLocation;
  }
  if (anchor.closest("#sticky-cta")) {
    return "sticky_cta";
  }
  if (anchor.closest(".site-header")) {
    return "header";
  }
  if (anchor.closest("footer")) {
    return "footer";
  }
  return document.body.className || window.location.pathname;
}

function trackQuoteSubmission() {
  trackFormSubmit("quote_form");
}

function buildQuoteSubmissionPayload(payload) {
  const attribution = getStoredAttribution();
  const fullName = getFirstNonEmptyPayloadValue(payload, ["full_name", "name"]);
  const moveDetails = getFirstNonEmptyPayloadValue(payload, [
    "move_details",
    "message",
    "access_notes",
    "inventory_special_items",
  ]);

  return {
    access_key: getTrimmedPayloadValue(payload, "access_key"),
    subject: getTrimmedPayloadValue(payload, "subject") || "Quote request - ZQ Removals",
    from_name: fullName || getTrimmedPayloadValue(payload, "from_name") || "ZQ Removals Website",
    botcheck: getFirstNonEmptyPayloadValue(payload, ["botcheck"]),
    redirect: getTrimmedPayloadValue(payload, "redirect") || "https://zqremovals.au/thank-you/",
    source_page: window.location.href,
    utm_source: attribution.utm_source || getTrimmedPayloadValue(payload, "utm_source"),
    utm_medium: attribution.utm_medium || getTrimmedPayloadValue(payload, "utm_medium"),
    utm_campaign: attribution.utm_campaign || getTrimmedPayloadValue(payload, "utm_campaign"),
    utm_content: attribution.utm_content || getTrimmedPayloadValue(payload, "utm_content"),
    utm_term: attribution.utm_term || getTrimmedPayloadValue(payload, "utm_term"),
    gclid: attribution.gclid || getTrimmedPayloadValue(payload, "gclid"),
    fbclid: attribution.fbclid || getTrimmedPayloadValue(payload, "fbclid"),
    landing_page: attribution.landing_page || getTrimmedPayloadValue(payload, "landing_page"),
    captured_at: attribution.captured_at || getTrimmedPayloadValue(payload, "captured_at"),
    move_date: getFirstNonEmptyPayloadValue(payload, ["move_date", "preferred_move_date"]),
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

function setupSuccessPageTracking() {
  const node = document.querySelector("[data-conversion-success]");
  if (!node) {
    return;
  }

  const formName = node.getAttribute("data-form-name") || "quote_form";
  trackFormSuccess(formName);
}

function setupConversionTracking() {
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
    if (href.startsWith("tel:")) {
      trackCallClick(inferClickLocation(anchor));
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

  if (!submitButton.dataset.defaultLabel) {
    submitButton.dataset.defaultLabel =
      submitButton.textContent?.trim() ?? "Get My Fixed-Price Quote";
  }

  submitButton.disabled = isSubmitting;
  submitButton.dataset.submitting = isSubmitting ? "true" : "false";
  submitButton.textContent = isSubmitting
    ? "Sending quote..."
    : submitButton.dataset.defaultLabel || "Get My Fixed-Price Quote";
}

async function submitQuoteForm(form, payload) {
  let response;
  try {
    response = await fetch(QUOTE_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(buildQuoteSubmissionPayload(payload)),
    });
  } catch (error) {
    const requestError = new Error(DEFAULT_QUOTE_ERROR_MESSAGE);
    requestError.cause = error;
    throw requestError;
  }

  const responseText = await response.text().catch(() => "");
  const trimmedResponseText = responseText.trim();
  let result;

  if (trimmedResponseText.startsWith("{") || trimmedResponseText.startsWith("[")) {
    try {
      result = JSON.parse(trimmedResponseText);
    } catch {
      if (response.ok) {
        return {
          success: true,
          message: "Quote request sent.",
        };
      }
      result = {
        success: false,
        message: DEFAULT_QUOTE_ERROR_MESSAGE,
        body: responseText,
      };
    }
  } else if (response.ok) {
    return {
      success: true,
      message: "Quote request sent.",
    };
  } else {
    result = {
      success: false,
      message: DEFAULT_QUOTE_ERROR_MESSAGE,
      body: responseText,
    };
  }

  if (!response.ok || result.success === false) {
    const error = new Error(
      result.message ||
        result.error ||
        result.details ||
        result.body?.message ||
        DEFAULT_QUOTE_ERROR_MESSAGE,
    );
    error.payload = result;
    throw error;
  }

  return result;
}

function setupQuoteForms() {
  if (quoteForms.length === 0) {
    return;
  }

  syncQuoteFormHiddenFields();

  quoteForms.forEach((form) => {
    setQuoteFormSubmitting(form, false);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton?.dataset.submitting === "true") {
        return;
      }

      const { payload, errors } = validateQuoteForm(form);
      applyQuoteFormErrors(form, errors);

      if (Object.keys(errors).length > 0) {
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
        await submitQuoteForm(form, payload);
        trackQuoteSubmission();
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
        console.error(error);
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

function setupRevealAnimations() {
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

setCurrentYear();
initAnalytics();
setQuoteDateMinimum();
setupHeaderDetails();
setupFormState();
setupQuoteFormStepAccessibility();
syncQuoteFormHiddenFields();
setupQuoteForms();
setupLocalFormPreview();
setupHeaderState();
setupRevealAnimations();
setupAnimatedCounters();
setupStickyCta();
setupConversionTracking();
setupFooterSocialLinks();
setupSuccessPageTracking();
