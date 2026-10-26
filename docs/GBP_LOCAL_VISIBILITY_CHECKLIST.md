# Google Business Profile and Local Visibility Checklist

Actions that need Business Profile or other account access. The repo cannot do these. Never create fake reviews, paid link networks, fabricated addresses or artificial ranking signals.

Starting point (from the public listing, to re-verify in the account): about 85 reviews, 5.0 rating, Andrews Farm location.

## 1. Business Profile accuracy (owner login)
- [ ] Name matches the website and invoices exactly ("ZQ Removals"); no keywords added.
- [ ] Primary category "Moving company"; add only secondary categories that are real services (for example storage or packing only if offered).
- [ ] Address, service-area suburbs, phone (0433 819 989) and website URL identical to the site footer, contact page and `MovingCompany` schema.
- [ ] Opening hours correct, including public holidays. Do not list a staffed shopfront if the business is crew-based and visits by appointment.
- [ ] Service area lists only suburbs actually served; keep it aligned with the suburb pages that exist.
- [ ] Add services with the published rates only: 2 men + truck $75 per 30 min, 3 men + truck $89 per 30 min, 1-hour call-out/travel where applicable.
- [ ] Booking/quote link points to `https://zqremovalsadelaide.com.au/contact-us/#quote-form` (with UTM `utm_source=gbp`).
- [ ] Website link uses the apex host `https://zqremovalsadelaide.com.au/`.

## 2. Evidence of real operations
- [ ] Upload genuine photos: crew, branded trucks, loading, wrapping, completed jobs (no stock images). Aim for several new photos a month.
- [ ] Add a short video of a real move (with customer consent).
- [ ] Post updates only about real events, offers or availability.
- [ ] Reuse the same real photos on the website (replace placeholders) with descriptive alt text.

## 3. Reviews (genuine only)
- [ ] Send a Google review link by SMS/email after each completed job; ask every customer, not only happy ones.
- [ ] Reply to every review, mentioning the service and suburb naturally, without keyword stuffing.
- [ ] Never offer incentives for reviews; never review-gate.
- [ ] Do not copy review text onto the site as `Review` or `AggregateRating` schema unless the data is first-party and visible on the page.

## 4. Citations and genuine links
- [ ] Claim or fix the same name/address/phone on: Bing Places, Apple Business Connect, Yellow Pages Australia, True Local, Hotfrog, Word of Mouth, Facebook, LinkedIn.
- [ ] Join real local bodies or directories the business actually qualifies for (chamber of commerce, removalist association, local council business directory).
- [ ] Earn editorial/partner links: real-estate agents, property managers, storage providers, cleaners and conveyancers the business works with; local news or community sponsorships.
- [ ] Close the known link gap with Medindie-area partners where a genuine relationship exists.

## 5. Search Console and measurement (account access)
- [ ] Reconnect a Search Console reporting source (the GSC Wizard connector subscription has lapsed; use the Search Console UI or `npm run gsc:fetch`).
- [ ] In Business Profile Performance, record calls, direction requests and website clicks weekly.
- [ ] Tag GBP website and booking links with UTM parameters so GA4 separates them.
- [ ] Confirm the apex-to-www behaviour in the Vercel domain settings (see the release report).

## 6. Live review count (Google Places API)
- The site reads its rating and review count from `site-src/data/google-reviews.json` (place ID `ChIJocgGurytsGoRvmRYf8Vyz0s`, public listing "ZQ Removals Adelaide", Andrews Farm). Verified through the Places API on 27 Oct 2026: rating 5.0, 94 reviews.
- `scripts/update-google-reviews.mjs` refreshes that file. Run it locally with `GOOGLE_PLACES_API_KEY` set or `--key-file <path>` (use `--dry-run` first). It refuses a drop of more than 10% and skips quietly without a key.
- **Primary path (Vercel build):** `npm run build` runs the `prebuild` step `update-google-reviews.mjs --on-vercel --soft`. On a Vercel build with `GOOGLE_PLACES_API_KEY` set (Production), every deploy fetches the current rating and count before the pages are generated. Outside Vercel (local, CI) it does nothing, and `--soft` means an API error or refused update only logs a warning and the committed values are used. The variable exists in the Vercel project (Production only); add it to Preview too if previews should refresh.
- A static site only updates on deploy. For a count that stays fresh between code changes, trigger a periodic redeploy (a Vercel Deploy Hook called on a schedule), or merge the pull requests from the optional workflow below.
- **Optional (GitHub):** `.github/workflows/update-google-reviews.yml` runs weekly and opens a pull request when the numbers change, keeping the committed file in sync. It needs the repository secret `GOOGLE_PLACES_API_KEY` in GitHub, which is separate from Vercel's; without it the run skips and stays green. PRs opened with the default token do not start the other workflows, so run the checks or merge deliberately.
- Restrict the key in Google Cloud: API restriction to "Places API (New)" only, and keep it out of the repo (`*.env` is git-ignored). The key file used on 27 Oct had its value printed into a Claude Code session; rotate it after setting up the secret.
- Check the Google Maps Platform terms for showing Places data (attribution and caching limits). The weekly refresh keeps stored values well inside typical cache windows.
- The public listing shows a street address. The site deliberately publishes only the locality (Andrews Farm SA 5114); keep it that way unless the owner wants the street address public. The listing name is "ZQ Removals Adelaide" while the site uses "ZQ Removals"; confirm which is intended and keep Business Profile, site and schema consistent.
