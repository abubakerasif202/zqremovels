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
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const WEB3FORMS_ACCESS_KEY = "d928b483-d5f0-40d7-9eb1-44a56130ba63";
const WEB3FORMS_SUBJECT = "New ZQ Removals Quote Request";
const WEB3FORMS_FROM_NAME = "ZQ Removals Website";
const DEFAULT_QUOTE_ERROR_MESSAGE = "Could not send the request. Please try again.";

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

function setupHeaderDetails() {
  if (!siteHeader || headerDetails.length === 0) {
    return;
  }

  headerDetails.forEach((details) => {
    const summary = details.querySelector("summary");

    details.addEventListener("toggle", () => {
      if (!details.open) {
        return;
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
        submitButton.textContent?.trim() ?? "Submit";
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
        submitButton.dataset.defaultLabel ?? submitButton.textContent ?? "Submit";
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

function trackQuoteSubmission(payload) {
  if (typeof window.gtag !== "function") {
    return;
  }

  window.gtag("event", "quote_submitted", {
    source_page: payload.source_page || window.location.pathname,
    move_scope: payload.move_scope || "",
    property_type: payload.property_type || "",
  });
}

function setQuoteFormSubmitting(form, isSubmitting) {
  const submitButton = form.querySelector('button[type="submit"]');
  if (!submitButton) {
    return;
  }

  if (!submitButton.dataset.defaultLabel) {
    submitButton.dataset.defaultLabel =
      submitButton.textContent?.trim() ?? "Submit";
  }

  submitButton.disabled = isSubmitting;
  submitButton.dataset.submitting = isSubmitting ? "true" : "false";
  submitButton.textContent = isSubmitting
    ? "Sending quote..."
    : submitButton.dataset.defaultLabel;
}

async function submitQuoteForm(form, payload) {
  const formData = new FormData(form);
  Object.entries(payload).forEach(([fieldName, value]) => {
    formData.set(fieldName, value);
  });
  formData.set("access_key", WEB3FORMS_ACCESS_KEY);
  formData.set("subject", WEB3FORMS_SUBJECT);
  formData.set("from_name", WEB3FORMS_FROM_NAME);
  formData.set("source_page", window.location.href);

  let response;
  try {
    response = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    });
  } catch (error) {
    const requestError = new Error(DEFAULT_QUOTE_ERROR_MESSAGE);
    requestError.cause = error;
    throw requestError;
  }

  const result = await response.json().catch(() => ({
    success: false,
    message: "Invalid response from quote service.",
  }));

  if (!response.ok || result.success === false) {
    const error = new Error(
      result.message || result.error || result.details || DEFAULT_QUOTE_ERROR_MESSAGE,
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
        trackQuoteSubmission({
          ...payload,
          source_page: window.location.pathname,
        });
        applyQuoteFormErrors(form, {});
        form.reset();
        setQuoteDateMinimum();
        setQuoteFormFeedback(
          form,
          "Quote request sent successfully. We will review it and get back to you soon.",
          "success",
        );
        setQuoteFormSubmitting(form, false);
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

  syncState();
  window.addEventListener("scroll", syncState, { passive: true });
}

function setupRevealAnimations() {
  const nodes = Array.from(document.querySelectorAll(".reveal-on-scroll"));
  if (nodes.length === 0) {
    return;
  }

  if (
    typeof window.IntersectionObserver !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    nodes.forEach((node) => {
      node.classList.add("is-visible");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.16,
    },
  );

  nodes.forEach((node) => observer.observe(node));
}

setCurrentYear();
setQuoteDateMinimum();
setupHeaderDetails();
setupFormState();
setupQuoteForms();
setupLocalFormPreview();
setupHeaderState();
setupRevealAnimations();
