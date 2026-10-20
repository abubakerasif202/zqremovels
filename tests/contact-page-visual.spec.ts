import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!127\.0\.0\.1:3000)/, route => route.abort());
});

test('contact page matches the homepage design system and remains readable', async ({ page }, testInfo) => {
  await page.goto('/contact-us/');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.contact-hero-shell a.zq-v2-button-primary')).toContainText('Get My Moving Quote');
  await expect(page.locator('.contact-hero-shell .zq-v2-button-outline')).toContainText('Call 0433 819 989');
  await expect(page.locator('.quote-form-premium label span')).toHaveCount(15);

  const twoPersonPackage = page.locator('input[name="crew_package"][value="2 Men + Truck — $75 / 30 min"]');
  const threePersonPackage = page.locator('input[name="crew_package"][value="3 Men + Truck — $89 / 30 min"]');
  await expect(twoPersonPackage.locator('xpath=ancestor::label')).toContainText('2 Men + Truck$75 / 30 min');
  await expect(threePersonPackage.locator('xpath=ancestor::label')).toContainText('3 Men + Truck$89 / 30 min');
  await expect(twoPersonPackage).not.toBeChecked();
  await expect(threePersonPackage).not.toBeChecked();
  await threePersonPackage.check();
  await expect(threePersonPackage).toBeChecked();

  const visualContract = await page.evaluate(() => {
    const style = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing ${selector}`);
      const computed = getComputedStyle(element);
      let surface: HTMLElement | null = element;
      let background = computed.backgroundColor;
      while (surface && (background === 'rgba(0, 0, 0, 0)' || background === 'transparent')) {
        surface = surface.parentElement;
        if (surface) background = getComputedStyle(surface).backgroundColor;
      }
      return {
        background,
        color: computed.color,
        borderColor: computed.borderColor,
        fontSize: Number.parseFloat(computed.fontSize),
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
      field: style('.quote-form-premium input[name="name"]'),
    };
  });

  expect(visualContract.documentWidth).toBeLessThanOrEqual(visualContract.viewportWidth);
  const luminance = (color: string) => {
    const components = color.match(/[\d.]+/g)?.map(Number);
    if (!components || components.length < 3) throw new Error(`Unsupported computed color: ${color}`);
    if (components.length > 3 && components[3] !== 1) throw new Error(`Contrast requires an opaque surface: ${color}`);
    const [red, green, blue] = components.slice(0, 3).map((value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return red * 0.2126 + green * 0.7152 + blue * 0.0722;
  };
  for (const [name, style] of Object.entries({ primaryCta: visualContract.primaryCta, label: visualContract.label, field: visualContract.field })) {
    const foreground = luminance(style.color);
    const background = luminance(style.background);
    expect((Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05), `${name} text contrast`).toBeGreaterThanOrEqual(4.5);
  }
  expect(visualContract.heroHeading.fontSize).toBeGreaterThanOrEqual(32);
  expect(visualContract.field.fontSize).toBeGreaterThanOrEqual(16);
  await expect(page.locator('.contact-hero-shell h1')).toBeVisible();
  await expect(page.locator('.contact-hero-shell .zq-v2-button-outline')).toBeVisible();

  const moveScope = page.locator('form[data-quote-form="quote"] select[name="move_scope"]');
  await moveScope.focus();
  await expect(moveScope).toBeFocused();
  await page.screenshot({
    path: `test-results/screenshots/${testInfo.project.name}-contact-us.png`,
    fullPage: true,
  });
});
