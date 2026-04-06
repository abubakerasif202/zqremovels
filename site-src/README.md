# Static Site Source

This folder is the source of truth for the deployed static pages.

- `pages.json` stores per-page metadata and the output path.
- `content/` stores page-specific `<main>` content blocks.
- `partials/` stores the shared header and footer.
- `templates/` stores the page shell templates used by the build step.

Build the site with:

```powershell
npm run build
```

That command runs `node scripts/build-site.mjs`, rebuilds the static HTML pages in `site-dist/`, and refreshes the shared minified stylesheet.
