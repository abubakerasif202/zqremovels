import { test, expect, type Route } from '@playwright/test';
import axe from 'axe-core';

const WEB3FORMS = 'https://api.web3forms.com/submit';
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test.beforeEach(async ({ page }) => {
  // Analytics and all external delivery are blocked unless a test installs a mock route.
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

async function acceptAll(page: any) {
  await page.getByRole('button', { name: 'Accept all' }).click();
}

async function fillForm(page: any) {
  const form = page.locator('form[data-quote-form="quote"]').first();
  await form.evaluate((element: HTMLFormElement) => {
    for (const field of Array.from(element.elements) as HTMLInputElement[]) {
      if (!field.name || !field.required) continue;
      if (field.tagName === 'SELECT') {
        const select = field as unknown as HTMLSelectElement;
        select.value = Array.from(select.options).find(option => option.value)?.value || '';
      } else if (field.type === 'radio' || field.type === 'checkbox') {
        field.checked = true;
      } else if (field.type === 'email') field.value = 'qa@example.com';
      else if (field.type === 'tel') field.value = '0400000000';
      else if (field.type === 'date') field.value = '2027-01-01';
      else if (field.type === 'number') field.value = '1';
      else field.value = 'QA fixture';
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
    element.requestSubmit();
  });
}

async function mockWeb3Forms(page: any, response: { status?: number; body: string }) {
  await page.route(WEB3FORMS, (route: Route) => route.fulfill({
    status: response.status ?? 200,
    contentType: 'application/json',
    body: response.body,
  }));
}

test('only provider-accepted Web3Forms responses emit the accepted conversion contract', async ({ page }) => {
  let requestCount = 0;
  let payload: Record<string, unknown> | undefined;
  await page.route(WEB3FORMS, async route => {
    requestCount++;
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, body: { message: 'Email sent successfully!' } }),
    });
  });

  await page.goto('/contact-us/?gclid=qa-gclid&utm_source=google');
  await acceptAll(page);
  await expect(page.locator('form[data-quote-form="quote"] input[name="redirect"]')).toHaveValue('https://zqremovalsadelaide.com.au/thank-you/');
  await fillForm(page);
  await page.waitForURL('**/thank-you/');
  await expect.poll(async () => (await events(page)).filter((item: any) => item.event === 'zq_quote_submitted').length).toBe(1);

  expect(requestCount).toBe(1);
  expect(payload?.access_key).toBeTruthy();
  expect(payload?.email).toBe('qa@example.com');
  expect(payload?.gclid).toBe('qa-gclid');
  expect(payload?.utm_source).toBe('google');
  expect(payload?.source_page).toContain('/contact-us/?gclid=qa-gclid&utm_source=google');
  expect(payload?.redirect).toBeUndefined();
  expect(payload?.botcheck).toBeUndefined();
  const recorded = await events(page);
  const accepted = recorded.find((item: any) => item.event === 'zq_quote_submitted');
  expect(accepted).toMatchObject({ form_name: 'quote_form', submission_status: 'accepted' });
  expect(accepted.submission_id).toMatch(UUID_V4);
  expect(recorded.filter((item: any) => item.event === 'generate_lead')).toHaveLength(1);
  expect(JSON.stringify(recorded)).not.toMatch(/qa@example|0400000000|QA fixture/);
});

test('native required-field validation prevents any Web3Forms request', async ({ page }) => {
  let requestCount = 0;
  await page.route(WEB3FORMS, async route => {
    requestCount++;
    await route.fulfill({ json: { success: true } });
  });
  await page.goto('/contact-us/');
  await page.locator('form[data-quote-form="quote"] button[type="submit"]').first().click();
  expect(requestCount).toBe(0);
  expect(await events(page)).toEqual([]);
});

for (const scenario of [
  { name: 'provider rejection', status: 200, body: { success: false, message: 'Request rejected' } },
  { name: 'HTTP failure', status: 503, body: { success: false, message: 'Unavailable' } },
  { name: 'missing success receipt', status: 200, body: { message: 'Unknown result' } },
  { name: 'truthy non-boolean success', status: 200, body: { success: 'true' } },
]) {
  test(`no conversion for ${scenario.name}`, async ({ page }) => {
    await mockWeb3Forms(page, { status: scenario.status, body: JSON.stringify(scenario.body) });
    await page.goto('/contact-us/');
    await acceptAll(page);
    await fillForm(page);
    await expect(page.locator('[data-form-feedback]').first()).toContainText(/rejected|unavailable|could not send|did not (?:accept|confirm)/i);
    expect(new URL(page.url()).pathname).toBe('/contact-us/');
    expect(await events(page)).toEqual([]);
  });
}

test('malformed Web3Forms responses and network failures do not count as conversions', async ({ page }) => {
  await page.goto('/contact-us/');
  await acceptAll(page);
  await page.route(WEB3FORMS, route => route.fulfill({ status: 200, contentType: 'application/json', body: '{bad json' }));
  await fillForm(page);
  await expect(page.locator('[data-form-feedback]').first()).toContainText('unreadable response');
  expect(await events(page)).toEqual([]);

  await page.unroute(WEB3FORMS);
  await page.route(WEB3FORMS, route => route.abort('failed'));
  await page.locator('form[data-quote-form="quote"] [name="message"]').fill('Second attempt after a failed provider request');
  await page.locator('form[data-quote-form="quote"] button[type="submit"]').first().click();
  await expect(page.locator('[data-form-feedback]').first()).toContainText('Could not send');
  expect(await events(page)).toEqual([]);
});

test('a successful provider response still redirects when optional tracking consent is denied', async ({ page }) => {
  await mockWeb3Forms(page, { body: JSON.stringify({ success: true }) });
  await page.goto('/contact-us/');
  await page.getByRole('button', { name: 'Reject optional' }).click();
  await fillForm(page);
  await page.waitForURL('**/thank-you/');
  expect(await events(page)).toEqual([]);
});

test('each independent accepted submission is sent and receives its own conversion ID', async ({ page }) => {
  let requestCount = 0;
  await page.route(WEB3FORMS, async route => {
    requestCount++;
    await new Promise(resolve => setTimeout(resolve, 300));
    await route.fulfill({ json: { success: true } });
  });
  await page.goto('/contact-us/');
  await acceptAll(page);
  const form = page.locator('form[data-quote-form="quote"]').first();
  await form.evaluate((element: HTMLFormElement) => {
    for (const field of Array.from(element.elements) as HTMLInputElement[]) {
      if (!field.name || !field.required) continue;
      if (field.tagName === 'SELECT') (field as unknown as HTMLSelectElement).value = Array.from((field as unknown as HTMLSelectElement).options).find(option => option.value)?.value || '';
      else if (field.type === 'radio' || field.type === 'checkbox') field.checked = true;
      else if (field.type === 'email') field.value = 'qa@example.com';
      else if (field.type === 'tel') field.value = '0400000000';
      else if (field.type === 'date') field.value = '2027-01-01';
      else field.value = 'QA fixture';
    }
    element.requestSubmit();
    element.requestSubmit();
  });
  await expect.poll(() => requestCount).toBe(2);
  await expect.poll(async () => (await events(page)).filter((item: any) => item.event === 'zq_quote_submitted').length).toBe(2);
  const accepted = (await events(page)).filter((item: any) => item.event === 'zq_quote_submitted');
  expect(accepted[0].submission_id).toMatch(UUID_V4);
  expect(accepted[1].submission_id).toMatch(UUID_V4);
  expect(accepted[0].submission_id).not.toBe(accepted[1].submission_id);
});

test('direct thank-you visits never establish a lead', async ({ page }) => {
  await page.goto('/thank-you/');
  expect(await events(page)).toEqual([]);
  await page.reload();
  expect(await events(page)).toEqual([]);
});

test('consent defaults remain denied and optional tag loaders wait for acceptance', async ({ page }) => {
  await page.goto('/contact-us/');
  expect(await page.locator('script[src*="googletagmanager.com/gtm.js"]').count()).toBe(0);
  expect(await events(page)).toEqual([]);
  const consent = await page.evaluate(() => Array.from(window.dataLayer![0] as any));
  expect(consent).toEqual(['consent', 'default', {
    ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  }]);
  await acceptAll(page);
  expect(await page.locator('script[src*="googletagmanager.com/gtm.js"]').count()).toBe(1);
  expect(await page.evaluate(() => (window as any).__zqConsentChoice?.advertising)).toBe(true);
});

test('consent choices are keyboard reachable and pass serious/critical axe checks', async ({ page }) => {
  await page.goto('/contact-us/');
  await expect(page.getByRole('region', { name: 'Privacy preferences' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accept all' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Reject optional' })).toBeFocused();
  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () => {
    const container = document.querySelector('[data-consent-banner]');
    const results = await (window as any).axe.run(container, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return results.violations.filter((item: any) => ['critical', 'serious'].includes(item.impact));
  });
  expect(violations).toEqual([]);
});

test('one GTM loader, consent defaults, delegated contacts and history navigation', async ({ page }) => {
  await page.goto('/contact-us/');
  expect(await page.locator('script[src*="googletagmanager.com/gtm.js"]').count()).toBe(0);
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
  expect(await events(page)).toHaveLength(0);
  await acceptAll(page);
  expect(await page.locator('script[src*="googletagmanager.com/gtm.js"]').count()).toBe(1);
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

test('consent choices persist, support partial grants and can be revoked', async ({ page }) => {
  await page.goto('/contact-us/');
  await page.getByRole('button', { name: 'Set preferences' }).click();
  await page.locator('[data-consent-analytics]').check();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  let updates = await page.evaluate(() => window.dataLayer!.filter(entry => entry[0] === 'consent').map(entry => Array.from(entry)));
  expect(updates.at(-1)).toEqual(['consent', 'update', {
    ad_storage: 'denied', analytics_storage: 'granted', ad_user_data: 'denied', ad_personalization: 'denied',
  }]);
  expect(await page.locator('script[src*="googletagmanager.com/gtm.js"]').count()).toBe(1);
  await page.reload();
  await expect(page.locator('[data-consent-banner]')).toBeHidden();
  expect(await page.evaluate(() => (window as any).__zqConsentChoice?.analytics)).toBe(true);
  await expect(page.getByRole('button', { name: 'Privacy choices' })).toBeVisible();
  await page.getByRole('button', { name: 'Privacy choices' }).click();
  await page.locator('[data-consent-analytics]').uncheck();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  updates = await page.evaluate(() => window.dataLayer!.filter(entry => entry[0] === 'consent').map(entry => Array.from(entry)));
  expect(updates.at(-1)).toEqual(['consent', 'update', {
    ad_storage: 'denied', analytics_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  }]);
  expect(await page.evaluate(() => sessionStorage.getItem('zq_attribution_v7'))).toBeNull();
});

test('reject optional keeps all tag loaders blocked and stores the choice', async ({ page }) => {
  await page.goto('/contact-us/');
  await page.getByRole('button', { name: 'Reject optional' }).click();
  expect(await page.locator('script[src*="googletagmanager.com/gtm.js"]').count()).toBe(0);
  expect(await page.locator('script[src*="connect.facebook.net"]').count()).toBe(0);
  await page.reload();
  await expect(page.locator('[data-consent-banner]')).toBeHidden();
  expect(await page.evaluate(() => (window as any).__zqConsentChoice?.advertising)).toBe(false);
});

test('consent choices are keyboard reachable and pass serious/critical axe checks', async ({ page }) => {
  await page.goto('/contact-us/');
  await expect(page.getByRole('region', { name: 'Privacy preferences' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accept all' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Accept all' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Reject optional' })).toBeFocused();
  await page.addScriptTag({ content: axe.source });
  const violations = await page.evaluate(async () => {
    const container = document.querySelector('[data-consent-banner]');
    const results = await (window as any).axe.run(container, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return results.violations.filter((item: any) => ['critical', 'serious'].includes(item.impact));
  });
  expect(violations).toEqual([]);
});

test('CMP late-choice hook captures grants and clears revoked attribution',async({page})=>{
  await page.goto('/?gclid=fixture-click&gbraid=fixture-gbraid&wbraid=fixture-wbraid&utm_campaign=fixture');
  expect(await page.evaluate(()=>sessionStorage.getItem('zq_attribution_v7'))).toBeNull();
  await page.getByRole('button', { name: 'Accept all' }).click();
  const attribution=await page.evaluate(()=>JSON.parse(sessionStorage.getItem('zq_attribution_v7')||'{}'));
  expect(attribution.gbraid).toBe('fixture-gbraid');expect(attribution.wbraid).toBe('fixture-wbraid');
  await page.getByRole('button', { name: 'Privacy choices' }).click();
  await page.locator('[data-consent-analytics]').uncheck();
  await page.locator('[data-consent-advertising]').uncheck();
  await page.getByRole('button', { name: 'Save preferences' }).click();
  expect(await page.evaluate(()=>sessionStorage.getItem('zq_attribution_v7'))).toBeNull();
  await expect(page.locator('input[name="gclid"]').first()).toHaveValue('');
  expect(await events(page)).toHaveLength(0);
});
