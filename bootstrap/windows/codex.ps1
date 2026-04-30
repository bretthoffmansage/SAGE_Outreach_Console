$ErrorActionPreference = "Stop"
$repoUrl = "https://github.com/bretthoffman/ForgeShell.git"
$rawBaseUrl = "https://raw.githubusercontent.com/bretthoffman/ForgeShell/main/shell-core/bootstrap/common"

if ($env:OS -ne "Windows_NT") {
  Write-Error "This launcher is for Windows only."
  exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Please install the following required dependencies before running ForgeShell"
  Write-Host ""
  Write-Host "- node: Install Node.js LTS: https://nodejs.org/"
  exit 1
}

$workDir = Join-Path ([System.IO.Path]::GetTempPath()) ("forgeshell-bootstrap-" + [System.Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path $workDir | Out-Null

$launcherPath = Join-Path $workDir "launcher.mjs"
$requirementsPath = Join-Path $workDir "requirements.json"

try {
  Invoke-WebRequest -Uri "$rawBaseUrl/launcher.mjs" -OutFile $launcherPath
  Invoke-WebRequest -Uri "$rawBaseUrl/requirements.json" -OutFile $requirementsPath

  node $launcherPath `
    --platform windows `
    --agent codex `
    --repo-url $repoUrl `
    --requirements-path $requirementsPath `
    --repo-folder Forgeshell
}
finally {
  if (Test-Path $workDir) {
    Remove-Item -Path $workDir -Recurse -Force
  }
}
