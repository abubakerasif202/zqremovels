# SEO V7 Trust Signals Implementation Plan

## Goal

Make ZQ Removals ready for stronger trust signals without publishing unsupported credentials. The confirmed ABN is now usable. Insurance, coverage amounts, goods-in-transit wording, and AFRA status still require owner confirmation before public claims are added.

## Pages Affected

- Global footer
- `/about/`
- `/contact-us/`
- LocalBusiness / MovingCompany JSON-LD
- Future trust blocks on service, suburb, and quote pages

## Exact Implementation Rules

- Display only this confirmed ABN: `97 954 095 119`.
- Use only this schema machine value: `97954095119`.
- Add the ABN to MovingCompany schema as `taxID` or `identifier`.
- Use the placeholder wording exactly where insurance is not confirmed: `ABN and insurance details can be added here once confirmed by the business owner.`
- If proof-of-cover wording is needed for a building manager, keep it as a request workflow, not a claim.
- Do not add AggregateRating schema unless verified first-party review data exists and the site is configured to publish it.

## ABN Placement Checklist

- Footer NAP block includes `ABN 97 954 095 119`.
- About page trust section includes `ABN 97 954 095 119`.
- Contact page trust section includes `ABN 97 954 095 119`.
- MovingCompany JSON-LD includes `97954095119`.

## LocalBusiness Schema Instructions

- `taxID`: `97954095119`
- `identifier.name`: `ABN`
- `identifier.value`: `97954095119`
- Do not add unverified licence, insurance, AFRA, review, or rating fields.

## Unsafe Claims To Avoid

- Do not invent an ABN.
- Do not invent insurance provider details.
- Do not invent public liability coverage amount.
- Do not invent goods-in-transit coverage details.
- Do not invent AFRA accreditation or membership.
- Do not invent reviews or ratings.
- Do not claim a NSW or VIC office.

## Owner Confirmation Required

- Official ABN: confirmed as `97 954 095 119`.
- Insurance provider: still required.
- Public liability coverage amount: still required.
- Goods-in-transit coverage details: still required.
- AFRA status, if any: still required.

## Follow-Up Actions

- Ask the owner for a current certificate of currency before publishing insurance details.
- Ask the owner whether AFRA membership exists before using any AFRA language.
- Keep review schema disabled until verified review data is available and configured.
