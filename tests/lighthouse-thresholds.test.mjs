import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateLighthouseThresholds } from '../scripts/lighthouse-thresholds.mjs';

test('Lighthouse threshold evaluation marks warning-level performance misses as failures', () => {
  const results = evaluateLighthouseThresholds({
    categories: { performance: { score: 0.86 }, accessibility: { score: 1 }, seo: { score: 1 } },
    audits: { 'largest-contentful-paint': { numericValue: 3600 } },
  }, {
    'categories:performance': ['warn', { minScore: 0.9 }],
    'categories:accessibility': ['warn', { minScore: 0.9 }],
    'categories:seo': ['error', { minScore: 0.9 }],
    'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
  });

  assert.deepEqual(results.filter(result => !result.passed).map(({ name, level }) => [name, level]), [
    ['categories:performance', 'warn'],
    ['largest-contentful-paint', 'warn'],
  ]);
});

test('Lighthouse threshold evaluation passes values exactly at configured boundaries', () => {
  const results = evaluateLighthouseThresholds({
    categories: { performance: { score: 0.9 } },
    audits: { 'largest-contentful-paint': { numericValue: 2500 } },
  }, {
    'categories:performance': ['warn', { minScore: 0.9 }],
    'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
  });
  assert.ok(results.every(result => result.passed));
});
