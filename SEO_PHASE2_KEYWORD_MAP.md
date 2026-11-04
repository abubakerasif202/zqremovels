# SEO Phase 2 Keyword Strategy & Query-to-Page Mapping

Strategic keyword mapping, Google Search Console query performance analysis, striking-distance opportunities, and cannibalisation prevention for ZQ Removals Adelaide (`https://zqremovalsadelaide.com.au/`).

---

## 1. Search Landscape & Opportunity Overview

Based on recent Google Search Console exports (`data/gsc/` range 2026-10-01 to 2026-10-29 and historical quarterly exports in `adelaide-removalist-keywords.csv`):
- **Total query impressions:** ~4,943 to ~6,197 across tracked periods.
- **Organic Clicks:** 23 total page clicks (18 clicks to homepage, 2 clicks to pricing, 1 to piano, 1 to office).
- **Core Challenge:** Substantial impression share in Page 1 and Page 2 striking distance (positions 5–15), but depressed Click-Through Rate (CTR) due to:
  1. Stale or misleading snippet metadata (e.g. outdated rates on the office removals page).
  2. Fragmented search intent splitting impressions between commercial service pages and informational moving guides (e.g. "removalists adelaide prices").
  3. Formulaic suburb copy that underperformed in organic engagement.

---

## 2. Striking-Distance Keyword Opportunities (Positions 4–15)

High-demand commercial and local queries currently ranking within striking distance of the top 3 spots, requiring prioritised snippet and intent optimisation:

| Query | Impressions (GSC) | Avg Position | Current CTR | Target Canonical URL | Optimisation Action Taken in Phase 2 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`office removalists adelaide`** | 71–137 | **5.2** | 0.00% | `/office-removals-adelaide/` | Replaced legacy `"$75 and $89"` title with high-CTR commercial snippet; aligned with commercial move intent |
| **`furniture movers adelaide`** | 26 | **8.4** | 0.00% | `/furniture-removalists-adelaide/` | Strengthened furniture handling, disassembly, and truck specification copy |
| **`removalists adelaide`** | 38–103 | **10.4** | 2.63% | `/` (Homepage) & `/removalists-adelaide/` | Preserved primary brand authority on apex homepage; dedicated regional hub |
| **`removals prices`** | 63 | **12.9** | 0.00% | `/removalists-adelaide-prices/` | Resolved cannibalisation from cost guide; focused on transparent published crew rates ($110/hr & $150/hr) |
| **`local removalist unley park`** | 60 | **14.3** | 0.00% | `/removalists-unley-park/` | Cleaned up suburb access notes; fixed plural grammar and naturalised street logistics |
| **`removalists adelaide prices`** | 90–148 | **15.4** | 0.00% | `/removalists-adelaide-prices/` | Hardened clear intent boundary between published pricing page and informational cost factors guide |
| **`hyde park removalist`** | 61 | **15.5** | 0.00% | `/removalists-hyde-park/` | Retained street-level access specifics, leafy corridor parking advice, and single canonical |

---

## 3. Query Cannibalisation Resolution

Analysis of `data/gsc/latest-cannibalization.json` revealed notable impression-splitting across multiple URLs for the same commercial intents.

### Case 1: `removalists adelaide prices` & `removals prices`
- **Previous Conflict:**
  - `/adelaide-moving-guides/removalists-cost-adelaide/` received 52 impressions (pos 14.4).
  - `/removalists-adelaide-prices/` received 45 impressions (pos 17.5).
  - Both pages competed for the same commercial pricing queries, diluting ranking signals.
- **Phase 2 Intent Separation:**
  1. **Commercial Intent (`/removalists-adelaide-prices/`):** Dedicated exclusively to *direct commercial rates*, published 2-man and 3-man hourly fees, inclusions, and transparent pricing policies.
  2. **Informational Intent (`/adelaide-moving-guides/removalists-cost-adelaide/`):** Dedicated strictly to *pre-move planning factors*, explaining what influences moving duration (stairs, walking distances, lift bookings, dismantling requirements).
  3. **Internal Linking:** The guide explicitly directs users seeking actual rates to `/removalists-adelaide-prices/` via the anchor text `"Published crew rates"`, signaling canonical commercial intent to Google.

### Case 2: Brand & Local Hub Queries (`zq removals`, `removalists adelaide`)
- **Previous Overlap:**
  - Homepage (`/`) and regional hub (`/removalists-adelaide/`) both ranked for broad Adelaide removalist searches.
- **Phase 2 Intent Separation:**
  - Homepage (`/`) remains the authoritative brand entity and general Adelaide residential hub.
  - `/removalists-adelaide/` acts as the regional cluster anchor connecting northern, southern, and eastern corridor suburbs.

---

## 4. Master Query-to-Page Mapping

Below is the structured index defining primary keywords, search intent, and secondary LSI targets across core service, suburb, and guide clusters:

### 4.1 Primary & Commercial Service Clusters

| Canonical URL | Primary Target Queries | Search Intent | Secondary / LSI Keywords |
| :--- | :--- | :--- | :--- |
| `https://zqremovalsadelaide.com.au/` | removalists adelaide, adelaide removalists, moving company adelaide | Transactional / Navigational | house movers adelaide, local removalists adelaide, cheap removalists adelaide, removal company south australia |
| `https://zqremovalsadelaide.com.au/office-removals-adelaide/` | office removalists adelaide, commercial removalists adelaide, office movers adelaide | Commercial / Transactional | office relocation adelaide, workstation movers, business relocations adelaide, corporate moving services |
| `https://zqremovalsadelaide.com.au/furniture-removalists-adelaide/` | furniture removalists adelaide, furniture movers adelaide, heavy furniture moving adelaide | Commercial / Transactional | couch delivery adelaide, single item movers, antique furniture transport, furniture disassembly adelaide |
| `https://zqremovalsadelaide.com.au/house-removals-adelaide/` | house removalists adelaide, home movers adelaide, residential removalists adelaide | Commercial / Transactional | 3 bedroom house move, family home removals adelaide, full home relocations south australia |
| `https://zqremovalsadelaide.com.au/packing-services-adelaide/` | packing services adelaide, moving packers adelaide, professional packing adelaide | Commercial / Transactional | packing boxes adelaide, moving and packing service, packing and unpacking adelaide |
| `https://zqremovalsadelaide.com.au/services/piano-movers-adelaide/` | piano movers adelaide, piano removalists adelaide, upright piano transport | Commercial / Transactional | grand piano movers adelaide, digital piano relocation, heavy instrument moving |
| `https://zqremovalsadelaide.com.au/removalists-adelaide-prices/` | removalists adelaide prices, removalist rates adelaide, removals prices | Commercial Investigation | 2 men and a truck cost, hourly removalist rates adelaide, affordable removalists adelaide |
| `https://zqremovalsadelaide.com.au/same-day-removalists-adelaide/` | same day removalists adelaide, urgent movers adelaide, emergency removalists adelaide | Transactional | last minute moving adelaide, short notice removalists south australia |

### 4.2 Local Suburb Cluster (Sample of Existing 40 Suburbs)

| Canonical URL | Primary Target Queries | Search Intent | Local Logistics Angle |
| :--- | :--- | :--- | :--- |
| `/removalists-unley-park/` | local removalist unley park, removalists unley park | Local Transactional | Historic estate driveway access, wide treelined verges, walking distances |
| `/removalists-glenelg/` | removalists glenelg, removalist glenelg sa | Local Transactional | Coastal apartments, Moseley Square pedestrian zones, service lift loading |
| `/removalists-norwood/` | removalists norwood, norwood removalists adelaide | Local Transactional | Parade-adjacent narrow residential streets, heritage cottage door clearances |
| `/removalists-marion/` | removalists marion, marion furniture movers | Local Transactional | Southern suburban thoroughfares, single-level family homes, driveway parking |
| `/removalists-salisbury/` | removalists salisbury, salisbury removalists | Local Transactional | Northern corridor estates, heavy garage/shed contents, broad arterial access |
| `/removalists-hyde-park/` | hyde park removalist, removalists hyde park | Local Transactional | King William Road fringe, leafy residential avenues, overhanging tree canopy clearances |
| `/removalists-medindie/` | removalists medindie, luxury home movers medindie | Local Transactional | Large residential estates, secure gate entries, formal furniture handling |
| `/removalists-north-adelaide/` | removalists north adelaide, north adelaide movers | Local Transactional | Multi-level townhouses, tight on-street parking, council permit awareness |
| `/removalists-prospect/` | removalists prospect, prospect removalists | Local Transactional | Character bungalow access, rear laneway access, driveway loading |

### 4.3 Editorial Planning Guides Cluster

| Canonical URL | Primary Target Queries | Search Intent | Conversion Route |
| :--- | :--- | :--- | :--- |
| `/adelaide-moving-guides/removalists-cost-adelaide/` | how much do removalists cost adelaide, moving cost calculator adelaide | Informational | Links to `/removalists-adelaide-prices/` for live booking rates |
| `/adelaide-moving-guides/hourly-vs-fixed-rate-removalists-adelaide/` | hourly vs fixed rate removalists, fixed quote removalists adelaide | Informational / Comparison | Links to `/removalists-adelaide-prices/` and quote form |
| `/adelaide-moving-guides/prepare-house-move-adelaide/` | how to prepare for house move adelaide, moving checklist south australia | Informational | Links to `/house-removals-adelaide/` and `/packing-services-adelaide/` |
| `/adelaide-moving-guides/moving-heavy-furniture-adelaide/` | moving heavy furniture tips, how to move a piano adelaide | Informational | Links to `/services/piano-movers-adelaide/` and `/furniture-removalists-adelaide/` |

---

## 5. Ongoing Monitoring Protocol

1. **GSC Query Tracking:** Track weekly impressions and clicks for `office removalists adelaide` following the metadata change. Expected outcome: Increased snippet click-through from Page 1 position 5.
2. **Intent Cannibalisation Check:** Verify whether `removalists adelaide prices` consolidates clicks onto `/removalists-adelaide-prices/` over the next 30-day reporting window.
3. **No Index Bloat:** Maintain strict 79-URL sitemap boundaries. No synthetic suburb or doorway pages should be created without verified commercial operations.
