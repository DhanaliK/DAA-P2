$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
if (-not (Test-Path -LiteralPath "$projectRoot\.venv\Scripts\python.exe")) {
    throw "Create the venv and install backend requirements first. See README.md."
}
& "$projectRoot\.venv\Scripts\python.exe" -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000
