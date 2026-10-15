const ANALYTICS_GUARD_KEY = "__zqAnalyticsV2";
const ROUTE_TRACKER_KEY = "__zqRouteTrackerV2";
const ATTRIBUTION_STORAGE_KEY = "zq_attribution_v7";
const ATTRIBUTION_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "gclid",
  "fbclid",
];

function safeWindow() {
  return typeof window === "undefined" ? null : window;
}

function getConfig() {
  const win = safeWindow();
  return win?.__analyticsConfig || {};
}

function sendGaEvent(eventName, params) {
  const win = safeWindow();
  if (typeof win?.gtag !== "function") return;
  try {
    win.gtag("event", eventName, params);
  } catch {}
}

function sendGtmEvent(eventName, params) {
  const win = safeWindow();
  if (!Array.isArray(win?.dataLayer)) return;
  try {
    win.dataLayer.push({ event: eventName, ...params });
  } catch {}
}

function sendMetaTrack(eventName, params) {
  const win = safeWindow();
  if (typeof win?.fbq !== "function") return;
  try {
    win.fbq("track", eventName, params);
  } catch {}
}

function sendMetaCustom(eventName, params) {
  const win = safeWindow();
  if (typeof win?.fbq !== "function") return;
  try {
    win.fbq("trackCustom", eventName, params);
  } catch {}
}

function dispatchEvent(eventName, params = {}) {
  if (getConfig().gtmId) sendGtmEvent(eventName, params);
  else sendGaEvent(eventName, params);
}

function getAttribution() {
  const win = safeWindow();
  if (!win) return {};
  try {
    const raw = win.sessionStorage?.getItem(ATTRIBUTION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function withAttribution(params = {}) {
  // Attribution remains in the enquiry payload; arbitrary query values can contain PII.
  return { ...params };
}

export function captureAttribution() {
  const win = safeWindow();
  if (!win) return {};

  const params = new URLSearchParams(win.location.search || "");
  const captured = {};
  ATTRIBUTION_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) {
      captured[key] = value;
    }
  });

  if (Object.keys(captured).length === 0) {
    return getAttribution();
  }

  const next = {
    ...getAttribution(),
    ...captured,
    landing_page: `${win.location.pathname}${win.location.search}`,
    captured_at: new Date().toISOString(),
  };

  try {
    win.sessionStorage?.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(next));
  } catch {}

  return next;
}

export function getStoredAttribution() {
  return getAttribution();
}

export function initGA4() {
  const win = safeWindow();
  if (!win) return false;
  const config = getConfig();
  return Boolean(config.gaMeasurementId && typeof win.gtag === "function");
}

export function initGTM() {
  const win = safeWindow();
  if (!win) return false;
  if (!Array.isArray(win.dataLayer)) {
    win.dataLayer = [];
  }
  const config = getConfig();
  return Boolean(config.gtmId);
}

export function initMetaPixel() {
  const win = safeWindow();
  if (!win) return false;
  const config = getConfig();
  return Boolean(config.metaPixelId && typeof win.fbq === "function");
}

export function trackPageView(path = "") {
  const win = safeWindow();
  if (!win) return;
  const pagePath = path || `${win.location.pathname}${win.location.search}`;
  if (!getConfig().gtmId) sendGaEvent("page_view", { page_path: pagePath.split("?")[0] });
  sendGtmEvent("page_view", { page_path: pagePath.split("?")[0], category: "engagement", label: "page_view" });
  sendMetaTrack("PageView", { page_path: pagePath });
}

export function trackCallClick(location = "") {
  sendGtmEvent("phone_click", {
    contact_method: "phone", link_location: location,
    page_path: safeWindow()?.location.pathname || "/",
  });
}

export function trackWhatsAppClick(location = "") {
  sendGtmEvent("whatsapp_click", {
    contact_method: "whatsapp", link_location: location,
    page_path: safeWindow()?.location.pathname || "/",
  });
}

export function trackQuoteClick(location = "") {
  const payload = withAttribution({ category: "conversion", label: "quote_button", location });
  dispatchEvent("quote_click", payload);
  dispatchEvent("quote_cta_click", payload);

}

export function trackFormStart(formName = "quote_form") {
  const payload = withAttribution({ category: "lead", label: "quote_form", form_name: formName });
  dispatchEvent("quote_form_start", payload);
  dispatchEvent("form_start", payload);

}

// A submit attempt is engagement only. Only the accepted-response handler calls success.
export function trackFormSubmit(formName = "quote_form") {
  dispatchEvent("quote_form_submit", { form_name: formName });
}

export function trackFormSuccess(formName = "quote_form", leadId = "", onQueued) {
  const win = safeWindow();
  if (!win || !/^[a-zA-Z0-9_-]{8,128}$/.test(leadId)) return false;
  const seen = win.__zqAcceptedLeads ||= new Set();
  const key = `zq_accepted_lead:${leadId}`;
  if (seen.has(leadId)) return false;
  try { if (win.sessionStorage?.getItem(key)) return false; } catch {}
  seen.add(leadId);
  try { win.sessionStorage?.setItem(key, "1"); } catch {}
  win.dataLayer ||= [];
  sendGtmEvent("generate_lead", {
    lead_type: "removal_quote", form_name: formName, lead_id: leadId,
    ...(onQueued ? { eventCallback: onQueued, eventTimeout: 1500 } : {}),
  });
  return true;
}

export function trackEmailClick(location = "") {
  const payload = withAttribution({ category: "conversion", label: "email_click", location });
  dispatchEvent("email_click", payload);
  sendMetaTrack("Contact", payload);
}

export function trackServiceCTA(serviceName = "") {
  const payload = withAttribution({ category: "conversion", label: "service_page_cta", service_name: serviceName });
  dispatchEvent("service_cta_click", payload);
  sendMetaCustom("service_cta_click", payload);
}

export function trackSuburbCTA(suburbName = "") {
  const payload = withAttribution({ category: "conversion", label: "suburb_page_cta", suburb_name: suburbName });
  dispatchEvent("suburb_cta_click", payload);
  sendMetaCustom("suburb_cta_click", payload);
}

export function trackPricePageCTA(pagePath = "") {
  const payload = withAttribution({ category: "conversion", label: "price_page_cta", page_path: pagePath });
  dispatchEvent("price_page_cta_click", payload);
  sendMetaCustom("price_page_cta_click", payload);
}

export function trackAdLanding(channel = "") {
  const eventName = channel === "facebook" ? "facebook_ad_landing" : "google_ad_landing";
  const payload = withAttribution({ category: "landing_page", label: eventName, channel });
  dispatchEvent(eventName, payload);
  sendMetaCustom(eventName, payload);
}

export function trackMobileMenuOpen() {
  const payload = { category: "engagement", label: "mobile_nav" };
  dispatchEvent("mobile_menu_open", payload);
  sendMetaCustom("mobile_menu_open", payload);
}

export function trackStickyCtaClick(location = "sticky_cta") {
  const payload = withAttribution({ category: "conversion", label: "sticky_cta_click", location });
  dispatchEvent("sticky_cta_click", payload);
  sendMetaCustom("sticky_cta_click", payload);
}

export function trackOutboundClick(url) {
  if (!url) return;
  let safeUrl;
  try { const parsed = new URL(url); safeUrl = `${parsed.origin}${parsed.pathname}`; } catch { return; }
  const payload = { category: "engagement", label: "outbound_link", url: safeUrl };
  dispatchEvent("outbound_click", payload);
  sendMetaCustom("outbound_click", payload);
}

function initRouteTracking() {
  const win = safeWindow();
  if (!win || win[ROUTE_TRACKER_KEY]) return;
  win[ROUTE_TRACKER_KEY] = true;

  const handleRoute = () => {
    trackPageView(`${win.location.pathname}${win.location.search}`);
  };

  const originalPush = win.history?.pushState;
  const originalReplace = win.history?.replaceState;
  if (typeof originalPush === "function") {
    win.history.pushState = function patchedPushState(...args) {
      const result = originalPush.apply(this, args);
      handleRoute();
      return result;
    };
  }
  if (typeof originalReplace === "function") {
    win.history.replaceState = function patchedReplaceState(...args) {
      const result = originalReplace.apply(this, args);
      handleRoute();
      return result;
    };
  }

  win.addEventListener("popstate", handleRoute);
  win.addEventListener("hashchange", handleRoute);
}

export function initAnalytics() {
  const win = safeWindow();
  if (!win || win[ANALYTICS_GUARD_KEY]) return;
  win[ANALYTICS_GUARD_KEY] = true;

  initGTM();
  initGA4();
  initMetaPixel();
  const attribution = captureAttribution();
  if (attribution.fbclid) {
    trackAdLanding("facebook");
  }
  if (attribution.gclid) {
    trackAdLanding("google");
  }
  initRouteTracking();
  trackPageView(`${win.location.pathname}${win.location.search}`);
}
