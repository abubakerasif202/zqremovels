---
name: design-system-adelaide-removalists
description: Creates implementation-ready design-system guidance with tokens, component behavior, and accessibility standards. Use when creating or updating UI rules, component specifications, or design-system documentation.
---

<!-- TYPEUI_SH_MANAGED_START -->

# Adelaide Removalists

## Mission
Deliver implementation-ready design-system guidance for Adelaide Removalists that can be applied consistently across marketing site interfaces.

## Brand
- Product/brand: Adelaide Removalists
- URL: https://zqremovals.au/
- Audience: readers and knowledge seekers
- Product surface: marketing site

## Style Foundations
- Visual style: structured, accessible, implementation-first
- Main font style: `font.family.primary=Inter`, `font.family.stack=Inter, system-ui, sans-serif`, `font.size.base=16px`, `font.weight.base=400`, `font.lineHeight.base=27.2px`
- Typography scale: `font.size.xs=10.56px`, `font.size.sm=11.52px`, `font.size.md=11.84px`, `font.size.lg=12.5px`, `font.size.xl=12.8px`, `font.size.2xl=13.6px`, `font.size.3xl=14.4px`, `font.size.4xl=14.72px`
- Color palette: `color.text.primary=#b2bdcd`, `color.text.secondary=#243246`, `color.text.tertiary=#f7f8fb`, `color.text.inverse=#5f6876`, `color.surface.base=#000000`, `color.surface.muted=#ffffff`, `color.surface.raised=#d2b06a`, `color.surface.strong=#04070d`
- Spacing scale: `space.1=2px`, `space.2=6px`, `space.3=13px`, `space.4=13.6px`, `space.5=16px`, `space.6=18px`, `space.7=20px`, `space.8=23.81px`
- Radius/shadow/motion tokens: `radius.xs=6px` | `shadow.1=rgba(0, 0, 0, 0.2) 0px 10px 30px 0px`, `shadow.2=rgba(0, 0, 0, 0.2) 0px 20px 40px 0px`, `shadow.3=rgba(176, 138, 74, 0.28) 0px 14px 34px 0px` | `motion.duration.instant=200ms`, `motion.duration.fast=300ms`, `motion.duration.normal=400ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
concise, confident, implementation-focused

## Rules: Do
- Use semantic tokens, not raw hex values in component guidance.
- Every component must define required states: default, hover, focus-visible, active, disabled, loading, error.
- Responsive behavior and edge-case handling should be specified for every component family.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy, variants, and interactions.
4. Add accessibility acceptance criteria.
5. Add anti-patterns and migration notes.
6. End with QA checklist.

## Required Output Structure
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Prefer system consistency over local visual exceptions.

<!-- TYPEUI_SH_MANAGED_END -->
