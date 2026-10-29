# Search Console actions (2026-10-30)

Status: could not read Search Console/Bing (connector subscription ended). Nothing submitted; no indexing requests made. Pending Google processing of earlier validations stays pending.
1. **Vercel domain redirect**: www.zqremovalsadelaide.com.au -> apex is 307 (project "zq"). Change the redirect status to 308/301 in Vercel > zq > Settings > Domains. No MCP tool for editing it; not changed.
2. Re-export Search Console (Pages, Performance) and run `npm run gsc:compare`-style comparison per docs/GSC_MEASUREMENT_PLAN.md.
3. Confirm sitemap https://zqremovalsadelaide.com.au/sitemap.xml is submitted on the sc-domain property; request indexing only for pages changed since last crawl.
4. Verify the site in Bing Webmaster Tools and submit the same sitemap.
