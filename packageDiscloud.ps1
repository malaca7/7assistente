$ErrorActionPreference = "Stop"

$workspaceRoot = $PSScriptRoot
Set-Location $workspaceRoot

Write-Host "📦 Gerando pacote pitoco.zip..." -ForegroundColor Cyan
python make_zip.py

$zipPath = Join-Path $workspaceRoot "pitoco.zip"
if (Test-Path $zipPath) {
    Write-Host "✅ Pacote pitoco.zip criado com sucesso em: $zipPath" -ForegroundColor Green
} else {
    Write-Error "❌ Falha ao gerar pitoco.zip"
}

