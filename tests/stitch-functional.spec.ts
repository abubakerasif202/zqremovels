import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Only local assets and explicitly mocked endpoints may receive requests.
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:3000)/, route => route.abort());
});

test('submit artwork survives initial pageshow, rejected submission and history restoration', async ({ page }) => {
  await page.route('https://api.web3forms.com/submit', route => route.fulfill({ json: { success: false, message: 'Fixture rejected' } }));
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
  await expect(form.locator('[data-form-feedback]')).toContainText('Fixture rejected');
  expect(await button.innerHTML()).toBe(markup);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  expect(await button.innerHTML()).toBe(markup);
  await expect(button).toBeEnabled();
});

test('calculator updates and preserves attached inventory in the actual quote endpoint payload', async ({ page }) => {
  let payload: Record<string, unknown> | undefined;
  await page.route('https://api.web3forms.com/submit', async route => {
    payload = route.request().postDataJSON();
    await route.fulfill({ json: { success: false, message: 'Fixture rejected' } });
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
  await expect(form.locator('[data-form-feedback]')).toContainText('Fixture rejected');
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

for (const width of [320, 375, 390, 768, 1366, 1920]) {
  test(`truck packages preserve choices and enquiry rates at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let payload: Record<string, unknown> | undefined;
    await page.route('https://api.web3forms.com/submit', async route => {
      payload = route.request().postDataJSON();
      await route.fulfill({ json: { success: false, message: 'Fixture rejected' } });
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Reject optional' }).click();
    await expect(page.locator('#hero-estimator')).not.toContainText(/Typical total|m³|\d+T Truck/);
    const small = page.getByRole('radio', { name: /Small truck/i });
    const large = page.getByRole('radio', { name: /Large truck/i });
    for (const [size, rate] of [[0, '$65'], [1, '$75'], [2, '$89'], [3, '$65']] as const) {
      await page.locator(`.hero-size-btn[data-size="${size}"]`).click();
      await expect(page.locator('#heroEstPrice')).toContainText(rate);
    }
    await small.click();
    await expect(page.locator('#heroEstPrice')).toHaveText('$65 / 30 min ($130/hr)');
    await page.locator('.hero-size-btn[data-size="2"]').click();
    await expect(small).toBeChecked();
    await small.focus();
    await page.keyboard.press('ArrowRight');
    await expect(large).toBeChecked();
    await expect(page.locator('#heroEstPrice')).toHaveText('$75 / 30 min ($150/hr)');
    await page.locator('#heroCrew').selectOption('large3');
    await expect(page.locator('#heroEstPrice')).toHaveText('$89 / 30 min ($178/hr)');
    await page.locator('#scope-office').click();
    await expect(page.locator('#heroEstPrice')).toHaveText('$89 / 30 min ($178/hr)');
    await page.locator('#scope-interstate').click();
    await expect(page.locator('#heroEstPrice')).toHaveText('Route-specific quote required');
    await page.locator('#scope-local').click();
    await expect(page.locator('#heroEstPrice')).toHaveText('$89 / 30 min ($178/hr)');
    await page.locator('.hero-transfer-btn').click();
    const form = page.locator('#quote-form');
    await expect(form.locator('[name="crew_package"]')).toHaveValue(/Large truck.*3 movers/);
    await form.locator('[name="crew_package"]').selectOption({ label: 'Small truck — $65 / 30 min ($130/hr); crew confirmed with quote' });
    await expect(small).toBeChecked();
    await expect(form.locator('[name="published_rate"]')).toHaveValue('$65 / 30 min ($130/hr)');
    await form.locator('[name="name"]').fill('QA fixture');
    await form.locator('[name="email"]').fill('qa@example.com');
    await form.locator('[name="phone"]').fill('0400000000');
    await form.locator('button[type="submit"]').click();
    await expect(form.locator('[data-form-feedback]')).toContainText('Fixture rejected');
    expect(payload?.crew_package).toContain('Small truck');
    expect(payload?.published_rate).toBe('$65 / 30 min ($130/hr)');
    expect(payload?.crew_request).toBe('Confirmed with quote');
    for (const [key, rate] of [['large2', '$75 / 30 min ($150/hr)'], ['large3', '$89 / 30 min ($178/hr)']]) {
      const label = await form.locator(`option[data-package="${key}"]`).innerText();
      await form.locator('[name="crew_package"]').selectOption({ label });
      await form.locator('button[type="submit"]').click();
      await expect.poll(() => payload?.published_rate).toBe(rate);
      expect(payload?.crew_request).toBe(key === 'large2' ? '2 movers' : '3 movers');
    }
    await form.locator('[name="move_scope"]').selectOption('Interstate move');
    await form.locator('button[type="submit"]').click();
    await expect.poll(() => payload?.published_rate).toBe('Route-specific quote required');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const section = page.locator('#truck-selection');
    const photo = section.locator('.truck-photo').first();
    const art = await photo.boundingBox();
    expect(art!.width).toBeGreaterThan(240);
    expect(art!.height).toBeGreaterThan(200);
    await expect(section.locator('img').first()).toHaveJSProperty('naturalWidth', 1760);
    await expect(section.locator('.hero-truck-surface').first()).toHaveCSS('transition-duration', '0s');
    await section.screenshot({ path: `artifacts/truck-selection/premium-${width}.png` });
    if (width >= 768) {
      const cards = await section.locator('.hero-truck-surface').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
      expect(cards[0].y).toBe(cards[1].y);
      expect(cards[0].height).toBe(cards[1].height);
    }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await large.hover();
    await expect(section.locator('.truck-photo img').last()).toHaveCSS('transition-duration', '0.65s');
  });
}

test('truck cards reveal with a stagger and remain visible without scripting', async ({ page, browser, baseURL }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const cards = page.locator('#truck-selection .hero-truck-card');
  await cards.evaluateAll(nodes => nodes.forEach(node => node.addEventListener('animationstart', () => {
    node.setAttribute('data-observed-delay', getComputedStyle(node).animationDelay);
  })));
  await cards.first().scrollIntoViewIfNeeded();
  await expect(cards.first()).toHaveAttribute('data-observed-delay', '0s');
  await expect(cards.last()).toHaveAttribute('data-observed-delay', '0.14s');
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 900 } });
  const fallback = await context.newPage();
  await fallback.goto(baseURL + '/');
  await expect(fallback.locator('#truck-selection .hero-truck-card')).toHaveCount(2);
  await fallback.locator('#truck-selection').scrollIntoViewIfNeeded();
  await expect(fallback.getByRole('radio', { name: 'Small Truck', exact: true })).toBeVisible();
  expect(await fallback.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.close();
});
