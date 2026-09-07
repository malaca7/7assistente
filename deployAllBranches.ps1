param (
    [string]$DiscloudToken = $env:DISCLOUD_TOKEN
)

$ErrorActionPreference = "Stop"

$workspaceRoot = $PSScriptRoot
$nodeExe = "node"
$npmCmd = "npm"

Write-Host "=========================================" -ForegroundColor Magenta
Write-Host " INICIANDO DEPLOY PITOCO DE GENTE" -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta

# 1. Branch SOURCE (Build Frontend & Commit)
Write-Host "[1/4] Buildando Frontend e atualizando branch SOURCE..." -ForegroundColor Cyan

& $npmCmd run build

if (!(Test-Path "dist\index.html")) {
    Write-Error "Falha no build: dist/index.html nao encontrado."
    exit 1
}

# Ensure CNAME and .nojekyll in dist
Set-Content -Path "dist\CNAME" -Value "pitoco.malaca.com.br" -NoNewline
Set-Content -Path "dist\.nojekyll" -Value "" -NoNewline
Copy-Item "dist\index.html" -Destination "dist\404.html" -Force

# 2. DISCLOUD PACKAGE
Write-Host "[2/4] Empacotando arquivos para Discloud..." -ForegroundColor Cyan
if (Test-Path "packageDiscloud.ps1") {
    powershell -ExecutionPolicy Bypass -File .\packageDiscloud.ps1
}

if ($DiscloudToken) {
    Write-Host "[3/4] Enviando commit para Discloud (pitoco.discloud.app)..." -ForegroundColor Cyan
    & $nodeExe deployDiscloud.mjs $DiscloudToken
} else {
    Write-Host "[3/4] DISCLOUD_TOKEN nao definido, pulando commit remoto." -ForegroundColor Yellow
}

Write-Host "==================================================" -ForegroundColor Magenta
Write-Host " DEPLOY CONCLUIDO COM SUCESSO!" -ForegroundColor Magenta
Write-Host " - Frontend build: OK" -ForegroundColor Green
Write-Host " - CNAME: pitoco.malaca.com.br" -ForegroundColor Green
Write-Host " - App Discloud: pitoco (pitoco.discloud.app)" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Magenta
