# Design Spec: Clean Gemini System v2.1

## Overview
A patch pack to improve Windows reliability for Gemini CLI by enforcing a "file-first" workflow and providing robust PowerShell-based maintenance tools.

## Architecture
The system integrates directly into the user's home directory (`C:\Users\abuba\`), providing centralized management for Gemini CLI configurations and project bootstrapping.

### Components

#### 1. Core Instructions (`GEMINI.md`)
- **Purpose**: Defines the operational rules for Gemini CLI.
- **Rules**:
  - Favor creating/editing files over large inline shell blobs.
  - Keep terminal commands short, repeatable, and reviewable.
  - Summarize plans before risky changes; provide validation steps after.

#### 2. Maintenance Scripts (`scripts/`)
- `gemini-backup.ps1`: Safer backups using `robocopy /E /XJ` to handle Windows junction points.
- `gemini-clean.ps1`: Targets problematic local state (`auto-saved.toml`, `cache`, `tmp`, `logs`).
- `gemini-doctor.ps1`: Health checks for Node, npm, git, and Gemini.
- `node-version-check.ps1`: Validates Node major versions (defaults to 20, 24).
- `gemini-config-validate.ps1`: Heuristic scan for JSON/TOML configuration issues.
- `gemini-extension-cleanup.ps1`: Safe management of extensions, plugins, and skills.

#### 3. Project Bootstrapping
- `bootstrap-new-repo.ps1`: Orchestrates environment checks, backups, and `vite` project scaffolding in a single flow.
- `scaffold-vite.ps1`: Dedicated Vite + React + TypeScript setup.

#### 4. Templates & Examples
- `templates/rules/safe-workflow.md`: Reusable safety guidelines.
- `examples/prompts/`: Standardized prompts for common tasks (feature building, refactoring, bug fixing).
- `examples/commands/`: Reference for "good" vs "bad" command styles.

## Data Flow
1. **Bootstrap**: `bootstrap-new-repo.ps1` runs health checks -> backups config -> cleans local state -> scaffolds project -> injects `GEMINI.md`.
2. **Maintenance**: User runs `gemini-doctor.ps1` or `gemini-backup.ps1` as needed.
3. **Daily Use**: Gemini CLI follows the rules in `GEMINI.md`, preferring script creation in `scripts/` over inline execution.

## Success Criteria
- [ ] No more "robocopy" or "symlink" related copy failures during backup.
- [ ] Gemini CLI consistently creates file-based tools rather than one-liners.
- [ ] Bootstrap command successfully creates a functional Vite app with injected rules.
- [ ] Config validator identifies large or malformed `auto-saved.toml` files.

## Implementation Plan
1. Update root `.gitignore`, `README.md`, and `GEMINI.md`.
2. Create `scripts/` directory and populate all `.ps1` files.
3. Create `templates/` and `examples/` subdirectories with corresponding documentation.
4. Verify all PowerShell scripts run correctly in the Windows environment.
