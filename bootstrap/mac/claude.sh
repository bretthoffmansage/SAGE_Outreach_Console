#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/bretthoffman/ForgeShell.git"
RAW_BASE_URL="https://raw.githubusercontent.com/bretthoffman/ForgeShell/main/shell-core/bootstrap/common"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This launcher is for macOS only."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Please install the following required dependencies before running ForgeShell"
  echo ""
  echo "- node: Install Node.js LTS: https://nodejs.org/"
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "Please install the following required dependencies before running ForgeShell"
  echo ""
  echo "- curl: Install curl with your OS package manager"
  exit 1
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

LAUNCHER_PATH="${WORK_DIR}/launcher.mjs"
REQUIREMENTS_PATH="${WORK_DIR}/requirements.json"

curl -fsSL "${RAW_BASE_URL}/launcher.mjs" -o "${LAUNCHER_PATH}"
curl -fsSL "${RAW_BASE_URL}/requirements.json" -o "${REQUIREMENTS_PATH}"

node "${LAUNCHER_PATH}" \
  --platform mac \
  --agent claude \
  --repo-url "${REPO_URL}" \
  --requirements-path "${REQUIREMENTS_PATH}" \
  --repo-folder Forgeshell
