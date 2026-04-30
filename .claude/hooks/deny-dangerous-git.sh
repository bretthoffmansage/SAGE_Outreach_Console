import fs from "node:fs";

const input = fs.readFileSync(0, "utf8");
const payload = JSON.parse(input || "{}");

const toolName = payload.tool_name ?? "";
const command = payload.tool_input?.command ?? "";

if (toolName !== "Bash") process.exit(0);

const deniedPrefixes = [
  "git push",
  "git pull",
  "git fetch",
  "git remote ",
  "git clone ",
  "git reset --hard",
  "git clean -fd",
  "git clean -fdx",
  "git checkout -f",
  "git branch -D ",
  "git rebase ",
  "git cherry-pick ",
  "git am ",
];

const shouldDeny = deniedPrefixes.some((prefix) => command.startsWith(prefix));

if (!shouldDeny) process.exit(0);

const response = {
  hookSpecificOutput: {
    hookEventName: "PermissionRequest",
    decision: {
      behavior: "deny",
      message:
        "ForgeShell Claude hook denied a dangerous git command. Use the documented shell flow and escalate explicitly if this command is truly required.",
    },
  },
};

process.stdout.write(JSON.stringify(response));