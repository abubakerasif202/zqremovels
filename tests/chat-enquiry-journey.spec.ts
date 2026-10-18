import { test, expect, type Page } from '@playwright/test';

// Every network call is mocked: no real enquiry, analytics hit or agent request leaves the test browser.
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DRAFT = {
  full_name: 'Sam Citizen', phone: '0412 345 678', email: '',
  pickup_suburb: 'Glenelg', dropoff_suburb: 'Unley', move_date: '2099-03-20',
  crew_package: '2 men + truck', move_scope: 'Local move', property_type: 'House',
  move_size: '3 bedrooms', pickup_access: 'Two flights of stairs, street parking',
  dropoff_access: '', packing_required: '', move_details: '',
};

interface Mocks { chatPosts: any[]; draftCalls: number; submissions: any[] }

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:3000)/, route => route.abort());
  await page.addInitScript(() => {
    const layer: any[] = [];
    const originalPush = layer.push.bind(layer);
    layer.push = (...items: any[]) => {
      for (const item of items) {
        if (['zq_quote_submitted', 'generate_lead'].includes(item.event)) {
          const events = JSON.parse(sessionStorage.getItem('qa_events') || '[]');
          events.push(item);
          sessionStorage.setItem('qa_events', JSON.stringify(events));
        }
      }
      return originalPush(...items);
    };
    (window as any).dataLayer = layer;
  });
});

async function recordedEvents(page: Page) {
  return page.evaluate(() => JSON.parse(sessionStorage.getItem('qa_events') || '[]'));
}

async function mockBackend(page: Page, submit: (body: any, count: number) => { status: number; json: any }): Promise<Mocks> {
  const mocks: Mocks = { chatPosts: [], draftCalls: 0, submissions: [] };
  await page.route('**/api/ai-chat/', async route => {
    const request = route.request();
    if (request.method() === 'GET') return route.fulfill({ json: { turns: [] } });
    const body = request.postDataJSON();
    if (body.action === 'draft') {
      mocks.draftCalls += 1;
      return route.fulfill({ json: { lead: DRAFT } });
    }
    mocks.chatPosts.push(body);
    const ready = mocks.chatPosts.length >= 2;
    return route.fulfill({ json: {
      reply: ready ? "Thanks Sam. Press 'Review & send my enquiry' to check and edit your details." : 'Happy to help. What is your name and phone number?',
      enquiry_ready: ready,
    } });
  });
  await page.route('**/api/ai-chat-submit/', async route => {
    const body = route.request().postDataJSON();
    mocks.submissions.push(body);
    const { status, json } = submit(body, mocks.submissions.length);
    await route.fulfill({ status, json });
  });
  return mocks;
}

const accepted = (body: any) => ({
  status: 200,
  json: { status: 'accepted', success: true, submission_id: body.submission_id, message: 'Your enquiry was accepted by our delivery service. ZQ Removals will review it. This is not a confirmed booking.' },
});

async function chatToReview(page: Page) {
  await page.goto('/');
  await page.locator('#zq-chat-launcher').click();
  const input = page.getByRole('textbox', { name: 'Your message', exact: true });
  await input.fill('Hi, I need a quote for moving Glenelg to Unley');
  await page.locator('.zq-chat-send').click();
  await expect(page.locator('.zq-chat-bubble[data-role="assistant"]').last()).toContainText('What is your name');
  await expect(page.getByRole('button', { name: 'Review & send my enquiry' })).toHaveCount(0);
  await input.fill("I'm Sam, 0412 345 678. House, 3 bedrooms, two flights of stairs.");
  await page.locator('.zq-chat-send').click();
  const prompt = page.getByRole('button', { name: 'Review & send my enquiry' });
  await expect(prompt).toBeVisible();
  await prompt.click();
  const panel = page.locator('#zq-chat-window');
  await expect(panel.locator('[data-chat-enquiry-feedback]')).toContainText('pre-filled');
  return panel;
}

async function expectInsideViewport(page: Page, locator: ReturnType<Page['locator']>) {
  await locator.scrollIntoViewIfNeeded();
  const box = await locator.boundingBox();
  const size = page.viewportSize()!;
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(size.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(size.height + 1);
}

async function completeDetails(panel: ReturnType<Page['locator']>) {
  // The pre-fill leaves three fields blank on purpose: the customer completes them by hand.
  await expect(panel.getByLabel('Full name', { exact: true })).toHaveValue('Sam Citizen');
  await expect(panel.getByLabel('Pickup suburb', { exact: true })).toHaveValue('Glenelg');
  await expect(panel.getByLabel('Move size')).toHaveValue('3 bedrooms');
  await expect(panel.getByLabel('Email address (optional)')).toHaveValue('');
  await panel.getByLabel('Delivery access, stairs, lifts or parking').fill('Lift available, loading zone out the front');
  await panel.getByLabel('Packing assistance').selectOption('No');
  await panel.getByLabel('Furniture, special items and moving details').fill('Queen bed, fridge, 20 boxes');
}

const journeyViewports = [320, 375, 390, 430];

for (const width of journeyViewports) {
  test(`customer completes and sends an enquiry inside the chat at ${width}px`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome (390px)', 'Explicit viewports run once.');
    await page.setViewportSize({ width, height: 640 });
    const mocks = await mockBackend(page, accepted);
    const panel = await chatToReview(page);
    const startUrl = page.url();
    await completeDetails(panel);
    await panel.getByRole('button', { name: 'Review my details' }).click();
    const summary = panel.locator('[data-chat-review-summary]');
    await expect(summary).toContainText('Sam Citizen');
    await expect(summary).toContainText('Queen bed, fridge, 20 boxes');
    await expect(summary).toContainText('Email address (optional): Not specified');

    // Editing is possible, and the edit survives into the review.
    await panel.getByRole('button', { name: 'Edit details' }).click();
    await panel.getByLabel('Pickup suburb', { exact: true }).fill('Glenelg North');
    await panel.getByRole('button', { name: 'Review my details' }).click();
    await expect(summary).toContainText('Glenelg North');

    // Nothing is sent without explicit consent.
    const confirm = panel.getByRole('button', { name: 'Confirm & send enquiry' });
    await expectInsideViewport(page, confirm);
    await confirm.click();
    await expect(panel.locator('[data-chat-enquiry-feedback]')).toContainText('consent');
    expect(mocks.submissions).toHaveLength(0);
    expect(await recordedEvents(page)).toEqual([]);

    await panel.getByRole('checkbox').check();
    await confirm.dblclick();
    await expect(panel.locator('.zq-chat-bubble[data-role="assistant"]').last()).toContainText('Reference:');
    expect(mocks.submissions).toHaveLength(1);
    const sent = mocks.submissions[0];
    expect(sent.consent).toBe(true);
    expect(sent.submission_id).toMatch(UUID_V4);
    expect(sent.lead.full_name).toBe('Sam Citizen');
    expect(sent.lead.pickup_suburb).toBe('Glenelg North');
    expect(sent.lead.packing_required).toBe('No');
    expect(Object.hasOwn(sent.lead, 'email')).toBe(false);
    expect(sent).not.toHaveProperty('dry_run');

    // Success is shown only after acceptance, in the chat, without leaving the page.
    expect(page.url()).toBe(startUrl);
    await expect(panel.locator('.zq-chat-bubble[data-role="assistant"]').last()).toContainText('not a confirmed booking');
    await expect(panel.locator('.zq-chat-bubble[data-role="assistant"]').last()).toContainText(sent.submission_id);
    await expect.poll(async () => (await recordedEvents(page)).length).toBe(2);
    const events = await recordedEvents(page);
    expect(events[0]).toMatchObject({ event: 'zq_quote_submitted', form_name: 'quote_form', submission_status: 'accepted', submission_id: sent.submission_id, source_form: 'ai_chat_enquiry' });
    expect(events[1]).toMatchObject({ event: 'generate_lead', submission_status: 'accepted', submission_id: sent.submission_id });
    expect(JSON.stringify(events)).not.toMatch(/Sam Citizen|0412|Glenelg/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(mocks.draftCalls).toBe(1);
  });
}

test('customer completes and sends an enquiry inside the chat on desktop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Desktop Chrome (1366px)', 'Desktop journey runs once.');
  const mocks = await mockBackend(page, accepted);
  const panel = await chatToReview(page);
  await completeDetails(panel);
  await panel.getByRole('button', { name: 'Review my details' }).click();
  await panel.getByRole('checkbox').check();
  await panel.getByRole('button', { name: 'Confirm & send enquiry' }).click();
  await expect(panel.locator('.zq-chat-bubble[data-role="assistant"]').last()).toContainText('Reference:');
  expect(mocks.submissions).toHaveLength(1);
  await expect.poll(async () => (await recordedEvents(page)).length).toBe(2);
});

test('the footer Send enquiry button also pre-fills from the conversation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Mobile Chrome (375px)', 'Run once.');
  await mockBackend(page, accepted);
  await page.goto('/');
  await page.locator('#zq-chat-launcher').click();
  await page.getByRole('textbox', { name: 'Your message', exact: true }).fill('Moving Glenelg to Unley');
  await page.locator('.zq-chat-send').click();
  await expect(page.locator('.zq-chat-bubble[data-role="assistant"]').last()).toContainText('What is your name');
  const panel = page.locator('#zq-chat-window');
  await panel.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  await expect(panel.getByLabel('Full name', { exact: true })).toHaveValue('Sam Citizen');
});

test('typed values are never overwritten by the pre-fill', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Mobile Chrome (375px)', 'Run once.');
  await mockBackend(page, accepted);
  await page.goto('/');
  await page.locator('#zq-chat-launcher').click();
  await page.getByRole('textbox', { name: 'Your message', exact: true }).fill('Moving Glenelg to Unley');
  await page.locator('.zq-chat-send').click();
  await expect(page.locator('.zq-chat-bubble[data-role="assistant"]').last()).toContainText('What is your name');
  const panel = page.locator('#zq-chat-window');
  await panel.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  await panel.getByLabel('Full name', { exact: true }).fill('Alex Typed');
  await expect(panel.getByLabel('Pickup suburb', { exact: true })).toHaveValue('Glenelg');
  await expect(panel.getByLabel('Full name', { exact: true })).toHaveValue('Alex Typed');
});

async function reachConfirm(page: Page) {
  const panel = await chatToReview(page);
  await completeDetails(panel);
  await panel.getByRole('button', { name: 'Review my details' }).click();
  await panel.getByRole('checkbox').check();
  return panel;
}

test('a rejected submission shows an error, allows editing and records no conversion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Mobile Chrome (375px)', 'Run once.');
  const mocks = await mockBackend(page, (body, count) => count === 1
    ? { status: 400, json: { status: 'invalid_request', message: 'Please review all required moving details, your email and phone, then approve sending.' } }
    : accepted(body));
  const panel = await reachConfirm(page);
  await panel.getByRole('button', { name: 'Confirm & send enquiry' }).click();
  await expect(panel.locator('[data-chat-enquiry-feedback]')).toContainText('Please review all required moving details');
  expect(await recordedEvents(page)).toEqual([]);
  await expect(panel.getByRole('button', { name: 'Edit details' })).toBeEnabled();
  await expect(panel.getByRole('button', { name: 'Confirm & send enquiry' })).toBeEnabled();
  await panel.getByRole('button', { name: 'Confirm & send enquiry' }).click();
  await expect(panel.locator('.zq-chat-bubble[data-role="assistant"]').last()).toContainText('Reference:');
  expect(mocks.submissions).toHaveLength(2);
  expect(mocks.submissions[1].submission_id).toBe(mocks.submissions[0].submission_id);
});

for (const scenario of [
  { name: 'unconfirmed delivery', status: 502, json: { status: 'unknown', message: 'Delivery could not be confirmed. Please call 0433 819 989 before trying again.' } },
  { name: 'pending delivery', status: 202, json: { status: 'pending', message: 'Your enquiry is pending. Please don\'t send it again.' } },
]) {
  test(`${scenario.name} claims no success, blocks a second send and records no conversion`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'Mobile Chrome (375px)', 'Run once.');
    const mocks = await mockBackend(page, () => ({ status: scenario.status, json: scenario.json }));
    const panel = await reachConfirm(page);
    await panel.getByRole('button', { name: 'Confirm & send enquiry' }).click();
    await expect(panel.locator('[data-chat-enquiry-feedback]')).toContainText('Do not submit again');
    await expect(panel.locator('.zq-chat-bubble[data-role="assistant"]').filter({ hasText: 'Reference:' })).toHaveCount(0);
    await panel.getByRole('button', { name: 'Confirm & send enquiry' }).click({ force: true });
    expect(mocks.submissions).toHaveLength(1);
    expect(await recordedEvents(page)).toEqual([]);
  });
}

test('a network failure never retries automatically or records a conversion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Mobile Chrome (375px)', 'Run once.');
  await mockBackend(page, accepted);
  await page.unroute('**/api/ai-chat-submit/');
  let attempts = 0;
  await page.route('**/api/ai-chat-submit/', route => { attempts += 1; return route.abort('failed'); });
  const panel = await reachConfirm(page);
  await panel.getByRole('button', { name: 'Confirm & send enquiry' }).click();
  await expect(panel.locator('[data-chat-enquiry-feedback]')).toContainText('could not be confirmed');
  await panel.getByRole('button', { name: 'Confirm & send enquiry' }).click({ force: true });
  expect(attempts).toBe(1);
  expect(await recordedEvents(page)).toEqual([]);
});

test('an already-accepted replay is acknowledged without a second conversion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Mobile Chrome (375px)', 'Run once.');
  await mockBackend(page, body => ({ status: 200, json: { status: 'accepted', success: true, replayed: true, submission_id: body.submission_id, message: 'Your enquiry was already accepted by the delivery service. This is not a confirmed booking.' } }));
  const panel = await reachConfirm(page);
  await panel.getByRole('button', { name: 'Confirm & send enquiry' }).click();
  await expect(panel.locator('.zq-chat-bubble[data-role="assistant"]').last()).toContainText('already accepted');
  await page.waitForTimeout(300);
  expect(await recordedEvents(page)).toEqual([]);
});

test('a failed pre-fill falls back to a blank form the customer can still complete', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'Mobile Chrome (375px)', 'Run once.');
  await mockBackend(page, accepted);
  await page.route('**/api/ai-chat/', async route => {
    const request = route.request();
    if (request.method() === 'POST' && request.postDataJSON().action === 'draft') return route.fulfill({ status: 502, json: { error: 'unavailable' } });
    return route.fallback();
  });
  await page.goto('/');
  await page.locator('#zq-chat-launcher').click();
  await page.getByRole('textbox', { name: 'Your message', exact: true }).fill('Moving Glenelg to Unley');
  await page.locator('.zq-chat-send').click();
  await expect(page.locator('.zq-chat-bubble[data-role="assistant"]').last()).toContainText('What is your name');
  const panel = page.locator('#zq-chat-window');
  await panel.getByRole('button', { name: 'Send enquiry', exact: true }).click();
  await expect(panel.locator('[data-chat-enquiry-feedback]')).toContainText("couldn't pre-fill");
  await expect(panel.getByLabel('Full name', { exact: true })).toBeEditable();
});
