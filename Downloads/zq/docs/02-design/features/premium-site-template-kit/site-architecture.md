# ZQ Removals Global Site Structure

## Goal

Keep the site architecture flat, obvious, and internally linked so service hubs can pass relevance to suburb and interstate spoke pages without burying them.

## Primary Navigation

- `/`
- `/local-removals/`
- `/interstate-removals/`
- `/packing-services/`
- `/contact-us/`

## Local Removals Spokes

- `/removalists-adelaide-cbd/`
- `/removalists-marion/`
- `/removalists-salisbury/`
- `/removalists-elizabeth/`
- `/removalists-glenelg/`

## Interstate Removals Spokes

- `/adelaide-to-melbourne-removals/`
- `/adelaide-to-sydney-removals/`

## Supporting Utility Pages

- `/thank-you/`
- `/privacy/`
- `/terms/`

## Internal Linking Rules

- The header links to both hub pages directly.
- Each hub page links to every spoke in the hero support area and again in the route grid.
- Every spoke page links back to its hub page with breadcrumbs and a related-routes section.
- The footer lists all core pages, all suburb spokes, and all interstate spokes to maintain crawl depth of one click from any page.
- Homepage service blocks link to hubs first, then to the most commercially important spokes.

## On-Page SEO Pattern

- Homepage targets the broad commercial intent: Adelaide removalists, local moves, interstate moves, and packing services.
- Hub pages target category intent: local removals Adelaide, interstate removals Adelaide.
- Spoke pages target exact suburb or route intent: Adelaide CBD removalists, Adelaide to Melbourne removals.
- Each page should have a unique title tag, meta description, canonical URL, H1, and opening paragraph.

## Structured Data Recommendations

- Global: `MovingCompany`, `LocalBusiness`, and `WebSite`.
- Hub pages: `Service` plus `BreadcrumbList`.
- Route or suburb spokes: `Service`, `FAQPage`, and `BreadcrumbList`.
- Contact page: `LocalBusiness` with final NAP and opening hours if applicable.

## NAP Consistency

Replace placeholders in the templates with one exact business name, one exact street address, and one exact primary phone number. Use the identical format in:

- header contact number
- footer address block
- contact page
- Google Business Profile
- schema markup
