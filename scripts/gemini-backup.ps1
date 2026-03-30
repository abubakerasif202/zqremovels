$ErrorActionPreference = 'Stop'
$geminiDir = Join-Path $env:USERPROFILE '.gemini'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path $PWD '.tmp'
$backupDir = Join-Path $backupRoot "gemini-backup-$timestamp"

New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
if (-not (Test-Path $geminiDir)) { Write-Host 'No ~/.gemini directory found.'; exit 0 }

Write-Host "Backing up from: $geminiDir"
Write-Host "Backing up to:   $backupDir"
$null = robocopy $geminiDir $backupDir /E /R:1 /W:1 /XJ
if ($LASTEXITCODE -lt 8) { Write-Host "Backup completed: $backupDir" -ForegroundColor Green; exit 0 }
else { throw "robocopy failed with exit code $LASTEXITCODE" }
