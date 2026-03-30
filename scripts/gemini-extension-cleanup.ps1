param([switch]$List, [string]$Remove)
$ErrorActionPreference = 'Stop'
$geminiDir = Join-Path $env:USERPROFILE '.gemini'
$roots = @((Join-Path $geminiDir 'extensions'), (Join-Path $geminiDir 'plugins'), (Join-Path $geminiDir 'skills'))
$found = foreach ($root in $roots) { if (Test-Path $root) { Get-ChildItem -Path $root -Force } }
if ($List) { $found | Format-Table Name, FullName; exit 0 }
if ($Remove) { $item = $found | Where-Object { $_.Name -eq $Remove }; if ($item) { Remove-Item -Recurse -Force $item.FullName; Write-Host "Removed $Remove" } }
