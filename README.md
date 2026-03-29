# ZQ Removals

Website and booking application for **ZQ Removals** — Adelaide's premium removalist service.

**Live site:** [zqremovals.au](https://zqremovals.au)

---

## Repository Structure

```
.
├── CNAME                          # Custom domain for GitHub Pages / Vercel
└── Downloads/
    └── zq/
        ├── vercel.json            # Vercel deployment config (static site)
        ├── netlify.toml           # Netlify deployment config (static site)
        ├── sitemap.xml
        ├── robots.txt
        ├── index.html             # Static site entry point
        ├── *.html / */index.html  # Static service & suburb pages
        └── zq-removals-pro/       # Full-stack React/Vite booking app
            ├── client/            # React frontend (Vite + Tailwind CSS v4)
            ├── server/            # Express API server
            ├── shared/            # Shared types and constants
            ├── vercel.json        # Vercel deployment config (app)
            ├── vite.config.ts
            └── package.json
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 10+ (`npm install -g pnpm`)

### Install dependencies

```bash
cd Downloads/zq/zq-removals-pro
pnpm install
```

### Development

```bash
pnpm dev        # Start Vite dev server on http://localhost:3000
```

### Type check

```bash
pnpm check      # Run TypeScript compiler check (no emit)
```

### Build

```bash
pnpm build      # Build client (Vite) + bundle server (esbuild) → dist/
```

### Production

```bash
pnpm start      # Run the bundled Express server from dist/
```

---

## Environment Variables

Copy `.env.example` to `.env` in `Downloads/zq/zq-removals-pro/` and fill in the values:

```bash
cp Downloads/zq/zq-removals-pro/.env.example Downloads/zq/zq-removals-pro/.env
```

| Variable                   | Description                                |
| -------------------------- | ------------------------------------------ |
| `VITE_ANALYTICS_ENDPOINT`  | Self-hosted analytics server URL           |
| `VITE_ANALYTICS_WEBSITE_ID`| Analytics website/property ID             |

---

## Deployment

The app is deployed on **Vercel**. Configuration is in `Downloads/zq/zq-removals-pro/vercel.json`.

The static site (service pages, suburb landing pages) is served from `Downloads/zq/` using `Downloads/zq/vercel.json`.

---

## Tech Stack

| Layer      | Technology                                      |
| ---------- | ----------------------------------------------- |
| Frontend   | React 19, TypeScript, Vite 7, Tailwind CSS v4   |
| UI         | Radix UI primitives, shadcn/ui, Framer Motion   |
| Routing    | Wouter                                          |
| Forms      | React Hook Form + Zod                           |
| Backend    | Express.js (Node.js)                            |
| Package mgr| pnpm 10                                         |
