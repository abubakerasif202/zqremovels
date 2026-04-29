const ANALYTICS_GUARD_KEY = "__zqAnalyticsV2";
const ROUTE_TRACKER_KEY = "__zqRouteTrackerV2";

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
  sendGaEvent(eventName, params);
  sendGtmEvent(eventName, params);
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
  sendGaEvent("page_view", { page_path: pagePath });
  sendGtmEvent("page_view", { page_path: pagePath, category: "engagement", label: "page_view" });
  sendMetaTrack("PageView", { page_path: pagePath });
}

export function trackCallClick(location = "") {
  const payload = { category: "conversion", label: "phone_call", location };
  dispatchEvent("call_click", payload);
  sendMetaTrack("Contact", payload);
}

export function trackQuoteClick(location = "") {
  const payload = { category: "conversion", label: "quote_button", location };
  dispatchEvent("quote_click", payload);
  sendMetaTrack("Lead", payload);
}

export function trackFormStart(formName = "quote_form") {
  const payload = { category: "lead", label: "quote_form", form_name: formName };
  dispatchEvent("form_start", payload);
  sendMetaTrack("Lead", payload);
}

export function trackFormSubmit(formName = "quote_form") {
  const payload = { category: "conversion", label: "quote_form", form_name: formName };
  dispatchEvent("generate_lead", payload);
  sendMetaTrack("Lead", payload);
}

export function trackServiceCTA(serviceName = "") {
  const payload = { category: "conversion", label: "service_page_cta", service_name: serviceName };
  dispatchEvent("service_cta_click", payload);
  sendMetaCustom("service_cta_click", payload);
}

export function trackMobileMenuOpen() {
  const payload = { category: "engagement", label: "mobile_nav" };
  dispatchEvent("mobile_menu_open", payload);
  sendMetaCustom("mobile_menu_open", payload);
}

export function trackOutboundClick(url) {
  if (!url) return;
  const payload = { category: "engagement", label: "outbound_link", url };
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
  initRouteTracking();
  trackPageView(`${win.location.pathname}${win.location.search}`);
}
