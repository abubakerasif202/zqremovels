import { execFileSync } from 'node:child_process';
import path from 'node:path';

export function validateLastmod(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
    ? value : undefined;
}

// Checkout mtimes describe deployment, not content changes. Unknown history is omitted.
export function createSitemapLastmodResolver(projectRoot, { runGit = execFileSync } = {}) {
  const root = path.resolve(projectRoot);
  const cache = new Map();
  function committedDate(source) {
    const relative = path.relative(root, path.resolve(source)).replaceAll('\\', '/');
    if (relative.startsWith('../') || path.isAbsolute(relative)) return undefined;
    if (!cache.has(relative)) {
      let date;
      try {
        const output = runGit('git', ['log', '-1', '--format=%cs', '--', relative], {
          cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
        });
        date = validateLastmod(String(output).trim());
      } catch { /* Git history is optional on deployment checkouts. */ }
      cache.set(relative, date);
    }
    return cache.get(relative);
  }
  return function resolveLastmod(page, sourcePaths = []) {
    const explicit = validateLastmod(page.lastmod);
    if (explicit) return explicit;
    const dates = [...new Set(sourcePaths)].map(committedDate).filter(Boolean).sort();
    return dates.at(-1);
  };
}
