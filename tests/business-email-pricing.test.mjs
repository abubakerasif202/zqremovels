import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const distRoot = path.join(root, 'site-dist');

function walkFiles(directory, results = []) {
  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      if (!['.git', 'node_modules', 'site-dist'].includes(entry)) walkFiles(fullPath, results);
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

test('source uses the approved ZQ Removals business email', () => {
  const searchableFiles = walkFiles(root).filter((file) => /\.(?:astro|html|js|json|md|mjs|ts)$/i.test(file));
  for (const file of searchableFiles) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /info@zqremovals\.au/i, path.relative(root, file));
  }

  const businessSource = readFileSync(path.join(root, 'site-src', 'data', 'business.mjs'), 'utf8');
  assert.match(businessSource, /email:\s*'admin@zqremovals\.au'/);
});

test('every generated quote form exposes both required crew packages', () => {
  const quotePages = walkFiles(distRoot).filter((file) => file.endsWith('.html'));
  let formCount = 0;

  for (const file of quotePages) {
    const html = readFileSync(file, 'utf8');
    const forms = html.match(/<form\b[^>]*data-quote-form="quote"[^>]*>[\s\S]*?<\/form>/gi) || [];
    for (const form of forms) {
      formCount += 1;
      assert.match(form, /name="crew_package"[^>]*required[^>]*value="2 Men \+ Truck — \$75 \/ 30 min"/i);
      assert.match(form, /name="crew_package"[^>]*required[^>]*value="3 Men \+ Truck — \$89 \/ 30 min"/i);
      assert.doesNotMatch(form, /name="crew_package"[^>]*checked/i, 'package must not be preselected');
    }
  }

  assert.ok(formCount >= 5, `expected at least five generated quote forms, found ${formCount}`);
});

test('generated business schema and public footer use the approved email', () => {
  const homepage = readFileSync(path.join(distRoot, 'index.html'), 'utf8');
  assert.match(homepage, /"email"\s*:\s*"admin@zqremovals\.au"/i);
  assert.match(homepage, /mailto:admin@zqremovals\.au/i);
  assert.doesNotMatch(homepage, /info@zqremovals\.au/i);
});

test('quote submission paths preserve the selected crew package', () => {
  const client = readFileSync(path.join(root, 'site.js'), 'utf8');
  const api = readFileSync(path.join(root, 'api', 'quote.js'), 'utf8');
  assert.match(client, /crew_package:\s*getFirstNonEmptyPayloadValue\(payload, \["crew_package"\]\)/);
  assert.match(api, /crew_package:\s*getTrimmedString\(payload, "crew_package"\)/);
});

test('generated same-page fragment links resolve to real targets', () => {
  const htmlFiles = walkFiles(distRoot).filter((file) => file.endsWith('.html'));
  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/gi)].map((match) => match[1]));
    for (const match of html.matchAll(/href="#([^"]+)"/gi)) {
      assert.ok(ids.has(match[1]), `${path.relative(distRoot, file)} has broken fragment #${match[1]}`);
    }
  }
});
