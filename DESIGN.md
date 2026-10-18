# ZQ Removals design rules

The approved production identity is **Midnight Navy + Vibrant Orange**.
These rules supersede historical forest/gold and neon concepts. Preserve the
existing logo, verified business information, imagery and quote integrations.

## Shared palette

| Role | Colour |
| --- | --- |
| Navy background | `#0b1e32` |
| Deep navy | `#071525` |
| Navy surface | `#122b43` |
| Elevated navy | `#19364f` |
| Hero/footer and CTA text | `#102b43` |
| Page background | `#f5f7fa` |
| Card/input background | `#ffffff` |
| Body text on light surfaces | `#20374b` |
| Secondary text on light surfaces | `#526477` |
| CTA orange | `#ff8a3d` |
| Orange hover | `#ffad73` |
| Orange text on light surfaces | `#a43d06` |

Production styles live in `premium-site.css` and its Astro mirror
`src/styles/premium-site.css`. Keep both in sync. Historical `--zq-gold`
variables remain compatibility aliases; their values follow this palette.

## Components and interaction

- Use navy text on bright orange buttons. White text on bright orange does
  not meet normal-text AA contrast. Reserve dark orange for links on white.
- Keep normal text contrast at least 4.5:1, large text at least 3:1 and
  meaningful control boundaries/focus indicators at least 3:1.
- Use Inter for body copy and the existing heading font. Load fonts locally
  with swap; retain image dimensions and responsive image sources.
- Use existing containers, spacing and components. Avoid continuously
  animated CTAs, glow effects and decorative motion that impedes reading.
- Keep keyboard focus visible, dialogs escapable and focus contained while
  modal. Restore focus to the opener when closing.
- Keep mobile inputs at least 16px and icon buttons at least 44px. Chat must
  follow the visual viewport and safe-area insets when the keyboard opens.
- Respect reduced motion and preserve usable no-JavaScript quote fallbacks.

## Verification

Build from source; never patch `site-dist/`. Run the existing contrast, quote,
SEO and browser checks. Test widths 320, 360, 375, 390, 430, 768, 1024, 1440
and 1920px. Automated contrast checks require manual inspection of text on
photographs, gradients and other backgrounds they cannot resolve.
