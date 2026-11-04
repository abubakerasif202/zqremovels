# SEO Phase 2 Remaining Actions & Account Follow-Up Plan

Actions requiring account access, business confirmation, or post-deployment monitoring following the Phase 2 SEO rollout for ZQ Removals Adelaide (`https://zqremovalsadelaide.com.au/`).

---

## 1. Google Business Profile (GBP) & Local Trust Roadmap

The website codebase enforces strict NAP (Name, Address, Phone) consistency and links directly to the business profile. However, full local map pack visibility requires manual administrative actions inside the Google Business Profile dashboard.

### 1.1 Tasks Requiring GBP Account Access (Manual)
1. **Primary & Secondary Category Setup:**
   - **Primary Category:** `Moving Company`
   - **Secondary Categories:** `Piano Moving Service`, `Packaging Supply Store`, `Commercial Relocation Service`.
2. **Service Area Configuration:**
   - Set service areas explicitly to: `Adelaide`, `Greater Adelaide`, `Adelaide Hills`, `City of Charles Sturt`, `City of Holdfast Bay`, `City of Unley`, `City of Norwood Payneham St Peters`, `City of Marion`, `City of Salisbury`.
   - If ZQ Removals operates as a Service Area Business (SAB) without a public storefront, ensure the physical residential address is hidden in accordance with Google Guidelines.
3. **Business Attributes & Opening Hours:**
   - Confirm standard operational hours (e.g. Monday–Sunday 7:00 AM – 7:00 PM).
   - Add service attributes: *Online estimates*, *Onsite services*.
4. **Authentic Photography:**
   - Upload 10–15 high-resolution, unedited photos:
     - ZQ Removals branded moving trucks and tail-lifts.
     - Moving crew in uniform equipped with dollies, straps, and protective blankets.
     - Real packing materials and secured cargo in transit.
   - *Do not use generic stock photos*, as Google uses image recognition to evaluate profile legitimacy.
5. **Systematic Review Acquisition Protocol:**
   - Generate a short Google Review link via the GBP dashboard (`https://gpost.link/...`).
   - Implement an automated SMS or WhatsApp follow-up sent within 2 hours of move completion:
     > *"Hi [Name], thank you for choosing ZQ Removals today! If our crew took great care of your furniture, could you leave us a quick 5-star review on Google? [Review Link] Thanks, ZQ Removals Adelaide."*
   - Never fabricate reviews or add synthetic review markup to the website HTML.

---

## 2. Google Search Console Manual Actions

Once Phase 2 changes are deployed to production, execute the following steps in Google Search Console (`sc-domain:zqremovalsadelaide.com.au`):

### 2.1 URL Inspection & Re-Index Requests
Request re-indexing for the highest-priority updated URLs:
1. `https://zqremovalsadelaide.com.au/office-removals-adelaide/` (Priority 1: updated snippet targeting Page 1 position 5 query `office removalists adelaide`).
2. `https://zqremovalsadelaide.com.au/removalists-adelaide-prices/` (Priority 2: resolving pricing cannibalisation).
3. `https://zqremovalsadelaide.com.au/adelaide-moving-guides/removalists-cost-adelaide/` (Priority 3: updated guide links and FAQ grammar).
4. `https://zqremovalsadelaide.com.au/removalists-unley-park/` (Sample suburb re-crawl check).
5. `https://zqremovalsadelaide.com.au/removalists-glenelg/` (Sample suburb re-crawl check).

### 2.2 Sitemap Verification
- Confirm all 5 child sitemaps in `https://zqremovalsadelaide.com.au/sitemap.xml` remain on **Success**:
  - `sitemap-pages.xml` (5 URLs)
  - `sitemap-services.xml` (15 URLs)
  - `sitemap-suburbs.xml` (48 URLs)
  - `sitemap-guides.xml` (11 URLs)
  - `sitemap-images.xml` (79 image URLs)

### 2.3 30-Day Query Performance Monitoring
Track Search Console Performance report for these primary striking-distance queries:
- `office removalists adelaide` (Watch for CTR improvement from 0% baseline).
- `removalists adelaide prices` (Verify impressions concentrate on `/removalists-adelaide-prices/`).
- `local removalist unley park` & `hyde park removalist` (Assess position lift from ~14 into top 10).

---

## 3. Business Facts Needing Client Confirmation

To further improve suburb pages and service descriptions without making unsupported claims, obtain confirmation from the business owners on the following details:

1. **Physical Depot / Base Location:**
   - Confirm primary parking depot (e.g. northern vs western suburb base). This will allow accurate travel-fee transparency if applicable.
2. **Fleet Specifications:**
   - Confirm exact truck capacities (e.g. 20m³ / 4.5-tonne Pantech, 45m³ / 8-tonne truck with hydraulic lift) to publish exact dimensions for customer planning.
3. **Specialist Insurance Terms:**
   - Verify whether Public Liability ($10M or $20M) or Goods in Transit insurance cover options are offered so exact policy terms can be published.
4. **Unmapped Suburb Landmarks:**
   - Several outer suburb records in `site-src/data/zq-suburbs.mjs` currently lack specific council or landmark annotations. Provide 2–3 authentic local landmarks for newly added corridors before expanding them.

---

## 4. Local Citation & Directory Alignment

To establish authority outside of the main website, ensure identical NAP citations across major Australian business directories:
- **TrueLocal:** `ZQ Removals Adelaide`, Phone: `0433 819 989`, Website: `https://zqremovalsadelaide.com.au`.
- **Yellow Pages Australia:** Match category and details.
- **Oneflare & Hipages:** Ensure business name matches the verified domain.
- **Apple Maps (Apple Business Connect):** Claim the business listing on Apple Maps to capture iOS users searching via Spotlight and Siri.

---

## 5. Summary of Unchanged Policies

To protect the website's technical integrity, the following architectural choices remain locked:
- **Host Consistency:** All generator links and schemas remain strictly locked to apex `https://zqremovalsadelaide.com.au/`.
- **Sitemap Boundary:** Strict 79-URL limit; no thin utility, preview, or redirect pages included.
- **Conversion Tracking:** Direct client-side submission to Web3Forms; analytics events fire only upon confirmed provider success.
