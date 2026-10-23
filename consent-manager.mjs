const COOKIE_NAME = "zq_consent_v1";
const MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
const MAX_AGE_MS = MAX_AGE_SECONDS * 1000;
const GOOGLE_CONSENT_KEYS = ["ad_storage", "analytics_storage", "ad_user_data", "ad_personalization"];

function readChoice() {
  try {
    const entry = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
    if (!entry) return null;
    const parsed = JSON.parse(decodeURIComponent(entry.slice(COOKIE_NAME.length + 1)));
    if (parsed?.version !== 1 || !Number.isFinite(parsed.updatedAt) ||
        Date.now() - parsed.updatedAt < 0 || Date.now() - parsed.updatedAt >= MAX_AGE_MS ||
        typeof parsed.analytics !== "boolean" || typeof parsed.advertising !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

function consentUpdate(choice) {
  return {
    ad_storage: choice.advertising ? "granted" : "denied",
    analytics_storage: choice.analytics ? "granted" : "denied",
    ad_user_data: choice.advertising ? "granted" : "denied",
    ad_personalization: choice.advertising ? "granted" : "denied",
  };
}

function loadOptionalTags(choice) {
  const config = window.__analyticsConfig || {};
  const mayLoadGoogle = choice.analytics || choice.advertising;
  if (mayLoadGoogle && config.gtmId && !window.__zqGtmLoaded) {
    window.__zqGtmLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(config.gtmId)}`;
    document.head.appendChild(script);
    if (choice.analytics && config.gaMeasurementId) window.setTimeout(() => window.__loadGtag?.(), 3500);
  } else if (choice.analytics && config.gaMeasurementId) {
    window.__loadGtag?.();
  }

  if (choice.advertising && config.metaPixelId && !window.__zqMetaPixelLoaded) {
    window.__zqMetaPixelLoaded = true;
    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", config.metaPixelId);
    window.fbq("track", "PageView");
  }
}

function initConsentManager() {
  const banner = document.querySelector("[data-consent-banner]");
  if (!banner) return;
  const preferences = banner.querySelector("[data-consent-preferences]");
  const analyticsInput = banner.querySelector("[data-consent-analytics]");
  const advertisingInput = banner.querySelector("[data-consent-advertising]");
  const customize = banner.querySelector("[data-consent-customize]");
  const save = banner.querySelector("[data-consent-save]");
  const manage = document.querySelector("[data-consent-manage]");
  let choice = readChoice();

  const applyChoice = (next, persist = true) => {
    choice = { version: 1, analytics: Boolean(next.analytics), advertising: Boolean(next.advertising), updatedAt: Date.now() };
    window.__zqConsentChoice = choice;
    const updates = consentUpdate(choice);
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(["consent", "update", updates]);
    for (const key of GOOGLE_CONSENT_KEYS) {
      if (!(key in updates)) throw new Error(`Missing consent state for ${key}`);
    }
    if (persist) {
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(choice))}; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax; Secure`;
    }
    window.dispatchEvent(new CustomEvent("zq:consent-updated", { detail: { ...choice } }));
    loadOptionalTags(choice);
    banner.hidden = true;
    manage.hidden = false;
    manage.focus({ preventScroll: true });
  };

  const openPreferences = () => {
    analyticsInput.checked = Boolean(choice?.analytics);
    advertisingInput.checked = Boolean(choice?.advertising);
    preferences.hidden = false;
    customize.hidden = true;
    save.hidden = false;
    customize.setAttribute("aria-expanded", "true");
    banner.hidden = false;
    manage.hidden = true;
    analyticsInput.focus();
  };

  banner.querySelector("[data-consent-accept]").addEventListener("click", () => applyChoice({ analytics: true, advertising: true }));
  banner.querySelector("[data-consent-reject]").addEventListener("click", () => applyChoice({ analytics: false, advertising: false }));
  customize.addEventListener("click", openPreferences);
  save.addEventListener("click", () => applyChoice({ analytics: analyticsInput.checked, advertising: advertisingInput.checked }));
  manage.addEventListener("click", openPreferences);

  if (choice) {
    window.__zqConsentChoice = choice;
    loadOptionalTags(choice);
    manage.hidden = false;
  } else {
    window.__zqConsentChoice = null;
    banner.hidden = false;
    manage.hidden = true;
    banner.querySelector("[data-consent-accept]").focus({ preventScroll: true });
  }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initConsentManager, { once: true });
else initConsentManager();

export { consentUpdate, readChoice };
