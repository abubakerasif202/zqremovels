# Manual GSC / GBP actions
1. GSC > Pages > "Page with redirect" > export all 28 example URLs (and the "Redirect error" and "Duplicate, Google chose different canonical" detail lists). The Nov export has none (extra_urls.csv is empty). Send the CSV so each can be GET-checked hop by hop.
2. GSC > URL Inspection > /removalists-pennington/ > Test Live URL; if it renders and is indexable, Request Indexing once. Last crawl 30 Aug 2026, "crawled - currently not indexed"; cause not proven.
3. GSC > Sitemaps: resubmit https://zqremovalsadelaide.com.au/sitemap.xml after deploy.
4. GBP: compare name, phone, hours, service areas, categories with the site NAP (not accessed in this session; no GBP changes were made).
5. Reviews: ask genuine past customers for Google reviews; no incentives or gating.
6. Check Google for "office removalists adelaide" (pos ~6, 0 clicks) in an Adelaide-located browser to judge SERP features and snippet.
7. Production: nothing is deployed; merging the PR and the Vercel deploy need your approval.

## GBP and local authority (phase 2 additions)
- Verify GBP primary category, service areas (Adelaide metro suburbs actually served), hours, phone 0433 819 989 and website URL exactly match the site.
- Add real photos only (crew, truck, loading jobs you own); no stock images.
- Reply to all existing Google reviews; ask recent genuine customers for reviews with a plain link, no incentives or gating.
- Competitors claim insurance/accreditation (e.g. AFRA, insurance limits). Only add such claims to the site once you supply documents; none were added.
- Citations: claim existing listings on Adelaide business directories you already control; no purchased links.
- Run the PageSpeed Insights check for production with an API key and send the field CWV.
