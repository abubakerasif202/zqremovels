# Performance baseline, 2026-11-06

Branch `feat/seo-growth-2026-11-06`. Machine-readable copy: `docs/seo/performance-baseline.json`. Recommendations only; no code was changed.

## Method and what could not be measured

| Source | Status |
| --- | --- |
| PageSpeed Insights API, production, keyless, 6 routes x mobile/desktop | **Unavailable.** All 12 requests returned HTTP 429 on all 3 attempts (initial + 2 retries, 10s spacing). Keyless quota is exhausted. |
| Field data (CrUX `loadingExperience` / `originLoadingExperience`) | **Absent** because PSI never answered. Nothing below is field data. |
| Local Lighthouse 13.5.0 on `site-dist` (`http-server`, port 3100) | Obtained for all 6 routes, mobile and desktop. One run each, so expect about +/-5 points of noise. |

Lab and field are never mixed in this document. Everything below is **local lab** unless stated. Mobile uses Lighthouse default Slow-4G / 4x CPU simulation.

Caveat: `http-server` has no compression and sends `max-age=3600`. Production serves Brotli (`premium-site.min.css` is 34,830 B over the wire against 200,208 B raw) and `immutable` one-year caching for CSS, JS, fonts and media (`vercel.json`). I re-ran 2 mobile routes with `-b -g` compression. `/` scored 82 and `/removalists-adelaide-prices/` scored 82 (LCP 3.6 s / 3.8 s, FCP 2.6 s / 2.7 s), the same as uncompressed. So compression does not explain the mobile gap. The `cache-insight` finding in the desktop reports (300-400 KiB) is a local-server artifact and should be ignored.

## Local lab scores (Performance / A11y / Best Practices / SEO)

| Route | Mobile | LCP | FCP | SI | TBT | CLS | Desktop | D-LCP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 84/100/100/100 | 3.6 s | 2.6 s | 4.1 s | 0 ms | 0 | 99 | 0.9 s |
| `/removalists-adelaide/` | 78/100/100/100 | 4.1 s | 3.2 s | 4.3 s | 0 ms | 0 | 99 | 0.9 s |
| `/office-removals-adelaide/` | 77/100/100/100 | 3.9 s | 2.6 s | 4.2 s | 260 ms | 0 | 99 | 0.8 s |
| `/services/piano-movers-adelaide/` | 83/100/100/100 | 3.8 s | 2.7 s | 4.2 s | 0 ms | 0 | 100 | 0.7 s |
| `/removalists-adelaide-prices/` | 83/100/100/100 | 3.8 s | 2.7 s | 4.2 s | 0 ms | 0 | 99 | 0.8 s |
| `/removalists-hyde-park/` | 82/100/100/100 | 3.8 s | 2.6 s | 4.1 s | 120 ms | 0 | 99 | 0.8 s |

Accessibility, Best Practices and SEO are 100 on every route and strategy. Desktop CLS is 0 except `/office-removals-adelaide/` at 0.019.

**Mobile LCP element.** On 5 of 6 routes it is hero text (`p.lede`, `h1#home-hero-title`, or `p.page-hero-support-note`). Of the mobile LCP, 99.5% or more is **element render delay** (about 2.17-2.23 s) against 4-10 ms of TTFB. The text is ready to paint but is held back by the render-blocking stylesheet.

**Desktop LCP element.** It is a hero image on 5 routes (only `/` is text). On `/removalists-adelaide/` it is a `loading="lazy"` image.

## Genuine problems, ranked by impact

1. **A single render-blocking CSS bundle delays all mobile first paint.**
   - Evidence: `render-blocking-insight` flags `premium-site.min.css` (200,532 B) at an estimated 860-1,310 ms savings on 4 of 6 routes, 540 ms for `premium-home.min.css` (157,400 B), and 680 ms on `/office-removals-adelaide/`. The mobile LCP breakdown is about 2.2 s of render delay.
   - Cause: stylesheets are emitted as plain blocking `<link rel="stylesheet">`.
   - Source: `scripts/build-site.mjs:2923-2935` (tag emission) and `performanceStylesheetNames` at line 295. Bundle building is in `writePerformanceStylesheets` and `purgeStylesheet` (around line 3797).
   - Fix direction: inline critical above-the-fold CSS and load the rest asynchronously, or split further per layout.

2. **Unused CSS in the shared bundle.**
   - Evidence: `unused-css-rules` reports 107-109 KiB wasted of 200 KB on service, price and office routes, 87 KiB on Hyde Park, 68 KiB on `/removalists-adelaide/`, and 48 KiB of 157 KB on the home bundle. Estimated savings are 300-600 ms.
   - Source: `premium-site.min.css` from `purgeStylesheet` in `scripts/build-site.mjs`. The purge keeps selectors used on any page. Per-template or per-route CSS would shrink it.

3. **Hero on `/removalists-adelaide/` is lazy-loaded and oversized.**
   - Evidence: it is the desktop LCP element with `loading="lazy"` and no `fetchpriority`. `image-delivery-insight` reports 52 KiB wasted: a 960x600 file served into a 379x253 slot.
   - Source: `site-src/content/removalists-adelaide/index.html:41`. Compare the other hubs that already use `loading="eager" fetchpriority="high"`.
   - Fix direction: eager plus `fetchpriority="high"`, and a correct `sizes`/`srcset`.

4. **Oversized hero image on `/removalists-hyde-park/`.**
   - Evidence: `image-delivery-insight` reports 32 KiB wasted. An 800x499 file is shown at 379x284, even though the image is eager with `fetchpriority="high"`.
   - Source: the suburb template in `scripts/build-site.mjs`, which generates the `/media/responsive/*-960w.webp` srcset (see around line 5337), and the `sizes` attribute it writes.

5. **Unused JavaScript and main-thread work on service and price pages.**
   - Evidence: `unused-javascript` reports about 23 KiB of the 39,128 B `site.js` (estimated 150-300 ms). TBT is 260 ms on `/office-removals-adelaide/` and 120 ms on Hyde Park, over the 200 ms budget in `.lighthouserc.cjs` for the office page.
   - Source: `site.js`, emitted by the generator; split per-feature (quote form, chat, analytics).

6. **Document latency (desktop reports): 31-53 KiB potential text compression.**
   - Evidence: `document-latency-insight` scores 0.5 locally. This is probably only the uncompressed `http-server`; production sends Brotli for static assets. Verify the HTML document encoding on production before acting.

## Production vs local differences

- Production CSS is Brotli (34.8 KB), cached `immutable` for a year. Local was 200 KB with 1 h cache. Local findings about cache lifetime and document compression are artifacts.
- The production HTML shell has `Cache-Control: public, must-revalidate, max-age=0`, so every navigation revalidates the document.
- Production lab numbers were not obtained (PSI 429). The mobile LCP and FCP gap against the targets should be confirmed on production with a Google API key or the existing `npm run lhci`. Both CSS-blocking and font-swap behaviour could differ with real CDN latency.

## Next step

Obtain a Google API key for PageSpeed Insights and re-run `docs/seo/performance-baseline.json` production rows for lab and CrUX field data. Until then, mobile performance of 77-84 should be treated as a local simulated baseline.
