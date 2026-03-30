# Clean Gemini System v2.1

This patch pack improves Windows reliability for Gemini CLI setups.

## Recommended workflow
1. Put project instructions in `GEMINI.md`
2. Keep scaffolding in `scripts/`
3. Keep reusable prompts in `examples/prompts/`
4. Run doctor checks before heavy sessions
5. Reset auto-saved state if Gemini starts throwing policy errors
6. Use the bootstrap script for new repos

## Usage
- Backup config: `pwsh -File .\scripts\gemini-backup.ps1`
- Clean local state: `pwsh -File .\scripts\gemini-clean.ps1`
- Check environment: `pwsh -File .\scripts\gemini-doctor.ps1`
- One-command bootstrap: `pwsh -File .\scripts\bootstrap-new-repo.ps1 -ProjectName my-app`
