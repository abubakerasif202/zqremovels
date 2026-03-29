if (Test-Path 'C:\Users\abuba\.git\index.lock') { Remove-Item 'C:\Users\abuba\.git\index.lock' -Force }
if (Test-Path '.git\index.lock') { Remove-Item '.git\index.lock' -Force }
git add .
git commit -m "feat: complete premium react build and update email"
git push -u origin main
