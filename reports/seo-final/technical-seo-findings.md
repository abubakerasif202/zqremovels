# Technical SEO findings (2026-10-17)

Live crawl of all 80 sitemap URLs on `https://zqremovalsadelaide.com.au` (production = `main` @ `00bbd08`, Vercel deployment `dpl_Fm6aGahkBfCFSc2RSqbre8Y5otiM`, READY).

## Verified clean on production
- 80/80 return 200; every canonical is absolute and self-referencing; none `noindex`.
- No missing or duplicate titles, H1s or meta descriptions; exactly one H1 per page; no title over 65 or description over 160 characters.
- JSON-LD parses on every page; BreadcrumbList present on every non-home page.
- No orphan pages (each has an inbound link from another live page); no page under 400 words.
- All internal link targets return 200 (2 targets outside the sitemap, both 200); 14 local image requests, 0 broken.
- Sitemap index lists 5 children, 80 unique page URLs, no old-host URLs.
- Automated audits on the build: contrast passes on 123 HTML files; axe 0 failures, 0 overflow, 0 clipped controls across 96 pages and 27 redirect stubs.

## Defects found and fixed in this change
| Finding | Root cause | Fix |
| --- | --- | --- |
| `/book-consultation/` footer linked 10 redirected URLs (hop on every click) | Astro `Footer.astro` hard-coded retired URLs | Each repointed to its redirect's final destination |
| Hero Google-reviews badge had no accessible name; `main`'s own test failed | Link text only | Added `aria-label` from the existing rating and count placeholders |
| Contact visual test failed on all 5 viewports | Chat widget injects a second `move_scope` select; locator was unscoped | Locator scoped to `.quote-form-premium` |
| Inner-page header wordmark invisible (dark green on dark green) | Legacy rule set `.brand-copy strong` dark on every route except home/contact | Light wordmark on those routes |
| Four primary-CTA styles (dark-green, orange gradient, outline, lime) | Homepage/contact received a navy/lime direction; other routes kept older variants | One lime/ink primary button everywhere |
| Footer address ran together ("...SA 5114ABN 97 954 095 1190433...") | `.nap` children inline with no rule | Stacked block layout |

## Not changed, for owner decision
- **Two visual systems remain**: homepage/contact use Inter on navy; inner pages use Fraunces serif headings on forest green. Shared chrome and CTAs are now unified, but a full re-skin of ~90 content templates is a design project, not a safe bulk edit.
- Pricing page lacks fixed-price content (see matrix REVIEW rows); adding it needs owner-confirmed pricing policy.
- 43 locality pages: `thin-content-report.md` (2026-10-15) stands; no page was deleted or noindexed. The built-in "neighbour" lists on suburb pages are geographically unreliable (e.g. Hallett Cove listed beside Henley Beach); worth a content review.
- `admin@zqremovals.au` remains the business email (not a website URL).
