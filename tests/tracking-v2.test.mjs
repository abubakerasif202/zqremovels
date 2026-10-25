import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const distDir = path.join(root, "site-dist");
const grantedConsent = ["consent", "default", {
  ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted",
}];

function readDist(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  const candidates = [
    path.join(distDir, relativePath),
  ];
  if (normalized.endsWith('/index.html') && normalized !== 'index.html') {
    const prefix = normalized.slice(0, -11);
    candidates.unshift(path.join(distDir, `${prefix}/index/index.html`));
  } else if (normalized.endsWith('.html') && !normalized.endsWith('/index.html') && normalized !== 'index.html' && normalized !== '404.html') {
    const prefix = normalized.slice(0, -5);
    candidates.unshift(path.join(distDir, `${prefix}/index.html`));
  }
  for (const c of candidates) {
    try {
      return readFileSync(c, 'utf8');
    } catch {
      // ignore
    }
  }
  return readFileSync(path.join(distDir, relativePath), 'utf8');
}

async function buildSite(extraEnv = {}) {
  const previous = new Map();
  for (const [key, value] of Object.entries(extraEnv)) {
    previous.set(key, process.env[key]);
    process.env[key] = value;
  }

  try {
    const buildUrl = pathToFileURL(path.join(root, "scripts", "build-site.mjs")).href;
    await import(`${buildUrl}?trackingV2=${Date.now()}${Math.random()}`);
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("optional tag requests stay blocked until a stored visitor choice permits loading", async () => {
  await buildSite();
  let homepage = readDist("index.html");
  assert.doesNotMatch(homepage, /<script[^>]+src=["']https:\/\/www\.googletagmanager\.com\/gtm\.js/);
  assert.match(homepage, /consent-manager\.mjs/);
  assert.match(homepage, /GTM-WJGKPXFL/);
  assert.doesNotMatch(homepage, /googletagmanager\.com\/ns\.html/);

  await buildSite({
    VITE_GA_MEASUREMENT_ID: "G-MNHNPP0087",
    VITE_META_PIXEL_ID: "123456789012345",
  });
  homepage = readDist("index.html");
  assert.doesNotMatch(homepage, /<script[^>]+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js/);
  assert.match(homepage, /GTM-WJGKPXFL/);
  assert.doesNotMatch(homepage, /googletagmanager\.com\/ns\.html/);
});

test("scripts are not duplicated in generated html", async () => {
  await buildSite({
    VITE_GA_MEASUREMENT_ID: "G-MNHNPP0087",
    VITE_META_PIXEL_ID: "123456789012345",
  });
  const homepage = readDist("index.html");

  const count = (pattern) => (homepage.match(pattern) || []).length;
  assert.equal(count(/consent-manager\.mjs/g), 1);
  assert.equal(count(/<script[^>]+src=["']https:\/\/www\.googletagmanager\.com\/gtm\.js/g), 0);
  assert.equal(count(/<script[^>]+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js/g), 0);
});

test("analytics utility does not throw when providers are unavailable", async () => {
  const moduleUrl = pathToFileURL(path.join(root, "analytics.mjs")).href;
  const analytics = await import(`${moduleUrl}?safe=${Date.now()}${Math.random()}`);

  const originalWindow = global.window;
  global.window = {
    location: { pathname: "/", search: "" },
    history: {
      pushState() {},
      replaceState() {},
    },
    addEventListener() {},
    dataLayer: [],
  };

  assert.doesNotThrow(() => analytics.initAnalytics());
  assert.doesNotThrow(() => analytics.trackCallClick("header"));
  assert.doesNotThrow(() => analytics.trackQuoteClick("hero"));
  assert.doesNotThrow(() => analytics.trackFormStart("quote_form"));
  assert.doesNotThrow(() => analytics.trackFormSubmit("quote_form"));
  assert.doesNotThrow(() => analytics.trackServiceCTA("house-removals"));
  assert.doesNotThrow(() => analytics.trackMobileMenuOpen());
  assert.doesNotThrow(() => analytics.trackOutboundClick("https://example.com"));

  global.window = originalWindow;
});

test("conversion events push payloads to dataLayer", async () => {
  const moduleUrl = pathToFileURL(path.join(root, "analytics.mjs")).href;
  const analytics = await import(`${moduleUrl}?events=${Date.now()}${Math.random()}`);

  const originalWindow = global.window;
  const dataLayer = [grantedConsent];
  global.window = {
    location: { pathname: "/services/house-removals-adelaide/", search: "" },
    history: {
      pushState() {},
      replaceState() {},
    },
    addEventListener() {},
    dataLayer,
    __analyticsConfig: { gtmId: "GTM-TESTV2" },
  };

  analytics.trackCallClick("header");
  analytics.trackQuoteClick("hero");
  analytics.trackFormStart("quote_form");
  analytics.trackFormSubmit("quote_form");
  assert.equal(dataLayer.some((entry) => entry.event === "generate_lead"), false);
  analytics.trackFormSuccess("quote_form", "6b1f0c2a-4d7e-4a3b-9c58-1e2f3a4b5c6d");
  analytics.trackFormSuccess("quote_form", "6b1f0c2a-4d7e-4a3b-9c58-1e2f3a4b5c6d");
  assert.equal(dataLayer.filter((entry) => entry.event === "generate_lead").length, 1);
  analytics.trackServiceCTA("house-removals");
  analytics.trackMobileMenuOpen();
  analytics.trackOutboundClick("https://example.com");

  const names = dataLayer.map((entry) => entry.event);
  assert.ok(names.includes("phone_click"));
  assert.ok(names.includes("quote_click"));
  assert.ok(names.includes("form_start"));
  assert.ok(names.includes("generate_lead"));
  assert.ok(names.includes("service_cta_click"));
  assert.ok(names.includes("mobile_menu_open"));
  assert.ok(names.includes("outbound_click"));

  global.window = originalWindow;
});

test("route tracking emits page_view after history changes", async () => {
  const moduleUrl = pathToFileURL(path.join(root, "analytics.mjs")).href;
  const analytics = await import(`${moduleUrl}?route=${Date.now()}${Math.random()}`);

  const originalWindow = global.window;
  const dataLayer = [grantedConsent];
  const listeners = new Map();
  const location = { pathname: "/", search: "" };
  const history = {
    pushState(_state, _title, url) {
      if (typeof url === "string") {
        const parsed = new URL(url, "https://zqremovalsadelaide.com.au");
        location.pathname = parsed.pathname;
        location.search = parsed.search;
      }
    },
    replaceState() {},
  };

  global.window = {
    location,
    history,
    dataLayer,
    __analyticsConfig: { gtmId: "GTM-TESTV2" },
    addEventListener(name, handler) {
      listeners.set(name, handler);
    },
  };

  analytics.initAnalytics();
  const before = dataLayer.length;
  global.window.history.pushState({}, "", "/contact-us/?from=test");
  const afterPush = dataLayer.length;
  assert.ok(afterPush > before);
  assert.ok(dataLayer.some((entry) => entry.event === "page_view"));

  const pop = listeners.get("popstate");
  if (typeof pop === "function") {
    pop();
  }
  assert.ok(dataLayer.filter((entry) => entry.event === "page_view").length >= 2);

  global.window = originalWindow;
});

test("trackStickyCtaClick pushes payload to dataLayer", async () => {
  const moduleUrl = pathToFileURL(path.join(root, "analytics.mjs")).href;
  const analytics = await import(`${moduleUrl}?sticky=${Date.now()}${Math.random()}`);

  const originalWindow = global.window;
  const dataLayer = [grantedConsent];
  global.window = {
    location: { pathname: "/", search: "" },
    history: { pushState() {}, replaceState() {} },
    addEventListener() {},
    dataLayer,
    __analyticsConfig: { gtmId: "GTM-TESTV2" },
  };

  analytics.trackStickyCtaClick("test_location");

  const entry = dataLayer.find((e) => e.event === "sticky_cta_click");
  assert.ok(entry, "Event 'sticky_cta_click' should be in dataLayer");
  assert.equal(entry.label, "sticky_cta_click");
  assert.equal(entry.location, "test_location");

  global.window = originalWindow;
});


test("accepted lead deduplication is private, GTM-only and resilient to blocked storage", async () => {
  const analytics = await import(`../analytics.mjs?privacy=${Date.now()}`);
  const originalWindow = global.window;
  const dataLayer = [grantedConsent];
  let directCalls = 0;
  global.window = {
    dataLayer, gtag() { directCalls++; },
    location: { pathname: "/contact-us/", search: "?email=private@example.com" },
    sessionStorage: { getItem() { throw Error("blocked"); }, setItem() { throw Error("blocked"); } },
    __analyticsConfig: { gtmId: "GTM-WJGKPXFL" },
  };
  try {
    analytics.trackFormSubmit("test_form");
    assert.equal(dataLayer.some(entry => entry.event === "generate_lead"), false);
    assert.equal(analytics.trackFormSuccess("test_form"), false);
    assert.equal(analytics.trackFormSuccess("test_form", "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d"), true);
    assert.equal(analytics.trackFormSuccess("test_form", "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d"), false);
    analytics.trackCallClick("header");
    analytics.trackWhatsAppClick("footer");
    assert.equal(directCalls, 0);
    assert.equal(dataLayer.filter(entry => entry.event === "generate_lead").length, 1);
    assert.doesNotMatch(JSON.stringify(dataLayer), /private@example/);
  } finally { global.window = originalWindow; }
});
