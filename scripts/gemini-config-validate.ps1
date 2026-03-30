$ErrorActionPreference = 'Continue'
$geminiDir = Join-Path $env:USERPROFILE '.gemini'
$filesToCheck = @('settings.json', 'config.json', 'skills.json', 'auto-saved.toml')
Write-Host '== Gemini Config Validator ==' -ForegroundColor Cyan
foreach ($file in $filesToCheck) {
    $path = Join-Path $geminiDir $file
    if (-not (Test-Path $path)) { continue }
    $content = Get-Content -Raw -Path $path
    if ($file -like '*.json') { try { $null = $content | ConvertFrom-Json; Write-Host "$($file): Valid JSON" -ForegroundColor Green } catch { Write-Warning "$($file): Invalid JSON" } }
}
