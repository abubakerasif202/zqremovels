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

## Dependency and Build Troubleshooting

### WSL/Linux optional dependency issues
If the build fails with an error like `Cannot find module '../lightningcss.linux-x64-gnu.node'` (or other platform-specific `.node` binary), run:
```bash
npm ci
```
or re-run `npm install` to ensure the platform-appropriate native packages for `lightningcss` are downloaded and linked.

### Auditing Dependencies
Run `npm audit` and review major-version fixes explicitly instead of using `npm audit fix --force`.

Lighthouse checks use the standalone `lighthouse` package through `scripts/lighthouse-audit.mjs`. The routes and pass/warn thresholds remain defined in `.lighthouserc.cjs`, and `npm run lhci` runs the compatibility audit.


## Optional Cal.diy / Cal.com consultation scheduling

The ZQ Removals website is a static Astro site. The scheduling server is a **separate deployment**, not a package installed inside Astro. A scheduling link is intentionally optional, to preserve the existing reviewed-quote and accepted-lead conversion flows.

1. Deploy and secure a scheduling service at an HTTPS origin you control. Cal.diy requires a separate application, PostgreSQL, backups, email and calendar integrations. **Cal.diy's own README recommends personal, non-production use**; assess suitability carefully before commercial use, or choose a supported Cal.com deployment.
2. Configure a consultation event type in the scheduling service. Set the organiser's time zone to Australia/Adelaide, confirm actual working hours, and connect an authorised calendar before making slots public.
3. Set the Vercel build-time environment variable `PUBLIC_ZQ_CAL_CONSULTATION_URL` to the actual HTTPS event link (for example, a `/username/consultation` page on your scheduling host). No scheduling URL or credentials are bundled by default. Redeploy to apply the URL.
4. When configured, "Book a Call" appears in desktop/mobile navigation, and `/book-consultation/` links to that event. Without the variable, the navigation link is hidden and the page directs customers to the existing quote form or phone.
5. Test the event end-to-end: Adelaide time zone, slot availability, emails, rescheduling/cancellation, and data privacy. A consultation **does not reserve a removal truck or crew**, approve a quote, or authorise a payment.

The calendar CTA intentionally does not fire `generate_lead` or `zq_quote_submitted`. Those quote acceptance events belong only to the existing quote flow. Do not conflate a calendar appointment with an accepted moving quote or confirmed job. No Google Tag Manager, Google Ads, or quote API changes are required for this optional link.
