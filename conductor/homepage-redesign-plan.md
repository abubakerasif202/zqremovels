# Homepage Premium Redesign Plan

## Objective
Redesign the ZQ Removals homepage into a premium, high-end, luxury editorial experience. The goal is to improve the hero section, card design, trust signals, and overall layout rhythm, while strengthening the final CTA.

## Key Files & Context
- `site-src/content/index.html` (The primary target for the HTML redesign)
- `premium-site.css` (Target for CSS updates to match the new luxury palette and typography)
- `.stitch/SITE.md`, `.stitch/DESIGN.md`, `.stitch/next-prompt.md` (To orchestrate the Stitch Loop)

## Design Direction
- **Style:** Luxury editorial style.
- **Palette:** Navy, ivory, and gold.
- **Typography:** Elegant, high-trust, and legible.
- **Feel:** Premium, high-converting, service-based business.

## Implementation Steps

1. **Setup the Stitch Loop:**
   - Create `.stitch/DESIGN.md` documenting the luxury editorial design system (colors, typography, component styling rules).
   - Create `.stitch/SITE.md` documenting the site roadmap focused on the homepage sections.
   - Initialize `.stitch/next-prompt.md` for the first iteration.

2. **Iterative Redesign (Stitch Loop):**
   We will iterate through the homepage sections, generating high-quality markup using the Stitch MCP tools, and integrating the results into the project files.
   
   - **Iteration 1: Premium Hero & Trust Signals**
     Redesign the top of the page to be impactful, removing weak or placeholder elements and introducing strong trust signals.
   - **Iteration 2: Service & Process Cards**
     Redesign the "Process Timeline" and "Premium Guarantees" sections with improved depth, elegant typography, and better layout rhythm.
   - **Iteration 3: Proof & Testimonials**
     Overhaul the "Customer Voice" and "Proof in Numbers" sections to feel highly credible and established.
   - **Iteration 4: Quote Form & Final CTA**
     Refine the "Request Quote" form and the footer area to drive conversions with a premium aesthetic.

3. **Integration:**
   - Move the generated layout and CSS from `.stitch/designs/` into `site-src/content/index.html` and `premium-site.css`.
   - Update asset paths to be relative.
   - Run `npm run build` and `npm run test` to verify the site builds correctly with the new structure.

## Verification & Testing
- Visually verify the site locally (using Chrome DevTools MCP or manual review) to ensure the navy/ivory/gold palette is consistent.
- Ensure all quote form (`#homepage-quote-form`) functionality remains intact.
- Verify mobile responsiveness of the new high-end design.