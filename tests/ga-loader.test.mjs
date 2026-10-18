import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../src/layouts/Layout.astro', import.meta.url), 'utf8');
const block = source.slice(source.indexOf('        window.dataLayer = window.dataLayer || [];', source.indexOf('{gaId && (')), source.indexOf('\n      `} />', source.indexOf('{gaId && (')));
function run(gtm, existing = []) {
  const appended = [], timers = [];
  const context = { window: {}, document: { scripts: existing.map(src => ({ src })), createElement: () => ({}), head: { appendChild: s => appended.push(s) } }, location: { href: 'https://zqremovalsadelaide.com.au/' }, URL, Date, setTimeout: fn => timers.push(fn) };
  context.window = context;
  vm.runInNewContext(block.replaceAll('${gaId}', 'G-TEST').replace('${Boolean(gtmId)}', String(gtm)), context);
  return { context, appended, timers };
}
test('GTM destination owns its loader while GA configuration remains queued', () => {
  const r = run(true);
  assert.equal(r.appended.length, 0);
  assert.equal(r.context.dataLayer[1][0], 'config');
  assert.equal(r.context.dataLayer[1][1], 'G-TEST');
  r.context.document.scripts.push({ src: 'https://www.googletagmanager.com/gtag/js?id=G-TEST&cx=c' });
  r.timers[0]();
  assert.equal(r.appended.length, 0);
});
test('unavailable GTM falls back once and standalone GA loads immediately', () => {
  const r = run(true);
  r.timers[0](); r.context.__loadGtag();
  assert.equal(r.appended.length, 1);
  assert.equal(run(false).appended.length, 1);
});
