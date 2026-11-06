# Competitor gap report: ZQ Removals vs HF Removals and Adelaide competitors

Observation date: 2026-11-06. Evidence rows with source URLs: `docs/seo/competitor-observations.csv` (row ids cited as [#n]).

## Method and limits

- 6 WebSearch queries (standard mode), then 25 page fetches via a plain HTTP script (title, meta description, H1, JSON-LD @type, word count, price strings). The 6 ZQ pages in the brief plus the Malvern and Unley Park pages were fetched; HF 5 pages; 3 Ready Movers; 2 Transcorp; 7 other sites.
- SERP results are "observed in this session only". The search tool is not a rank tracker, returns unpersonalised results in a tool-chosen order, and the first pass for most queries was dominated by directories (Airtasker, Oneflare, Muval, Upmove, Selectra). I did not treat list order as rank. A second pass with aggregators blocked surfaced the company sites listed in [#2], [#4]; that filter distorts the list.
- Review counts, years in business and insurance values are **page claims**, not verified against Google or an insurer.
- Not measured (unverified): competitor rankings, traffic, backlinks/domain authority, GBP position, Core Web Vitals, structured-data validity beyond @type presence, pages other than those fetched. "No `<form>` element" means none in the server HTML; a JS-injected form is not excluded.
- The brief's HF URL `hfremovalsadelaide.com` redirects to `https://www.hfremovalsadelaide.com.au/` [#16].

## Observed competitor set (this session)

| Query | Company sites seen | Aggregators seen |
|---|---|---|
| removalists adelaide | HF, Ready Movers, Complete, W.E. Hughes, CBD Movers, Door 2 Door, SA Removals, Grace, No Limits, Transcorp | Oneflare, Airtasker, Selectra, Upmove, Surequote, Find a Mover, Word of Mouth |
| office removalists | Ready Movers, Black Gold (via Oneflare), Total Removals (via Houzz) | Airtasker, Gust, Mind42 |
| piano movers | Powell, DC Piano Moves, Best Movers Adelaide, Delco, Team, Last Minute, Same Day, Rmoverz, AtoB | uShip, Airtasker, Yellow Pages, Find a Mover |
| prices | Ready Movers | Muval, Upmove, Homely, Selectra, MoveAdvisor, whatsthedamage |
| hyde park / malvern | none identified (Transcorp Malvern page is Malvern VIC [#28]) | Muval, Airtasker |

Recurring company domains used for page comparison: HF, Ready Movers, Best Movers Adelaide, DC Piano Moves, Powell, CBD Movers, Door 2 Door.

## Comparison by dimension

| Dimension | ZQ | HF | Others observed |
|---|---|---|---|
| Landing-page quality | 1,450-3,290 words per money page; clear H1s; each page has a rate line and FAQ | 900-3,100 words; homepage truck chooser, quote form, pricing page | Ready Movers ~2,200-3,400; piano specialists 1,160-2,100 |
| Keyword-to-page targeting | One page per target (piano, office, prices, 3 suburbs); titles carry the keyword | Service pages (furniture, office, residential...), `/pricing`; **no** piano, Malvern, Hyde Park or Unley Park page seen [#20] | Piano specialists target one term per site; Ready Movers has city-specific office page |
| Service architecture | Services + suburb hubs + guides; 8+ suburb-pattern links on home | 6 services, 4 interstate routes, 18 northern suburbs only | Complete Removals: 18 suburb-pattern links |
| Content usefulness | Planning, access, hypothetical cost examples | Planning guide + FAQ; shorter | Ready Movers cost guide has per-m3 numbers; Best Movers shows piano price points |
| Internal linking | Suburb/neighbour links, cross-service | `/areas/*` northern cluster | Ready Movers heavy nav (85-103 links) |
| Trust / credibility | 94 Google reviews at 5.0 (claimed), ABN, transit/insurance wording; suburb and piano pages show no review count | **472** reviews at 5.0 and "up to $1M" insurance (claimed) [#18] | Best Movers 1,203+ (claimed); Ready Movers 3,389 / 300+ / 2,000+ (inconsistent on own pages [#25-27]); AFRA on Ready Movers, Hughes, Transcorp |
| Local relevance | Suburb pages with parking/access content | Northern suburbs only | Aggregators carry the central-suburb SERPs observed |
| Structured data | MovingCompany, Service, Offer, FAQPage, Breadcrumb on all money pages; no AggregateRating | MovingCompany, FAQPage, OpeningHours, Geo on home | CBD Movers, Hughes use AggregateRating; Best Movers uses UnitPriceSpecification |
| Conversion path | Phone `0433 819 989`; form on homepage; money pages link to quote path (no `<form>` in HTML on 7 of 8 pages fetched) | Phone, home form, `/book` | Piano sites have 1 form on page |
| Prices | Published: $75/30 min (2 men), $89/30 min (3 men); 30-min billing, call-out explained | Published: $69/30 min but 3-hour minimum + 1-hour call-out [#17] | Door 2 Door and Best Movers publish $55/30 min [#32,#35]; Ready Movers publishes per-m3 interstate only |

Rate arithmetic from page text: ZQ $75/30 = $150/h and $89/30 = $178/h; HF $69/30 = $138/h before its minimum/call-out; Door 2 Door and Best Movers $55/30 = $110/h. ZQ is the highest advertised headline rate among those that publish one in this sample. Whether that loses clicks is untested.

## Gap lists for the six target pages

GSC source: `page_queries.csv` (760 rows; export period not stated in the file) [#37-42]. Hypotheses are testable; effort is relative (S/M/L). Rank = impact / effort.

### 1. Piano movers (`/services/piano-movers-adelaide/`): 1 click, 1,564 impr, pos 30-84

Competitors have that ZQ lacks (demonstrated):
- Dedicated specialist positioning (Powell piano-only, DC Piano Moves with 25 years/+100 reviews claimed) and, on Best Movers, published piano price points and `UnitPriceSpecification` [#30-32].
- ZQ shows only the generic $75/$89 rate; no piano price or surcharge text found [#11].

ZQ has that they lack: longer page (2,677 words vs 1,160-2,100), Service/Offer/FAQ schema (Powell has WebSite only).

Hypotheses:
1. (High/S) Adding a piano-specific price line or range, once ZQ has a real figure, will lift CTR for "piano movers adelaide" (currently pos 73, so CTR effect is unmeasurable until rank improves). Needs owner input; do not invent a number.
2. (High/M) Near-me/"piano movers" intents (pos 30-62) need a local entity signal: GBP service listing for pianos and 2-3 real photos/jobs. Fixable only partly in code.
3. (Med/S) Review count/rating on the page: none shown; competitors state counts.

### 2. Office removals (`/office-removals-adelaide/`): 0 clicks, 1,303 impr

Competitors have: Ready Movers states AFRA accreditation, depot location, fixed-quote promise and an "Accreditations" section [#26]. HF office page has no form either, so a form is not the differentiator [#22].
ZQ has: rate line, cost breakdown heading with figures, IT/dock/lift detail, 2,914 words.
Evidence: "office removalists adelaide" is already pos 6.0 (150 impr, 0 clicks): a CTR/snippet problem, not a ranking problem. Broad "office removalists/removals" are pos 33-68.

Hypotheses:
1. (High/S) Rewriting title/meta for the pos-6 query to carry a concrete differentiator (published rate, lift/dock checks) will raise CTR above 0 over 4 weeks. Metric: GSC CTR for that query.
2. (Med/M) A visible "what we need for a quote" checklist and an on-page quote form (Ready Movers pattern) will raise quote-start rate. Metric: form starts per 100 sessions.
3. (Low/L) Broad head terms need authority, see "cannot fix" below.

### 3. Prices (`/removalists-adelaide-prices/`): 0 clicks, 801 impr, pos 23 for the head term

Competitors have: aggregators dominate this SERP in-session and supply market averages (about $140-150/h quoted by Muval/Upmove, unverified) [#5]. Ready Movers has a cost guide with per-m3 tables [#27]. HF publishes rates plus a pricing explanation page [#21].
ZQ has: one of the few company-owned hourly-rate pages with 30-minute billing and worked examples.
Gap: ZQ's $150/h headline is above HF's $138/h and the $110/h crews; the page does not explain what the higher rate includes versus cheaper rates that add minimums/call-outs.

Hypotheses:
1. (High/S) A "what is included vs minimums and call-outs" comparison block (describing how charges are structured, not naming competitors) will improve engagement on "cheap removalists adelaide" and "hourly rate" queries (pos 36-42).
2. (Med/S) Adding a price-range-by-home-size table sourced from ZQ's own jobs (not aggregator averages) will earn more long-tail impressions. Needs ZQ job data.
3. (Med/S) Title/meta already carry rates; test "2026" and "per hour" wording against pos 14.6 "removals prices".

### 4. Malvern (`/removalists-malvern/`): 0 clicks, 848 impr, pos 27-32

Competitors have: in-session SERP shows Muval/Airtasker plus Malvern VIC firms; no Adelaide removalist company page identified [#6, #28]. HF has no Malvern page [#20].
ZQ has: "SA 5061" in title and H1, 1,977 words, Service/Offer/FAQ.
Gap: Malvern is ambiguous with Malvern VIC; position ~30 means page 3. Unclear whether the page lacks authority or lacks a distinguishing local signal.

Hypotheses:
1. (Med/S) Adding 2-3 verifiable Malvern/Unley-border facts (e.g., Unley Road access, specific street types, nearby landmarks only if accurate) and linking Malvern from Hyde Park/Unley Park/Unley hub pages will lift pos by 5+ in 6 weeks.
2. (Med/S) Add `areaServed` with Malvern SA 5061 to the Service JSON-LD (already uses Service/Offer).
3. (Low/M) Third-party local mentions (SA directories) to establish the Adelaide Malvern entity: off-site.

### 5. Hyde Park (`/removalists-hyde-park/`): 0 clicks, 754 impr, pos 10-12

Close to page 1 on six near-identical head terms. Unley Park page also appears for "hyde park removalist" at pos 23 [#42]: possible overlap, not proven cannibalisation. Competitor suburb pages not identified; HF has none [#20].

Hypotheses:
1. (High/S) Pos ~11 with 0 clicks means page-2 residency; one more ranking position band needs internal links with varied anchors from the Adelaide, Unley, Malvern and prices pages. Metric: pos <= 9 in 4 weeks.
2. (Med/S) Distinguish Hyde Park from Unley Park content (unique access notes) to remove the overlap.
3. (Med/S) Add on-page review count (94 claimed) to the suburb template; suburb pages currently show none [#13].

### 6. Unley Park (`/removalists-unley-park/`): 0 clicks, 521 impr, pos 12-14

Same pattern as Hyde Park: page-2 residency on six head terms, thinnest page (1,455 words), no review line, FAQ in schema but no visible Q&A heading found in my text match. No competitor page identified in SERP.

Hypotheses:
1. (High/S) Internal links to this page from Unley, Malvern, Hyde Park and the central hub, with natural anchors, will move it to page 1. 
2. (Med/S) Expand to match Hyde Park's depth (1,900 words) with Unley Park-specific access detail, avoiding duplication with Hyde Park.

## Advantages ZQ cannot fix in code

- Domain authority and backlinks (not measured; competitor profiles unverified).
- Review volume: 94 (claimed) vs 472 (HF), 1,203+ (Best Movers), 3,389 (Ready Movers), all claimed. Review growth needs customers and a request process.
- Google Business Profile prominence: map-pack position, categories, photos, Q&A, service areas. Manual action list is `docs/seo/manual-gsc-gbp-actions.md`.
- Age/credibility claims (25-60+ years) and AFRA accreditation (a membership application, not code).
- Aggregator dominance on generic and suburb SERPs.

## Fixable by ZQ in code/content

- Title/meta tests on the pos-6 office query and pos 10-14 suburb terms.
- Visible review count/rating on suburb, piano and price pages (only the real figure, no AggregateRating without verifiable review source).
- Piano price line (owner input) and a charges-structure comparison on the prices page.
- Internal-link density and anchor variety toward Hyde Park, Unley Park, Malvern.
- Unique local facts per suburb and de-duplication between Hyde Park and Unley Park.
- `areaServed` in Service JSON-LD; office quote form or checklist.

## Priority order (impact / effort)

1. Hyde Park + Unley Park internal links and review line (S).
2. Office title/meta for the pos-6 query (S).
3. Prices page "what's included" block (S).
4. Piano price line + trust block (S, needs owner data).
5. Malvern local facts + links (S).
6. Office quote form/checklist (M).
7. Off-site: reviews, GBP, AFRA, local citations (L, not code).

Each hypothesis should be tested by changing one page at a time and comparing GSC 28-day windows before and after; causality is not established by this report.
