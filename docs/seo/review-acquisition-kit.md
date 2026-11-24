# Genuine Google review acquisition kit

Prepared 2026-11-25. Current Google Business Profile: **5.0 from 102 reviews** (owner-confirmed 2026-11-25).
Official review link (already used on the site footer): <https://g.page/r/Cb5kWH_Fcs9LEBM/review>

Review-count targets (goals, not guarantees): **125**, **150**, **200** genuine reviews.

## Rules this workflow follows

These keep the profile compliant with Google's review policies and protect the rating long term.

1. **Ask every customer, not only happy ones.** Do not screen, filter or "gate" who receives the request. Selectively asking likely-positive customers violates Google policy.
2. **No incentives.** No discounts, gifts, prize draws or payment in exchange for a review, and no "review for a free box" offers.
3. **Never write, edit or post a review on a customer's behalf**, and never ask a customer to use a particular star rating or wording.
4. **Ask once, then one gentle follow-up at most.** Do not repeatedly message a customer who has not responded.
5. **Reply to every review**, positive or negative, as the business (not as a customer).
6. **Do not post reviews from staff, family or friends who did not use the service.**
7. **Australian spam rules (SMS, WhatsApp, email):** send only to people you have dealt with, identify the business, and include a simple opt-out ("Reply STOP"). This is not legal advice; check the current ACMA guidance.

## When to ask

- Send within **24 to 72 hours after the move is completed** and paid, while the experience is fresh.
- Send from the business phone (0433 819 989) or admin@zqremovalsadelaide.com.au so the customer recognises the sender.
- Track in a simple sheet: job date, suburb, request sent (date), response (reviewed yes/no). This tracks process, not outcomes. Do not drop customers from the list based on how the job went.

## Message templates

Replace `{First name}` and `{Crew lead}` before sending. Keep wording factual and free of star-rating requests.

### SMS (about 300 characters)

> Hi {First name}, it's {Crew lead} from ZQ Removals. Thanks for choosing us for your move. If you have a minute, we'd really value an honest Google review: https://g.page/r/Cb5kWH_Fcs9LEBM/review . Reply STOP to opt out.

### WhatsApp

> Hi {First name}, thanks again for moving with ZQ Removals. We read every review and use them to improve how we work. If you're happy to share your experience, honestly, here is our Google review link: https://g.page/r/Cb5kWH_Fcs9LEBM/review
> Thank you, {Crew lead} and the ZQ Removals team. (Reply STOP and we won't message again.)

### Email (first request)

**Subject:** How did your move go, {First name}?

> Hi {First name},
>
> Thank you for choosing ZQ Removals for your recent move. We hope everything is settled in.
>
> If you have a couple of minutes, an honest Google review helps other Adelaide households and businesses know what to expect, and it helps us see what we do well and where we can improve.
>
> Leave a review: https://g.page/r/Cb5kWH_Fcs9LEBM/review
>
> If something wasn't right, please call or reply to this email so we can look into it. Reviews and feedback are both welcome.
>
> Thanks again,
> {Crew lead}
> ZQ Removals Adelaide · 0433 819 989 · admin@zqremovalsadelaide.com.au
>
> If you'd rather not receive messages like this, reply "unsubscribe".

### Follow-up (one only, 5 to 7 days after the first request, only if no reply)

> Hi {First name}, just a quick, final note from ZQ Removals. If you've got a minute to share your experience of your move, here's the link: https://g.page/r/Cb5kWH_Fcs9LEBM/review . No problem if not, and thank you either way. Reply STOP to opt out.

### Verbal ask on move day (crew script)

> "If you're happy with how today went, we'd appreciate an honest Google review. I can show you the QR code on our card, or we'll send a link tomorrow."

Hand over the printable QR card (`docs/seo/review-request-card.html`) to **every** customer at handover, not a selected few.

## Printable QR card

`docs/seo/review-request-card.html` is a self-contained, print-ready A6 card (single file, no external assets). Open it in a browser and print at 100% scale. Before printing, **scan the QR code with a phone** and confirm it opens the ZQ Removals Google review form.

## Response templates

Use the customer's first name, mention one specific detail from their review, and keep it short. Reply publicly within 1 to 2 business days. Avoid sharing private details about the job.

### 5-star

> Hi {First name}, thank you for the kind words and for trusting ZQ Removals with your move. We're glad {specific detail, e.g. the beds were rebuilt without fuss} worked well, and we've passed your thanks to {names}. All the best in your new place.

### 4-star or mixed

> Hi {First name}, thank you for the feedback. We're pleased {positive detail}. We'd like to understand what would have made it a 5-star experience, so please call us on 0433 819 989 or email admin@zqremovalsadelaide.com.au and we'll look into it.

### 1 to 3 star or complaint

> Hi {First name}, thank you for letting us know, and we're sorry the move did not go as it should have. We take this seriously. Please call 0433 819 989 or email admin@zqremovalsadelaide.com.au so we can review what happened and put it right where we can.

Rules for negative reviews: reply calmly and factually, do not argue, do not publish personal details, move the conversation offline, and update the reply once resolved. If a review is fake, abusive or from a non-customer, use "Report review" in Google Business Profile rather than arguing publicly.

### Review without text (rating only)

> Hi {First name}, thank you for the {n}-star rating and for choosing ZQ Removals. If there's anything we could do better, we'd welcome your feedback on 0433 819 989.

## Tracking progress to the targets

Re-check the profile review count monthly. The site reads the count from `site-src/data/google-reviews.json` (refreshed from the Google Places API when configured), so the on-site figure updates with the data file, not by editing page copy. Regression tests cover that data flow (`tests/google-reviews-loader.test.mjs`).

| Target | Reviews needed from 102 | At about 6 new reviews per month |
|---|---|---|
| 125 | 23 | about 4 months |
| 150 | 48 | about 8 months |
| 200 | 98 | about 16 months |

The pace is an illustration, not a forecast; it depends entirely on how many customers choose to respond.
