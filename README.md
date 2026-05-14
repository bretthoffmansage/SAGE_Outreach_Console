# SAGE Outreach

## What this is

SAGE Outreach is the application delivered from your ForgeShell run.

This folder was prepared by **ForgeShell clean handoff** packaging. ForgeShell runtime docs were archived under `_forgeshell_archive/` and shell control directories were removed from this tree.

## How to run

1. Install dependencies: `npm install`
2. - `npm start` — start the app
2. - `npm run dev` — development server

## Setup and environment

- Copy or create env files if your app expects them (for example `.env.local`) based on project conventions.
- External npm dependencies are listed in `package.json`.
- **Hermes local runtime (planned):** set `HERMES_RUNTIME_URL` server-side to the HTTP(S) endpoint for Hermes by Nous on the office Mac mini when you are ready to validate connectivity. Optional server-only secrets: `HERMES_RUNTIME_API_KEY` or `HERMES_RUNTIME_TOKEN`. Do not expose secrets in `NEXT_PUBLIC_*` variables. The console validates URL shape only; it does not enable auto-send, auto-post, or external writes by default.

## Deployment / launch

- Deployment targets are project-specific; infer from `package.json` and any framework config present in this repo.

## Folder name

This application directory is named `SAGE-Outreach` (filesystem-safe name from bootstrap).
