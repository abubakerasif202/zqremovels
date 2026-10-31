// The one public quote form. Every page that shows a quote form renders it from here, and all of them
// submit through site.js -> /api/quote/ (form_type "simple_quote"). Page context travels as hidden metadata.

const PHONE_DISPLAY = '0433 819 989';
const PHONE_TEL = '+61433819989';

const escape = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export function classifyPage(output = '') {
  if (output === 'index.html') return 'home';
  if (output === 'contact-us/index.html') return 'contact';
  if (output.startsWith('adelaide-to-') || output.startsWith('interstate-') || output.includes('interstate')) return 'interstate';
  if (output.startsWith('guides/') || output.startsWith('adelaide-moving-guides/') || output.includes('checklist')) return 'guide';
  if (
    /^(house|furniture|office|packing|storage|piano|apartment)-/.test(output) ||
    output.startsWith('services/') ||
    output.startsWith('adelaide-movers-and-packers/')
  ) return 'service';
  return 'suburb';
}

function field({ name, label, type = 'text', required = false, autocomplete, placeholder, inputmode, id, maxlength }) {
  const errorId = `${id}-error-${name}`;
  return `<label class="sqf-field ${required ? 'sqf-req' : 'sqf-opt'}" for="${id}-${name}">
      <span class="sqf-label">${escape(label)}</span>
      <input id="${id}-${name}" name="${name}" type="${type}"${autocomplete ? ` autocomplete="${autocomplete}"` : ''}${inputmode ? ` inputmode="${inputmode}"` : ''}${placeholder ? ` placeholder="${escape(placeholder)}"` : ''}${maxlength ? ` maxlength="${maxlength}"` : ''}${required ? ' required aria-required="true"' : ''} aria-describedby="${errorId}" />
      <small class="field-error" data-error-for="${name}" id="${errorId}"></small>
    </label>`;
}

/**
 * @param {object} options
 * @param {string} [options.id]          form element id; the first form on a page keeps "quote-form" for anchors
 * @param {string} [options.formLocation] where the form sits (hero, bottom, contact, page) - sent as metadata
 * @param {object} [options.page]        page registry entry (output, title)
 * @param {string} [options.heading]
 * @param {string} [options.intro]
 * @param {boolean} [options.compact]    tighter layout for hero placement
 * @param {boolean} [options.headingTag] heading element, h2 by default
 */
export function renderSimpleQuoteForm({
  id = 'quote-form',
  formLocation = 'page',
  page = {},
  heading = 'Get your free moving quote',
  intro = 'Tell us where you are moving from and to. We will call you back with a quote.',
  compact = false,
  headingTag = 'h2',
} = {}) {
  const output = page.output || '';
  const pageType = classifyPage(output);
  const pageTitle = String(page.title || '').split('|')[0].trim();
  const headingId = `${id}-heading`;
  const hidden = [
    ['form_type', 'simple_quote'],
    ['page_type', pageType],
    ['page_title', pageTitle],
    ['service_context', pageType === 'service' || pageType === 'interstate' ? pageTitle : ''],
    ['location_context', pageType === 'suburb' ? pageTitle : ''],
    ['form_location', formLocation],
  ]
    .map(([name, value]) => `<input type="hidden" name="${name}" value="${escape(value)}" />`)
    .join('');
  const attribution = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'landing_page', 'captured_at']
    .map((name) => `<input type="hidden" name="${name}" value="" data-attribution-field="${name}" />`)
    .join('');

  return `<form id="${id}" class="sqf${compact ? ' sqf-compact' : ''}" action="/api/quote/" method="post" data-quote-form="quote" data-form-name="quote_form" data-sqf novalidate aria-labelledby="${headingId}">
    <div class="sqf-head">
      <${headingTag} class="sqf-title" id="${headingId}">${escape(heading)}</${headingTag}>
      <p class="sqf-intro">${escape(intro)}</p>
    </div>
    <p hidden><label>Leave this field empty <input autocomplete="off" name="botcheck" tabindex="-1" type="text" /></label></p>
    ${hidden}${attribution}
    <div class="sqf-grid">
      ${field({ id, name: 'full_name', label: 'Full name', required: true, autocomplete: 'name', maxlength: 100 })}
      ${field({ id, name: 'phone', label: 'Phone number', type: 'tel', required: true, autocomplete: 'tel', inputmode: 'tel', maxlength: 30 })}
      ${field({ id, name: 'pickup_suburb', label: 'Moving from', required: true, autocomplete: 'address-level2', placeholder: 'Suburb or address', maxlength: 120 })}
      ${field({ id, name: 'dropoff_suburb', label: 'Moving to', required: true, placeholder: 'Suburb or address', maxlength: 120 })}
      ${field({ id, name: 'move_date', label: 'Moving date', type: 'date' })}
      <label class="sqf-field sqf-opt sqf-field-wide" for="${id}-additional_details">
        <span class="sqf-label">Additional details</span>
        <textarea id="${id}-additional_details" name="additional_details" rows="${compact ? 2 : 3}" maxlength="2000" placeholder="Stairs, heavy items, packing, anything else we should know"></textarea>
      </label>
    </div>
    <button class="sqf-submit" type="submit">Get My Free Quote</button>
    <p class="sqf-note">Free, no obligation. Prefer to talk? Call <a href="tel:${PHONE_TEL}">${PHONE_DISPLAY}</a>.</p>
    <p class="form-feedback sqf-feedback" data-form-feedback role="status" aria-live="polite"></p>
  </form>`;
}

export function renderSimpleQuoteSection(options = {}) {
  const { sectionClass = 'section sqf-section', sectionId = '', eyebrow = 'Free quote', ...formOptions } = options;
  return `<section class="${sectionClass}"${sectionId ? ` id="${sectionId}"` : ''} data-simple-quote-section>
  <div class="container">
    <div class="sqf-shell">
      <span class="eyebrow">${escape(eyebrow)}</span>
      ${renderSimpleQuoteForm(formOptions)}
    </div>
  </div>
</section>`;
}
