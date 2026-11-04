// Side-effect-free Google Ads conversion check against the live site (or a local build).
//
// Nothing real is created: POST to Web3Forms is mocked (no enquiry, no email) and every Google Ads /
// Analytics measurement request is ABORTED in the test browser and only recorded. Only the
// gtm.js / gtag.js script loaders are fetched.
//
// Two layers are reported separately:
//   * site events - dataLayer pushes recorded in the page (asserted; the script exits 1 on a mismatch)
//   * Google requests - conversion requests GTM/gtag attempted (informational; they depend on the
//     published GTM container and Consent Mode, so a difference from the site events is a GTM
//     finding, not a site bug)
// Optional-tracking consent is explicit: scenarios run with the zq_consent_v1 cookie granted or absent.
//
// Usage:
//   node scripts/verify-ads-conversion.mjs                 # live GTM + live site
//   node scripts/verify-ads-conversion.mjs --local         # live GTM + local site-dist/site.js, analytics.mjs, vercel.json CSP
//   node scripts/verify-ads-conversion.mjs --simulate-gtm-fix [--local]
//        # also patches the live gtm.js IN THIS BROWSER ONLY, dropping the eval-based Custom JS
//        # condition from the conversion trigger (the change proposed in
//        # docs/lead-tracking-recovery-2026-10-19.md section 4A). Nothing is published.
//
// After the GTM trigger fix is published and the site fix deployed, run with no flags:
// "accepted" scenarios should show conversion requests (aborted), all others none.
import { readFileSync } from "node:fs";
import { chromium } from "playwright";

const ORIGIN = "https://zqremovalsadelaide.com.au";
const LOCAL = process.argv.includes("--local");
const SIMULATE_GTM_FIX = process.argv.includes("--simulate-gtm-fix");
const MEASUREMENT = /googleadservices\.com|google\.com(\.au)?\/(pagead|ccm|rmkt)|doubleclick\.net|googlesyndication\.com|google-analytics\.com|analytics\.google\.com/i;
const LIVE_RULE = '[["if",1,3,4,5,6,7],["add",2]]';
const FIXED_RULE = '[["if",1,3,4,5,7],["add",2]]';
const localCsp = () => JSON.parse(readFileSync("vercel.json", "utf8")).headers
  .flatMap((rule) => rule.headers).find((header) => header.key === "Content-Security-Policy").value;

async function fillAndSubmit(page, double = false) {
  const form = page.locator("form[data-quote-form]").first();
  await form.locator('input[name="crew_package"]').first().check({ force: true });
  for (const name of ["move_scope", "property_type", "move_size", "packing_required", "pickup_access", "dropoff_access"]) {
    const select = form.locator(`select[name="${name}"]`);
    const values = await select.locator("option").evaluateAll((options) => options.map((o) => o.value).filter(Boolean));
    await select.selectOption(values[0]);
  }
  await form.locator('[name="pickup_suburb"]').fill("Test Suburb");
  await form.locator('[name="dropoff_suburb"]').fill("Test Suburb Two");
  await form.locator('[name="name"]').fill("Synthetic Test");
  await form.locator('[name="phone"]').fill("0400000000");
  await form.locator('[name="email"]').fill("synthetic@example.invalid");
  await form.locator('[name="message"]').fill("Synthetic audit fixture - not a real enquiry.");
  const submit = form.locator('button[type="submit"]');
  if (double) await submit.dblclick({ force: true }).catch(() => {});
  else await submit.click();
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const consentCookie = () => encodeURIComponent(JSON.stringify({ version: 1, updatedAt: Date.now(), analytics: true, advertising: true }));

async function run(label, { api = "ok", consent = true, action = "submit", landing = "", path = "/contact-us/", expectEvents = 0 } = {}) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const conversions = [];
  const csp = [];
  let quotePosts = 0;
  const events = [];
  let gtmPatched = false;
  if (consent) await context.addCookies([{ name: "zq_consent_v1", value: consentCookie(), url: ORIGIN }]);
  await context.exposeFunction("__zqCsp", (entry) => csp.push(entry));
  await context.exposeFunction("__zqRec", (entry) => events.push(entry));
  await context.addInitScript(() => {
    // Record accepted-lead pushes before any GTM wrapper sees them; records only, never alters them.
    const layer = window.dataLayer || [];
    const original = layer.push.bind(layer);
    layer.push = (...items) => {
      for (const item of items) {
        if (item && ["zq_quote_submitted", "generate_lead"].includes(item.event)) {
          try { window.__zqRec(JSON.parse(JSON.stringify(item))); } catch {}
        }
      }
      return original(...items);
    };
    window.dataLayer = layer;
  });
  await context.addInitScript(() => document.addEventListener("securitypolicyviolation", (e) => window.__zqCsp(`${e.violatedDirective} ${e.blockedURI.split("?")[0]}`)));
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = request.url();
    if (url === "https://api.web3forms.com/submit" && request.method() === "POST") {
      quotePosts += 1;
      if (api === "abort") return route.abort();
      if (api === "rejected") return route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ success: false, message: "Synthetic rejection" }) });
      if (api === "error") return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ success: false }) });
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, body: { message: "Synthetic accepted fixture" } }) });
    }
    if (/googletagmanager\.com\/gtm\.js/.test(url) && SIMULATE_GTM_FIX) {
      const response = await route.fetch();
      const body = (await response.text()).replace(LIVE_RULE, () => { gtmPatched = true; return FIXED_RULE; });
      return route.fulfill({ response, body });
    }
    if (/googletagmanager\.com\/(gtm\.js|gtag\/js)/.test(url)) return route.continue();
    if (MEASUREMENT.test(url)) {
      if (/conversion/.test(url)) {
        const parsed = new URL(url);
        const oid = parsed.searchParams.get("oid") || "";
        const oidState = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(oid) ? "uuid4" : oid ? "other" : "missing";
        conversions.push(`${parsed.host}${parsed.pathname} gcs=${parsed.searchParams.get("gcs") || "-"} oid=${oidState}`);
      }
      return route.abort();
    }
    if (url.startsWith(`${ORIGIN}/api/`)) return route.abort();
    // Serve the local build: site.js, its hashed chunks (site.js loads analytics from
    // /chunks/analytics-<hash>.js) and analytics.mjs (imported directly by the chat widget).
    const localPath = LOCAL && /^\/(site\.js|analytics\.mjs|chunks\/[\w.-]+\.js)$/.exec(new URL(url).pathname)?.[1];
    if (localPath && url.startsWith(ORIGIN)) return route.fulfill({ contentType: "text/javascript", body: readFileSync(`site-dist/${localPath}`, "utf8") });
    if (LOCAL && request.resourceType() === "document" && url.startsWith(ORIGIN)) {
      const response = await route.fetch();
      return route.fulfill({ response, headers: { ...response.headers(), "content-security-policy": localCsp() } });
    }
    return route.continue();
  });
  const page = await context.newPage();
  await page.goto(`${ORIGIN}${path}${landing}`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  const pushFromUserEvent = (script) => page.evaluate((code) => {
    // A real click task, so GTM runs under the page CSP (DevTools-evaluated pushes are CSP-exempt).
    document.getElementById("__zq_probe")?.remove();
    const button = document.createElement("button");
    button.style.cssText = "position:fixed;top:0;left:0;width:8px;height:8px;z-index:2147483647";
    button.id = "__zq_probe";
    // Inline <script> (allowed by 'unsafe-inline'); new Function would itself be blocked as eval.
    button.addEventListener("click", () => {
      const script = document.createElement("script");
      script.textContent = code;
      document.head.appendChild(script);
    });
    document.body.appendChild(button);
  }, script).then(() => page.click("#__zq_probe"));
  if (action === "idle") {
    await page.waitForTimeout(3000);
    if (path === "/thank-you/") { await page.reload(); await page.waitForTimeout(3000); }
  } else if (action === "chat") {
    await pushFromUserEvent(`import("/analytics.mjs").then((m) => m.trackFormSuccess("ai_chat_enquiry", crypto.randomUUID()));`);
    await page.waitForTimeout(3500);
  } else if (action === "bridge") {
    await pushFromUserEvent(`import("/analytics.mjs").then((m) => m.trackFormSuccess("contact-us_quote_1", crypto.randomUUID()));`);
    await page.waitForTimeout(3000);
    // What the legacy bridge tag would push: the event with no submission fields.
    await pushFromUserEvent(`window.dataLayer.push({ event: "zq_quote_submitted", form_name: "quote_form" });`);
    await page.waitForTimeout(3000);
  } else if (action === "open") {
    await page.locator("form[data-quote-form] [name=name]").first().fill("x");
    await page.waitForTimeout(2000);
  } else if (action === "invalid") {
    await page.locator("form[data-quote-form] button[type=submit]").first().click();
    await page.waitForTimeout(2500);
  } else {
    await fillAndSubmit(page, action === "double");
    await page.waitForURL(/thank-you/, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(3000);
    if (action === "replay" || action === "double") {
      await page.goBack().catch(() => {});
      await page.waitForTimeout(2000);
      await page.reload().catch(() => {});
      await page.waitForTimeout(2500);
    }
  }
  const endedOn = new URL(page.url()).pathname;
  await browser.close();
  const accepted = events.filter((e) => e.event === "zq_quote_submitted" && UUID_V4.test(e.submission_id || ""));
  const problems = [];
  if (accepted.length !== expectEvents) problems.push(`expected ${expectEvents} zq_quote_submitted, saw ${accepted.length}`);
  for (const e of accepted) {
    if (e.form_name !== "quote_form" || e.submission_status !== "accepted") problems.push("accepted event has wrong form_name/submission_status");
    if (!UUID_V4.test(e.submission_id || "")) problems.push("submission_id is not a UUIDv4");
  }
  if (new Set(accepted.map((e) => e.submission_id)).size !== accepted.length) problems.push("accepted submissions reused a conversion ID");
  if (action === "double" && quotePosts !== 2) problems.push(`expected both direct submissions to reach Web3Forms, saw ${quotePosts}`);
  if (/Synthetic Test|0400000000|synthetic@example/i.test(JSON.stringify(events))) problems.push("personal details leaked into the dataLayer");
  if (csp.length) problems.push(`CSP violations: ${[...new Set(csp)].join("; ")}`);
  return { label, quotePosts, endedOn, siteEvents: { zq_quote_submitted: accepted.length, generate_lead: events.length - accepted.length }, googleConversionRequests: conversions.length, conversions, cspViolations: [...new Set(csp)], problems, ...(SIMULATE_GTM_FIX ? { gtmPatched } : {}) };
}

const results = [
  await run("form opened only", { action: "open" }),
  await run("validation failed", { action: "invalid" }),
  await run("consent + accepted", { expectEvents: 1 }),
  await run("consent + accepted from ad landing (gclid)", { landing: "?gclid=TESTSYNTHGCLID&utm_source=google", expectEvents: 1 }),
  await run("consent + accepted, double submit is not suppressed", { action: "double", expectEvents: 2 }),
  await run("consent + accepted, then back + reload", { action: "replay", expectEvents: 1 }),
  await run("consent + AI chat accepted, no navigation", { action: "chat", expectEvents: 1 }),
  await run("consent + accepted, then legacy-bridge bare push", { action: "bridge", expectEvents: 1 }),
  await run("NO consent + accepted (event must stay queued)", { consent: false, expectEvents: 0 }),
  await run("consent + HTTP 422 rejected", { api: "rejected" }),
  await run("consent + HTTP 500", { api: "error" }),
  await run("consent + network failure", { api: "abort" }),
  await run("direct thank-you visit + reload never creates a lead", { path: "/thank-you/", action: "idle" }),
];
console.log(JSON.stringify({ mode: { local: LOCAL, simulateGtmFix: SIMULATE_GTM_FIX }, results }, null, 2));

// Google-side rules (these exercise the published GTM container, so a failure here is a GTM or
// Consent Mode finding): no Google conversion request without a permitted site event, and the
// legacy bare push must not add a conversion on top of the single accepted one.
const baseline = results.find((result) => result.label === "consent + accepted")?.googleConversionRequests ?? 0;
for (const result of results) {
  if (result.siteEvents.zq_quote_submitted === 0 && result.googleConversionRequests > 0) {
    result.problems.push(`${result.googleConversionRequests} Google conversion request(s) with no permitted site event`);
  }
  if (result.label === "consent + accepted" && result.googleConversionRequests === 0) {
    result.problems.push("GTM sent no Google conversion request for a consented, accepted lead (check the published trigger and Consent Mode)");
  }
  if (result.label.includes("legacy-bridge") && result.googleConversionRequests !== baseline) {
    result.problems.push(`bare push changed Google conversion requests (${result.googleConversionRequests} vs ${baseline} for one accepted lead)`);
  }
}

const failing = results.filter((result) => result.problems.length);
for (const result of failing) console.error(`FAIL ${result.label}: ${result.problems.join("; ")}`);
console.error(failing.length ? `${failing.length} of ${results.length} scenarios failed` : `all ${results.length} scenarios passed (site events and Google-side rules)`);
process.exitCode = failing.length ? 1 : 0;
