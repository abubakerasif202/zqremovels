# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** ZQ Removals
**Generated:** 2026-06-03 17:00:34
**Category:** Home Services (Plumber/Electrician)

---

## Global Rules

### Color Palette (Custom Premium Rebuild Theme)

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary / Background | `#0A1410` | `--zq-bg` |
| Deep Background | `#050A08` | `--zq-bg-deep` |
| Secondary Surface | `#12221C` | `--zq-surface` |
| CTA / Accent | `#C9A86A` | `--zq-gold` / `--zq-cta` |
| Accent Light | `#E3C98F` | `--zq-gold-light` |
| Accent Dark | `#9F7D42` | `--zq-gold-dark` |
| Text | `#F7F4ED` | `--zq-text` |
| Text Muted | `rgba(255, 255, 255, 0.68)` | `--zq-text-muted` |

**Color Notes:** Luxury forest green background, gold buttons/accents, cream text.

### Typography

- **Heading Font:** Fraunces (serif)
- **Body Font:** Inter (sans-serif)
- **Mood:** premium, luxury, elegant, modern, trustworthy, clean
- **Local Font Sources:** Pre-loaded via WOFF2 in `public/fonts/` for maximum performance.

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-soft` | `0 14px 36px var(--zq-shadow)` | Subtle lift |
| `--shadow-card` | `0 28px 64px rgba(0, 0, 0, 0.6)` | Cards, buttons |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.button-primary, .zq-v2-button-primary {
  background: var(--zq-gold);
  color: var(--zq-bg-deep);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.button-primary:hover, .zq-v2-button-primary:hover {
  background: var(--zq-gold-light);
  transform: translateY(-1px);
}

/* Secondary / Outline Button */
.button-secondary, .zq-v2-button-outline {
  background: transparent;
  color: var(--zq-text);
  border: 1px solid var(--zq-border-soft);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.zq-v2-service-card {
  background: var(--zq-surface);
  border: 1px solid var(--zq-border-soft);
  border-radius: 12px;
  padding: 24px;
  transition: all 200ms ease;
  cursor: pointer;
}

.zq-v2-service-card:hover {
  border-color: var(--zq-border-gold);
  transform: translateY(-2px);
}
```

### Inputs

```css
.quote-form-premium input, .quote-form-premium select, .quote-form-premium textarea {
  background: var(--zq-bg-deep);
  border: 1px solid var(--zq-border-soft);
  color: var(--zq-text);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.quote-form-premium input:focus, .quote-form-premium select:focus, .quote-form-premium textarea:focus {
  border-color: var(--zq-gold);
  outline: none;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Trust & Authority

**Keywords:** Certificates/badges displayed, expert credentials, case studies with metrics, before/after comparisons, industry recognition, security badges

**Best For:** Healthcare/medical landing pages, financial services, enterprise software, premium/luxury products, legal services

**Key Effects:** Badge hover effects, metric pulse animations, certificate carousel, smooth stat reveal

### Page Pattern

**Pattern Name:** Hero + Testimonials + CTA

- **Conversion Strategy:** Social proof before CTA. Use 3-5 testimonials. Include photo + name + role. CTA after social proof.
- **CTA Placement:** Hero (sticky) + Post-testimonials
- **Section Order:** 1. Hero, 2. Problem statement, 3. Solution overview, 4. Testimonials carousel, 5. CTA

---

## Anti-Patterns (Do NOT Use)

- ❌ Hidden contact info
- ❌ No certifications

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
