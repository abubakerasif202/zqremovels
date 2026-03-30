param([int[]]$AllowedMajors = @(20, 24))
$ErrorActionPreference = 'Stop'
try { $nodeVersionRaw = (& node --version).Trim() } catch { throw 'Node.js missing' }
if ($nodeVersionRaw -match '^v(?<major>\d+)') { $major = [int]$matches['major'] }
Write-Host "Node version: $nodeVersionRaw"
if ($AllowedMajors -notcontains $major) { Write-Warning "Major $major not allowed."; exit 1 }
Write-Host "Node version check passed." -ForegroundColor Green
