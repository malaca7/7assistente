$ErrorActionPreference = "Stop"

$stage = Join-Path $env:TEMP "7assistente_main_stage"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

# Copy all source and config files to stage
$itemsToCopy = @(
    "discloud.config", ".discloudignore", "index.mjs", "index.js", "package.json", 
    "package-lock.json", "supabase_schema.sql", "supabase_setup.sql", ".github", 
    "server", "src", "public", "index.html", "vite.config.ts", "tsconfig.json", 
    "tsconfig.app.json", "tsconfig.node.json", "tailwind.config.js", 
    "postcss.config.js", "CNAME", "icons.svg", ".gitignore"
)

foreach ($item in $itemsToCopy) {
    if (Test-Path $item) {
        Copy-Item $item -Destination $stage -Recurse -Force
    }
}

# Switch to main branch
git checkout -f main

# Sync stage to main
foreach ($item in $itemsToCopy) {
    $srcPath = Join-Path $stage $item
    if (Test-Path $srcPath) {
        if (Test-Path $item) {
            Remove-Item $item -Recurse -Force
        }
        Copy-Item $srcPath -Destination . -Recurse -Force
    }
}

# Stage and commit on main
git add -A
try {
    git commit -m "deploy: sync full production codebase to main"
} catch {
    Write-Host "Nada para commitar na branch main."
}

Remove-Item $stage -Recurse -Force

# Return to source branch
git checkout -f source
Write-Host "✅ Branch main sincronizada localmente com sucesso!" -ForegroundColor Green
