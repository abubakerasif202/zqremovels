# Plan: Deep Review and Fix Technical Issues

This plan addresses several identified issues across `zq-removals-site`, `zq-removals-pro`, and the project root to ensure a clean, error-free build and proper functionality.

## Identified Issues

### 1. `zq-removals-pro` (Critical/Functional)
- **Environment Variables:** `%VITE_ANALYTICS_ENDPOINT%` and `%VITE_ANALYTICS_WEBSITE_ID%` in `index.html` are not being replaced during the build process.
- **Script Bundle Warning:** The analytics script in `index.html` is missing the `type="module"` attribute, causing Vite to warn and potentially fail to bundle it correctly.
- **Missing Environment Config:** No `.env` files or `.env.example` exist for these variables.

### 2. `zq-removals-site` (Quality/Linting)
- **110 Lint Errors:** The project was recently updated to turn off most lint rules in `.eslintrc.cjs` to suppress errors, but many files still have inconsistent style (e.g., extra semicolons for a `standard` config).
- **TypeScript Version Warning:** A warning about an unsupported TypeScript version (5.9.3) persists during linting.
- **ESLint/TSConfig Mismatch:** ESLint reports that `vite.config.ts` is not included in the project's `tsconfig.json`, despite it being listed in the `include` array.

### 3. Project Root (Maintenance)
- **Log Files:** `server.err.log` and `server.out.log` appear to contain access logs rather than actual error/output logs.
- **Missing Script:** `git_ops.ps1` is listed as deleted in `git status` but was used in the last commit.

## Proposed Solutions

### Phase 1: Fix `zq-removals-pro` Analytics and Build
1. **Update `vite.config.ts`**: Add a custom `transformIndexHtml` hook to replace `%VITE_ANALYTICS_ENDPOINT%` and `%VITE_ANALYTICS_WEBSITE_ID%` with values from `process.env`.
2. **Update `client/index.html`**: Add `type="module"` to the analytics script tag.
3. **Create `.env.example`**: Document the required variables.
4. **Create `.env`**: Provide local development values (using placeholder if unknown).

### Phase 2: Fix `zq-removals-site` Linting and Config
1. **Fix ESLint/TSConfig Mismatch**: Explicitly include `./vite.config.ts` in `tsconfig.json` and ensure `.eslintrc.cjs` points to the correct project.
2. **Restore Lint Rules**: Re-enable the rules that were turned off to maintain code quality.
3. **Automated Fix**: Run `npm run lint -- --fix` to resolve the majority of errors (semicolons, etc.).
4. **Manual Fix**: Resolve the remaining 21+ errors manually (missing return types, etc.).

### Phase 3: Root Maintenance
1. **Logs Review**: Clarify why access logs are going to `server.err.log`. Adjust server startup script if necessary.
2. **Restore/Cleanup**: Confirm if `git_ops.ps1` is needed. If so, restore it; otherwise, stage the deletion.

## Verification & Testing
- Run `pnpm build` and `pnpm check` in `zq-removals-pro`.
- Verify the built `dist/public/index.html` in `zq-removals-pro` for correctly replaced variables.
- Run `npm run build` and `npm run lint` in `zq-removals-site`.
- Check logs during a short server run.

