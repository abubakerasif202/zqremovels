import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Only local assets and explicitly mocked endpoints may receive requests.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:3000)/, route => route.abort());
});

test('submit artwork survives initial pageshow, rejected submission and history restoration', async ({ page }) => {
  await page.route('**/api/quote/', route => route.fulfill({ json: { success: false } }));
  await page.goto('/');
  await expect(page.locator('form[data-quote-form="quote"]')).toHaveCount(1);
  const form = page.locator('#quote-form');
  const button = form.locator('button[type="submit"]');
  await expect(button.locator('svg use')).toHaveAttribute('href', '#zq-i-arrow');
  const markup = await button.innerHTML();
  await form.evaluate((element: HTMLFormElement) => {
    for (const field of Array.from(element.elements)) {
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) || !field.required) continue;
      if (field instanceof HTMLSelectElement) field.value = Array.from(field.options).find(option => option.value)?.value || '';
      else if (field instanceof HTMLInputElement && ['radio', 'checkbox'].includes(field.type)) field.checked = true;
      else field.value = field.type === 'email' ? 'qa@example.com' : field.type === 'tel' ? '0400000000' : field.type === 'date' ? '2099-01-01' : 'QA fixture';
      field.dispatchEvent(new Event('input', { bubbles: true }));
      field.dispatchEvent(new Event('change', { bubbles: true }));
    }
    element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await expect(form.locator('[data-form-feedback]')).toContainText('Could not send');
  expect(await button.innerHTML()).toBe(markup);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  expect(await button.innerHTML()).toBe(markup);
  await expect(button).toBeEnabled();
});

test('calculator updates and preserves attached inventory in the actual quote endpoint payload', async ({ page }) => {
  let payload: Record<string, unknown> | undefined;
  await page.route('**/api/quote/', async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { success: false } });
  });
  await page.goto('/');
  await page.locator('.calc-preset-pill').filter({ hasText: /reset all/i }).click();
  await expect(page.locator('#calcTotalM3')).toHaveText('0.0');
  await page.locator('.calculator-builder summary').click();
  const increase = page.locator('.calc-step-btn[aria-label^="Increase"]').first();
  await increase.click();
  const volume = Number(await page.locator('#calcTotalM3').textContent());
  expect(volume).toBeGreaterThan(0);
  await increase.click();
  await expect(page.locator('#calcTotalM3')).toHaveText((volume * 2).toFixed(1));
  const beforePacking = await page.locator('#calcTotalCostRange').textContent();
  await page.locator('#calcPacking').selectOption('full');
  await expect(page.locator('#calcTotalCostRange')).not.toHaveText(beforePacking!);
  await page.locator('.calc-attach-btn').click();
  const form = page.locator('#quote-form');
  const inventory = await form.locator('[name="attached_inventory"]').inputValue();
  await expect(form.locator('[name="message"]')).toHaveValue(/Selected items:/);
  await expect(page.locator('#attachedInventoryBanner')).toBeVisible();
  await form.evaluate((element: HTMLFormElement) => {
    for (const field of Array.from(element.elements)) {
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement) || !field.required) continue;
      if (field instanceof HTMLSelectElement) field.value = Array.from(field.options).find(option => option.value)?.value || '';
      else if (field.type === 'radio' || field.type === 'checkbox') field.checked = true;
      else field.value = field.type === 'email' ? 'qa@example.com' : field.type === 'tel' ? '0400000000' : field.type === 'date' ? '2099-01-01' : 'QA fixture';
    }
    element.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await expect(form.locator('[data-form-feedback]')).toContainText('Could not send');
  expect(payload?.attached_inventory).toBe(inventory);
  expect(payload?.message).toContain('Selected items:');
  await expect(form.locator('[name="attached_inventory"]')).toHaveValue(inventory);
});

test('service-area filters and route selection produce usable quote inputs', async ({ page }) => {
  await page.goto('/');
  await page.locator('.suburb-tab[data-region="east"]').click();
  await expect(page.locator('.suburb-tab[data-region="east"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.suburb-tab[data-region="all"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#suburbsGrid .zq-suburb-card')).toHaveCount(2);
  const norwood = page.locator('#suburbsGrid .zq-suburb-card').filter({ hasText: 'Norwood' });
  await expect(norwood.locator('a')).toHaveAttribute('href', '/removalists-norwood/');
  await norwood.getByRole('button', { name: 'Select for Quote' }).click();
  await expect(page.locator('#quote-form [name="pickup_suburb"]')).toHaveValue('Norwood');
  await page.locator('#route-tab-syd').click();
  await expect(page.locator('#route-tab-syd')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#route-tab-mel')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#routeDetailPanel')).toContainText('Sydney');
});

test('quick estimator changes rates and transfers the chosen move into the quote', async ({ page }) => {
  await page.goto('/');
  await page.locator('.hero-size-btn[data-size="2"]').click();
  await expect(page.locator('#heroEstPrice')).toContainText('$89 / 30 min');
  await page.locator('#scope-interstate').click();
  await expect(page.locator('#scope-interstate')).toHaveAttribute('aria-selected', 'true');
  await page.locator('#heroPickup').fill('Norwood');
  await page.locator('#heroDropoff').fill('Melbourne');
  await page.locator('.hero-transfer-btn').click();
  await expect(page.locator('#quote-form [name="pickup_suburb"]')).toHaveValue('Norwood');
  await expect(page.locator('#quote-form [name="dropoff_suburb"]')).toHaveValue('Melbourne');
  await expect(page.locator('#quote-form [name="move_scope"]')).toHaveValue('Interstate move');
  await expect(page.locator('#quote-form [name="move_size"]')).toHaveValue('Four or more bedrooms');
});
