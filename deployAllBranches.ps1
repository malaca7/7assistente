param (
    [string]$DiscloudToken = "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjI4ODUxOTI1OTYyMDgiLCJrZXkiOiIzMTE1ZTQwYTY3ODY0MDg3NmRlYzZhOTk4YTYwIn0.y3RYPKpF9VdbnO-Qhry-84k-1bP3bhpWeQ7AfjqLXqk"
)

$ErrorActionPreference = "Stop"

$env:PATH = "d:\dev\web\7assistente\node_modules\.bin;C:\Program Files\nodejs;$env:PATH"
$nodeExe = "C:\Program Files\nodejs\node.exe"
$npmCmd = "C:\Program Files\nodejs\npm.cmd"

Write-Host "=========================================" -ForegroundColor Magenta
Write-Host " INICIANDO DEPLOY EM TODAS AS BRANCHS" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# 1. Branch SOURCE (Build Frontend & Commit)
Write-Host "[1/4] Buildando Frontend e atualizando branch SOURCE..." -ForegroundColor Cyan
git checkout source

& $npmCmd run build

if (!(Test-Path "dist\index.html")) {
    Write-Error "Falha no build: dist/index.html nao encontrado."
    exit 1
}

# Ensure CNAME and .nojekyll in dist
Set-Content -Path "dist\CNAME" -Value "talvane.malaca.com.br" -NoNewline
Set-Content -Path "dist\.nojekyll" -Value "" -NoNewline
Copy-Item "dist\index.html" -Destination "dist\404.html" -Force

git add -A
$sourceStatus = git status --porcelain
if ($sourceStatus) {
    git commit -m "build: compile production bundle and update CRM features"
}
git push origin source
Write-Host "Branch SOURCE enviada para o GitHub com sucesso!" -ForegroundColor Green

# 2. Branch MAIN (Sync full codebase + dist + server)
Write-Host "[2/4] Sincronizando e enviando branch MAIN..." -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File .\syncMainBranch.ps1
git checkout main
git push origin main
Write-Host "Branch MAIN enviada para o GitHub com sucesso!" -ForegroundColor Green

# 3. Branch GH-PAGES (Deploy Static Site)
Write-Host "[3/4] Atualizando branch GH-PAGES (talvane.malaca.com.br)..." -ForegroundColor Cyan

$tempDist = Join-Path $env:TEMP "dist_ghpages_$(Get-Random)"
New-Item -ItemType Directory -Path $tempDist -Force | Out-Null
Copy-Item -Path "dist\*" -Destination $tempDist -Recurse -Force

$tempEnv = Join-Path $env:TEMP "env_backup_$(Get-Random)"
if (Test-Path ".env") {
    Copy-Item ".env" -Destination $tempEnv -Force
}

git checkout gh-pages
Get-ChildItem -Path . -Exclude @(".git", ".env") | Remove-Item -Recurse -Force
Copy-Item -Path "$tempDist\*" -Destination . -Recurse -Force
Remove-Item -Path $tempDist -Recurse -Force

git add -A
$ghPagesStatus = git status --porcelain
if ($ghPagesStatus) {
    git commit -m "deploy: update GitHub Pages production release"
}
git push --force origin gh-pages
Write-Host "Branch GH-PAGES enviada para o GitHub com sucesso!" -ForegroundColor Green

# Return to source branch
git checkout source
if (Test-Path $tempEnv) {
    Copy-Item $tempEnv -Destination ".env" -Force
    Remove-Item $tempEnv -Force
}

# 4. DISCLOUD DEPLOY & RESTART
Write-Host "[4/4] Empacotando 7assistente.zip e enviando para o Discloud..." -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File .\packageDiscloud.ps1

& $nodeExe deployDiscloud.mjs $DiscloudToken

Write-Host "==================================================" -ForegroundColor Magenta
Write-Host " TODOS OS DEPLOYS FORAM CONCLUIDOS COM SUCESSO!" -ForegroundColor Magenta
Write-Host " - Branch 'source': Sincronizada" -ForegroundColor Green
Write-Host " - Branch 'main': Sincronizada" -ForegroundColor Green
Write-Host " - Branch 'gh-pages': Publicada (talvane.malaca.com.br)" -ForegroundColor Green
Write-Host " - Discloud (App: talvane / talvane.discloud.app): Commit enviado e Bot reiniciado" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Magenta
