param([string]$ProjectName)
npm create vite@latest $ProjectName -- --template react-ts --no-interactive
Set-Location $ProjectName
npm install
