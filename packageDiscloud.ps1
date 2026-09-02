$ErrorActionPreference = "Stop"
$stage = Join-Path $env:TEMP "7assistente_deploy_stage"
if (Test-Path $stage) { 
    Remove-Item $stage -Recurse -Force 
}
New-Item -ItemType Directory -Path $stage | Out-Null

Copy-Item "discloud.config" -Destination $stage
Copy-Item "index.mjs" -Destination $stage
if (Test-Path "index.js") { 
    Copy-Item "index.js" -Destination $stage 
}
Copy-Item "package.json" -Destination $stage
Copy-Item "dist" -Destination $stage -Recurse
Copy-Item "server" -Destination $stage -Recurse

$zipPath = "d:\dev\web\7assistente\7assistente.zip"
if (Test-Path $zipPath) { 
    Remove-Item $zipPath -Force 
}

tar.exe -a -cf $zipPath -C $stage .

[System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression.FileSystem") | Out-Null
$zipObj = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
Write-Host "=== Arquivos no 7assistente.zip ==="
foreach ($entry in $zipObj.Entries) {
    Write-Host $entry.FullName
}
$zipObj.Dispose()

Remove-Item $stage -Recurse -Force
Write-Host "✅ Pacote 7assistente.zip criado com sucesso!"
