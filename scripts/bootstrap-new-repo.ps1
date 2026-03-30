param([string]$ProjectName)
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $scriptRoot 'node-version-check.ps1')
& (Join-Path $scriptRoot 'gemini-backup.ps1')
& (Join-Path $scriptRoot 'gemini-clean.ps1')
& (Join-Path $scriptRoot 'scaffold-vite.ps1') -ProjectName $ProjectName
