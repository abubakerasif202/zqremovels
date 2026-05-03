# SEO V7 Roadmap From Audit

## Goal

Build the next growth layer after SEO V5 and V6 by improving trust readiness, hyperlocal authority, route-specific interstate intent, AEO formatting, B2B office intent, and schema guardrails.

## Pages Affected

- `/about/`
- `/contact-us/`
- Footer on all standard pages
- Priority suburb pages: Glenelg, Salisbury, Adelaide CBD, Marion, Norwood
- New route pages for Sydney, Melbourne, Western Sydney, and Smithfield NSW
- Office removals and office relocation pages
- Cost, quote, fixed-price, guide, and interstate pages

## Exact Implementation Rules

- Use source data and generator helpers in `site-src/data/seo-v4.mjs`.
- Keep `site-dist/` generated only.
- Use the apex canonical host `https://zqremovals.au`.
- Add visible FAQ before adding FAQPage schema.
- Use Article schema only for guide pages.
- Keep route pages phrased as Adelaide-origin interstate removals.

## Unsafe Claims To Avoid

- No fake insurance details.
- No fake AFRA accreditation.
- No AggregateRating schema without verified review data.
- No NSW office or Melbourne office claims.
- No doorway pages.
- No keyword stuffing.

## Follow-Up Actions

- Confirm insurance and AFRA facts with the owner.
- Review Search Console impressions for new route pages after indexing.
- Expand hyperlocal sections only when the suburb has a distinct logistics angle.

## Owner Confirmation Required

- Insurance provider and coverage wording.
- Public liability amount.
- Goods-in-transit wording.
- AFRA status, if any.
