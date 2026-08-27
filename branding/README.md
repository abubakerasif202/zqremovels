# Branding assets

`ab-digital-solutions-watermark.webp` — official AB Digital Solutions logo used by the
footer developer credit (`site-src/data/agency-credit.mjs`).

Produced from the supplied master artwork (1536x1024 PNG, gold glow on a dark
background). The dark background was removed by treating the artwork as additive
light: alpha is derived from the per-pixel maximum channel above the background
floor, with the colour unpremultiplied, so the gold, the monogram strokes, the
tagline and the glow survive intact with no halo or matte edge.

Current asset: 360x173, transparent WebP, ~28 KB. Rendered at
`clamp(140px, 15vw, 170px)` wide, i.e. roughly 2x for high-DPI displays.

Regenerate only from the original master; do not upscale or re-encode this file.
