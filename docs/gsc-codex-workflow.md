# Google Search Console Codex Workflow

This repo can use the official Google Search Console API for SEO analysis without storing secrets in git.

## Files

- `scripts/gsc-auth.mjs`
- `scripts/gsc-fetch.mjs`
- `scripts/gsc-submit-sitemap.mjs`
- `scripts/gsc-analyze-opportunities.mjs`
- `data/gsc/`

## Secret Handling

- OAuth client JSON must live at `secrets/gsc-oauth-client.json`
- OAuth tokens are written to `.gsc-token.json`
- Neither file should be committed
- Raw exports stay ignored via `data/gsc/*.raw.json`

## Default Property

- Default property: `sc-domain:zqremovals.au`
- Fallback URL-prefix property: `https://zqremovals.au/`

## Authentication

Use read-only scope first:

```powershell
npm run gsc:auth
```

That uses:

- `https://www.googleapis.com/auth/webmasters.readonly`

If write access is explicitly needed later, rerun with:

```powershell
$env:GSC_WRITE_SCOPE='1'
npm run gsc:auth
```

## Fetching Data

Fetch the last 28 days and the previous 28 days:

```powershell
npm run gsc:fetch
```

Outputs:

- `data/gsc/latest-search-analytics.json`
- `data/gsc/latest-page-opportunities.json`
- `data/gsc/latest-query-opportunities.json`
- `data/gsc/latest-cannibalization.json`
- `data/gsc/latest-summary.md`

## Opportunity Analysis

Generate action recommendations from the latest exports:

```powershell
npm run gsc:opportunities
```

Output:

- `data/gsc/codex-seo-actions.md`

Recommended actions can include:

- title rewrite
- meta description rewrite
- H1 shortening
- FAQ addition
- internal link addition
- hub page link addition
- cannibalization canonical/redirect review

## Optional Sitemap Submission

Only use when write scope is configured:

```powershell
$env:GSC_WRITE_SCOPE='1'
npm run gsc:submit-sitemap
```

By default the script submits:

- `https://zqremovals.au/sitemap.xml`

Override with:

```powershell
$env:GSC_SITEMAP_URL='https://zqremovals.au/sitemap.xml'
```

## Typical Workflow

1. Authenticate with read-only scope.
2. Fetch fresh GSC data.
3. Run opportunity analysis.
4. Review `data/gsc/codex-seo-actions.md`.
5. Only submit the sitemap if write scope is intentionally enabled.
