import { test, expect } from '@playwright/test';
import axe from 'axe-core';

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

async function acceptAll(page: any) {
  await page.getByRole('button', { name: 'Accept all' }).click();
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
    await page.route('**/api/quote/', async route => {
      requests++;
      await new Promise(resolve => setTimeout(resolve, 100));
      // Echo the accepted server receipt for the exact request.
      await route.fulfill({ json: { success: true, submission_status: 'accepted', submission_id: route.request().postDataJSON().submission_id } });
    });
    await page.goto(path);
    await acceptAll(page);
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
    await page.goto("/contact-us/");
    await page.goto("/thank-you/");
    expect(await events(page)).toEqual(recorded);
  });
}

for (const scenario of ['invalid', 'network', 'server', 'rejected', 'empty', 'malformed', 'missing-success', 'truthy-success', 'timeout', 'spam', 'invalid-id', 'missing-id']) {
  test(`no conversion for ${scenario}`, async ({ page }) => {
    let requests = 0;
    await page.route('**/api/quote/', async route => {
      requests++;
      if (scenario === 'network' || scenario === 'timeout') return route.abort(scenario === 'timeout' ? 'timedout' : 'failed');
      if (scenario === 'invalid-id' || scenario === 'missing-id') return route.fulfill({json:{success:true,submission_status:'accepted',...(scenario === 'invalid-id' ? {submission_id:'invalid'} : {})}});
      return route.fulfill({ status: scenario === 'server' ? 500 : scenario === 'spam' ? 403 : 200,
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

test('direct thank-you visits never establish a lead', async ({ page }) => {
  await page.goto('/thank-you/');
  await page.waitForLoadState('networkidle');
  expect(await events(page)).toEqual([]);
  await page.reload();
  expect(await events(page)).toEqual([]);
});

test('ambiguous response retry across reload keeps one logical receipt', async ({ page }) => {
  const ids: string[] = [];
  await page.route('**/api/quote/', async route => {
    ids.push(route.request().postDataJSON().submission_id);
    if (ids.length === 1) return route.abort('timedout');
    return route.fulfill({ json: { success: true, submission_status: 'accepted', submission_id: ids[0] } });
  });
  await page.goto('/contact-us/');
  await acceptAll(page);
  await fillForm(page);
  await page.locator('form[data-quote-form="quote"]').first().evaluate((form: HTMLFormElement) => form.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true })));
  await expect(page.locator('[data-form-feedback]').first()).toContainText('Could not send');
  expect(await events(page)).toHaveLength(0);
  await page.reload();
  await fillForm(page);
  await page.locator('form[data-quote-form="quote"]').first().evaluate((form: HTMLFormElement) => form.dispatchEvent(new Event('submit', { bubbles:true, cancelable:true })));
  await page.waitForURL('**/thank-you/');
  expect(ids).toHaveLength(2);
  expect(ids[1]).toBe(ids[0]);
  await expect.poll(async () => (await events(page)).filter((entry: any) => entry.event === 'zq_quote_submitted').length).toBe(1);
});

test('explicit server-confirmed rejection allows a corrected request with a new ID',async({page})=>{
  const ids:string[]=[];
  await page.route('**/api/quote/',async route=>{
    ids.push(route.request().postDataJSON().submission_id);
    return ids.length===1?route.fulfill({status:502,json:{success:false,status:'rejected'}}):route.fulfill({json:{success:true,submission_status:'accepted',submission_id:ids[1]}});
  });
  await page.goto('/contact-us/');await acceptAll(page);await fillForm(page);
  const submit=()=>page.locator('form[data-quote-form="quote"]').first().evaluate((f:HTMLFormElement)=>f.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
  await submit();await expect(page.locator('[data-form-feedback]').first()).toContainText('was rejected');
  expect(await events(page)).toHaveLength(0);await submit();await page.waitForURL('**/thank-you/');
  expect(ids[1]).not.toBe(ids[0]);
  await expect.poll(async()=>(await events(page)).filter((e:any)=>e.event==='zq_quote_submitted').length).toBe(1);
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
