import { test, expect, type Page } from '@playwright/test';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type QAEntry = { event: string; submission_id?: string; [key: string]: unknown };
test.use({ serviceWorkers: 'block' });

test.beforeEach(async ({ context }) => {
  // Default-deny at context scope: no frames/popups/beacons can escape to a collector.
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === 'http://127.0.0.1:3000' && ['GET', 'HEAD'].includes(route.request().method())) return route.continue();
    return route.abort();
  });
  await context.addInitScript(() => {
    type Entry = Record<string, unknown> & { event?: string; eventCallback?: () => void };
    const qa = window as unknown as { dataLayer: unknown[]; __qa: { claims: boolean[]; order: string[] }; __zqClaimAcceptedQuoteForAds?: (id: unknown, form: unknown, status: unknown) => boolean };
    qa.__qa = { claims: [], order: [] };
    const layer: unknown[] = [];
    const push = layer.push.bind(layer);
    layer.push = (...items: unknown[]) => {
      for (const raw of items) {
        const item = raw as Entry;
        if (!item || !['zq_quote_submitted', 'generate_lead', 'phone_click', 'whatsapp_click'].includes(item.event || '')) continue;
        // QA-only storage transports evidence across navigation; production registry uses memory.
        const events = JSON.parse(sessionStorage.getItem('qa_events') || '[]');
        events.push(item);
        sessionStorage.setItem('qa_events', JSON.stringify(events));
        if (item.event === 'zq_quote_submitted') {
          const claimed = qa.__zqClaimAcceptedQuoteForAds?.(item.submission_id, item.form_name, item.submission_status) === true;
          qa.__qa.claims.push(claimed);
          qa.__qa.order.push(claimed ? 'mock-main-tag-complete' : 'mock-setup-failed');
          // This models sequencing only; it does NOT load or validate native GTM.
          if (item.eventCallback) {
            item.eventCallback();
            qa.__qa.order.push('canonical-callback-returned');
          }
          sessionStorage.setItem('qa_claims', JSON.stringify(qa.__qa));
        }
      }
      return push(...items);
    };
    qa.dataLayer = layer;
  });
});

async function events(page: Page): Promise<QAEntry[]> {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem('qa_events') || '[]'));
}
async function fillForm(page: Page, formIndex = 0) {
  await page.locator('form[data-quote-form="quote"]').nth(formIndex).evaluate((form: HTMLFormElement) => {
    for (const field of Array.from(form.elements) as HTMLInputElement[]) {
      if (!field.name || !field.required) continue;
      if (field.tagName === 'SELECT') {
        const select = field as unknown as HTMLSelectElement;
        select.value = Array.from(select.options).find(option => option.value)?.value || '';
      } else if (field.type === 'radio' || field.type === 'checkbox') field.checked = true;
      else field.value = field.type === 'email' ? 'qa@example.invalid' : field.type === 'tel' ? '0400000000' : field.type === 'date' ? '2027-01-01' : 'Private QA fixture';
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // No real production key is present even in the intercepted synthetic request.
    const key = form.querySelector<HTMLInputElement>('[name="access_key"]');
    if (key) key.value = 'offline-test-key';
  });
}
async function submit(page: Page, formIndex = 0) {
  await page.locator('form[data-quote-form="quote"]').nth(formIndex).evaluate((form: HTMLFormElement) => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

for (const [path, index] of [['/', 0], ['/', 1], ['/contact-us/', 0], ['/removalists-southern-adelaide/', 0], ['/adelaide-removalists-facebook-offer/', 0]] as const) {
  test(`accepted quote canonical contract: ${path} form ${index}`, async ({ page, context }) => {
    let requests = 0;
    await context.route('https://api.web3forms.com/submit', async route => {
      requests++;
      await new Promise(resolve => setTimeout(resolve, 100));
      await route.fulfill({ json: { success: true, lead_id: 'provider-id-is-untrusted' } });
    });
    await page.goto(path + '?email=private@example.invalid');
    await fillForm(page, index);
    await submit(page, index);
    await page.waitForURL('**/thank-you/');
    expect(requests).toBe(1);
    const recorded = await events(page);
    expect(recorded).toHaveLength(1);
    expect(recorded[0]).toEqual({ event: 'zq_quote_submitted', form_name: 'quote_form', submission_status: 'accepted', submission_id: expect.stringMatching(uuid), eventTimeout: 1500 });
    expect(JSON.stringify(recorded)).not.toMatch(/private@|0400000000|Private QA|provider-id|lead_id|generate_lead/i);
    expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('qa_claims') || '{}'))).toEqual({ claims: [true], order: ['mock-main-tag-complete', 'canonical-callback-returned'] });
    await page.reload();
    expect(await events(page)).toEqual(recorded);
  });
}

for (const scenario of ['invalid', 'network', 'server', 'rejected', 'empty', 'malformed', 'missing-success', 'null', 'string-true']) {
  test(`no conversion for ${scenario}`, async ({ page, context }) => {
    let requests = 0;
    await context.route('https://api.web3forms.com/submit', async route => {
      requests++;
      if (scenario === 'network') return route.abort();
      const body = scenario === 'empty' ? '' : scenario === 'malformed' ? '{oops' : JSON.stringify(scenario === 'missing-success' ? {} : scenario === 'null' ? null : { success: scenario === 'string-true' ? 'true' : scenario === 'server' });
      await route.fulfill({ status: scenario === 'server' ? 500 : 200, contentType: 'application/json', body });
    });
    await page.goto('/contact-us/');
    if (scenario !== 'invalid') await fillForm(page);
    await submit(page);
    await expect(page.locator('[data-form-feedback]').first()).toContainText(scenario === 'invalid' ? 'highlighted' : 'Could not send');
    expect(await events(page)).toEqual([]);
    expect(requests).toBe(scenario === 'invalid' ? 0 : 1);
  });
}

test('raw replay, unknown IDs and missing fields fail the website claim gate', async ({ page, context }) => {
  await context.route('https://api.web3forms.com/submit', route => route.fulfill({ json: { success: true } }));
  await page.goto('/contact-us/');
  await fillForm(page);
  // Suppress only navigation so the accepted document registry remains available.
  await page.evaluate(() => {
    const original = window.setTimeout;
    window.setTimeout = ((fn: TimerHandler, delay?: number, ...args: unknown[]) => original(fn, delay === 1600 ? 10000 : delay, ...args)) as typeof window.setTimeout;
    const push = window.dataLayer!.push.bind(window.dataLayer);
    window.dataLayer!.push = (...items: unknown[]) => {
      for (const raw of items) {
        const item = raw as { event?: string; eventCallback?: () => void };
        if (item.event === 'zq_quote_submitted') delete item.eventCallback;
      }
      return push(...items);
    };
  });
  await submit(page);
  await expect.poll(async () => (await events(page)).length).toBe(1);
  const results = await page.evaluate(() => {
    const w = window as unknown as { __zqClaimAcceptedQuoteForAds: (id: unknown, form: unknown, status: unknown) => boolean; dataLayer: Record<string, unknown>[]; __qa: { claims: boolean[] } };
    const item = w.dataLayer.find(entry => entry.event === 'zq_quote_submitted')!;
    w.dataLayer.push({ ...item });
    return [w.__qa.claims, w.__zqClaimAcceptedQuoteForAds('00000000-0000-4000-8000-000000000000', 'quote_form', 'accepted'), w.__zqClaimAcceptedQuoteForAds(item.submission_id, 'other', 'accepted'), w.__zqClaimAcceptedQuoteForAds(undefined, 'quote_form', 'accepted')];
  });
  expect(results).toEqual([[true, false], false, false, false]);
  const id = (await events(page))[0].submission_id;
  await page.reload();
  const replay = await page.evaluate(id => {
    const helper = (window as unknown as { __zqClaimAcceptedQuoteForAds?: (id: unknown, form: string, status: string) => boolean }).__zqClaimAcceptedQuoteForAds;
    return helper ? helper(id, 'quote_form', 'accepted') : false;
  }, id);
  expect(replay).toBe(false);
});

test('homepage and direct thank-you refresh never create leads', async ({ page }) => {
  await page.goto('/');
  expect(await events(page)).toEqual([]);
  await page.goto('/thank-you/');
  await page.reload();
  expect(await events(page)).toEqual([]);
});

for (const [name, choices] of [
  ['denied', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }],
  ['partial', { analytics_storage: 'granted' }],
  ['persisted grant', { ad_storage: 'granted', analytics_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' }],
] as const) {
  test(`consent baseline precedes ${name} fixture without inventing choices`, async ({ page }) => {
    await page.addInitScript(choices => { window.dataLayer!.push(['consent', 'update', choices]); }, choices);
    await page.goto('/contact-us/');
    const entries = await page.evaluate(() => window.dataLayer!.filter(entry => entry?.[0] === 'consent').map(entry => Array.from(entry)));
    expect(entries).toEqual([['consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }], ['consent', 'update', choices]]);
  });
}

test('consent grant then revocation preserve update order', async ({ page }) => {
  await page.addInitScript(() => {
    window.dataLayer!.push(['consent', 'update', { ad_storage: 'granted' }], ['consent', 'update', { ad_storage: 'denied' }]);
  });
  await page.goto('/');
  const entries = await page.evaluate(() => window.dataLayer!.filter(entry => entry?.[0] === 'consent').map(entry => Array.from(entry)));
  expect(entries.map(entry => entry[1])).toEqual(['default', 'update', 'update']);
  expect(entries[2][2]).toEqual({ ad_storage: 'denied' });
});

test('two independently accepted forms receive distinct one-time claims', async ({ page, context }) => {
  let requests = 0;
  await context.route('https://api.web3forms.com/submit', async route => {
    requests++;
    await new Promise(resolve => setTimeout(resolve, 150));
    await route.fulfill({ json: { success: true } });
  });
  await page.goto('/');
  await fillForm(page, 0);
  await fillForm(page, 1);
  const thankYouNavigation = page.waitForURL('**/thank-you/');
  await page.evaluate(() => {
    // Hold completion callbacks briefly so both accepted documents' records can queue.
    const push = window.dataLayer!.push.bind(window.dataLayer);
    window.dataLayer!.push = (...items: unknown[]) => {
      for (const raw of items) {
        const item = raw as { event?: string; eventCallback?: () => void };
        if (item.event === 'zq_quote_submitted' && item.eventCallback) {
          const callback = item.eventCallback;
          item.eventCallback = () => { setTimeout(callback, 350); };
        }
      }
      return push(...items);
    };
    for (const form of document.querySelectorAll('form[data-quote-form="quote"]')) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    }
  });
  await thankYouNavigation;
  expect(requests).toBe(2);
  const recorded = await events(page);
  expect(recorded).toHaveLength(2);
  expect(new Set(recorded.map(entry => entry.submission_id)).size).toBe(2);
  expect(recorded.every(entry => uuid.test(entry.submission_id || ''))).toBe(true);
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('qa_claims') || '{}').claims)).toEqual([true, true]);
});
