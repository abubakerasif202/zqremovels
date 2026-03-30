# Workspace Instructions

You are working inside a developer repo.

Rules:
- Never generate or run giant inline shell blobs when a script file can be created instead.
- Prefer creating or editing files directly over embedding escaped JSON inside commands.
- Keep commands short, reviewable, and repeatable.
- For project scaffolding, write files to disk in normal source files instead of `python -c` one-liners.
- Before risky changes, summarize the plan.
- After edits, propose validation steps.

Preferred tooling:
- PowerShell scripts for Windows automation
- Node/npm for JS app setup
- Vite + React + TypeScript for frontend projects

Output style:
- concise
- actionable
- file-first
