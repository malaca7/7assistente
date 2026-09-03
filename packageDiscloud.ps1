$ErrorActionPreference = "Stop"

if (-not (Test-Path "dist\index.html")) {
    git archive --format=tar main dist -o dist_temp.tar
    tar -xf dist_temp.tar
    Remove-Item dist_temp.tar -Force -ErrorAction SilentlyContinue
}

$nodeExe = "C:\Program Files\nodejs\node.exe"
if (Test-Path "server\mergeLiveDb.mjs") {
    try {
        & $nodeExe server\mergeLiveDb.mjs
    } catch {
        Write-Warning "Falha ao sincronizar live DB: $_"
    }
}

$stage = Join-Path $env:TEMP "7assistente_deploy_stage"
if (Test-Path $stage) { 
    Remove-Item $stage -Recurse -Force 
}
New-Item -ItemType Directory -Path $stage | Out-Null

Copy-Item "discloud.config" -Destination $stage
if (Test-Path ".discloudignore") { 
    Copy-Item ".discloudignore" -Destination $stage 
}
Copy-Item "index.mjs" -Destination $stage
if (Test-Path "index.js") { 
    Copy-Item "index.js" -Destination $stage 
}
Copy-Item "package.json" -Destination $stage
if (Test-Path ".env") { 
    Copy-Item ".env" -Destination $stage 
}
Copy-Item "dist" -Destination $stage -Recurse
Copy-Item "server" -Destination $stage -Recurse

$zipPath = "d:\dev\web\7assistente\7assistente.zip"
if (Test-Path $zipPath) { 
    Remove-Item $zipPath -Force 
}

Get-ChildItem -Path $stage -Force | Compress-Archive -DestinationPath $zipPath -Force

[System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression.FileSystem") | Out-Null
$zipObj = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
Write-Host "=== Arquivos no 7assistente.zip ==="
foreach ($entry in $zipObj.Entries) {
    Write-Host $entry.FullName
}
$zipObj.Dispose()

Remove-Item $stage -Recurse -Force
Write-Host "✅ Pacote 7assistente.zip criado com sucesso!"
