---
name: zq-removals
description: ZQ Removals marketing UI system for the Adelaide removals website.
---

# ZQ Removals UI System

Use this system for ZQ Removals marketing pages, quote conversion surfaces, service pages, suburb pages, and planning guides.

## Direction

Warm editorial premium: deep forest backgrounds, brass accents, Fraunces display type, Inter body copy, strong photography, restrained borders, and scope-first conversion language.

## Rules

- Keep body copy at or above the documented readable foreground tokens.
- Use `--accent-1` for text on dark surfaces and `--accent-3` only for borders or large decorative elements.
- Use sentence case for body copy and compact uppercase labels only for eyebrows and utility metadata.
- Keep primary actions explicit: `Get Fixed-Price Quote` or `Request My Fixed-Price Quote`.
- Preserve 44px minimum touch targets and visible keyboard focus.
- Do not introduce gradients, purple palettes, emoji icons, invented trust claims, or rounded accent strips.

## Source of truth

Production styling remains in `premium-site.css`, mirrored to `src/styles/premium-site.css` by the generator. The canonical token export is `tokens/colors_and_type.css`.
