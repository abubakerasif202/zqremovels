// Read-only diagnostic: shows exactly what one accepted quote sends to Google, using the live GTM container.
//
// Nothing real is created or measured: POST /api/quote/ is mocked, and every Google Ads / Analytics
// measurement request is ABORTED in the test browser and only recorded (with timestamps and parameters).
//
// Usage:
//   node scripts/capture-conversion-requests.mjs [form|double-push] ['{"analytics":true,"advertising":true}' | null]
//   form         submit the contact form once (mocked acceptance) and record the dataLayer and Google requests
//   double-push  push the same accepted event twice, to show that GTM itself does not de-duplicate
// The second argument is the consent cookie to set (JSON), or the string null for a first-time visitor.
import { chromium } from 'playwright';
const ORIGIN = 'https://zqremovalsadelaide.com.au';
const MEAS = /googleadservices\.com|google\.com(\.au)?\/(pagead|ccm|rmkt)|doubleclick\.net|googlesyndication\.com|google-analytics\.com|analytics\.google\.com/i;
const mode = process.argv[2] || 'form';           // form | double-push
const consent = process.argv[3] === 'null' ? null : JSON.parse(process.argv[3] || '{"analytics":true,"advertising":true}');
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
if (consent) await ctx.addCookies([{ name: 'zq_consent_v1', value: encodeURIComponent(JSON.stringify({ version: 1, updatedAt: Date.now(), ...consent })), url: ORIGIN }]);
const t0 = Date.now(); const layer = []; const hits = [];
await ctx.exposeFunction('__rec', (e) => layer.push({ t: Date.now() - t0, ...e }));
await ctx.addInitScript(() => {
  const arr = window.dataLayer || []; const o = arr.push.bind(arr);
  arr.push = (...items) => { for (const x of items) { try { const y = x && x.length !== undefined && !Array.isArray(x) ? Array.from(x) : x; window.__rec({ item: JSON.parse(JSON.stringify(y)) }); } catch { } } return o(...items); };
  window.dataLayer = arr;
});
await ctx.route('**/*', async (route) => {
  const req = route.request(); const u = req.url();
  if (/\/api\/quote\/$/.test(new URL(u).pathname) && req.method() === 'POST') { const b = JSON.parse(req.postData() || '{}'); return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, status: 'accepted', submission_status: 'accepted', submission_id: b.submission_id }) }); }
  if (MEAS.test(u)) { hits.push({ t: Date.now() - t0, method: req.method(), type: req.resourceType(), url: u }); return route.abort(); }
  return route.continue();
});
const page = await ctx.newPage();
await page.goto(ORIGIN + '/contact-us/', { waitUntil: 'load' }); await page.waitForTimeout(2500);
const mark = Date.now() - t0;
if (mode === 'form') {
  const form = page.locator('form[data-quote-form]').first();
  await form.locator('input[name="crew_package"]').first().check({ force: true });
  for (const n of ['move_scope', 'property_type', 'move_size', 'packing_required', 'pickup_access', 'dropoff_access']) { const s = form.locator(`select[name="${n}"]`); const v = await s.locator('option').evaluateAll(o => o.map(x => x.value).filter(Boolean)); await s.selectOption(v[0]); }
  for (const [k, v] of Object.entries({ pickup_suburb: 'Test Suburb', dropoff_suburb: 'Test Suburb Two', name: 'Synthetic Test', phone: '0400000000', email: 'synthetic@example.invalid', message: 'Synthetic QA fixture.' })) await form.locator(`[name="${k}"]`).fill(v);
  await form.locator('button[type="submit"]').click();
  await page.waitForURL(/thank-you/, { timeout: 8000 }).catch(() => { });
  await page.waitForTimeout(4000);
} else {
  const id = '3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14';
  for (let i = 0; i < 2; i++) { await page.evaluate((id) => { window.dataLayer.push({ event: 'zq_quote_submitted', form_name: 'quote_form', submission_status: 'accepted', submission_id: id }); }, id); await page.waitForTimeout(2500); }
}
console.log(JSON.stringify({ mode, consent, markMs: mark, layer: layer.filter(l => l.t >= mark - 50), hits }, null, 1));
await browser.close();
