param (
    [string]$DiscloudToken = $env:DISCLOUD_TOKEN
)

$ErrorActionPreference = "Stop"

Write-Host "📦 1. Empacotando aplicação em 7assistente.zip..." -ForegroundColor Cyan
powershell -ExecutionPolicy Bypass -File .\packageDiscloud.ps1

$zipPath = "d:\dev\web\7assistente\7assistente.zip"
if (-not (Test-Path $zipPath)) {
    Write-Error "❌ Arquivo 7assistente.zip não encontrado."
}

if (-not $DiscloudToken) {
    Write-Host "⚠️ Nenhum token da Discloud fornecido." -ForegroundColor Yellow
    Write-Host "ℹ️ Para enviar o commit e reiniciar o bot na Discloud diretamente pelo terminal:" -ForegroundColor Yellow
    Write-Host "   powershell -ExecutionPolicy Bypass -File .\deployToDiscloud.ps1 -DiscloudToken SEU_TOKEN_AQUI" -ForegroundColor White
    exit 0
}

Write-Host "🚀 2. Enviando commit do arquivo ZIP para Discloud (App: talvanebarber)..." -ForegroundColor Cyan

$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"
$bodyLines = (
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"7assistente.zip`"",
    "Content-Type: application/zip$LF",
    [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString([System.IO.File]::ReadAllBytes($zipPath)),
    "--$boundary--$LF"
) -join $LF

$headers = @{
    "api-token" = $DiscloudToken
}

try {
    $commitResponse = Invoke-RestMethod -Uri "https://api.discloud.app/v2/app/talvanebarber/commit" `
        -Method Put `
        -Headers $headers `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body ([System.Text.Encoding]::GetEncoding("iso-8859-1").GetBytes($bodyLines))

    Write-Host "✅ Resposta do Commit na Discloud: $($commitResponse | ConvertTo-Json -Compress)" -ForegroundColor Green

    Write-Host "⏳ 3. Aguardando 10 segundos para descompactação dos arquivos..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10

    Write-Host "🔄 4. Reiniciando bot na Discloud..." -ForegroundColor Cyan
    $restartResponse = Invoke-RestMethod -Uri "https://api.discloud.app/v2/app/talvanebarber/restart" `
        -Method Put `
        -Headers $headers

    Write-Host "✅ Resposta do Restart na Discloud: $($restartResponse | ConvertTo-Json -Compress)" -ForegroundColor Green
    Write-Host "🎉 Bot atualizado e reiniciado na Discloud com sucesso!" -ForegroundColor Green
} catch {
    Write-Error "❌ Falha no deploy da Discloud: $_"
}
