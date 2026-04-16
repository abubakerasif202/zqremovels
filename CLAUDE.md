# Claude Code Guidelines — ZQ Removals

## Working Style

- Keep changes small and production-safe. Prefer targeted edits over wide refactors.
- Work through code audits, test runs, and file edits with minimal interruption.
- Only pause to confirm actions that are destructive, irreversible, or affect deployment.
- Do not refactor surrounding code when fixing a bug or adding a feature.

## Change Safety

- Never force-push, reset, or clean the working tree without explicit confirmation.
- Never delete files, modify `.env` / secrets, or run deployment commands without asking first.
- Deployments (Vercel, `gh release`, `npm run deploy`) require explicit user approval each time.

## Testing

- Run `npm run test` after any logic change to verify nothing is broken.
- Run `npm run build` to confirm the build passes before declaring a task complete.

## Session Summary

At the end of each session Claude will output:
- Files changed (from `git diff --stat`)
- Uncommitted file count
- Manual follow-up checklist (test, review diff, deploy when ready)
