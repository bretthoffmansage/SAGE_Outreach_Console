#!/usr/bin/env node
/**
 * ForgeShell optional final packaging (clean for handoff).
 * Run from shell-core: node scripts/forgeshell-packaging-handoff.mjs --mode clean
 * Requires a clean git tree unless FORGESHELL_PACKAGING_DRY_RUN=1 (not recommended).
 */

import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const ARCHIVE_ROOT = "_forgeshell_archive";
const RESERVED_WIN = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
]);

const ARTIFACT_FILES = [
  "PRD_SOURCE.md",
  "CURRENT_STATE_AUDIT.md",
  "MASTER_ROADMAP.md",
  "EXECUTION_PACKAGES.md",
  "FINAL_EXECUTION_AUDIT.md",
  "POST_EXECUTION_HARDENING_PLAN.md",
  "POST_EXECUTION_HARDENING_TASKS.md",
  "POST_BUILD_FIDELITY_AUDIT.md",
  "FIDELITY_UPLIFT_PLAN.md",
  "DESIGN_DIRECTION_BRIEF.md",
  "UI_REFINEMENT_PLAN.md",
  "POST_DESIGN_FUNCTIONAL_VALIDATION.md",
  "FORGESHELL_FINAL_CLOSEOUT.md",
  "FORGESHELL_PACKAGING_CHOICE.md",
  "FORGESHELL_FIRST_RUN_REVIEW.md"
];

const REMOVE_DIRS = [".claude", ".codex", "bootstrap", "dry_runs", "shell"];

const FORGESHELL_PACKAGING_SCRIPT = "forgeshell-packaging-handoff.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (!t.startsWith("--")) continue;
    const k = t.slice(2);
    const v = argv[i + 1];
    if (!v || v.startsWith("--")) {
      args[k] = true;
    } else {
      args[k] = v;
      i += 1;
    }
  }
  return args;
}

function runCommand(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const c = spawn(cmd, args, { stdio: "pipe", shell: opts.shell ?? false, cwd: opts.cwd });
    let out = "";
    let err = "";
    c.stdout?.on("data", (d) => { out += d; });
    c.stderr?.on("data", (d) => { err += d; });
    c.on("error", reject);
    c.on("close", (code) => resolve({ code, stdout: out.trim(), stderr: err.trim() }));
  });
}

async function assertGitClean(workspace) {
  if (process.env.FORGESHELL_PACKAGING_DRY_RUN === "1") return;
  const st = await runCommand("git", ["status", "--porcelain"], { cwd: workspace });
  if (st.code !== 0) {
    throw new Error(`git status failed: ${st.stderr || st.stdout}`);
  }
  if (st.stdout.length > 0) {
    throw new Error(
      "Working tree is not clean. Commit or stash changes before clean handoff, or resolve intentionally."
    );
  }
}

async function moveIntoArchive(workspace, archiveDir, name) {
  const src = path.join(workspace, name);
  if (!fs.existsSync(src)) return;
  const dest = path.join(archiveDir, name);
  await fsp.rename(src, dest).catch(async () => {
    await fsp.cp(src, dest, { recursive: true, force: true });
    await fsp.rm(src, { recursive: true, force: true });
  });
}

async function removeDirIfPresent(workspace, rel) {
  const p = path.join(workspace, rel);
  if (fs.existsSync(p)) {
    await fsp.rm(p, { recursive: true, force: true });
  }
}

/**
 * `scripts/` is often ForgeShell-only (packaging handoff). If the app added its own
 * scripts, preserve them and only archive the known ForgeShell file.
 */
async function archiveScriptsDirectory(workspace, archiveDir) {
  const scriptsDir = path.join(workspace, "scripts");
  if (!fs.existsSync(scriptsDir)) {
    return;
  }

  const entries = await fsp.readdir(scriptsDir, { withFileTypes: true });
  if (entries.length === 0) {
    await fsp.rm(scriptsDir, { recursive: false, force: true }).catch(() => {});
    return;
  }

  const onlyForgeShellPackaging =
    entries.length === 1 &&
    entries[0].isFile() &&
    entries[0].name === FORGESHELL_PACKAGING_SCRIPT;

  if (onlyForgeShellPackaging) {
    await moveIntoArchive(workspace, archiveDir, "scripts");
    return;
  }

  const handoffPath = path.join(scriptsDir, FORGESHELL_PACKAGING_SCRIPT);
  if (!fs.existsSync(handoffPath)) {
    return;
  }

  const destDir = path.join(archiveDir, "scripts-forgeshell-only");
  await fsp.mkdir(destDir, { recursive: true });
  await fsp.rename(handoffPath, path.join(destDir, FORGESHELL_PACKAGING_SCRIPT));

  const remaining = await fsp.readdir(scriptsDir);
  if (remaining.length === 0) {
    await fsp.rm(scriptsDir, { recursive: false, force: true }).catch(() => {});
  }
}

async function readJson(p) {
  return JSON.parse(await fsp.readFile(p, "utf8"));
}

async function tryReadPackageJson(workspace) {
  const p = path.join(workspace, "package.json");
  try {
    return JSON.parse(await fsp.readFile(p, "utf8"));
  } catch {
    return null;
  }
}

function buildAppReadme({ displayName, folderName, packageJson, prdOneLiner }) {
  const scripts = packageJson?.scripts || {};
  const runLines = [];
  if (scripts.start) runLines.push("- `npm start` — start the app");
  if (scripts.dev) runLines.push("- `npm run dev` — development server");
  if (scripts.validate) runLines.push("- `npm run validate` — validation");
  if (scripts.test) runLines.push("- `npm test` — tests");
  if (runLines.length === 0) {
    runLines.push("- See `package.json` → `scripts` for run and validation commands.");
  }

  const deps = { ...(packageJson?.dependencies || {}), ...(packageJson?.devDependencies || {}) };
  const ext =
    Object.keys(deps).length > 0
      ? "External npm dependencies are listed in `package.json`."
      : "";

  return `# ${displayName}

## What this is

${prdOneLiner || `${displayName} is the application delivered from your ForgeShell run.`}

This folder was prepared by **ForgeShell clean handoff** packaging. ForgeShell runtime docs were archived under \`${ARCHIVE_ROOT}/\` and shell control directories were removed from this tree.

## How to run

1. Install dependencies: \`npm install\`
${runLines.map((l) => `2. ${l}`).join("\n")}

## Setup and environment

- Copy or create env files if your app expects them (for example \`.env.local\`) based on project conventions.
${ext ? `- ${ext}` : ""}

## Deployment / launch

- Deployment targets are project-specific; infer from \`package.json\` and any framework config present in this repo.

## Folder name

This application directory is named \`${folderName}\` (filesystem-safe name from bootstrap).
`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = String(args.mode || "").toLowerCase();
  const workspace = path.resolve(String(args.workspace || process.cwd()));

  if (mode !== "clean") {
    console.error("Usage: node scripts/forgeshell-packaging-handoff.mjs --mode clean [--workspace /path/to/shell-core]");
    process.exit(1);
  }

  const packagingPath = path.join(workspace, ".forgeshell", "packaging.json");
  if (!fs.existsSync(packagingPath)) {
    throw new Error(
      "Missing .forgeshell/packaging.json (bootstrap did not record an application name). Clean handoff cannot run."
    );
  }

  const choicePath = path.join(workspace, "FORGESHELL_PACKAGING_CHOICE.md");
  if (!fs.existsSync(choicePath)) {
    throw new Error("Missing FORGESHELL_PACKAGING_CHOICE.md. Record the operator packaging choice before running this script.");
  }
  const choiceRaw = await fsp.readFile(choicePath, "utf8");
  if (!/choice:\s*clean-for-handoff/i.test(choiceRaw)) {
    throw new Error("FORGESHELL_PACKAGING_CHOICE.md does not select clean-for-handoff. Aborting.");
  }

  const pkgMeta = await readJson(packagingPath);
  const folderName = String(pkgMeta.applicationFolderName || "").trim();
  const displayName = String(pkgMeta.applicationDisplayName || folderName).trim();
  if (!folderName) {
    throw new Error("packaging.json missing applicationFolderName.");
  }
  if (RESERVED_WIN.has(folderName.toUpperCase())) {
    throw new Error(`applicationFolderName is reserved on Windows: ${folderName}`);
  }

  await assertGitClean(workspace);

  const archiveDir = path.join(workspace, ARCHIVE_ROOT);
  await fsp.mkdir(archiveDir, { recursive: true });

  const archiveReadme = `# ForgeShell archive

This folder contains files **archived by ForgeShell packaging** (clean for handoff).

- The workspace was cleaned for **application handoff**.
- ForgeShell runtime logs and final shell planning/audit artifacts were **moved here**, not destroyed.
- Shell control directories (\`shell/\`, \`.codex/\`, \`.claude/\`, \`bootstrap/\`, \`dry_runs/\`) were removed from the application tree per packaging rules.
- The ForgeShell-only \`scripts/\` tree (or \`scripts-forgeshell-only/\` when your app also had files under \`scripts/\`) is archived here rather than left in the handed-off app.

Keep this folder if you need traceability of the original shell run.
`;
  await fsp.writeFile(path.join(archiveDir, "README.md"), archiveReadme, "utf8");

  let prdOneLiner = "";
  const prdSourcePath = path.join(workspace, "PRD_SOURCE.md");
  if (fs.existsSync(prdSourcePath)) {
    const text = await fsp.readFile(prdSourcePath, "utf8");
    const m = text.match(/###\s*One-sentence definition\s*\n+([^\n#]+)/i);
    prdOneLiner = (m && m[1] ? m[1].trim() : "") || "";
  }

  await moveIntoArchive(workspace, archiveDir, "agent_runs");

  for (const f of ARTIFACT_FILES) {
    // eslint-disable-next-line no-await-in-loop
    await moveIntoArchive(workspace, archiveDir, f);
  }

  const rootEntries = await fsp.readdir(workspace, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith(".md")) continue;
    if (!/^FORGESHELL_/i.test(entry.name)) continue;
    if (ARTIFACT_FILES.includes(entry.name)) continue;
    // eslint-disable-next-line no-await-in-loop
    await moveIntoArchive(workspace, archiveDir, entry.name);
  }

  const dotForgeshell = path.join(workspace, ".forgeshell");
  if (fs.existsSync(dotForgeshell)) {
    await moveIntoArchive(workspace, archiveDir, ".forgeshell");
  }

  await archiveScriptsDirectory(workspace, archiveDir);

  const packageJson = await tryReadPackageJson(workspace);
  const readmeBody = buildAppReadme({ displayName, folderName, packageJson, prdOneLiner });

  for (const dir of REMOVE_DIRS) {
    // eslint-disable-next-line no-await-in-loop
    await removeDirIfPresent(workspace, dir);
  }

  await fsp.writeFile(path.join(workspace, "README.md"), readmeBody, "utf8");

  const trimmedGitignore = `# Application .gitignore (post–ForgeShell handoff)
.env.local
.env.*.local

.DS_Store

node_modules/
.next/
dist/
build/
coverage/
*.tsbuildinfo
.vite/

# ForgeShell packaging archive (kept intentionally)
_forgeshell_archive/
`;
  await fsp.writeFile(path.join(workspace, ".gitignore"), trimmedGitignore, "utf8");

  const parent = path.dirname(workspace);
  const target = path.join(parent, folderName);
  if (fs.existsSync(target)) {
    throw new Error(`Target folder already exists: ${target}`);
  }

  await fsp.rename(workspace, target);

  console.log("");
  console.log("ForgeShell clean handoff complete.");
  console.log(`Application folder: ${target}`);
  console.log(`Archive: ${path.join(target, ARCHIVE_ROOT)}`);
  console.log("");
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  main().catch((e) => {
    console.error("");
    console.error(`ForgeShell packaging failed: ${e.message}`);
    process.exit(1);
  });
}
