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
