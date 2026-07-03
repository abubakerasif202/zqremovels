import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walkHtml(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) walkHtml(fullPath, files);
    else if (entry.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function hasDarkSurfaceContext(html, index) {
  const context = html.slice(Math.max(0, index - 5000), index + 300);
  return /(?:section-dark(?:-plan)?|surface-dark|quote-strip|footer-shell|hero-shell-home|home-redesign-(?:hero|quote|final-cta))/.test(context)
    || /background\s*:\s*var\(--color-surface-strong\)/i.test(context)
    || /background(?:-color)?\s*:\s*(?:#(?:050910|03060b|071526|091b17|10231f|123b31)|rgb\((?:5,\s*9,\s*16|7,\s*21,\s*38|16,\s*35,\s*31)\))/i.test(context);
}

export function auditGeneratedContrast(distDir = path.join(root, 'site-dist')) {
  const issues = [];
  for (const file of walkHtml(distDir)) {
    const html = readFileSync(file, 'utf8');
    const relative = path.relative(distDir, file).replaceAll('\\', '/');

    for (const pattern of [
      { name: 'text-white utility', regex: /class="[^"]*\btext-white\b[^"]*"/gi },
      { name: 'text opacity utility', regex: /class="[^"]*\b(?:text-opacity-\d+|opacity-(?:[1-9]|[1-8]\d|9\d))\b[^"]*"/gi },
      { name: 'inline white foreground', regex: /style="[^"]*\bcolor\s*:\s*(?:white|#fff(?:fff)?)(?:\s*!important)?\s*(?:;|")/gi },
    ]) {
      for (const match of html.matchAll(pattern.regex)) {
        if (!hasDarkSurfaceContext(html, match.index ?? 0)) {
          issues.push(`${relative}: ${pattern.name} outside a known dark surface: ${match[0].slice(0, 180)}`);
        }
      }
    }

    for (const match of html.matchAll(/<p\b[^>]*class="[^"]*\bopacity-(?:[1-9]|[1-8]\d|9\d)\b[^"]*"[^>]*>/gi)) {
      issues.push(`${relative}: body copy must not use opacity utilities: ${match[0]}`);
    }
  }
  return issues;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const issues = auditGeneratedContrast(process.argv[2] ? path.resolve(process.argv[2]) : undefined);
  if (issues.length) {
    console.error(issues.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`contrast audit passed for ${walkHtml(path.join(root, 'site-dist')).length} generated HTML files`);
  }
}
