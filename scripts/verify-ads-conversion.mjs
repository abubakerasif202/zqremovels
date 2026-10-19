// Side-effect-free Google Ads conversion check against the live site (or a local build).
//
// Nothing real is created: Web3Forms is mocked (no enquiry, no email) and every Google Ads /
// Analytics measurement request is ABORTED in the test browser and only recorded. Only the
// gtm.js / gtag.js script loaders are fetched.
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

async function fillAndSubmit(page) {
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
  await form.locator('button[type="submit"]').click();
}

const UUID = "3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14";
// Runs in the browser; `marker.at` is an offset from now in ms.
function seedMarker(marker) {
  if (sessionStorage.getItem("qa_seeded")) return;
  sessionStorage.setItem("qa_seeded", "1");
  sessionStorage.setItem("zq_pending_accepted_quote", typeof marker === "string" ? marker : JSON.stringify({ ...marker, at: Date.now() + marker.at }));
}

async function run(label, { web3Ok = true, action = "submit", landing = "", path = "/contact-us/", marker } = {}) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const conversions = [];
  const csp = [];
  let web3Posts = 0;
  let gtmPatched = false;
  await context.exposeFunction("__zqCsp", (entry) => csp.push(entry));
  await context.addInitScript(() => document.addEventListener("securitypolicyviolation", (e) => window.__zqCsp(`${e.violatedDirective} ${e.blockedURI.split("?")[0]}`)));
  await context.route("**/*", async (route) => {
    const request = route.request();
    const url = request.url();
    if (/api\.web3forms\.com\/submit/.test(url)) {
      web3Posts += 1;
      return route.fulfill({ status: web3Ok ? 200 : 400, contentType: "application/json", body: JSON.stringify({ success: web3Ok, message: "mock" }) });
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
  if (marker) await context.addInitScript(seedMarker, marker);
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
    await fillAndSubmit(page);
    await page.waitForURL(/thank-you/, { timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(3000);
    if (action === "replay") {
      await page.goBack().catch(() => {});
      await page.waitForTimeout(2000);
      await page.reload().catch(() => {});
      await page.waitForTimeout(2500);
    }
  }
  const endedOn = new URL(page.url()).pathname;
  await browser.close();
  return { label, web3Posts, endedOn, conversionRequests: conversions.length, conversions, cspViolations: [...new Set(csp)], ...(SIMULATE_GTM_FIX ? { gtmPatched } : {}) };
}

const results = [
  await run("form opened only (expect 0)", { action: "open" }),
  await run("validation failed (expect 0)", { action: "invalid" }),
  await run("Web3Forms rejected (expect 0)", { web3Ok: false }),
  await run("accepted (expect one conversion pair)"),
  await run("accepted, then back + reload (expect no extra)", { action: "replay" }),
  await run("accepted from synthetic ad landing", { landing: "?gclid=TESTSYNTHGCLID&utm_source=google" }),
  await run("AI chat accepted, no navigation (expect one pair)", { action: "chat" }),
  await run("accepted, then legacy-bridge style bare push (expect one pair total)", { action: "bridge" }),
  await run("direct thank-you visit + reload, no marker (expect 0)", { path: "/thank-you/", action: "idle" }),
  await run("thank-you with expired marker + reload (expect 0)", { path: "/thank-you/", action: "idle", marker: { formName: "contact-us_quote_1", leadId: UUID, at: -11 * 60 * 1000 } }),
  await run("thank-you with future-dated marker (expect 0)", { path: "/thank-you/", action: "idle", marker: { formName: "contact-us_quote_1", leadId: UUID, at: 60 * 60 * 1000 } }),
  await run("thank-you with malformed marker (expect 0)", { path: "/thank-you/", action: "idle", marker: "{oops" }),
  await run("thank-you with non-UUIDv4 id (expect 0)", { path: "/thank-you/", action: "idle", marker: { formName: "contact-us_quote_1", leadId: "not-a-uuid", at: 0 } }),
  await run("thank-you with bad form name (expect 0)", { path: "/thank-you/", action: "idle", marker: { formName: "<img src=x>", leadId: UUID, at: 0 } }),
  await run("thank-you with hand-forged valid marker + reload (inherent limit: one pair)", { path: "/thank-you/", action: "idle", marker: { formName: "contact-us_quote_1", leadId: UUID, at: 0 } }),
];
console.log(JSON.stringify({ mode: { local: LOCAL, simulateGtmFix: SIMULATE_GTM_FIX }, results }, null, 2));

