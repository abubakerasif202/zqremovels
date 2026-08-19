# Premium Local-Service Site Rebuild Agent

## Purpose

This file is the reusable rebuild blueprint for creating new websites inspired by the architecture, conversion strategy, SEO system, and premium visual quality of the ZQ Removals project.

Use the existing ZQ Removals repository as a reference implementation, not as a source of business facts to copy into another company.

The objective is to create a new site that feels like the same level of product: premium, fast, trustworthy, conversion-focused, locally relevant, technically disciplined, and scalable to hundreds of useful service/location pages without becoming a thin SEO template farm.

This file is intentionally separate from `AGENTS.md`. `AGENTS.md` governs maintenance of ZQ Removals itself. This `agent.md` governs rebuilding the system for another business.

---

## 1. Core Mission

When asked to rebuild a similar site for another company:

1. Study this repository before writing code.
2. Extract the reusable system, not the ZQ-specific identity.
3. Centralize the new company's verified facts before producing pages.
4. Recreate the premium editorial experience and conversion flow.
5. Recreate the generator/data architecture so changes scale cleanly.
6. Build a deliberate SEO hierarchy around services, regions, suburbs, routes, and useful guides.
7. Preserve accessibility, performance, structured data, analytics, forms, mobile conversion, and testing from day one.
8. Never invent reviews, ratings, accreditations, years in business, licences, customers, statistics, locations, insurance, awards, or guarantees.

A successful rebuild should look custom-made for the new company. It must not feel like a recoloured clone.

---

## 2. Required Inputs Before Rebranding

Create a verified business profile before replacing any ZQ data.

Minimum inputs:

```text
COMPANY_NAME=
DOMAIN=
PRIMARY_CITY=
STATE_REGION=
COUNTRY=
PHONE_DISPLAY=
PHONE_TEL=
EMAIL=
PRIMARY_ADDRESS_OR_SERVICE_BASE=
BUSINESS_REGISTRATION_NAME=
ABN_OR_REGISTRATION_NUMBER=
GOOGLE_BUSINESS_PROFILE_URL=
FACEBOOK_URL=
INSTAGRAM_URL=
PRIMARY_SERVICES=
SERVICE_AREAS=
PRIMARY_CTA=
QUOTE_METHOD=
FORM_DESTINATION=
LOGO_FILE=
BRAND_PRIMARY=
BRAND_SECONDARY=
BRAND_BACKGROUND=
BRAND_DISPLAY_FONT=
BRAND_BODY_FONT=
```

Optional verified inputs:

- Google rating and review count with verification date/source
- owner-approved review excerpts
- licences or memberships
- insurance details
- team names and roles
- years operating
- fleet information
- physical showroom/office location
- opening hours
- pricing model
- guarantees
- finance/payment options
- real project/job photos
- case studies

If a fact is not verified, omit it or write neutral copy that does not require the claim.

---

## 3. Reference Architecture

The ZQ project is a generator-driven static marketing site. Preserve this separation of concerns when creating a similar project.

```text
project/
├── site-src/
│   ├── pages.json
│   ├── content/
│   │   ├── index.html
│   │   ├── about/
│   │   ├── contact-us/
│   │   ├── services/
│   │   ├── suburbs/
│   │   ├── regions/
│   │   ├── routes/
│   │   └── guides/
│   ├── partials/
│   │   ├── header.html
│   │   └── footer.html
│   ├── templates/
│   │   ├── standard.html
│   │   ├── bare.html
│   │   └── redirect.html
│   └── data/
│       ├── business.mjs
│       ├── seo.mjs
│       ├── services.mjs
│       ├── locations.mjs
│       ├── guides.mjs
│       └── internal-links.mjs
├── scripts/
│   ├── build-site.mjs
│   └── seo-validate.mjs
├── tests/
├── site-dist/
├── vercel.json
├── package.json
├── AGENTS.md
└── agent.md
```

### Source-of-truth rule

`site-src/`, reusable data modules, templates, and the build script are the long-term edit surface.

Never make a generated `site-dist/` page the source of truth. Generated output may be inspected and tested, but source changes belong upstream.

### Preferred technical baseline

The current ZQ reference uses:

- Node.js 22.x
- Astro/custom static generation
- Tailwind CSS 4 where useful
- production CSS transformed/minified through LightningCSS
- esbuild for production browser assets
- Sharp for image processing
- native Node test runner
- Playwright for browser/mobile validation
- Lighthouse CI for performance checks
- Vercel for static hosting, redirects, headers, and deployment

A rebuild may simplify this stack when the project is smaller, but do not remove important capability merely to reduce file count.

---

## 4. Business Data Must Be Centralized

Create one primary identity module equivalent to `site-src/data/business.mjs`.

All of the following should come from centralized data where practical:

- company name
- canonical site URL
- phone display value
- `tel:` value
- email
- ABN/registration information
- location/service base
- service areas
- social profiles
- logo path
- default social image
- verified review information
- business schema fields

Do not scatter contact details or registration numbers across templates.

When the phone, domain, rating, or business address changes, the site should be fixable from one authoritative location.

---

## 5. Visual Direction

### Overall feel

Build a premium editorial service website, closer to a high-end architecture, property, transport, or lifestyle publication than a generic trade-business template.

The experience should communicate:

- precision
- care
- operational competence
- trust
- calmness
- premium service
- human reassurance

The site should feel established without using unsupported claims.

### Reference visual language

The current ZQ system uses a dark premium palette:

```css
:root {
  --fg-1: #f7f4ed;
  --fg-2: #d9ddd6;
  --fg-3: #aeb9b0;
  --bg-1: #050a08;
  --bg-2: #0a1410;
  --surface-1: #12221c;
  --surface-2: #1b2f2a;
  --accent-1: #e3c98f;
  --accent-2: #c9a86a;
  --accent-3: #9f7d42;
}
```

Reference typography:

- display: Fraunces/quality editorial serif
- body: Inter/modern neutral sans-serif
- eyebrows: compact uppercase labels with tracking
- large responsive H1 using `clamp()`

For a new company, adapt the palette to its real brand while preserving the same hierarchy and restraint.

### Design rules

- Use generous spacing.
- Use asymmetric editorial layouts where appropriate.
- Mix text, photography, proof, and structured information instead of repeating card grids endlessly.
- Use restrained border radii.
- Use subtle borders and layered surfaces.
- Keep imagery large enough to create emotion.
- Prefer real job/team/fleet photography over generic stock when available.
- Use refined SVG icons, not emoji.
- Use animation only when it improves hierarchy or feedback.
- Respect `prefers-reduced-motion`.
- Keep the interface readable in sunlight and on ordinary mobile screens.

### Avoid

- generic purple/blue SaaS gradients
- excessive glassmorphism
- oversized rounded pills everywhere
- floating decorative blobs with no purpose
- emoji icons
- fake award seals
- autoplay background video that harms LCP
- stock photography that visibly conflicts with the company's real location/fleet
- repeating six-card grids on every section
- excessive entrance animations

---

## 6. Homepage Blueprint

The homepage should be a high-conversion summary of the business, not a long collection of disconnected SEO sections.

Recommended order:

### A. Premium hero

Include:

- location/service eyebrow
- strong H1 describing the core service
- clear reassurance-focused lead
- primary CTA
- phone CTA
- verified review badge only if verified
- short proof bullets
- important quote/pricing expectation note
- strong hero photo or photo + quote panel

The ZQ reference uses a two-column hero: editorial copy on one side and visual/quote conversion surface on the other.

### B. Quote surface

Ask only for information needed to qualify the enquiry.

Typical fields:

- name
- phone
- email
- preferred date
- origin/location
- destination where relevant
- service/move type
- property/job size
- message/access notes

Requirements:

- real `<label>` elements
- sensible autocomplete attributes
- server/API or approved external submission handler
- honeypot/bot protection
- inline status feedback
- clear success state
- no hidden paid-booking implication when it is only an enquiry

### C. Trust strip

Use short verified operational assurances such as:

- local team
- residential/commercial capability
- careful handling
- transparent quoting
- prompt follow-up

Do not turn this into unverified marketing statistics.

### D. Core services

Show the most important services first.

Each service needs:

- distinct icon or imagery
- one-sentence value description
- direct link to its own intent-specific page

### E. Why this company / operational differentiators

Explain how work is scoped, scheduled, handled, protected, communicated, or completed.

Prefer concrete process detail over vague words like "quality" and "professional".

### F. Process

Use a concise sequence such as:

1. enquiry
2. scope review
3. quote/plan
4. service day
5. handover/follow-up

### G. Proof

Use only verified:

- reviews
- case studies
- team/fleet imagery
- public business details
- genuine operational evidence

### H. Coverage

Introduce regional/service-area hubs naturally. Do not dump hundreds of suburb links onto the homepage.

### I. FAQs

Answer buying-intent questions that genuinely help the customer decide or prepare.

### J. Final CTA

Finish with one clear next step plus phone/contact alternative.

---

## 7. Page-Type Blueprints

### Service page

Must answer:

- what the service includes
- who it is for
- how it works
- operational constraints
- preparation requirements
- related services
- service areas
- real quote path
- FAQs when useful

Do not generate a service page by merely swapping one keyword in the H1.

### Region hub

A region hub should function as a useful controller for a geographic cluster.

Include:

- what makes moves/jobs in the region different
- primary services in that area
- representative suburbs
- operational/logistical considerations
- relevant guides
- quote CTA

### Suburb/location page

Create a location page only when there is enough unique intent or operational context to justify it.

Possible differentiation:

- apartment/tower access
- commercial loading areas
- parking restrictions
- coastal conditions
- narrow streets
- family-home inventory
- storage-linked moves
- lift bookings
- stairs and long carries
- industrial/commercial access
- route/corridor timing

For removalist-style suburb pages, approximately 600-900 useful words can be a reasonable working range, but usefulness and differentiation are more important than word count.

Never mass-produce near-identical suburb pages.

### Interstate/route page

Use route-specific content:

- origin and destination
- typical planning considerations
- timing expectations stated carefully
- inventory/loading considerations
- route support
- packing options
- handover expectations
- related origin-region and destination pages where appropriate

Do not state exact travel times, prices, or schedules unless verified.

### Guide page

Every guide must answer a real pre-purchase/pre-quote question.

Useful examples:

- packing timeline
- move preparation checklist
- heavy furniture preparation
- apartment move preparation
- office relocation planning
- interstate preparation
- pricing factors
- access and parking preparation

Guides should naturally link to the service that solves the problem.

### About page

Use evidence-based trust:

- business story when supplied
- operating base
- process
- real team/fleet photos
- business identifiers
- service philosophy
- verified capabilities

Avoid manufactured founder stories or fake company history.

### Contact page

Include:

- phone
- email
- quote form
- service area
- response expectation only if verified
- business details
- optional map only if a real public location should be shown

### Legal pages

Provide privacy and terms pages appropriate to the actual form, analytics, data handling, and jurisdiction. Do not copy legal claims blindly from another company.

---

## 8. SEO Architecture

The rebuild must be structurally strong before adding large numbers of pages.

Recommended hierarchy:

```text
Home
├── Primary city/service hub
│   ├── regional hubs
│   │   └── differentiated suburb pages
│   ├── core services
│   └── contact/quote
├── Interstate or long-distance hub
│   └── route pages
└── Guide hub
    └── planning guides
```

### Internal-link intent

Use natural paths such as:

```text
home -> region/service hub -> specific service/location -> quote
suburb -> parent region -> relevant service -> guide -> quote
service -> relevant locations -> related service -> guide -> quote
route -> interstate hub -> supporting guide -> quote
```

Do not create a flat site where every page links to every other page.

Do not overuse exact-match anchor text.

---

## 9. Canonical, Sitemap, Redirect, and Robots Rules

Pick one production origin and use it everywhere.

For example:

```text
https://example.com
```

The selected host must match in:

- canonical tags
- `og:url`
- structured data URLs and `@id`
- sitemap `<loc>` values
- absolute logo URLs
- default social image URLs

### Sitemap inclusion

Include only pages that are intended to be indexed.

Exclude:

- redirects
- 404
- `noindex` utility pages
- thank-you pages unless intentionally indexable
- previews/demos
- thin generated utilities

### Redirects

Use permanent redirects when replacing a legitimate legacy URL with a clear canonical destination.

Redirect pages must not remain in the sitemap.

Maintain production redirect behavior in `vercel.json` or the actual deployment platform configuration.

---

## 10. Metadata and Structured Data

Every indexable page should have deliberate:

- title
- meta description
- canonical
- robots directive
- Open Graph metadata
- Twitter/social card metadata
- appropriate schema

Use schema that matches visible content.

Possible types:

- `LocalBusiness`
- `MovingCompany` only for genuine moving/removal businesses
- a more specific valid LocalBusiness subtype when appropriate
- `Service`
- `WebPage`
- `AboutPage`
- `ContactPage`
- `BreadcrumbList`
- `FAQPage` only when the FAQ is actually visible and valid for the intended use
- `Article` for genuine editorial guides

Rules:

- no fake ratings
- no fake reviews
- no fake branches/locations
- no fake opening hours
- no duplicate conflicting entities
- schema must reflect visible page content
- use one coherent business identity across the site

---

## 11. Content Standards

Write for customers first, search engines second.

The copy should be:

- direct
- location-aware
- specific
- calm
- practical
- conversion-aware
- free of empty hype

Prefer:

> We review access, inventory and timing before confirming the quote.

Over:

> We are the number one world-class experts delivering unmatched excellence every time.

Never invent:

- "#1"
- "best rated"
- "thousands of customers"
- "20+ years experience"
- "fully insured"
- licence numbers
- same-day availability
- fixed prices
- zero-damage guarantees
- review totals

unless supported by verified company information.

---

## 12. Photography and Asset System

Treat photography as part of the product, not decoration.

Preferred asset groups:

```text
/media/
  home-hero.webp
  team.webp
  fleet.webp
  service-house.webp
  service-office.webp
  service-interstate.webp
  about-team.webp
/media/responsive/
  ...320w.webp
  ...480w.webp
  ...768w.webp
```

Guidelines:

- generate responsive variants
- use WebP/AVIF where appropriate
- keep meaningful width/height attributes to reduce CLS
- eager-load only the primary above-the-fold visual
- lazy-load lower media
- use accurate alt text
- do not keyword-stuff alt text
- do not ship multi-megabyte hero assets when a smaller optimized version is sufficient
- preserve originals outside generated optimization output when needed

Use Sharp or equivalent tooling for repeatable image processing.

---

## 13. Conversion System

The website is a lead-generation product. Treat CTA behavior as an application feature.

Primary conversion actions usually include:

- quote form submit
- primary quote CTA click
- phone click
- email click
- service enquiry click

Where analytics are configured, expose consistent event names/data attributes.

Optional build-time integrations supported by the ZQ pattern include:

```text
VITE_GA_MEASUREMENT_ID
VITE_GTM_ID
VITE_META_PIXEL_ID
```

Quote integrations may use a first-party endpoint or an approved provider such as Web3Forms. Keep provider keys in environment variables, never hard-code private credentials into the repository.

Do not block the core experience when analytics fails.

---

## 14. Accessibility Requirements

Accessibility is a release requirement.

Minimum standards:

- semantic landmarks
- one logical H1 per page
- meaningful heading hierarchy
- keyboard-accessible navigation
- visible focus states
- skip link
- form labels
- clear validation messages
- `aria-live` for async form feedback where useful
- descriptive buttons/links
- 44px minimum interactive touch target where practical
- sufficient foreground/background contrast
- no critical information conveyed only by colour
- sensible reduced-motion behavior
- mobile navigation that remains usable at 320px width

Do not sacrifice contrast to preserve a brand colour. Adjust the token role instead.

---

## 15. Mobile Requirements

Design mobile intentionally rather than shrinking the desktop layout.

Check:

- hero reading order
- form width and input spacing
- no horizontal overflow
- navigation usability
- sticky CTA does not cover content
- buttons do not wrap awkwardly
- headings do not overflow
- cards do not become excessively tall
- images retain useful crops
- phone CTA is immediately usable
- form can be completed with one hand

The ZQ pattern includes a sticky mobile contact/quote region. A similar site should keep this only when it helps conversion and does not obstruct legal notices, form controls, or browser UI.

---

## 16. Performance Requirements

Aim for a static, fast-loading experience.

Prefer:

- minimal client JavaScript
- compressed CSS
- responsive images
- correct image dimensions
- local/system font fallbacks
- preloading only critical assets
- no large animation libraries unless genuinely necessary
- no unnecessary third-party widgets above the fold

The primary hero should be treated as an LCP-critical component.

Use Lighthouse CI or equivalent checks when available.

---

## 17. Build and Test Commands

Keep a reproducible command surface similar to:

```bash
npm ci
npm run build
npm test
npm run seo:validate
npm run test:visual-mobile
npm run lhci
```

At minimum, tests should protect:

- successful build
- canonical host consistency
- sitemap integrity
- noindex exclusions
- redirect behavior
- internal links
- required CTA paths
- quote form contract
- business details consistency
- structured data basics
- mobile layout regressions
- colour contrast rules
- critical performance asset behavior

A documentation-only change does not require rebuilding generated output, but source/template/code changes do.

---

## 18. Recommended Rebuild Workflow

### Phase 1: Audit the reference

Inspect:

- `AGENTS.md`
- `.stitch/DESIGN.md`
- `.stitch/SITE.md`
- `opendesign/design-systems/zq-removals/`
- `site-src/content/index.html`
- `site-src/partials/`
- `site-src/templates/`
- `site-src/data/business.mjs`
- SEO/location/service data modules
- `scripts/build-site.mjs`
- `tests/`
- `vercel.json`

Document what is reusable and what is ZQ-specific.

### Phase 2: Create the new identity layer

Before editing page copy:

1. create new business data
2. set canonical host
3. set verified contact information
4. replace branding tokens
5. replace logo/social image
6. define service taxonomy
7. define region/service-area taxonomy
8. define form destination

### Phase 3: Build the global shell

Implement:

- head metadata generator
- header/navigation
- footer
- standard template
- redirect template
- sticky mobile CTA when suitable
- global styles/tokens
- site JS
- forms

### Phase 4: Build the homepage first

Do not generate dozens of location pages before the homepage, global shell, design system, and conversion flow are visually approved.

### Phase 5: Build money pages

Prioritize:

1. core service pages
2. primary city/service hub
3. contact page
4. about/trust page
5. important region hubs
6. only then differentiated local pages

### Phase 6: Build content clusters

Add:

- useful suburb pages
- route pages
- planning guides
- internal links

Every new page must have a reason to exist.

### Phase 7: Validate

Run build, tests, SEO validator, responsive checks, and performance checks.

Fix the system, not only the failing generated page.

### Phase 8: Deployment review

Before production:

- verify canonical host
- verify environment variables
- verify quote delivery
- verify analytics only when configured
- verify redirects
- verify robots/sitemap
- verify social cards
- verify mobile CTA
- verify phone/email links
- verify legal copy

---

## 19. Rebuild Decision Rules

When working autonomously, use these priorities:

1. Correct business facts beat marketing copy.
2. Usability beats visual novelty.
3. Conversion clarity beats decorative complexity.
4. Real operational detail beats generic SEO text.
5. One strong differentiated page beats ten thin location pages.
6. Generator-level fixes beat repeated page-level hacks.
7. Centralized data beats duplicated hard-coded values.
8. Static HTML/CSS beats unnecessary runtime complexity.
9. Accessible interactions beat visually clever but fragile controls.
10. Verified proof beats invented trust signals.

---

## 20. Rebranding Checklist

Before considering a new-company rebuild complete, search the repository for the original company's:

- name
- domain
- email
- phone
- ABN/registration number
- locality/state
- Google profile URL
- social URLs
- logo filenames
- social image filenames
- schema IDs
- image alt text
- analytics IDs
- quote recipient/provider keys

Then manually inspect every remaining match. Some references may belong in this documentation or migration notes, but no ZQ customer-facing identity should leak into the new production site.

Also check for location-specific words such as:

```text
Adelaide
South Australia
Andrews Farm
Glenelg
Norwood
Salisbury
```

Replace them only where they are business content. Do not blindly replace strings inside historical docs or tests without understanding the purpose.

---

## 21. Final Quality Gate

Do not claim the rebuild is finished until all applicable items are true:

- the new business identity is centralized
- no customer-facing ZQ identity remains
- the homepage looks intentionally designed for the new brand
- primary CTA and phone paths work
- quote submissions are tested
- core services have dedicated useful pages
- regional/location content is differentiated
- guide content supports real customer decisions
- canonical host is consistent
- sitemap contains only indexable canonical pages
- redirects are correct
- schema matches visible verified information
- no fake trust claims are present
- desktop and mobile layouts are checked
- keyboard/focus behavior is usable
- important contrast issues are fixed
- critical images are optimized
- build passes
- automated tests pass
- SEO validation passes
- production environment requirements are documented

---

## 22. Final Handoff Format

At the end of a rebuild task, report:

```text
REBUILD STATUS
- Brand/identity:
- Architecture:
- Homepage:
- Services:
- Locations/SEO clusters:
- Quote form:
- Analytics:
- Accessibility:
- Performance:
- Structured data:
- Redirects/sitemap:
- Tests/build:
- Deployment status:

VERIFIED BUSINESS FACTS USED
- ...

ENVIRONMENT VARIABLES REQUIRED
- ...

REMAINING OWNER INPUTS
- ...

KNOWN LIMITATIONS
- ...
```

Do not hide unresolved production requirements. If something depends on Vercel, DNS, Google Business Profile, Search Console, form-provider configuration, analytics configuration, or owner verification, state it clearly.

---

## 23. Reference Characteristics Worth Preserving

The most important transferable qualities of ZQ Removals are not its exact colours or text. They are:

- a strong, premium first impression
- immediate phone/quote conversion
- clear service hierarchy
- real operational detail in local pages
- scalable static generation
- centralized business identity
- disciplined metadata/schema
- location-aware internal linking
- useful guide content supporting money pages
- strong mobile behavior
- accessible forms/navigation
- lightweight production output
- automated SEO/conversion/visual regression testing
- strict avoidance of fabricated proof

Preserve those qualities while giving each new company its own identity, imagery, tone, services, geography, evidence, and conversion logic.
