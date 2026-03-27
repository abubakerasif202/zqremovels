# Design: Brand Update and Infrastructure Cleanup

## Objectives
1.  **Visual Identity**: Replace text-based brand marks with the new ZQ Removals logo.
2.  **SEO & Discovery**: Ensure 100% SEO optimization and clean URL structures.
3.  **Security & Scalability**: Relax CSP for future analytics while maintaining security.
4.  **UX Consistency**: Update Hero and Header sections across all 28+ HTML files.

## Technical Specifications
- **Logo Asset**: `brand-logo.png` (renamed from source).
- **Header Implementation**: `img` tag replacement for `.brand-mark` span.
- **Redirect Logic**: Netlify global splat redirects for stripping `.html`.
- **CSP Headers**: `script-src` and `connect-src` expanded for `googletagmanager.com` and `google-analytics.com`.
- **SEO Validation**: Zero errors on `seo_audit.py`.

## Success Criteria
- [ ] No `zq_removals_analytics.png` references remain.
- [ ] Header link depth correctly handles root vs. subdirectories.
- [ ] All 29 pages pass the SEO audit.
- [ ] `netlify.toml` contains clean URL redirect patterns.
