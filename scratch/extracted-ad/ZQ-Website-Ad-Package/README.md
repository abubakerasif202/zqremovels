# ZQ Removals Website Ad Package

This package converts the uploaded creative preview into a production-ready, dependency-free website section for the current Astro site.

## Included

- `src/components/ZQApartmentAd.astro` — drop-in Astro component.
- `public/images/zq-apartment-ad/scene-1.webp` to `scene-5.webp` — optimized 720 × 1280 WebP assets.
- `standalone/ZQ-Apartment-Ad.html` — browser-ready preview and fallback implementation.
- `standalone/assets/` — assets used by the standalone preview.

## Astro installation

1. Copy `src/components/ZQApartmentAd.astro` into the matching folder in the ZQ Removals repository.
2. Copy `public/images/zq-apartment-ad/` into the website's `public/images/` directory.
3. Import the component on the preferred page:

```astro
---
import ZQApartmentAd from "../components/ZQApartmentAd.astro";
---

<ZQApartmentAd />
```

Recommended placement: after the main services section or before the main quote form. Avoid placing it above the primary homepage hero because the ad imagery is intentionally heavier than the normal hero content.

## Production behavior

- Click-to-play: no intrusive autoplay.
- Pauses when off-screen or when the browser tab is hidden.
- Respects `prefers-reduced-motion`.
- Keyboard-accessible controls and focus states.
- CTA links to `/contact-us/`.
- Call link uses `0433 819 989`.
- All CSS uses the `zq-ad-` prefix to minimize collisions.
- No React, animation library, CDN, font, or third-party script dependency.

## Performance

The five source images were resized from 1152 × 2048 to 720 × 1280 and recompressed as WebP. Total optimized image weight is approximately 340 KB instead of approximately 1.94 MB.

## Before deployment

Run the website's normal checks, for example:

```bash
npm run build
npm run test
npm run lint
```

Then review the section at mobile widths around 360 px and desktop widths around 1440 px.
