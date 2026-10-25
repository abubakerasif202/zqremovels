# Conversion measurement and consent audit (2026-10-25)

Scope: read-only. Nothing in GTM, Google Ads, Search Console or the consent policy was changed.
Method: the real published GTM container (`GTM-WJGKPXFL`, version 6) run in a test browser against production
pages, with `POST /api/quote/` mocked and every Google measurement request **aborted** (recorded, never sent).
Reproduce with `scripts/capture-conversion-requests.mjs` and `scripts/verify-ads-conversion.mjs`.

## 1. Why one accepted quote shows three Google conversion requests

One accepted quote (consent granted) produced, in order, on `/thank-you/` (the accepted receipt is handed over
there so the redirect cannot cancel the request):

| Layer | What happened | Count |
|---|---|---|
| dataLayer | `zq_quote_submitted` (`form_name=quote_form`, `submission_status=accepted`, `submission_id`=UUIDv4) | 1 |
| dataLayer | `generate_lead` (same id). No GTM trigger uses it; trigger 1 requires `zq_quote_submitted` | 1, unused |
| GTM tag firing | Google Ads conversion tag `18413688842` / label `aMLuCIvzzZUdEIqwqsxE` (`once_per_event`) | 1 |
| Network | `googleadservices.com/pagead/conversion/…` (GET), `googleadservices.com/ccm/conversion/…` (GET), `google.com/pagead/1p-conversion/…` (POST) | 3 (sometimes 2) |

The three requests are **one conversion sent over several transports**, not duplicates:

- they leave within about 5ms of each other (+1443, +1444, +1448 ms in the captured run);
- they carry the identical `random` (1792928555614), `oid` (the submission UUID), `label`, `gtm` and `gcs` values;
- the number of transports varies between runs (3 in one capture, 2 in another, as the first-party request depends on
  the first-party cookie), so counting hits is not a reliable measure of conversions.

Other Google requests seen (`ccm/collect` page_view, `analytics.google.com/g/collect`) are Google tag / GA4 page-view
pings, not conversions.

### De-duplication layers
1. **Site (verified):** `trackFormSuccess` dedupes by id (in-memory set plus `sessionStorage`); double submit, back and reload
   each produce one event (`verify-ads-conversion.mjs`, 20 scenarios).
2. **GTM (verified: does NOT dedupe):** pushing the same accepted event twice made the tag fire twice (different `random`,
   same `oid`). The site layer is therefore what protects against double firing.
3. **Google Ads (documented, not verifiable here):** conversions with the same transaction ID (`oid`) are de-duplicated by
   Google Ads. This session has no access to the Ads account, so recorded conversions could not be checked.

### Manual checks (need account access; not done)
- Ads > Goals > Conversions > the quote conversion action: confirm **Count = One** and that the tag status is "Recording conversions".
- Compare Ads conversions with real enquiries over the same dates (the only valid evidence of correct counting).

## 2. Consent audit

Defaults are set before any optional tag (`consent default`, all four signals `denied`) and updated from the stored
choice (`zq_consent_v1` cookie, 180 days). GTM is loaded only when the visitor has chosen analytics **or** advertising.

Correction to an earlier statement: the accepted-quote gate is `analytics || advertising` (`optionalTrackingAllowed`), **not**
both. The condition `ad_storage && analytics_storage` (`attributionStorageAllowed`) only controls whether UTM and click-ID
values are saved into the enquiry payload.

Measured with the real container (accepted quote, mocked):

| Visitor choice | GTM loaded | Site event | Ads conversion requests | `gcs` | GA4 collect |
|---|---|---|---|---|---|
| analytics + advertising | yes | 1 | yes (2-3) | G111 | yes |
| advertising only | yes | 1 | yes (2) | G110 | no |
| analytics only | yes | 1 | yes (1, cookieless) | G101 | no |
| neither / no choice | no | 0 | 0 | n/a | no |

Findings:
- **Advertising-only measurement is already supported.** Advertising consent alone fires the accepted event and the Ads
  conversion; analytics consent is not required for it.
- **Analytics-only visitors still send a cookieless Ads conversion ping** (`gcs=G101`, advertising signals denied). This is
  Google's consent-denied behaviour, but it means Ads receives a signal from a visitor who declined advertising. This needs
  a privacy/legal decision; options: accept (it is the documented cookieless ping), or stop the site pushing the accepted
  event unless advertising is granted (a small change to `optionalTrackingAllowed` for this event only).
- **Attribution capture needs both categories.** Advertising-only visitors do not get UTM/click-ID values stored into the
  enquiry record. Relaxing `attributionStorageAllowed` to advertising-only for click-IDs is technically possible.
- **Advanced Consent Mode is not active** (nothing loads before a choice), so visitors who decline everything are never
  modelled. Enabling it needs a GTM change plus policy updates.

Required before changing anything: privacy-policy review of what each category covers, a legal view on the cookieless ping
for analytics-only visitors, and approval to alter GTM or the gate. None of these were actioned.

## 3. Remaining mobile LCP (measured, no change shipped)

- Homepage CSS: 153.5KB raw, 27.5KB gzip, 23.3KB brotli. Vercel serves brotli.
- Rules touching the first viewport (mobile only): 70.7KB raw / 13.1KB gzip (493 of 1,354 rules); union with desktop widths:
  90.9KB / 16.5KB gzip. The design system touches about half the sheet above the fold.
- Controlled A/B (5 interleaved Lighthouse mobile runs each): current CSS LCP 2,425ms, perf 0.80; inline critical CSS plus
  async full sheet LCP 2,539ms, perf 0.73, +13KB. No gain, so it was not implemented.
- Fonts: Inter and Fraunces are Latin-only subsets and the CSS uses weights 500-900, so there is no axis to trim.
  Dropping the Fraunces preload site-wide cut office LCP by about 450ms but raised desktop CLS to 0.019; rejected.
- Shipped earlier (PR #73): 51KB mobile hero image and no footer-only font preload on the homepage.
