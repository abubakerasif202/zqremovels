import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // No analytics hits, CAPTCHA requests or real enquiries leave the test browser.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:3000)/, route => route.abort());
  await page.addInitScript(() => {
    const layer: any[] = [];
    const originalPush = layer.push.bind(layer);
    layer.push = (...items: any[]) => {
      for (const item of items) {
        if (['zq_quote_submitted', 'generate_lead', 'phone_click', 'whatsapp_click'].includes(item.event)) {
          const events = JSON.parse(sessionStorage.getItem('qa_events') || '[]');
          events.push(item);
          sessionStorage.setItem('qa_events', JSON.stringify(events));
          const paths = JSON.parse(sessionStorage.getItem('qa_event_paths') || '[]');
          paths.push(location.pathname);
          sessionStorage.setItem('qa_event_paths', JSON.stringify(paths));
        }
      }
      return originalPush(...items);
    };
    window.dataLayer = layer;
  });
});

async function events(page: any) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem('qa_events') || '[]'));
}

async function fillForm(page: any, formIndex = 0) {
  await page.locator('form[data-quote-form="quote"]').nth(formIndex).evaluate((form: HTMLFormElement) => {
    for (const field of Array.from(form.elements) as HTMLInputElement[]) {
      if (!field.name || !field.required) continue;
      if (field.tagName === 'SELECT') {
        const select = field as unknown as HTMLSelectElement;
        select.value = Array.from(select.options).find(option => option.value)?.value || '';
      } else if (field.type === 'radio' || field.type === 'checkbox') {
        field.checked = true;
      } else {
        field.value = field.type === 'email' ? 'qa@example.com' :
          field.type === 'tel' ? '0400000000' : field.type === 'date' ? '2027-01-01' : 'QA fixture';
      }
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

for (const [path, formIndex] of [['/', 0], ['/contact-us/', 0], ['/removalists-southern-adelaide/', 0], ['/adelaide-removalists-facebook-offer/', 0]] as const) {
  // The Ads tag sends 0.45-1s after the push, after GTM's eventCallback, so the event is handed
  // to /thank-you/ (which stays open) instead of racing the redirect.
  test(`accepted quote fires one private event on the thank-you page: ${path} form ${formIndex}`, async ({ page }) => {
    let requests = 0;
    await page.route('https://api.web3forms.com/submit', async route => {
      requests++;
      await new Promise(resolve => setTimeout(resolve, 100));
      // Provider references need not be UUIDs; the Ads transaction contract is UUIDv4.
      await route.fulfill({ json: { success: true, lead_id: 'provider-reference-12345' } });
    });
    await page.goto(path);
    await fillForm(page, formIndex);
    await page.locator('form[data-quote-form="quote"]').nth(formIndex).evaluate((form: HTMLFormElement) => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await page.waitForURL('**/thank-you/');
    expect(requests).toBe(1);
    await expect.poll(async () => (await events(page)).length).toBe(2);
    const recorded = await events(page);
    expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem('qa_event_paths') || '[]'))).toEqual(['/thank-you/', '/thank-you/']);
    expect(await page.evaluate(() => sessionStorage.getItem('zq_pending_accepted_quote'))).toBeNull();
    expect(recorded[0]).toEqual({
      event: 'zq_quote_submitted', form_name: 'quote_form', submission_status: 'accepted',
      submission_id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
      lead_id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i), source_form: expect.any(String),
    });
    expect(recorded[1]).toEqual({
      event: 'generate_lead', lead_type: 'removal_quote',
      form_name: expect.any(String), lead_id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i),
      submission_status: 'accepted', submission_id: recorded[0].submission_id,
    });
    expect(recorded[0].lead_id).toBe(recorded[1].lead_id);
    expect(JSON.stringify(recorded)).not.toMatch(/qa@example|0400000000|QA fixture/);
    await page.reload();
    expect(await events(page)).toEqual(recorded);
  });
}

for (const scenario of ['invalid', 'network', 'server', 'rejected', 'empty', 'malformed', 'missing-success', 'truthy-success']) {
  test(`no conversion for ${scenario}`, async ({ page }) => {
    let requests = 0;
    await page.route('https://api.web3forms.com/submit', async route => {
      requests++;
      if (scenario === 'network') return route.abort();
      return route.fulfill({ status: scenario === 'server' ? 500 : 200,
        contentType: 'application/json', body: scenario === 'empty' ? '' : scenario === 'malformed' ? '{oops' :
          JSON.stringify(scenario === 'missing-success' ? {} : { success: scenario === 'truthy-success' ? 'true' : scenario === 'server' }) });
    });
    await page.goto('/contact-us/');
    if (scenario !== 'invalid') await fillForm(page);
    await page.locator('form[data-quote-form="quote"]').first().evaluate((form: HTMLFormElement) => {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
    await expect(page.locator('[data-form-feedback]').first()).toContainText(scenario === 'invalid' ? 'highlighted' : 'Could not send');
    expect(await events(page)).toHaveLength(0);
    expect(await page.evaluate(() => sessionStorage.getItem('zq_pending_accepted_quote'))).toBeNull();
    expect(requests).toBe(scenario === 'invalid' ? 0 : 1);
  });
}

test('a stale or malformed hand-off never establishes a lead', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('qa_seeded')) return;
    sessionStorage.setItem('qa_seeded', '1');
    sessionStorage.setItem('zq_pending_accepted_quote', JSON.stringify({
      leadId: '3f2b8c1e-9d4a-4b6f-8a1c-2e5d7f903b14', formName: 'contact-us_quote_1', at: Date.now() - 60 * 60 * 1000,
    }));
  });
  await page.goto('/thank-you/');
  await page.waitForLoadState('networkidle');
  expect(await events(page)).toEqual([]);
  expect(await page.evaluate(() => sessionStorage.getItem('zq_pending_accepted_quote'))).toBeNull();
  await page.evaluate(() => sessionStorage.setItem('zq_pending_accepted_quote', '{oops'));
  await page.reload();
  await page.waitForLoadState('networkidle');
  expect(await events(page)).toEqual([]);
});

test('one GTM loader, consent defaults, delegated contacts and history navigation', async ({ page }) => {
  await page.goto('/contact-us/');
  expect(await page.locator('script[src*="googletagmanager.com/gtm.js"]').count()).toBe(1);
  expect(await page.locator('script[src*="gtag/js?id=AW-"]').count()).toBe(0);
  expect(await events(page)).toHaveLength(0);
  const consent = await page.evaluate(() => Array.from(window.dataLayer![0] as any));
  expect(consent).toEqual(['consent', 'default', {
    ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  }]);
  await page.locator('a[href="tel:+61433819989"]').first().evaluate((anchor: HTMLAnchorElement) => {
    anchor.addEventListener('click', event => event.preventDefault());
    anchor.click();
  });
  // No production WhatsApp CTA exists. Exercise the delegated handler with a fixture.
  await page.evaluate(() => {
    history.pushState({}, '', '/contact-us/?email=private@example.com');
    const a = document.createElement('a');
    a.href = 'https://wa.me/61433819989';
    a.dataset.leadLocation = 'qa_fixture';
    a.addEventListener('click', event => event.preventDefault());
    document.body.appendChild(a);
    a.click();
  });
  await expect.poll(async () => (await events(page)).length).toBe(2);
  const recorded = await events(page);
  expect(recorded.map((entry: any) => entry.event)).toEqual(['phone_click', 'whatsapp_click']);
  expect(recorded[1]).toEqual({ event: 'whatsapp_click', contact_method: 'whatsapp', link_location: 'qa_fixture', page_path: '/contact-us/' });
  expect(JSON.stringify(recorded)).not.toContain('private@example.com');
});

test('queued consent choices are preserved', async ({ page }) => {
  await page.addInitScript(() => {
    window.dataLayer!.push(['consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied' }]);
  });
  await page.goto('/contact-us/');
  const entries = await page.evaluate(() => window.dataLayer!.filter(entry => entry[0] === 'consent').map(entry => Array.from(entry)));
  expect(entries).toEqual([['consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied' }]]);
});

test('direct thank-you visits never establish a lead', async ({ page }) => {
  await page.goto('/thank-you/');
  await page.waitForLoadState('networkidle');
  expect(await events(page)).toEqual([]);
  await page.reload();
  expect(await events(page)).toEqual([]);
});
