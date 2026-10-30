# Repository Guidelines

## Project Structure & Sources of Truth

ZQ Removals Adelaide (`zqremovalsadelaide.com.au`) is a generator-driven static site built with Node.js and deployed on Vercel. Treat `site-src/` and `scripts/build-site.mjs` as the source of truth; never patch `site-dist/` directly.

- `site-src/pages.json`: route registry (output path, layout, canonical, robots, social metadata, JSON-LD, content source).
- `site-src/content/`: route content partials; most page copy lives here. `site-src/partials/`: shared header/footer and fragments. `site-src/templates/`: `standard`, `bare`, and `redirect` layouts.
- `scripts/build-site.mjs`: main generator. It enforces canonical tags, robots, structured data, sitemap output, shared sections, related links, and asset copying. Prefer fixing behavior here over editing page output.
- `api/`: Vercel serverless handlers (`quote.js`, `ai-chat.js`, `ai-chat-submit.js`, `ai-lead.js`, `legacy-sitemap.js`). `lib/`: shared server logic; keep credentials and privileged operations server-side.
- `site-dist/`: generated output only. `vercel.json`: headers (including CSP), redirects, and deploy routing.
- `tests/`: regression tests. `scripts/`: build, SEO, GSC, Ads, and audit tooling. `docs/`, `reports/`, `artifacts/`: documentation and generated evidence.
- Repo docs: `SEO_AUDIT.md`, `META_MAP.md`, `CHANGELOG_SEO.md`, `GOOGLE_SEARCH_CONSOLE_PLAN.md`, `INTERNAL_LINKING_PLAN.md`, `SCHEMA_NOTES.md`.

## Development & Validation Commands

Use Node.js 22.x (`engines` in `package.json`) and the committed lockfile. Run commands from the repository root.

| Command | Purpose |
| --- | --- |
| `npm ci` | Install locked dependencies. |
| `npm run build` | Generate `site-dist/`. |
| `npm test` | Quote API smoke test, then every `tests/*.test.{mjs,cjs}` file. |
| `node --test tests/search-console-fixes.test.mjs` | Focused Search Console regression. |
| `node --test tests/seo-conversion-pass.test.mjs` | SEO and conversion regression. |
| `node --test tests/eeat-audit.test.mjs` | E-E-A-T content regression. |
| `npm run seo:validate` | Validate sitemap, canonicals, and SEO output. |
| `npm run test:visual-mobile` | Playwright mobile visual checks. |
| `npm run test:readability` | Readability audit. |
| `npm run lhci` | Lighthouse audit. |

Install Chromium once with `npx playwright install chromium` before browser tests. Browser and Lighthouse checks need a completed `npm run build`.

## Coding Style & Naming

Follow the surrounding code. Keep generator changes small, deterministic, and covered by tests. Use descriptive kebab-case filenames for scripts and content partials, and keep `pages.json` routes lowercase with trailing slashes. Reuse existing registries, partials, and utilities before adding dependencies. Do not hard-code business facts in several places; keep them in shared partials or registries.

## Testing Guidelines

Use `node:test` and `node:assert/strict`; name regressions `tests/<feature>.test.mjs`. Playwright specs use `*.spec.ts`. SEO behavior changes need generator- or output-level regression tests. Add behavioral coverage for changed business logic, quote and lead handling, and failure paths.

For UI changes, check narrow phones (320–375px), tablets, and desktop, including keyboard access, focus states, overflow, contrast, and reduced motion. Test runs can regenerate reports and artifacts; protect existing audit evidence. Report checks as passed, failed, blocked, or not run, and distinguish local verification from live-site evidence.

## Security, Lead Capture & Tracking

Never expose secrets or commit environment files (for example `password.env`). Do not print credential values. Preserve request validation, abuse controls, and the CSP in `vercel.json`. Before adding a script origin, `eval`-style code, or a new connect target, confirm the CSP change is intended and tested.

Keep quote, chat, and lead handlers server-authoritative. Preserve the conversion and consent flow (GTM/GA/Ads tags, thank-you redirect timing, and consent handling); verify tracking changes with `tests/conversion-tracking.spec.ts` and `scripts/verify-ads-conversion.mjs` rather than assumption.

## SEO Policy

- **Canonical host:** the apex `https://zqremovalsadelaide.com.au`. Canonical tags, `og:url`, JSON-LD URLs and `@id` values, sitemap `<loc>` values, social and logo image URLs, and generator-built absolute URLs must all use it. Never reintroduce mixed `www`/apex output. If the live site still redirects apex to `www`, treat that as a Vercel/domain configuration issue and call it out in the final report.
- **Sitemap inclusion:** include a page only if it is indexable, not a redirect layout, not `404`, not `noindex`, not a preview/concept/utility page, and its canonical points to a real indexable destination. Exclude redirect pages, `404.html`, `thank-you.html`, `noindex` pages, `premium-moving-concepts/` routes, and thin utility pages.
- **Legacy redirects:** use permanent redirects for crawlable legacy aliases (old `.html` URLs, older service aliases, renamed routes, historical local/interstate aliases). Targets must be the canonical live route with a trailing slash. Redirect pages in `pages.json` stay `noindex,nofollow` and never appear in the sitemap. Keep redirect rules grouped, documented, and reviewable.
- **Structured data:** valid, minimal JSON-LD that matches visible content and the canonical host. No duplicate `FAQPage` or `BreadcrumbList`, no conflicting `WebPage`/`Service` entities for one route, and no fake ratings, reviews, locations, or unsupported claims. Keep `MovingCompany`, `WebPage`/`AboutPage`/`ContactPage`, `Service`, `BreadcrumbList`, and `FAQPage` consistent.
- **Verified facts only:** do not invent services, prices, reviews, availability, or marketing claims. Never publish leaked SEO-strategy copy, fluff, or doorway-style pages.

## Internal Linking & Clusters

Links must serve users first, not stuff anchors. Treat the site as a hierarchy: homepage → Adelaide hub plus Northern and Southern hubs; hubs → suburb pages, core services, and the guide hub; suburb pages → regional hub, best-fit services, quote path, and interstate support where relevant; service pages → sibling services, relevant hubs and suburbs, supporting guides, and quote path; guides → best-fit services, hubs or suburbs, and quote path; interstate pages → interstate hub, local entry points, packing guides, and quote path. Avoid orphan pages, repetitive exact-match anchors, and flat related-link pools.

Strengthen cluster authority through shared generator registries before editing page-local copy. Main clusters: Adelaide hub, Southern hub, Northern hub, core services (house, furniture, packing, office, interstate), differentiated suburb pages, and pre-quote guides. Conversion flows naturally from guide, suburb, or hub to the best-fit service page to the quote form; linking straight to `/contact-us/#quote-form` is acceptable as a secondary CTA.

## Content Expansion Rules

- **Suburb pages:** add only when the suburb has a real operational angle (apartment or tower access, coastal access, northern vs southern corridor logistics, family-home and garage-heavy inventory, commercial or mixed-use inventory, storage-linked routes, loading/parking/stair/service-lift constraints, or interstate departure relevance). Never mass-produce or duplicate an existing page's intent. Each new page must fit one regional hub, at least one core service cluster, and a guide or interstate path where relevant.
- **Guides:** add only when they answer a realistic pre-quote planning question (packing timing, heavy furniture, apartment and tower prep, office dock/lift/restart planning, interstate preparation, pricing expectations, access logistics). Each needs a clear intent, a natural link into a money page, a hub or suburb link where useful, and enough unique detail to justify indexing.

## Commits, Pull Requests & Delivery

Inspect Git status before editing and preserve unrelated changes, including untracked audit exports and patches. Use `type(scope): short summary` commits (for example `fix(seo): align keyword intent and contextual service links`). Review the final diff and run `git diff --check` before committing.

PRs include Summary, Changes, Why, Testing, Risk, and Rollback. Link relevant issues and attach screenshots for visual changes. Keep each PR focused. Verify the deployed revision and live routes separately from CI. Never force-push or perform destructive production changes without explicit authorization, and call out any remaining Vercel dashboard or domain-layer action.

## Done When Checklist

Before claiming SEO work is complete, verify:

- `npm run build` passes.
- Relevant tests pass: at minimum the focused SEO regressions plus any affected suites.
- Canonical output is consistent on the apex host, with no mixed-host SEO output in HTML or the sitemap.
- The sitemap contains only intended indexable pages; redirect pages, `404`, and `noindex` utility pages are excluded.
- Legacy SEO-critical aliases redirect correctly.
- Critical generated pages have no broken internal links.
- Structured data stays valid and host-consistent.
- Any remaining Vercel dashboard or domain-layer action is called out explicitly.

## Agent Workflow

Inspect source before editing: start with `scripts/build-site.mjs`, `site-src/pages.json`, `vercel.json`, `tests/`, and the affected `site-src/content/**`. Trace the cause, make the smallest reliable generator-level fix, check related paths, and validate. Prefer generator-level fixes over page-by-page output hacks. Add or update regression tests with every SEO behavior change. Do not assume Search Console issues are fully repo-fixable while domain host behavior is controlled by Vercel project settings. Use the installed `codebase-memory` skill for structural exploration, with source inspection when graph coverage is unavailable, and consult Context7 for library-specific questions.

## Cursor Cloud specific instructions

- Node.js 22.x is already the expected runtime. Install from the lockfile with `npm ci`. There is no separate lint or typecheck script.
- `npm run build` writes gitignored `site-dist/`. Its prebuild step leaves `google-reviews.json` unchanged unless `VERCEL=1`.
- Preview the built site with `node scripts/serve-site.mjs`. It listens only on `127.0.0.1` and `PORT` (default `3000`). It serves static files and does not mount the Vercel handlers in `api/`.
- `npm test` and `npm run test:quote-api` cover quote handling without `WEB3FORMS_ACCESS_KEY`, Redis, or other production secrets. Do not submit the on-page quote form to the live Web3Forms endpoint from this environment; on the local preview that form posts to `/api/quote/`, which the static server does not implement.
- Before Playwright specs, install Chromium with `npx playwright install chromium`. The system Chrome binary is not a substitute for Playwright's browser cache.
