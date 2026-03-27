const footerYears = document.querySelectorAll("[data-year]");
const siteHeader = document.querySelector(".site-header");
const headerDetails = Array.from(siteHeader?.querySelectorAll("details") ?? []);
const forms = Array.from(document.querySelectorAll("form"));
const quoteDateFields = Array.from(
  document.querySelectorAll('input[type="date"][name*="date"]'),
);

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

function setupLocalFormPreview() {
  const localPreviewHosts = new Set(["127.0.0.1", "localhost"]);
  if (!localPreviewHosts.has(window.location.hostname)) {
    return;
  }

  forms.forEach((form) => {
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

setCurrentYear();
setQuoteDateMinimum();
setupHeaderDetails();
setupFormState();
setupLocalFormPreview();
