$ErrorActionPreference = "Stop"

$stage = Join-Path $env:TEMP "7assistente_main_stage"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

Copy-Item "discloud.config" -Destination $stage
if (Test-Path ".discloudignore") { Copy-Item ".discloudignore" -Destination $stage }
Copy-Item "index.mjs" -Destination $stage
if (Test-Path "index.js") { Copy-Item "index.js" -Destination $stage }
Copy-Item "package.json" -Destination $stage
if (Test-Path "package-lock.json") { Copy-Item "package-lock.json" -Destination $stage }
if (Test-Path "supabase_schema.sql") { Copy-Item "supabase_schema.sql" -Destination $stage }
Copy-Item ".github" -Destination $stage -Recurse
Copy-Item "dist" -Destination $stage -Recurse
Copy-Item "server" -Destination $stage -Recurse

# Switch to main branch
git checkout -f main

# Sync stage to main
Copy-Item "$stage\discloud.config" -Destination . -Force
if (Test-Path "$stage\.discloudignore") { Copy-Item "$stage\.discloudignore" -Destination . -Force }
Copy-Item "$stage\index.mjs" -Destination . -Force
if (Test-Path "$stage\index.js") { Copy-Item "$stage\index.js" -Destination . -Force }
Copy-Item "$stage\package.json" -Destination . -Force
if (Test-Path "$stage\package-lock.json") { Copy-Item "$stage\package-lock.json" -Destination . -Force }
if (Test-Path "$stage\supabase_schema.sql") { Copy-Item "$stage\supabase_schema.sql" -Destination . -Force }
Copy-Item "$stage\.github" -Destination . -Recurse -Force

if (Test-Path "dist") { Remove-Item "dist" -Recurse -Force }
Copy-Item "$stage\dist" -Destination . -Recurse -Force

if (Test-Path "server") { Remove-Item "server" -Recurse -Force }
Copy-Item "$stage\server" -Destination . -Recurse -Force

git add -f dist/
git add -A .github/ .discloudignore server/ discloud.config index.html index.mjs index.js package.json package-lock.json supabase_schema.sql .gitignore
try {
    git commit -m "deploy: update main with POSIX dist files and robust static server for Discloud"
} catch {
    Write-Host "Nada para commitar na branch main."
}

Remove-Item $stage -Recurse -Force

# Return to source branch
git checkout -f source
Write-Host "✅ Branch main sincronizada localmente com sucesso!"
