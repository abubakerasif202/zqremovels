import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const distDir = path.join(root, "site-dist");

function readDist(relativePath) {
  return readFileSync(path.join(distDir, relativePath), "utf8");
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

test("provider scripts load only when matching env vars exist", async () => {
  await buildSite();
  let homepage = readDist("index.html");
  assert.doesNotMatch(homepage, /id="ga4-loader"/);
  assert.doesNotMatch(homepage, /id="gtm-loader"/);
  assert.doesNotMatch(homepage, /id="meta-pixel-loader"/);
  assert.doesNotMatch(homepage, /ns\.html\?id=/);

  await buildSite({
    VITE_GA_MEASUREMENT_ID: "G-MNHNPP0087",
    VITE_GTM_ID: "GTM-TESTV2",
    VITE_META_PIXEL_ID: "123456789012345",
  });
  homepage = readDist("index.html");
  assert.match(homepage, /id="ga4-loader"/);
  assert.match(homepage, /id="gtm-loader"/);
  assert.match(homepage, /id="meta-pixel-loader"/);
  assert.match(homepage, /ns\.html\?id=GTM-TESTV2/);
});

test("scripts are not duplicated in generated html", async () => {
  await buildSite({
    VITE_GA_MEASUREMENT_ID: "G-MNHNPP0087",
    VITE_GTM_ID: "GTM-TESTV2",
    VITE_META_PIXEL_ID: "123456789012345",
  });
  const homepage = readDist("index.html");

  const count = (pattern) => (homepage.match(pattern) || []).length;
  assert.equal(count(/id="ga4-loader"/g), 1);
  assert.equal(count(/id="gtm-loader"/g), 1);
  assert.equal(count(/id="meta-pixel-loader"/g), 1);
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
  const dataLayer = [];
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
  analytics.trackServiceCTA("house-removals");
  analytics.trackMobileMenuOpen();
  analytics.trackOutboundClick("https://example.com");

  const names = dataLayer.map((entry) => entry.event);
  assert.ok(names.includes("call_click"));
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
  const dataLayer = [];
  const listeners = new Map();
  const location = { pathname: "/", search: "" };
  const history = {
    pushState(_state, _title, url) {
      if (typeof url === "string") {
        const parsed = new URL(url, "https://zqremovals.au");
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
