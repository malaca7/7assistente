param (
    [string]$DiscloudToken = $env:DISCLOUD_TOKEN
)

$nodePath = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $nodePath)) {
    $nodePath = "node"
}

& $nodePath deployDiscloud.mjs $DiscloudToken
