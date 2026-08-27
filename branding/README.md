# Branding assets

`ab-digital-solutions-watermark.webp` — official AB Digital Solutions logo used by the
footer developer credit (`site-src/data/agency-credit.mjs`).

Requirements for the asset:

- transparent background, gold artwork preserved, original proportions
- intrinsic size roughly 336x80 (rendered at 168x40 CSS px, 2x for retina)
- optimized WebP (PNG is also accepted — update `agencyCredit.logo` if so)

While the file is absent the footer renders a restrained `AB Digital Solutions`
wordmark instead; adding the file switches to the artwork automatically at build time.
