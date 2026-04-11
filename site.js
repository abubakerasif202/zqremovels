document.documentElement.classList.add("js");

const footerYears = document.querySelectorAll("[data-year]");
const siteHeader = document.querySelector(".site-header");
const headerDetails = Array.from(siteHeader?.querySelectorAll("details") ?? []);
const forms = Array.from(document.querySelectorAll("form"));
const web3FormsForms = Array.from(
  document.querySelectorAll('form[data-web3forms="true"]'),
);
const quoteDateFields = Array.from(
  document.querySelectorAll('input[type="date"][name*="date"]'),
);
const web3FormsRedirect = "/thank-you.html";

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
    if (form.getAttribute("data-web3forms") === "true") {
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

function validateWeb3Form(form) {
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

function applyWeb3FormErrors(form, errors) {
  const errorNodes = Array.from(form.querySelectorAll("[data-error-for]"));
  errorNodes.forEach((node) => {
    const fieldName = node.getAttribute("data-error-for") ?? "";
    node.textContent = errors[fieldName] ?? "";
  });
}

function setWeb3FormFeedback(form, message, state = "") {
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
    move_type: payload.move_type || "",
    property_type: payload.property_type || "",
  });
}

function setupWeb3Forms() {
  if (web3FormsForms.length === 0) {
    return;
  }

  web3FormsForms.forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      formData.append("access_key", "d928b483-d5f0-40d7-9eb1-44a56130ba63");
      formData.append("subject", "New ZQ Removals Quote Request");
      formData.append("from_name", "ZQ Removals Website");

      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        });

        const result = await response.json();

        if (result.success) {
          alert("Message sent successfully");
          form.reset();
        } else {
          alert(result.message || "Submission failed");
        }
      } catch (error) {
        console.error(error);
        alert("Network error");
      }
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
    if (form.getAttribute("data-web3forms") === "true") {
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
setupWeb3Forms();
setupLocalFormPreview();
setupHeaderState();
setupRevealAnimations();
