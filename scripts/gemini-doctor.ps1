$ErrorActionPreference = 'Continue'
Write-Host '== Gemini Doctor ==' -ForegroundColor Cyan
$checks = @(
    @{ Name = 'node'; Command = 'node --version' },
    @{ Name = 'npm'; Command = 'npm --version' },
    @{ Name = 'git'; Command = 'git --version' },
    @{ Name = 'gemini'; Command = 'gemini --version' }
)
foreach ($check in $checks) {
    Write-Host "`n[$($check.Name)]"
    try { Invoke-Expression $check.Command } catch { Write-Warning "Missing: $($check.Name)" }
}
