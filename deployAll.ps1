$ErrorActionPreference = "Stop"

Write-Host "=== [1/4] Salvando e Publicando Branch Source ==="
git add -A
try {
    git commit -m "fix: resolve admin panel 404 on Discloud with POSIX zip and robust dist serving"
} catch {
    Write-Host "Nada para commitar na branch source."
}
git push origin source

Write-Host "=== [2/4] Atualizando e Publicando Branch Main ==="
$stage = Join-Path $env:TEMP "7assistente_deploy_stage"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

Copy-Item "discloud.config" -Destination $stage
Copy-Item "index.mjs" -Destination $stage
if (Test-Path "index.js") { Copy-Item "index.js" -Destination $stage }
Copy-Item "package.json" -Destination $stage
if (Test-Path "package-lock.json") { Copy-Item "package-lock.json" -Destination $stage }
if (Test-Path "supabase_schema.sql") { Copy-Item "supabase_schema.sql" -Destination $stage }
Copy-Item "dist" -Destination $stage -Recurse
Copy-Item "server" -Destination $stage -Recurse

# Switch to main branch
git checkout -f main

# Sync stage to main
Copy-Item "$stage\discloud.config" -Destination . -Force
Copy-Item "$stage\index.mjs" -Destination . -Force
if (Test-Path "$stage\index.js") { Copy-Item "$stage\index.js" -Destination . -Force }
Copy-Item "$stage\package.json" -Destination . -Force
if (Test-Path "$stage\package-lock.json") { Copy-Item "$stage\package-lock.json" -Destination . -Force }
if (Test-Path "$stage\supabase_schema.sql") { Copy-Item "$stage\supabase_schema.sql" -Destination . -Force }

if (Test-Path "dist") { Remove-Item "dist" -Recurse -Force }
Copy-Item "$stage\dist" -Destination . -Recurse -Force

if (Test-Path "server") { Remove-Item "server" -Recurse -Force }
Copy-Item "$stage\server" -Destination . -Recurse -Force

git add -f dist/
git add -A server/ discloud.config index.html index.mjs index.js package.json package-lock.json supabase_schema.sql .gitignore
try {
    git commit -m "deploy: update main with POSIX dist files and robust static server for Discloud"
} catch {
    Write-Host "Nada para commitar na branch main."
}
git push origin main

Write-Host "=== [3/4] Gerando 7assistente.zip para Discloud ==="
$zipPath = "d:\dev\web\7assistente\7assistente.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
tar.exe -a -cf $zipPath -C $stage .

Remove-Item $stage -Recurse -Force

Write-Host "=== [4/4] Retornando para Branch Source ==="
git checkout -f source

Write-Host "🎉 TODOS OS DEPLOYS E PACOTES FORAM ATUALIZADOS COM SUCESSO!"
