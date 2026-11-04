import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const client = readFileSync('site.js', 'utf8');
const generator = readFileSync('scripts/build-site.mjs', 'utf8');
const quoteSourceFiles = [
  'site-src/content/index.html',
  'site-src/content/contact-us/index.html',
  'site-src/content/removalists-adelaide-quote/index.html',
  'site-src/content/removalists-southern-adelaide/index.html',
  'site-src/content/adelaide-removalists-facebook-offer/index.html',
];

test('quote forms post JSON directly to Web3Forms with attribution and no redirect field in AJAX', () => {
  assert.match(client, /new FormData\(form\)/);
  assert.match(client, /Object\.fromEntries\(formData\.entries\(\)\)/);
  assert.match(client, /delete payload\.redirect/);
  assert.match(client, /fetch\("https:\/\/api\.web3forms\.com\/submit"/);
  assert.match(client, /"Content-Type": "application\/json"/);
  assert.match(client, /Accept: "application\/json"/);
  assert.match(client, /function syncQuoteFormHiddenFields\(\)/);
  assert.match(generator, /name: 'access_key'/);
  assert.match(generator, /action="https:\/\/api\.web3forms\.com\/submit"/);
  assert.doesNotMatch(client, /QUOTE_API_ENDPOINT|\/api\/quote\//);
});

test('only an HTTP-success response with boolean success true can emit conversion or redirect', () => {
  const acceptedCheck = client.indexOf('if (!response.ok || result?.success !== true)');
  const conversion = client.indexOf('analytics.trackFormSuccess(sourceForm, submissionId, resume)');
  const redirect = client.indexOf('window.location.assign("/thank-you/")', conversion);
  assert.ok(acceptedCheck >= 0, 'provider acceptance must be checked explicitly');
  assert.ok(conversion > acceptedCheck, 'conversion must follow the accepted provider response');
  assert.ok(redirect > conversion, 'thank-you redirect must follow conversion queuing');
  assert.match(client, /const submissionId = window\.crypto\.randomUUID\(\)/);
});

test('quote form submissions remain independently sendable with native validation', () => {
  for (const file of quoteSourceFiles) {
    const html = readFileSync(file, 'utf8');
    assert.match(html, /data-quote-form="quote"/i, `${file} must keep its quote form`);
    assert.doesNotMatch(html, /name="botcheck"/i, `${file} must not use a honeypot`);
    assert.doesNotMatch(html, /<form\b[^>]*data-quote-form="quote"[^>]*\bnovalidate/i, `${file} must keep native validation`);
  }
  const setup = client.slice(client.indexOf('function setupQuoteForms()'), client.indexOf('function setQuoteFormFeedback('));
  assert.doesNotMatch(setup, /submitButton\.disabled|quoteAccepted|data\.submitting/);
});

test('quote forms add no custom CAPTCHA or custom API abuse layer', () => {
  assert.doesNotMatch(client, /cf-turnstile-response|g-recaptcha-response|verifyRecaptcha|verifyTurnstile/);
  assert.doesNotMatch(client, /QUOTE_API_ENDPOINT|\/api\/quote\//);
});
