# Sitemap content history

`site-src/data/sitemap-content-history.json` is a committed record of each canonical page's meaningful rendered content hash and, where supported, its historical lastmod. The initial snapshot preserves the previous Git-backed sitemap dates; these are source-history evidence, not independently verified publication timestamps. One page without date evidence remains undated. No dates come from checkout mtimes or the build clock.

Builds read this record without modifying it. Matching content keeps its date even in a shallow checkout without Git history. A new or changed page omits lastmod until its change date is reviewed and recorded. Canonical URLs, sitemap membership and redirects are unaffected.

After a meaningful content change:

1. Run `npm run build`.
2. Run `node scripts/update-sitemap-content-history.mjs --date=YYYY-MM-DD`, using the actual date the content was changed. This only updates records whose content hash changed.
3. Review the JSON diff and commit it with the content change.
4. Rebuild and run `npm test`, `npm run seo:validate`, and `git diff --check`.

The hash covers main content, title, description, canonical and JSON-LD. Script bodies, styles, classes, data attributes, comments and formatting whitespace do not bump the date. Header/footer-only edits do not bump all pages. `--seed` is a one-time migration command and refuses to overwrite existing history.
