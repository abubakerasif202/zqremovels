import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [css, contact] = await Promise.all([
  readFile(path.join(root, 'premium-site.css'), 'utf8'),
  readFile(path.join(root, 'site-src', 'content', 'contact-us', 'index.html'), 'utf8'),
]);

assert.match(contact, /class="zq-v2-contact"/);
assert.match(contact, /zq-v2-button-primary/);
assert.match(contact, /zq-v2-button-outline/);
assert.match(contact, /name="move_scope"/);
assert.match(contact, /name="pickup_suburb"/);
assert.match(contact, /name="dropoff_suburb"/);
assert.match(contact, /name="message"/);

assert.match(css, /body\.page-contact\s*\{[\s\S]*--zq-v2-ink: #071421;[\s\S]*--zq-v2-accent: #b8f229;/);
assert.match(css, /body\.page-contact \.contact-hero-shell\s*\{[\s\S]*url\("\/media\/home-local-hero-branded\.webp"\)/);
assert.match(css, /body\.page-contact \.zq-v2-button-primary\s*\{[\s\S]*background: var\(--zq-v2-accent\) !important;/);
assert.match(css, /body\.page-contact \.zq-v2-button-outline\s*\{[\s\S]*color: #f6f8f2 !important;/);
assert.match(css, /body\.page-contact \.quote-form-premium :is\(h2, h3, legend, label span\)\s*\{ color: var\(--zq-v2-ink\) !important;/);
assert.match(css, /body\.page-contact \.quote-form-premium :is\(input, select, textarea\):is\(:focus, :focus-visible\)\s*\{[\s\S]*border-color: var\(--zq-v2-accent\) !important;/);
