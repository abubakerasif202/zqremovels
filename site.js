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

const requiredFieldMessages = {
  pickup_suburb: "Enter the pickup suburb.",
  delivery_suburb: "Enter the delivery suburb.",
  move_type: "Select a move type.",
  property_type: "Select a property type.",
  full_name: "Enter your full name.",
  phone: "Enter your phone number.",
  email: "Enter your email address.",
  access_notes: "Add access notes for pickup or delivery.",
  inventory_special_items: "Add inventory or special-item notes.",
};
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

  Object.entries(requiredFieldMessages).forEach(([name, message]) => {
    if (!payload[name]) {
      errors[name] = message;
    }
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

  const localPreviewHosts = new Set(["127.0.0.1", "localhost"]);
  const isLocalPreview = localPreviewHosts.has(window.location.hostname);

  web3FormsForms.forEach((form) => {
    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) {
      return;
    }
    const defaultLabel = submitButton.textContent?.trim() ?? "Submit";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (submitButton.dataset.submitting === "true") {
        return;
      }

      const { payload, errors } = validateWeb3Form(form);
      applyWeb3FormErrors(form, errors);

      if (Object.keys(errors).length > 0) {
        setWeb3FormFeedback(form, "Please check the highlighted fields.", "error");
        return;
      }

      if (payload.botcheck) {
        setWeb3FormFeedback(form, "Unable to submit. Please try again.", "error");
        return;
      }

      submitButton.dataset.submitting = "true";
      submitButton.disabled = true;
      submitButton.textContent = "Sending request...";
      setWeb3FormFeedback(form, "Submitting your quote request...");

      try {
        if (!isLocalPreview) {
          const response = await fetch("/api/quote", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              botcheck: payload.botcheck ?? "",
              pickup_suburb: payload.pickup_suburb,
              delivery_suburb: payload.delivery_suburb,
              move_type: payload.move_type,
              property_type: payload.property_type,
              preferred_move_date: payload.preferred_move_date || "",
              access_notes: payload.access_notes,
              inventory_special_items: payload.inventory_special_items,
              full_name: payload.full_name,
              phone: payload.phone,
              email: payload.email,
              source_page: window.location.href,
            }),
          });

          let result = {};
          let responseJsonParsed = true;
          try {
            result = await response.json();
          } catch (error) {
            responseJsonParsed = false;
            console.error("Web3Forms response parse failed.", {
              message: error instanceof Error ? error.message : String(error),
              status: response.status,
            });
          }

          if (!response.ok) {
            throw new Error(
              result.message || `Submission failed with status ${response.status}`,
            );
          }

          if (result.success === false) {
            throw new Error(result.message || "Submission failed");
          }

          if (!responseJsonParsed) {
            throw new Error("Submission response could not be confirmed.");
          }

          trackQuoteSubmission({
            source_page: window.location.href,
            move_type: payload.move_type,
            property_type: payload.property_type,
          });
        }

        form.reset();
        applyWeb3FormErrors(form, {});
        setWeb3FormFeedback(
          form,
          "Thanks — your quote request has been sent. We will respond shortly.",
          "success",
        );
        window.setTimeout(() => {
          window.location.assign(web3FormsRedirect);
        }, 300);
      } catch (error) {
        console.error("Web3Forms submission failed.", {
          message: error instanceof Error ? error.message : String(error),
          source: window.location.href,
        });
        setWeb3FormFeedback(
          form,
          "Could not send the request. Please try again or call 0433 819 989.",
          "error",
        );
      } finally {
        submitButton.disabled = false;
        submitButton.dataset.submitting = "false";
        submitButton.textContent = defaultLabel;
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

function setupLocalFormPreview() {
  const localPreviewHosts = new Set(["127.0.0.1", "localhost"]);
  if (!localPreviewHosts.has(window.location.hostname)) {
    return;
  }

  forms.forEach((form) => {
    if (form.getAttribute("data-web3forms") === "true") {
      return;
    }

    const successPath =
      form.getAttribute("data-dev-success") ?? "/thank-you.html";

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
