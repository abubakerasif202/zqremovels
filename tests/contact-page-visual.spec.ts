import { test, expect } from '@playwright/test';

test('contact page matches the homepage design system and remains readable', async ({ page }, testInfo) => {
  await page.goto('/contact-us/');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.contact-hero-shell a.zq-v2-button-primary')).toContainText('Get Fixed-Price Quote');
  await expect(page.locator('.contact-hero-shell .zq-v2-button-outline')).toContainText('Call 0433 819 989');
  await expect(page.locator('.quote-form-premium label span')).toHaveCount(13);

  const visualContract = await page.evaluate(() => {
    const style = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      const computed = getComputedStyle(element);
      return {
        background: computed.backgroundColor,
        color: computed.color,
        borderColor: computed.borderColor,
      };
    };

    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
      header: style('.site-header'),
      heroHeading: style('.contact-hero-shell h1'),
      primaryCta: style('.contact-hero-shell a.zq-v2-button-primary'),
      secondaryCta: style('.contact-hero-shell .zq-v2-button-outline'),
      label: style('.quote-form-premium label span'),
      field: style('.quote-form-premium input'),
    };
  });

  expect(visualContract.documentWidth).toBeLessThanOrEqual(visualContract.viewportWidth);
  expect(visualContract.header.background).toBe('rgba(0, 0, 0, 0)');
  expect(visualContract.heroHeading.color).toBe('rgb(246, 248, 242)');
  expect(visualContract.primaryCta.background).toBe('rgb(184, 242, 41)');
  expect(visualContract.primaryCta.color).toBe('rgb(7, 20, 33)');
  expect(visualContract.secondaryCta.color).toBe('rgb(246, 248, 242)');
  expect(visualContract.label.color).toBe('rgb(7, 20, 33)');
  expect(visualContract.field.background).toBe('rgb(255, 255, 255)');
  expect(visualContract.field.color).toBe('rgb(7, 20, 33)');

  await page.locator('select[name="move_scope"]').focus();
  await expect(page.locator('select[name="move_scope"]')).toBeFocused();
  await page.screenshot({
    path: `test-results/screenshots/${testInfo.project.name}-contact-us.png`,
    fullPage: true,
  });
});
