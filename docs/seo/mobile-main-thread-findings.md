# Mobile main-thread cost: findings and fix (2026-11-07)
Correction to the earlier hypothesis: on `/removalists-adelaide/` and `/office-removals-adelaide/` the main-thread cost is Style & Layout (about 1.9 s in a throttled Lighthouse trace) while Script Evaluation is only 86-100 ms. JavaScript is not the cause.

Experiments (Playwright + CDP, 4x CPU, 375px): stripping `reveal-on-scroll`, lazy images, filters, shadows and animations changed nothing material. Adding `content-visibility: auto` to below-the-fold sections roughly halved style+layout time (e.g. /removalists-adelaide/ 792 ms to 387 ms).

Change: one rule at the end of `premium-site.css`: `main > section.section:not(:has(form)) { content-visibility: auto; contain-intrinsic-size: auto 600px; }`. Sections containing a form stay always rendered. The hero is `section.hero-shell` and is excluded. Homepage CSS (`premium-home.css`) is untouched.

Lab result (Lighthouse devtools throttling, 3 runs each, local build, same machine):
| Route | Before perf / TBT | After perf / TBT |
|---|---|---|
| /removalists-adelaide/ | 75-77 / 605-634 ms | 78-81 / 510-608 ms |
| /office-removals-adelaide/ | 82-83 / 390-437 ms | 85-86 / 368-410 ms |
The gain is modest (about +3 to +4 performance points). It is lab data on a local server, not field data. CLS on the affected routes comes only from the existing consent banner (0.055-0.063) and is unchanged.

Checks: build, `npm test`, `seo:validate`, Playwright (181 passed, 84 deliberate skips, 0 failed). `:has()` is unsupported in some older browsers; there the rule is ignored and the page renders as before.
