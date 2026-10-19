import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const script = readFileSync(new URL('../site.js', import.meta.url), 'utf8');
const source = script.slice(script.indexOf('function playEntrance('), script.indexOf('function setupRevealAnimations('));
function fixture(reduced = false) {
  const classes = new Set();
  const listeners = {};
  const node = { classList: { add: (...names) => names.forEach(n => classes.add(n)), remove: (...names) => names.forEach(n => classes.delete(n)) }, addEventListener: (event, fn) => { listeners[event] = fn; } };
  const preference = { matches: reduced, addEventListener: (event, fn) => { listeners.preference = fn; } };
  let callback;
  const observed = new Set();
  const context = vm.createContext({
    window: { matchMedia: () => preference, IntersectionObserver: true },
    document: { querySelector: () => null, querySelectorAll: () => [node] },
    IntersectionObserver: class {
      constructor(fn) { callback = fn; }
      observe(n) { observed.add(n); }
      unobserve(n) { observed.delete(n); }
      disconnect() { observed.clear(); }
    },
  });
  vm.runInContext(source, context);
  return { context, node, classes, listeners, preference, observed, intersect: () => callback([{ target: node, isIntersecting: true }]) };
}
test('scroll entrances leave waiting content visible and unobserve on entry', () => {
  const f = fixture();
  f.context.setupEntranceAnimations();
  assert.equal(f.classes.size, 0);
  assert.equal(f.observed.size, 1);
  f.intersect();
  assert.equal(f.observed.size, 0);
  assert.ok(f.classes.has('animate__fadeIn'));
  f.listeners.animationend();
  assert.equal(f.classes.size, 0);
});
test('reduced motion skips entrances and cancels active effects when changed', () => {
  const reduced = fixture(true);
  reduced.context.setupEntranceAnimations();
  reduced.context.playEntrance(reduced.node);
  assert.equal(reduced.classes.size, 0);
  assert.equal(reduced.observed.size, 0);
  const f = fixture();
  f.context.setupEntranceAnimations();
  f.intersect();
  f.preference.matches = true;
  f.listeners.preference();
  assert.equal(f.classes.size, 0);
  assert.equal(f.observed.size, 0);
});
test('production retains the selected Animate.css class and keyframe only', () => {
  // Astro inlines this subset because it falls below the stylesheet size threshold.
  const html = readFileSync(new URL('../site-dist/index.html', import.meta.url), 'utf8');
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]).join('\n');
  assert.match(css, /\.animate__fadeIn/);
  assert.match(css, /@keyframes fadeIn\s*\{/);
  assert.doesNotMatch(css, /@keyframes (?:bounce|fadeOut|zoomIn)\s*\{/);
  const rootCss = readFileSync(new URL('../premium-site.css', import.meta.url), 'utf8');
  assert.match(rootCss, /animation-delay: -400ms/);
  assert.match(rootCss, /prefers-reduced-motion: reduce/);
});

test('quote feedback animates success without changing feedback or error behavior', () => {
  const f = fixture();
  const feedback = script.slice(script.indexOf('function setQuoteFormFeedback('), script.indexOf('function isServiceContextPage('));
  vm.runInContext(feedback, f.context);
  const form = { querySelector: () => f.node };
  f.context.setQuoteFormFeedback(form, 'Request sent', 'success');
  assert.equal(f.node.textContent, 'Request sent');
  assert.ok(f.classes.has('is-success'));
  assert.ok(f.classes.has('animate__fadeIn'));
  f.listeners.animationend();
  f.context.setQuoteFormFeedback(form, 'Please check your details', 'error');
  assert.equal(f.node.textContent, 'Please check your details');
  assert.ok(f.classes.has('is-error'));
  assert.ok(!f.classes.has('is-success'));
  assert.ok(!f.classes.has('animate__fadeIn'));
});
