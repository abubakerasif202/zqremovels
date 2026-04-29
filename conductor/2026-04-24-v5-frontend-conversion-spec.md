# V5 Frontend & Conversion Upgrade Spec

## Scope
This specification covers Phases 1, 2, 3, 4, and 7 of the ZQ Removals V5 upgrade. It focuses on UI/UX, conversion rate optimization, and visual refinement using the existing codebase structure. 

## Approach: "Refined Premium Local"
The goal is to elevate the "Adelaide premium" feel without completely rebuilding the layout. We will use the deep navy (`#0a192f`) in high-impact zones (Hero, Stats, Footer) and reduce the beige/warm tones elsewhere to create a crisper, more modern look.

### Phase 1: Hero Optimization
*   **Headline:** Change to exactly: "Stress-free moving with clear prices and a team that cares."
*   **Subheading (Lede):** Refine to strongly emphasize trust, clarity, and the Adelaide focus.
*   **Trust Strip:** Replace the current trust brief with a single, high-impact strip under the CTAs: "⭐ 4.9★ from 200+ Adelaide customers | Fully insured & trained team | Fixed pricing — no surprises".
*   **CTAs:** Ensure the Primary button ("Get My Free Quote") uses the bold gold accent and the Secondary button ("Call 0433 819 989") is highly visible but distinct.

### Phase 2: Conversion Layer
*   **Trust Bullets (Grid):** Refine the `home-trust-grid` items to focus strictly on: "Fixed pricing", "On-time arrival", and "Careful handling".
*   **Urgency Drivers:** Inject "Limited bookings available this week" and "Fast response within 1 hour" near the hero and quote sections.
*   **Quote Form Friction:** Add micro-copy to the form header: "Takes less than 60 seconds" and "No obligation quote". Review the form fields to ensure only essential information is required to start the quote process.

### Phase 3: Real-World Proof
*   **Testimonials:** Rewrite the existing placeholders into highly realistic, human-sounding reviews with local Adelaide context.
*   **Stats Updates:** Update the "Our Experience" stats grid:
    *   "10+ years moving Adelaide families"
    *   "500+ successful moves"
    *   "50+ suburbs covered"
*   **"Why Choose Us":** Edit the `home-story-list` to feature short, clear, jargon-free benefits.

### Phase 4: Visual Refinement
*   **Color Palette Adjustment:** Reduce the use of beige (`--color-bg-soft`, `.section-mist`). Shift the background tones to crisper whites or very subtle cool greys to let the Deep Navy and Gold accents pop more effectively.
*   **Depth & Shadows:** Enhance the CSS variables for `--shadow-soft` and `--shadow-card` to provide subtle, premium layering for service cards and form panels.
*   **Typography Hierarchy:** Increase the contrast and weight of H2/H3 headings. Ensure body text (`.lede`, `p`) has optimal line height and readability.

### Phase 7: Final Polish
*   **Mobile Review:** Ensure sticky mobile CTAs, form padding, and hero text scale perfectly on smaller devices.
*   **Spacing Consistency:** Standardize vertical rhythm between sections (`--space-8`, `--space-9`).
*   **Content Audit:** Sweep the homepage for any remaining generic "corporate" filler text and replace it with direct, outcome-focused copy.

## Next Steps
Once this specification is approved, we will move directly into implementation, applying these changes to `site-src/content/index.html`, `premium-site.css`, and related files.