# Change log - 2026-11-06 SEO growth branch
Branch: feat/seo-growth-2026-11-06. Commit 42634bf plus follow-up commit.

| Change | Files | Why | Test |
|---|---|---|---|
| Reworded suburb "access notes" intro and FAQ template so plural logistics labels no longer take singular verbs ("changes the crew") | site-src/data/seo-v4.mjs | Confirmed on 45 live-built pages incl. Campbelltown, Norwood | tests/seo-growth-2026-11-06.test.mjs |
| Added withArticle() for "a/an <suburb>" | site-src/data/seo-v4.mjs | "a Adelaide CBD move" on /removalists-adelaide-cbd/ | same, plus door2door test updated |
| Interstate "Quote factors" cards now have distinct guidance | site-src/data/seo-v4.mjs | Card body repeated the title + one filler sentence on all 5 route pages | same |
| Queens Park NSW breadcrumbs moved under Interstate Removals (HTML + JSON-LD); removed link to redirected /sydney-to-adelaide-removalists/ | scripts/build-site.mjs, seo-v4.mjs | Page is Queens Park NSW to Adelaide, not an Adelaide suburb; no live Sydney-to-Adelaide page exists (it 308s to the hub) | same |
| Nearby-suburb cards skip suburbs folded away by redirect | seo-v4.mjs | Campbelltown showed "Myrtle Bank" card linking to /removalists-adelaide/ | same |
| Semaphore links to Pennington | seo-v4.mjs | Pennington had 3 inbound sitemap links vs 78 for Salisbury | same |
| New scripts/audit-internal-redirect-links.mjs | scripts/ | Finds internal links to redirected URLs | run manually |

Not changed: URLs, canonicals, redirects, robots, sitemap membership, GTM/conversion code, titles of the six priority pages (already target their queries).
Known remaining: /book-consultation/ links to /privacy/ (redirects to /privacy-policy/); it is a legacy redirect page.
