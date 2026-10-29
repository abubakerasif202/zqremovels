# AI search readiness (2026-10-30)

- robots.txt: `User-agent: * / Allow: /`, sitemap + ai-sitemap + llms references. No per-bot blocks.
- Crawler UA probe of / (no firewall/rate-limit block seen): Googlebot, Bingbot, OAI-SearchBot, GPTBot, PerplexityBot, ChatGPT-User, ClaudeBot all 200. This is a user-agent test only, not IP verification.
- /llms.txt and /llms-full.txt exist (supplementary; HTML + schema remain the primary signal).
- Schema: MovingCompany on all pages (name "ZQ Removals Adelaide", matches the Google listing), plus WebPage/Service/FAQPage/BreadcrumbList/Article as appropriate. Rating/review count come from the Places-API-refreshed file; no invented values.
- Answer-ready content (visible HTML + FAQPage) exists for: hourly rates, billing, call-out/travel charge, quote comparison, stairs/carries, interstate cost/timing/packing/insurance, quote details to send, prep checklists, suburb coverage.
- Not verified: actual citations or recommendations by ChatGPT/Gemini/Perplexity/Copilot. GA4 AI-referral data was unavailable (connector payment_required). Manual prompt log template: record date, platform, query, cited URLs; repeat weekly; do not infer frequency from one run.
