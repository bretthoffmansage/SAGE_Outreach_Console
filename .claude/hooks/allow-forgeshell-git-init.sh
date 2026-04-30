import fs from "node:fs";

const input = fs.readFileSync(0, "utf8");
const payload = JSON.parse(input || "{}");

const cwd = payload.cwd ?? "";
const toolName = payload.tool_name ?? "";
const command = payload.tool_input?.command ?? "";
const projectDir = process.env.CLAUDE_PROJECT_DIR ?? "";

if (toolName !== "Bash") process.exit(0);
if (!projectDir || cwd !== projectDir) process.exit(0);

// Never auto-allow compound commands.
if (command.includes("&&") || command.includes(";") || command.includes("|")) {
  process.exit(0);
}

const allowed = new Set([
  "pwd",
  "git rev-parse --is-inside-work-tree",
  "git init",
  "git status",
]);

if (!allowed.has(command)) process.exit(0);

const response = {
  hookSpecificOutput: {
    hookEventName: "PermissionRequest",
    decision: {
      behavior: "allow",
    },
  },
};

process.stdout.write(JSON.stringify(response));