# AI search readiness (2026-10-30, updated)

## Technical readiness (unchanged, verified)
robots.txt allows all; 7 crawler user agents get 200 (UA test only, not IP verification); /llms.txt and /llms-full.txt exist; MovingCompany + FAQPage + Service schema on all pages; visible FAQs answer rates, call-out charge, quotes and interstate moves.

## Real platform visibility tests: NOT COMPLETED (blocked)
Target queries: best removalists Adelaide; affordable removalists Adelaide; cheap furniture removalists Adelaide; house removalists Adelaide; reliable moving company Adelaide; two men and a truck Adelaide; interstate removalists Adelaide.

| Platform | Date | Outcome |
|---|---|---|
| Perplexity | 2026-10-30 | Blocked: HTTP 403 and Cloudflare bot verification for automated fetch and headless browser. Not bypassed. |
| Bing web / Copilot | 2026-10-30 | Headless Bing returned unrelated results (Gmail help pages, Ford dealers) for all 7 queries, so the output is invalid; no usable evidence. Copilot answer text not exposed. |
| ChatGPT Search | 2026-10-30 | Not attempted: needs an authenticated interactive session. |
| Gemini / Google AI | 2026-10-30 | Not attempted: needs an authenticated session. |
| Plain web search | 2026-10-30 | Brand-name and phone queries returned no ZQ Removals results (US-only search tool; not an AI-platform test). |

**No visibility result is claimed.** Manual protocol: from a normal signed-in browser run each query once per platform and record date, platform, whether ZQ appears / is cited / is recommended, and the cited URLs. Repeat weekly for a month before drawing conclusions.

## Realistic improvements suggested by the thin evidence
The brand and phone number have almost no third-party footprint, which is what AI answers lean on. Priorities: real citations (GBP, Facebook, Oneflare, Airtasker, True Local), genuine customer reviews on GBP, and local mentions. No keyword stuffing and no further on-site content changes are warranted.
