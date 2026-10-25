# Manual Google Ads and GTM changes — 22 October 2026

Documentation only. No account mutation, container publication, campaign restart, push or deployment was performed. Historical settings below are supplied audit evidence, not fresh authenticated account observations. UI labels can vary by rollout. Customer 684-819-0382; currency AUD.

## 1. Verify the existing conversion before restarting

Google Ads → Goals → Conversions → Summary → **ZQ - Quote Form Submitted** (action 7829944715) → Settings. Verify the existing action's tag setup, attribution, diagnostics and counting. Keep the existing action, Conversion ID **18413688842** (Google tag AW-18413688842), and its authorised label. Read the label privately from this action's **Tag setup → Use Google Tag Manager** and compare it to the existing GTM tag. Never paste the label into reports or create another conversion action/tag. Historical result: zero recorded website quote conversions.

Set **Count = One** for this lead action, after business review. This counts one lead per ad interaction; transaction-ID deduplication additionally suppresses repeated receipts. Do not assign fabricated lead values. Preserve existing value/currency semantics; AUD only where a value is actually configured. Inspect attribution settings without changing them during recovery unless justified separately. Verify the same action appears in Preview/Tag Assistant and subsequently Ads diagnostics.

GTM → container **GTM-WJGKPXFL** → Workspace. Export a backup privately and compare the workspace with Versions → latest published version. Verify these **Variables → New → Data Layer Variable**, Version 2:

| Variable name | Data Layer Variable Name | Default |
|---|---|---|
| DLV - form_name | form_name | none |
| DLV - submission_status | submission_status | none |
| DLV - submission_id | submission_id | none |

Variables → Configure built-ins → enable **Page Hostname**. Triggers → inspect/edit the existing accepted quote Custom Event trigger:

- Event name: `zq_quote_submitted` (exact; event-name regex disabled).
- Some Custom Events, ALL conditions:
  - `{{DLV - form_name}}` equals `quote_form`
  - `{{DLV - submission_status}}` equals `accepted`
  - `{{DLV - submission_id}}` matches RegEx below
  - `{{Page Hostname}}` equals `zqremovalsadelaide.com.au`

```regex
^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$
```

Tags → existing **Google Ads Conversion Tracking** tag: retain verified ID/label/action, use the above trigger and **Transaction ID = {{DLV - submission_id}}**. Inspect the existing transaction mapping before changing it; source code cannot establish its current published value. Preserve the Conversion Linker and Google tag destination. Do not install a second standalone Ads loader. Review every firing trigger for this tag: remove competing click, form-valid, thank-you pageview or generate_lead triggers only after Preview proves replacement parity. Inspect legacy generate_lead-to-zq_quote_submitted Custom HTML; retire it manually after confirming the native accepted event is authoritative. Do not create custom JavaScript variables requiring unsafe-eval.

`generate_lead` remains useful analytics. Check Goals for an imported GA4 copy of the same quote and make it secondary/exclude it from this campaign's bidding goal after review. Never optimise on both copies of one lead. Keep form views/starts/errors, phone clicks and directions secondary. Phone clicks are not qualified calls. Only use independently measured, useful qualified calls as primary with agreed duration/qualification criteria.

Consent: inspect Consent Initialization tags and the CMP's saved-preference restoration. Site defaults are denied for ad_storage, analytics_storage, ad_user_data and ad_personalization. Preserve these defaults; submission does not grant consent. Test rejection, grant, partial choice and returning visits. Built-in Google tag checks must remain active; inspect any additional tag requirements. Do not enable enhanced conversions or DOM collection of customer data during this repair. GA4 presence/property and CMP ownership require authenticated inspection; a missing HYPD property proves neither absence nor presence.

GTM Preview → connect to approved staging; hostname condition intentionally blocks Ads on localhost/staging, so inspect the event/variables there without expecting the production tag to fire. On an authorised production release use Tag Assistant and ONE genuine owner-approved enquiry. Check accepted UUID in Data Layer, one Ads firing with matching transaction ID, actual provider delivery and no competing imported lead. Refresh/back/forward must produce no extra accepted event. Direct thank-you visit, invalid form, spam rejection, provider failure, timeout, call click and merely opening the form must not fire the tag. Avoid artificial ad clicks or fake production leads. Preview changes require separate publication approval.

## 2. Campaign goals and controlled restart

Campaigns → select **ZQ Removals | Search | Enquiries** (24332398054) → Settings → Conversion goals → use campaign-specific goals. Historical bidding: Maximise Conversions; zero primary conversions from Search. Make accepted website quotes the principal primary lead goal only after the verification above; keep directions/generic engagements secondary. Check custom goals carefully because included secondary actions can still affect bidding. Review Conversions and All conversions separately, segmented by conversion action. Risk: changing goals changes learning and the history used by bidding. Verify selected actions and diagnostics before any separately approved restart. Both campaigns remain paused.

## 3. Search terms and negatives (proposals, never applied)

Campaign → Insights and reports → Search terms (or Keywords → Search terms). Use 1 September–21 October 2026; export privately and inspect actual terms. Campaign → Audiences, keywords and content → Search keywords → Negative search keywords; choose this campaign, not an account-wide shared list. Negative match semantics differ from positive keywords: negatives do not automatically cover all close variants; negative phrase blocks the phrase in that order, exact blocks the entire term. Review variants deliberately.

| Category / proposed negative | Evidence | Reason / match / scope | Legitimate traffic risk | Approval |
|---|---|---|---|---|
| Clearly irrelevant: [forbes best moving companies] | Audit supplied term to review; cost not supplied | Research list rather than scoped move; exact, Search campaign | Someone comparing providers may still be a lead | Required after term export confirms context |
| Competitor: [og movers] | A$17.99 / 1 click | Other brand; exact, Search campaign | Comparison shoppers | Business approval required |
| Competitor: [handy truck adelaide] | A$13.66 / 1 click | Other brand; exact, Search campaign | Comparison shoppers | Business approval required |
| Service category: [international moving companies] | Supplied review example, no cost supplied | Only exclude if international moves unsupported; exact, local ad groups | International customers needing local legs | Service confirmation required |
| Service category: [hire a moving van] | Supplied review example, no cost supplied | DIY vehicle hire if unsupported; exact, Search campaign | Customer may accept movers + truck | Service confirmation required |
| Research/support: [moving assistance for low income] | A$9.95 / 1 click | Only exclude if verified welfare/support intent outside service | Price-sensitive paying customers | Business/context approval required |

No category is already approved by this document. After approval copy ONLY the corresponding exact-match lines; do not paste the entire combined list indiscriminately:

Clearly irrelevant proposal:
```text
[forbes best moving companies]
```
Competitors (separate approval):
```text
[og movers]
[handy truck adelaide]
```
Unsupported categories (confirm services first):
```text
[international moving companies]
[hire a moving van]
```
Irrelevant support research (confirm intent first):
```text
[moving assistance for low income]
```

Verify negative conflicts against positive keywords and next week's search terms. Never blanket-exclude Adelaide, Glenelg, houses, apartments, furniture, interstate customers, piano or specialised moves without confirming service capability. Historical high costs are review signals, not proof of waste: Glenelg A$45.08/1 click; brand A$38.05/5; removalist Adelaide A$19.52/2; small removals A$16.32/1. The audit returned no negatives; inspect the UI for campaign and shared-list negatives before adding any.

## 4. Keyword and landing-page alignment

Search keywords → inspect match types/ad groups. Prioritise exact and phrase variants with clear Adelaide house/apartment/furniture/office intent while measurement stabilises. Restrict broad expansion until accepted lead quality is observable. Keep brand terms separately reviewable; expensive brand clicks require auction/search-term review, not an assumption of fraud. Align Local House Removals to /house-removals-adelaide/, Apartment Removals to /apartment-removalists-adelaide/, Office Removals to /office-removals-adelaide/, interstate intent to the canonical interstate page. Inspect Final URLs/redirects before editing ads. Reclassify ambiguous “Ad group 1” terms only after reviewing its actual ads and searches. Risk: over-restriction loses useful demand; verify enquiry quality and impression volume.

## 5. Locations and networks

Campaign Settings → Locations → Advanced search: historical target is an Adelaide 45 km radius. Locations → Location options: inspect presence versus presence-or-interest. For strictly local work prefer **Presence: People in or regularly in your targeted locations**, subject to available options and business review. Inspect exclusions and Reports → Report editor → Geographic / User locations / Matched locations to distinguish physical user location from location of interest. Historical 43 outside-SA clicks / A$44.67 can include legitimate interstate leads; keep interstate requirements in a separately scoped campaign/ad group plan before exclusions. Risk: local presence restricts people planning an Adelaide move remotely; verify quality and location reports.

Settings → Networks: historical Google Search enabled; Search Partners and Display disabled. Retain controlled Search-only during recovery; verify both checkboxes and campaign type in the UI. Do not assume Smart campaign network controls match Search.

## 6. Budget and bidding review

Settings → Budget and bidding: inspected average daily budget A$15, Maximise Conversions. Campaigns → Change history → filter Budget, Bid strategy and date range; include users/automations. Tools → Bulk actions → Rules: inspect automated budget/bid rules and their run history. Recommendations → Budget recommendations and auto-apply settings: check opt-ins/history. Campaigns → segment Time → Day and add Cost, Budget, Conversions, All conversions. Billing → Summary / activity and campaign budget report: inspect billed cost, served cost, credits, monthly forecast/limit and account notifications.

Historical daily spend: 17 Oct A$106.76; 19 Oct A$81.86; 20 Oct A$35.02; 21 Oct A$27.01. Budget changed during this period: reconstruct the budget applicable on EACH day before concluding overspend. Average daily budgets are not strict daily caps; most campaigns can spend up to twice the average daily budget on a day and generally have a 30.4-times monthly charging limit, subject to campaign type and budget changes. Review the actual budget report rather than applying today's A$15 retrospectively.

After acceptance/consent validation, propose a separately approved conservative restart at a business-agreed budget with daily spend/lead-quality review, change-history monitoring and a stop/review condition for delivery failure or duplicate conversions. Do not automatically unpause. Keep bidding unchanged until trustworthy measurement supports a choice; consider a time-bounded click-based strategy only with explicit rationale and approval if lead signals remain insufficient. An arbitrary CPC cap is not a Maximise Conversions control; any cap must match the selected supported strategy. Do not invent a target CPA from unreliable leads.

## 7. Smart campaign separation

**Adelaide Removalists** (24180391902) remains paused. Directions, interactions and call-related actions in Smart reporting are engagement signals, not proof of accepted website quotes. Search provides keyword/ad-group/landing-page control; Smart aggregates more automated local discovery. Keep separate campaign and conversion-action reports; preserve historical reporting. Do not reinterpret the account's 17 primary conversions as 17 quote submissions or rewrite reporting history.

## References and final gates

- [Google GTM conversion setup and transaction ID](https://support.google.com/tagmanager/answer/6105160)
- [Google transaction-ID deduplication](https://support.google.com/google-ads/answer/6386790)
- [Negative keywords](https://support.google.com/google-ads/answer/2453972)
- [Location targeting](https://support.google.com/google-ads/answer/1722043)
- [Average daily budgets](https://support.google.com/google-ads/answer/10486637)

Before restart: approved website release, healthy receipt storage, functioning CAPTCHA where configured, one genuine accepted lead delivered, Preview/Tag Assistant single tag/transaction, correct consent, Count One, campaign-specific goals, verified locations/networks/budget history, and explicit restart approval. Production Ads receipt/attribution remains pending authenticated verification.

## Release-readiness continuation: exact v5 configuration and current public v6 evidence

An authenticated read-only Vercel check linked project `zq` to `abubakerasif202/zqremovels`, production branch `main`, Node 22.x, `npm run build` and `site-dist`. No project settings or environment variables were changed. A separate read-only fetch of GTM's publicly compiled resource now reports **resource version 6**. It contains only Conversion Linker and Google Ads Conversion Tracking tags, the three expected DLV names, the accepted-event predicates and Transaction ID → `submission_id`. The old bridge and Custom JS claim are not present in that public resource. Evidence is stored without labels in `artifacts/ads-recovery-2026-10-22/readiness/public-gtm-*.json`. Public compiled-resource version evidence is not authenticated Workspace/Versions inspection or Tag Assistant success.

**Do not downgrade or overwrite current version 6.** “GTM v5” refers to the earlier proposed configuration below. Compare these settings with the current published version and workspace first. If they already match, make no change. Any later container publication remains a separately authorised action.

1. GTM → Workspace → Variables: Data Layer Variable Version 2, no default values: `DLV - form_name` → `form_name`; `DLV - submission_status` → `submission_status`; `DLV - submission_id` → `submission_id`. Enable built-in Page Hostname. No Custom JavaScript variable is needed.
2. Triggers → the existing quote tag's Custom Event trigger: exact event `zq_quote_submitted`, **Some Custom Events**, ALL four conditions:
   - form_name equals quote_form;
   - submission_status equals accepted;
   - submission_id matches `^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$`;
   - Page Hostname equals zqremovalsadelaide.com.au.
3. Tags → existing Google Ads Conversion Tracking tag: keep Conversion ID 18413688842, the existing authorised conversion label (inspect privately), the existing quote action and its value semantics. Transaction ID is `{{DLV - submission_id}}`. Keep Conversion Linker. No thank-you pageview, submit click, form-valid, generate_lead bridge or Custom JS claim condition may provide a competing quote path. The source normalises UUIDs to lowercase; the currently published lower-case regex therefore covers the emitted IDs.
4. Retain consent defaults and built-in Google consent checks. Do not grant consent from submitting the form. No enhanced conversion collection is introduced. If an obsolete bridge/Custom JS condition exists only in an unpublished workspace, compare dependencies before retiring it; do not recreate it from historical instructions.
5. Preview controlled staging with measurement requests blocked; the production hostname condition intentionally prevents the Ads tag on staging. For a separately approved production verification, coordinate one genuine enquiry and reconcile provider acceptance, server UUID, tag transaction ID and eventual Ads recording. A fabricated dataLayer push or seeded thank-you marker is only a trigger test, never proof of a genuine accepted lead. No synthetic production lead or artificial ad click is permitted.

Google Ads manual goal check remains: Goals → Conversions → Summary → existing **ZQ - Quote Form Submitted** (7829944715) → Settings → Count **One**, principal primary accepted lead goal. Campaigns → **ZQ Removals | Search | Enquiries** (24332398054) → Settings → Conversion goals → campaign-specific goals. Inspect and exclude duplicate imported GA4 quote goals from bidding; generic calls/clicks/directions remain secondary unless independently qualified call measurement justifies primary status. Keep both campaigns paused until separately approved. Existing labels and current account settings require private authenticated inspection; public GTM code does not establish Google Ads action identity or recording status.

Configuration and staging blockers are described in the production runbook below. Nothing in this document authorises a publication, deployment, account mutation or campaign restart.

### Release gate and current local validation

Production KV/provider environment definitions are present by read-only metadata; Preview has no returned KV definitions and its provider destination must be confirmed as isolated before synthetic staging tests. The approved consent mode (permanent denial or actual CMP collection/restoration) remains to be verified. The [production runbook](production-verification-2026-10-22.md) gives secure setup, controlled staging and rollback steps; none were applied remotely.

Local evidence now includes 441 passing full-suite Node tests (one existing TODO), 56 passing final focused tests, 192 passing Chromium tests (28 intentional skips), a successful Windows Node 22 production build, 108-page SEO validation and 48 byte-identical before/after screenshot pairs. Comparable local Lighthouse medians improved **79 → 81**, simulated LCP **4.663s → 4.518s**, with TBT/CLS zero; field performance and live conversions remain unverified. WebKit could not launch without missing host libraries; no OS packages were installed.

**BLOCKED** for staging/release sign-off until isolated Preview Redis/provider destination and intended consent behavior are verified, followed by controlled staging acceptance/replay tests. Continue human code review; do not publish GTM, change Ads goals, reactivate campaigns or deploy from these local results. After an authorised future deployment, one genuine approved production enquiry must confirm provider delivery and eventual Google Ads recording before describing live conversion tracking as verified.
