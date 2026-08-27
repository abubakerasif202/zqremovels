import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Developer attribution shown once per page, at the very bottom of the global footer.
 * Keep this the single source of truth for the credit.
 */
export const agencyCredit = {
  enabled: true,
  name: 'AB Digital Solutions',
  url: 'https://www.abwebstudio.com.au/',
  label: 'Designed & Developed by',
  // Official brand artwork. Drop the supplied logo here (transparent WebP or PNG)
  // and it is used automatically; until then a restrained wordmark is rendered.
  logo: '/branding/ab-digital-solutions-watermark.webp',
  logoWidth: 168,
  logoHeight: 40,
};

const BRANDING_DIR = path.join(process.cwd(), 'branding');

/** True when the official logo asset is present in the repository. */
export function hasAgencyLogo() {
  return existsSync(path.join(BRANDING_DIR, path.basename(agencyCredit.logo)));
}

/**
 * Markup for the footer developer credit. Returns an empty string when disabled
 * so callers can render it unconditionally.
 */
export function renderAgencyCreditHtml() {
  if (!agencyCredit.enabled) return '';

  const mark = hasAgencyLogo()
    ? `<img class="agency-credit-logo" src="${agencyCredit.logo}" alt="${agencyCredit.name}" width="${agencyCredit.logoWidth}" height="${agencyCredit.logoHeight}" loading="lazy" decoding="async" />`
    : `<span class="agency-credit-wordmark">${agencyCredit.name}</span>`;

  return `<div class="agency-credit">
      <span class="agency-credit-label">${agencyCredit.label}</span>
      <a class="agency-credit-link" href="${agencyCredit.url}" target="_blank" rel="noopener noreferrer">
        ${mark}
        <span class="agency-credit-arrow" aria-hidden="true">&#8599;</span>
      </a>
    </div>`;
}
