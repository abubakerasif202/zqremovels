# GSC 2026-11-21 SEO fixes

Objective: implement the on-site fixes from the 21 Nov 2026 Search Console audit.
Branch: `seo/gsc-2026-11-21-fixes` (worktree off `origin/main` 9dc4307). Delivery: single PR, no commits until the owner approves the diff.
Test runner: `node:test` via `npm test`; build via `npm run build`.

## Specs

- S1: "Price inconsistency on `/removalists-adelaide-prices/`" - find every `$65` occurrence; "Do NOT pick a value yourself. Report every location and stop for my confirmation". Rates must come from one shared constant after confirmation.
- S2: "Make `/furniture-removalists-adelaide/` the single canonical page"; 301 `/services/furniture-removals-adelaide/` -> it; remove old URL from sitemap; "Update every internal link to point at the canonical URL"; report other `/services/*` duplicates.
- S3: "Make the Andrews Farm, Gawler and Mount Barker pages unique" - measure shared text (shingle/Jaccard), replace generic blocks with suburb-specific sections; no invented stats, reviews or stories; link from homepage or hub and from Northern Adelaide / Adelaide Hills pages; Andrews Farm linked from the homepage.
- S4: "Strengthen internal links to the striking-distance suburb pages" (Hyde Park, Unley Park, Medindie, Malvern, Toorak Gardens, Kensington Gardens): homepage plus 2-3 related pages plus `/removalists-adelaide-prices/`; "Don't change their titles or H1s".
- S5: Schema: `openingHoursSpecification` Monday-Sunday 07:00-19:00; `priceRange` only after Task 1; no street address or coordinates; business name "ZQ Removals Adelaide"; phone 0433 819 989; `alternateName` on `WebSite`; values in the shared schema code.
- S6: Sitemap lists only canonical, indexable 200 URLs; report the noindex pages.
- S7: Regression tests: furniture 301; no unconfirmed rate in build output; `openingHoursSpecification` on homepage JSON-LD; sitemap has no redirected URLs.

## Tasks

| ID | Specs | Route | Status |
| --- | --- | --- | --- |
| T1 | S1 | inline | Report only. Blocked on owner confirmation of the $65 small-truck rate. |
| T2 | S2 | inline | Redirects, noindex stubs and sitemap already correct on origin/main; source links and llms.txt tidied. |
| T3 | S3 | inline | Pending |
| T4 | S4 | inline | Pending |
| T5 | S5 | inline | Pending (priceRange blocked on T1) |
| T6 | S6, S7 | inline | Pending |

## Log

- L1 (2026-11-21, user, verbatim summary): the full task brief "Claude Code task: ZQ Removals Adelaide SEO fixes (from the 21 Nov 2026 Search Console audit)" - tasks 1-6, verification list, report-back list, out-of-scope list.
- 2026-11-21: local checkout was 35 commits behind `origin/main`; work moved to a clean worktree off `origin/main`. Dirty files in the original checkout (package*.json, zq-services.mjs, odd/tasks/premium-truck-selection.md) were left alone.
- 2026-11-21: `$65` is published on the homepage truck card and quote dropdown, and on the prices page (meta, rate table, lead, billing copy, FAQ). The audit premise that the homepage shows only $75/$89 does not match the repo.
