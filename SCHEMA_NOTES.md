# Schema Notes

## Existing Schema Patterns

The repo already had route-level JSON-LD in `site-src/pages.json`, including:

- `MovingCompany`
- `WebPage`
- `ContactPage`
- `Service`
- `BlogPosting`
- `BreadcrumbList`
- `FAQPage`

This was a strong base, but some coverage was inconsistent and the schema could drift from route metadata because the blocks were stored as static JSON strings.

## Implemented Schema Improvements

### 1. Metadata Alignment

- Build output now normalizes `WebPage` and `ContactPage` schema nodes to the current route `title`, `description`, and `canonical`
- This keeps schema aligned with meta tags without manually editing every JSON-LD block

### 2. `MovingCompany` Normalization

- Existing `MovingCompany` nodes are normalized at build time to ensure consistent:
  - `@id`
  - `name`
  - `url`
  - `telephone`
  - `address`
- Added a consistent `contactPoint`:
  - customer service
  - phone number
  - area served
  - language
  - contact page URL

### 3. Breadcrumb Coverage

- Breadcrumb JSON-LD is now generated dynamically when:
  - the page has visible breadcrumb navigation
  - no `BreadcrumbList` is already present in `pages.json`
- This safely improved breadcrumb coverage without adding hidden or unsupported paths

### 4. FAQ Coverage

- FAQ schema remains limited to pages with visible FAQ markup
- Dynamic FAQ generation already existed and was preserved
- No invisible FAQ content was added

## What Was Not Added

- No review or rating schema
- No fake `AggregateRating`
- No business hours schema because opening hours were not available in the repo
- No misleading service schema beyond what the page content already supports

## Result

- Core commercial pages keep `MovingCompany` + `WebPage` / `ContactPage` + `Service` where applicable
- Breadcrumb coverage is broader and now tied to visible navigation
- FAQ schema remains visibility-safe
- Meta-to-schema consistency is stronger after build normalization
