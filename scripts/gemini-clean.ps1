$ErrorActionPreference = 'Stop'
$geminiDir = Join-Path $env:USERPROFILE '.gemini'
$targets = @('auto-saved.toml', 'cache', 'tmp', 'logs')

if (-not (Test-Path $geminiDir)) { exit 0 }
foreach ($target in $targets) {
    $path = Join-Path $geminiDir $target
    if (Test-Path $path) { Remove-Item -Recurse -Force $path; Write-Host "Removed: $path" }
}
Write-Host 'Gemini local state cleaned.'
