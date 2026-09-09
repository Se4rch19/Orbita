$ErrorActionPreference = 'Stop'
$orbitaProject = Split-Path -Parent $PSScriptRoot
$orbitaServer = Join-Path $PSScriptRoot 'serve.mjs'
$orbitaReady = $false
try {
    $orbitaResponse = Invoke-WebRequest 'http://localhost:4173/' -TimeoutSec 2
    $orbitaReady = $orbitaResponse.Content -match 'rbita'
} catch {}
if (-not $orbitaReady) {
    $orbitaNode = (Get-Command node -ErrorAction Stop).Source
    Start-Process -FilePath $orbitaNode -ArgumentList ('"{0}"' -f $orbitaServer) -WorkingDirectory $orbitaProject -WindowStyle Hidden
    Start-Sleep -Milliseconds 900
}
Start-Process 'http://localhost:4173/?v=0.3'
