# Keyword and search-intent review

Reviewed 27 October 2026. Sources: `site-src/`, the generator, rebuilt HTML, the supplied `sc-domain_zqremovalsadelaide_com_au_20261025_182506/` export, and `adelaide-removalist-keywords.csv`. Performance dates: 25 July–22 October 2026; exported 25 October. These are historical observations, not current rankings or evidence of improvement after these edits.

## Findings and fixes

- Suburb titles previously selected a promotional suffix using a character-code hash. Replaced that with a consistent location, service and brand title. Retained existing editorial overrides and their published pricing or location distinctions.
- Default suburb descriptions repeated the location and could produce “Port Adelaide Adelaide”. They now explain the local moving angle once and request inventory and access details.
- Default Canberra and Perth descriptions repeated Adelaide after already naming the route. Removed the second origin reference.
- Five surviving generated guides now have descriptions specific to their actual advice, rather than shared access/timing boilerplate.
- The guide renderer previously ignored intent profiles in `zq-blog-guides.mjs`, although metadata used them. It now uses the shared profile accessor for consistent topic and supporting copy.
- Generated guide FAQ headings no longer concatenate an already localized topic with another “in Adelaide”. Suburb introduction headings now describe the planning task directly.
- Suburb quick answers previously linked twice to aliases that both resolve to the prices page. They now distinguish crew rates, the educational cost guide and the quote form.
- The suburb service-card fallback linked office removals from residential locations regardless of intent. Office cards and shared location-link fallbacks now follow the existing `hasOffice` profile flag. This also prevents generic office targeting on the Queens Park NSW interstate enquiry page and the Adelaide Hills page without a commercial profile. Service descriptions explain the task instead of repeating the linked keyword. The existing office-linking TODO is promoted to an enforced regression test.

No new landing pages, keyword schema, locations, ratings or service promises were added. Existing canonical routes and redirects remain in place.

## Search Console evidence and priorities

The property summary reports 41 clicks, 7,729 impressions and 0.53% CTR. Query rows contain 20 clicks and 6,623 impressions; page-query rows contain 20 clicks and 6,952 impressions. Use each table at its own aggregation level; do not add them or treat their totals as interchangeable. All 79 inspected URLs were reported as submitted and indexed in this snapshot. Inspection and performance exports describe different aspects of search visibility.

| Query | Impressions | Clicks | Average position | Existing target and assessment |
| --- | ---: | ---: | ---: | --- |
| office removalists adelaide | 137 | 0 | 6.197 | `/office-removals-adelaide/`; strongest immediate snippet/conversion monitoring opportunity. Keep commercial access and restart planning distinct from house moving. |
| removalists adelaide prices | 148 | 0 | 21.919 | `/removalists-adelaide-prices/`; cost guide also appears for this query. Prices should own published crew rates; the guide should explain variables affecting time. |
| hyde park removalists | 111 | 0 | 11.811 | `/removalists-hyde-park/`; retain the existing specific home-access and published-rate content. |
| piano removalists adelaide | 105 | 0 | 84.019 | `/services/piano-movers-adelaide/`; weak visibility warrants monitoring and genuine service evidence, not more exact-match repetitions. |
| piano movers adelaide | 101 | 0 | 82.475 | Same piano page; use dimensions, piano type and access assessment to qualify enquiries. |

For `removalists adelaide prices`, page-query rows show the cost guide at 53 impressions/position 14.415 and the prices page at 108/26.343. This is a possible intent-overlap signal, not proof of harmful cannibalization. Both pages already have distinct purposes and reciprocal links; retain both and monitor which page receives transactional queries after recrawling.

The export also shows Toorak Gardens searches reaching Allenby Gardens and Kensington Gardens URLs. The dedicated Toorak Gardens page exists in the current build. Check a fresh page-query export before making further geographic redirects: historical query matches alone do not establish the right consolidation target.

## Keyword ownership and entity map

`SEO_KEYWORD_MAP.csv` maps all 87 supplied keywords to 22 existing indexable owners, supporting pages, review priorities and concrete actions. All 87 keywords and their clicks, impressions and average positions were cross-checked against the raw GSC query export with no mismatches. The seven supplied clusters contain 30 suburb/region, 26 interstate, 12 pricing, 8 office, 6 local/core, 3 piano and 2 furniture terms. The input is a selected subset of GSC queries, not a complete keyword universe or monthly-volume dataset. “Review snippet and intent first” identifies queries with at least 20 historical impressions and an average position of 20 or better; this is a triage rule, not an SEO score.

Original query strings and statistics are preserved. Two pricing queries begin with a literal quotation mark; the map retains those originals and provides a cleaned editorial form separately. Their statistics are not merged into similarly worded queries. Eight reverse-direction interstate searches are marked for operational review and assigned to the broad interstate enquiry hub, rather than falsely describing inbound service on an outbound route page. No new routes or reciprocal-service claims were created from these queries.

| Cluster / primary target | Intent | Secondary phrases | Concepts that answer the enquiry |
| --- | --- | --- | --- |
| Homepage: Adelaide removalists | Broad commercial discovery | Adelaide movers; moving company Adelaide; local moving services | Move types, crew options, service coverage, quote details |
| Adelaide hub: removalists Adelaide | Local service selection | Adelaide metro removals; suburb-to-suburb moves; local movers Adelaide | Regional hubs, service selection, origin/destination access |
| Prices: removalists Adelaide prices | Transactional pricing comparison | removalist hourly rates; moving quote Adelaide; crew rates | Crew size, billing increments, travel/call-out charges, inventory |
| Cost guide: removalist cost factors | Informational research | what affects moving costs; moving time estimate; access costs | Stairs, lifts, carry distance, packing scope and elapsed time |
| Office: office removalists Adelaide | Commercial relocation enquiry | office relocation Adelaide; commercial movers; business removals | Workstations, IT equipment, loading docks, lift windows, restart sequence |
| House: house removals Adelaide | Full-home service enquiry | house removalists Adelaide; home movers; residential removals | Room inventory, garage contents, utilities, keys and unloading order |
| Furniture: furniture removalists Adelaide | Item-handling enquiry | furniture movers; bulky-item moves; single-item removals | Dimensions, dismantling, fragile finishes, doorways and carrying path |
| Packing: packing services Adelaide | Preparation service enquiry | moving packing help; fragile packing; room-by-room packing | Cartons, labels, packing order and agreed materials/scope |
| Piano: piano movers Adelaide | Handling assessment | piano removalists Adelaide; upright piano moving; digital piano moving | Piano type, dimensions, stairs, landings, doors and access photographs |
| Suburbs: [suburb] removalists | Location-specific service enquiry | movers in [suburb]; house moves in [suburb]; furniture moves in [suburb] | Existing local road/property/access details, relevant regional hub and services |
| Guides: the actual planning question | Informational preparation | moving house checklist; when to book movers; furniture preparation | Practical sequence, building rules, booking constraints and service next step |

The homepage and hub naturally share vocabulary. Their purpose and conversion paths matter more than forcing mutually exclusive words. Each suburb retains its geographic intent. The older `/guides/` variants already emit `noindex,follow`; they are excluded from keyword inventory and are not additional indexable competitors.

## Semantic phrase bank

These are 28 editorial suggestions, not search-volume estimates, mandatory insertions or an “LSI” ranking mechanism. Use them only where the corresponding concept is useful and factually supported:

| Group | Related phrases |
| --- | --- |
| Local / home | local Adelaide movers; suburb-to-suburb move; family-home relocation; apartment moving access |
| Quote / costs | removalist crew rates; moving quote checklist; call-out and travel charges; estimated moving time |
| Access | service-lift booking; loading-zone access; truck parking; furniture carry distance |
| Packing | room-by-room packing; fragile-item preparation; labelled moving cartons; essentials box |
| Furniture | furniture dimensions; dismantling and reassembly scope; doorway clearance; bulky-item handling |
| Office | office relocation checklist; workstation inventory; IT equipment labelling; business restart sequence |
| Interstate / piano | interstate pickup and delivery windows; destination access notes; upright piano dimensions; piano access assessment |

## Placement and content checklist

- Keep the main service/location clear in the title and opening copy. Use a readable H1; do not force the exact phrase when “removals”, “removalists” or a natural word order better suits the sentence.
- Keep descriptions specific to the page's answer, with no invented superlatives or unsupported service guarantees.
- Use headings for decisions and tasks: access, packing order, quote inclusions, inventory and handover. Repeating the same city/service phrase in every heading adds little value.
- Use contextual service, hub and quote links. Avoid sending different keyword anchors to the same destination within one small block.
- Explain entities in context; do not publish lists of synonyms, nearby places or “near me” terms to chase a density percentage.
- Existing guides can address questions such as “What should a moving quote include?”, “When should I book a lift?”, “How do I compare crew rates?” and “What piano measurements are needed?”. Concise direct answers and practical lists are appropriate; featured snippets, PAA appearances and voice-search visibility are not guaranteed.
- Do not change schema types merely to insert keywords. Keep structured answers consistent with visible advice.

Google advises useful, people-first content and identifies excessive repetition as keyword stuffing. This review does not treat the skill's 0.5–1.5% range as a ranking requirement. Sources: [Search Essentials](https://developers.google.com/search/docs/essentials), [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), [spam policies](https://developers.google.com/search/docs/essentials/spam-policies).

## Competitor context

Primary service pages reviewed during this run: [Kent Adelaide](https://www.kentremovalsstorage.com.au/removalists-adelaide-removals), [Allied Adelaide business relocations](https://www.allied.com/au/business/adelaide), and [Grace Adelaide](https://www.grace.com.au/location/adelaide/). Kent discusses packing and moving preparation; Allied emphasizes business planning, equipment handling and operational continuity; Grace distinguishes commercial moving and removals in its Adelaide services. These support a task-based entity map. They do not establish search volumes, ranking causality or services that ZQ can claim. Competitor storage networks, transport options and credentials must not be copied into ZQ claims.

## Reproduce the checks

From `C:\Users\abuba\zqremovels`, using Windows Node 22:

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run seo:validate
npm.cmd run seo:keywords
node --test tests/keyword-strategy.test.mjs
node scripts/keyword-audit.mjs | Out-File -Encoding utf8 SEO_KEYWORD_AUDIT.json
```

The audit measures case-insensitive, whole-token phrase occurrences in `<main>` divided by main-content word tokens, multiplied by 100. It excludes scripts, styles, templates and comments, but includes breadcrumbs, FAQs and supporting link blocks within main. It does not evaluate CSS visibility. Inflections and reordered words are separate phrases. Assigned targets are explicitly marked; remaining targets are inferred from titles and need editorial interpretation. Low or zero exact-match density is not automatically a defect. Noindex/refresh pages are excluded; missing canonicals or main content fail the audit.

## Validation results

- `npm.cmd run build`: passed on Windows Node 22.23.1.
- `npm.cmd test`: quote API smoke checks passed; all 463 tests across 47 files passed, with zero failures, skips or TODOs.
- Focused keyword and page-targeting checks: 23 passed, including the previously failing office-linking guard and the two generic location fallbacks.
- `npm.cmd run seo:validate`: passed for 108 generated pages; zero bad pages. The sitemap contains 79 page URLs across four page sitemaps; redirect and noindex exclusions passed.
- `node scripts/keyword-audit.mjs`: passed. Full output is saved in `SEO_KEYWORD_AUDIT.json`; the main content of each of the 79 indexable pages has one H1, and metadata/canonical duplicate checks passed.
- Keyword map: all 87 source rows match the raw query export; all 22 selected owners and their supporting pages resolve to current indexable canonical routes.
- Syntax checks and `git diff --check`: passed. Existing unrelated untracked files and the supplied datasets were preserved.
- Live HEAD checks: apex loaded successfully; `www` resolved to apex; the legacy office-removalists URL resolved to the office-removals page. These checks verify existing live routing, not deployment of these edits.

Release state at review completion: these edits were local and had not been deployed. Reassess query-to-page distribution and CTR in Search Console after release and sufficient recrawl time; no ranking improvement is claimed. Eight inbound interstate query variants still need operational coverage confirmation before any specific reciprocal-service content can be added.

## Final exact-phrase inventory

The generated audit contains 79 indexable pages. There are 0 duplicate canonical/title/description groups. Compared with the baseline build, 30 titles and 35 descriptions changed. Contextual office links now appear in the main content of 8 suburb pages; global navigation is outside this count.

The following assigned targets illustrate the measurement; the JSON contains the full per-page inventory, inferred-target labels and title/description/H1 placement checks. Zero exact matches can reflect a natural variant, such as “house removals” instead of “house removalists”, and do not require keyword insertion.

| Route | Primary phrase | Main words | Uses | Phrase density |
| --- | --- | ---: | ---: | ---: |
| `/` | Adelaide removalists | 1564 | 3 | 0.192% |
| `/apartment-removalists-adelaide/` | apartment removalists Adelaide | 1581 | 7 | 0.443% |
| `/cheap-removalists-adelaide/` | cheap removalists Adelaide | 1025 | 2 | 0.195% |
| `/furniture-removalists-adelaide/` | furniture removalists Adelaide | 4394 | 7 | 0.159% |
| `/house-removals-adelaide/` | house removalists Adelaide | 2231 | 0 | 0.000% |
| `/interstate-removals-adelaide/` | interstate removalists Adelaide | 2426 | 1 | 0.041% |
| `/office-removals-adelaide/` | office removalists Adelaide | 2517 | 1 | 0.040% |
| `/packing-services-adelaide/` | packing services Adelaide | 1762 | 6 | 0.341% |
| `/removalists-adelaide-prices/` | removalists Adelaide prices | 1661 | 2 | 0.120% |
| `/removalists-adelaide/` | removalists Adelaide | 2877 | 8 | 0.278% |
| `/services/piano-movers-adelaide/` | piano movers Adelaide | 2014 | 6 | 0.298% |
