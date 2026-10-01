import { readFileSync } from 'node:fs';
import path from 'node:path';

const CANONICAL_ORIGIN = 'https://zqremovalsadelaide.com.au';

// Path redirects ship with absolute canonical destinations so legacy-host requests resolve in a single hop.
// Tests reason about the destination path, so expose it path-relative; host-scoped rules stay untouched.
export function readVercelConfig(root = process.cwd()) {
  const config = JSON.parse(readFileSync(path.join(root, 'vercel.json'), 'utf8'));
  return {
    ...config,
    redirects: (config.redirects || []).map((redirect) => (
      !redirect.has && typeof redirect.destination === 'string' && redirect.destination.startsWith(CANONICAL_ORIGIN)
        ? { ...redirect, destination: redirect.destination.slice(CANONICAL_ORIGIN.length) || '/' }
        : redirect
    )),
  };
}
