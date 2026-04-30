#!/usr/bin/env node

import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { stdin as input, stdout as output } from "node:process";
import { spawn } from "node:child_process";

const SUPPORTED_AGENTS = new Set(["codex", "claude"]);

const RESERVED_WINDOWS_NAMES = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
]);

function validateApplicationDisplayName(raw) {
  const name = String(raw || "").trim();
  if (!name) {
    throw new Error("Application name cannot be empty.");
  }
  if (name.length > 120) {
    throw new Error("Application name is too long (max 120 characters).");
  }
  return name;
}

function sanitizeApplicationFolderName(displayName) {
  let s = String(displayName).trim().replace(/\s+/g, "-");
  s = s.replace(/[^a-zA-Z0-9_-]/g, "");
  s = s.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
  if (!s) {
    throw new Error("Application name must contain at least one letter or number after sanitization.");
  }
  if (s === "." || s === "..") {
    throw new Error("Invalid application folder name.");
  }
  if (RESERVED_WINDOWS_NAMES.has(s.toUpperCase())) {
    throw new Error(`"${s}" is reserved on Windows. Choose a different application name.`);
  }
  if (s.length > 64) {
    s = s.slice(0, 64).replace(/-+$/g, "");
  }
  if (!s) {
    throw new Error("Invalid application folder name after sanitization.");
  }
  return s;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = value;
    i += 1;
  }
  return args;
}

function toAbsolutePath(rawPath) {
  if (!rawPath) {
    return rawPath;
  }
  if (rawPath.startsWith("~")) {
    return path.join(os.homedir(), rawPath.slice(1));
  }
  return path.resolve(rawPath);
}

function runCommand(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: options.stdio ?? "pipe",
      shell: options.shell ?? false,
      cwd: options.cwd,
      env: options.env ?? process.env
    });

    let stdoutData = "";
    let stderrData = "";

    if (child.stdout) {
      child.stdout.on("data", (chunk) => {
        stdoutData += chunk.toString();
      });
    }
    if (child.stderr) {
      child.stderr.on("data", (chunk) => {
        stderrData += chunk.toString();
      });
    }

    child.on("error", (err) => reject(err));
    child.on("close", (code) => {
      resolve({
        code,
        stdout: stdoutData.trim(),
        stderr: stderrData.trim()
      });
    });
  });
}

async function commandExists(name) {
  const isWindows = process.platform === "win32";
  const checkCmd = isWindows ? "where" : "which";
  const result = await runCommand(checkCmd, [name]);
  return result.code === 0;
}

function documentsDirectory() {
  return path.join(os.homedir(), "Documents");
}

function shouldCopyFromStaging(src, stagingRoot) {
  if (path.basename(src) === ".git") {
    return false;
  }
  const rel = path.relative(stagingRoot, src);
  if (rel === "README.md") {
    return false;
  }
  return true;
}

async function nextWorkspaceDestination(baseDir, repoFolderName) {
  let candidate = path.join(baseDir, repoFolderName);
  let suffix = 2;
  while (fs.existsSync(candidate)) {
    candidate = path.join(baseDir, `${repoFolderName}-${suffix}`);
    suffix += 1;
  }
  return candidate;
}

async function readRequirements(requirementsPath) {
  const raw = await fsp.readFile(requirementsPath, "utf8");
  return JSON.parse(raw);
}

async function validatePrdPath(prdPath) {
  let stat;
  try {
    stat = await fsp.stat(prdPath);
  } catch {
    throw new Error(`PRD file does not exist: ${prdPath}`);
  }

  if (stat.isDirectory()) {
    throw new Error(`PRD path points to a directory, not a file: ${prdPath}`);
  }
  if (path.extname(prdPath).toLowerCase() !== ".md") {
    throw new Error("PRD file must use a .md extension.");
  }
}

async function prepareRawPrdFolder(rawPrdDir, obviousBlockers) {
  await fsp.mkdir(rawPrdDir, { recursive: true });

  for (const blocker of obviousBlockers) {
    const blockerPath = path.join(rawPrdDir, blocker);
    if (fs.existsSync(blockerPath)) {
      await fsp.rm(blockerPath, { force: true });
    }
  }
}

async function archiveExistingMarkdown(rawPrdDir) {
  const entries = await fsp.readdir(rawPrdDir, { withFileTypes: true });
  const existingMarkdown = entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === ".md")
    .map((entry) => entry.name);

  if (existingMarkdown.length === 0) {
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(rawPrdDir, "_bootstrap_backup", stamp);
  await fsp.mkdir(backupDir, { recursive: true });

  for (const fileName of existingMarkdown) {
    await fsp.rename(path.join(rawPrdDir, fileName), path.join(backupDir, fileName));
  }

  console.log("");
  console.log(`Moved existing raw_prd markdown files to backup: ${backupDir}`);
}

async function launchAgent(agent, shellCoreDir) {
  console.log("");
  console.log(`Launching ${agent} in: ${shellCoreDir}`);
  console.log("You should now be ready to type: begin");
  console.log("You can also type: start");
  console.log("");

  const launcherResult = spawn(agent, [], {
    cwd: shellCoreDir,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  await new Promise((resolve, reject) => {
    launcherResult.on("error", reject);
    launcherResult.on("close", resolve);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const agent = String(args.agent || "").toLowerCase();
  const expectedPlatform = String(args.platform || "").toLowerCase();
  const repoUrl = String(args["repo-url"] || "").trim();
  const requirementsPathArg = String(args["requirements-path"] || "").trim();
  const repoFolderName = String(args["repo-folder"] || "Forgeshell");

  if (!SUPPORTED_AGENTS.has(agent)) {
    throw new Error("Invalid or missing --agent. Use codex or claude.");
  }
  if (!repoUrl) {
    throw new Error("Missing --repo-url.");
  }

  if (expectedPlatform === "mac" && process.platform !== "darwin") {
    throw new Error("This launcher is for macOS only.");
  }
  if (expectedPlatform === "windows" && process.platform !== "win32") {
    throw new Error("This launcher is for Windows only.");
  }

  const currentFilePath = fileURLToPath(import.meta.url);
  const requirementsPath = requirementsPathArg
    ? toAbsolutePath(requirementsPathArg)
    : path.join(path.dirname(currentFilePath), "requirements.json");
  const requirements = await readRequirements(requirementsPath);

  const dependencies = [
    ...(requirements.commonDependencies || []),
    ...((requirements.agentDependencies && requirements.agentDependencies[agent]) || [])
  ];

  const missing = [];
  for (const dep of dependencies) {
    // eslint-disable-next-line no-await-in-loop
    const found = await commandExists(dep.name);
    if (!found) {
      missing.push(dep);
    }
  }

  if (missing.length > 0) {
    console.error("");
    console.error("Please install the following required dependencies before running ForgeShell");
    console.error("");
    for (const dep of missing) {
      console.error(`- ${dep.name}: ${dep.installHint}`);
    }
    process.exit(1);
  }

  const rl = readline.createInterface({ input, output });
  const rawInputPath = await rl.question("Enter full path to your PRD markdown file (.md): ");
  const prdPath = toAbsolutePath(rawInputPath.trim());
  await validatePrdPath(prdPath);

  const rawAppName = await rl.question(
    "What would you like your new application's name to be? "
  );
  const applicationDisplayName = validateApplicationDisplayName(rawAppName);
  const applicationFolderName = sanitizeApplicationFolderName(applicationDisplayName);
  console.log("");
  console.log(`Application folder name (for final packaging): ${applicationFolderName}`);
  rl.close();

  const docsDir = documentsDirectory();
  await fsp.mkdir(docsDir, { recursive: true });
  const workspaceDest = await nextWorkspaceDestination(docsDir, repoFolderName);
  const stagingRoot = await fsp.mkdtemp(path.join(os.tmpdir(), "forgeshell-bootstrap-"));
  const stagingCloneDest = path.join(stagingRoot, "ForgeShell-source");

  try {
    console.log("");
    console.log(`Downloading ForgeShell distribution from GitHub...`);
    const cloneResult = await runCommand("git", ["clone", repoUrl, stagingCloneDest], { stdio: "pipe" });
    if (cloneResult.code !== 0) {
      throw new Error(`Failed to clone repository.\n${cloneResult.stderr || cloneResult.stdout}`);
    }

    console.log(`Creating clean workspace copy at: ${workspaceDest}`);
    await fsp.cp(stagingCloneDest, workspaceDest, {
      recursive: true,
      filter: (src) => shouldCopyFromStaging(src, stagingCloneDest)
    });

    const inheritedGitMetadata = path.join(workspaceDest, ".git");
    if (fs.existsSync(inheritedGitMetadata)) {
      throw new Error("Clean workspace creation failed: inherited .git metadata is still present.");
    }

    const shellCoreDir = path.join(workspaceDest, "shell-core");
    const rawPrdDir = path.join(shellCoreDir, "raw_prd");
    await prepareRawPrdFolder(rawPrdDir, requirements.obviousIntakeBlockers || []);
    await archiveExistingMarkdown(rawPrdDir);

    const prdFileName = path.basename(prdPath);
    const targetPrdPath = path.join(rawPrdDir, prdFileName);
    await fsp.copyFile(prdPath, targetPrdPath);

    const packagingDir = path.join(shellCoreDir, ".forgeshell");
    await fsp.mkdir(packagingDir, { recursive: true });
    const packagingPayload = {
      applicationDisplayName,
      applicationFolderName,
      createdAt: new Date().toISOString(),
      note: "Used only for the optional final ForgeShell packaging step. Nothing is renamed during bootstrap."
    };
    await fsp.writeFile(
      path.join(packagingDir, "packaging.json"),
      `${JSON.stringify(packagingPayload, null, 2)}\n`,
      "utf8"
    );

    console.log(`Copied PRD to: ${targetPrdPath}`);
    console.log(`Recorded packaging target at: ${path.join(packagingDir, "packaging.json")}`);
    await launchAgent(agent, shellCoreDir);
  } finally {
    await fsp.rm(stagingRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error("");
  console.error(`ForgeShell bootstrap failed: ${error.message}`);
  process.exit(1);
});
