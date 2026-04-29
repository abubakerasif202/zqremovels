# ZQ Removals

Static site for ZQ Removals.

## Common Commands

```powershell
npm run build
npm test
```

## Test Notes

- `npm test` starts with `scripts/quote-api-smoke.mjs`, which checks the `/api/quote` handler directly.
- The smoke test covers both the active `WEB3FORMS_ACCESS_KEY` variable and the legacy `VITE_WEB3FORMS_ACCESS_KEY` fallback.
- The rest of the suite rebuilds `site-dist/` and verifies the generated HTML and asset contracts.

## Optional analytics environment variables

- `VITE_GA_MEASUREMENT_ID` for Google Analytics 4
- `VITE_GTM_ID` for Google Tag Manager
- `VITE_META_PIXEL_ID` for Meta Pixel

Tracking scripts are injected only when these variables are set at build time.
