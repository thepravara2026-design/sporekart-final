# ==============================================================================
# start-cloudflare-tunnel.ps1
# Safe Startup Workflow for Sporekart with Cloudflare Quick Tunnels
# ==============================================================================

$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot
$LogDir = Join-Path $WorkspaceRoot "tunnel-logs"

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$BackendLog = Join-Path $LogDir "backend.log"
$FrontendLog = Join-Path $LogDir "frontend.log"
$BackendTunnelLog = Join-Path $LogDir "backend-tunnel.log"
$FrontendTunnelLog = Join-Path $LogDir "frontend-tunnel.log"
$PidFile = Join-Path $LogDir "pids.json"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Sporekart Cloudflare Quick Tunnel Environment  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Locate cloudflared
$cloudflaredCmd = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflaredCmd) {
    $fallbackPath = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
    if (Test-Path $fallbackPath) {
        $cloudflared = $fallbackPath
    } else {
        Write-Error "cloudflared executable not found on PATH or standard directory. Run: winget install --id Cloudflare.cloudflared"
        exit 1
    }
} else {
    $cloudflared = $cloudflaredCmd.Source
}
Write-Host "[✓] Found cloudflared: $cloudflared" -ForegroundColor Green

# 2. Check / Start Backend (Port 8080)
$backendConn = Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue
$backendPid = $null
if ($backendConn) {
    $backendPid = $backendConn.OwningProcess | Select-Object -First 1
    Write-Host "[i] Backend is already running on port 8080 (PID: $backendPid)." -ForegroundColor Yellow
} else {
    Write-Host "[+] Starting Backend (mvn spring-boot:run)..." -ForegroundColor Yellow
    $backendProc = Start-Process -FilePath "mvn.cmd" -ArgumentList "spring-boot:run" -WorkingDirectory (Join-Path $WorkspaceRoot "backend") -RedirectStandardOutput $BackendLog -RedirectStandardError (Join-Path $LogDir "backend-err.log") -PassThru
    $backendPid = $backendProc.Id
    Write-Host "    Backend process started with PID: $backendPid. Waiting for port 8080..." -ForegroundColor Gray

    $retries = 60
    while ($retries -gt 0) {
        Start-Sleep -Seconds 2
        $backendConn = Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue
        if ($backendConn) { break }
        $retries--
    }
    if (-not $backendConn) {
        Write-Error "Backend failed to bind to port 8080 within timeout. Check $BackendLog"
        exit 1
    }
    Write-Host "[✓] Backend is ready on http://localhost:8080/api/v1" -ForegroundColor Green
}

# 3. Check / Start Frontend (Port 3000)
$frontendConn = Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue
$frontendPid = $null
if ($frontendConn) {
    $frontendPid = $frontendConn.OwningProcess | Select-Object -First 1
    Write-Host "[i] Frontend is already running on port 3000 (PID: $frontendPid)." -ForegroundColor Yellow
} else {
    Write-Host "[+] Starting Frontend (npm run dev)..." -ForegroundColor Yellow
    $frontendProc = Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory (Join-Path $WorkspaceRoot "frontend") -RedirectStandardOutput $FrontendLog -RedirectStandardError (Join-Path $LogDir "frontend-err.log") -PassThru
    $frontendPid = $frontendProc.Id
    Write-Host "    Frontend process started with PID: $frontendPid. Waiting for port 3000..." -ForegroundColor Gray

    $retries = 30
    while ($retries -gt 0) {
        Start-Sleep -Seconds 1
        $frontendConn = Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue
        if ($frontendConn) { break }
        $retries--
    }
    if (-not $frontendConn) {
        Write-Error "Frontend failed to bind to port 3000 within timeout. Check $FrontendLog"
        exit 1
    }
    Write-Host "[✓] Frontend is ready on http://localhost:3000" -ForegroundColor Green
}

# 4. Start Backend Quick Tunnel (Port 8080)
if (Test-Path $BackendTunnelLog) { Remove-Item $BackendTunnelLog -Force }
Write-Host "[+] Launching Backend Cloudflare Quick Tunnel (http://localhost:8080)..." -ForegroundColor Yellow
$backendTunnelProc = Start-Process -FilePath $cloudflared -ArgumentList "tunnel --url http://localhost:8080" -RedirectStandardOutput $BackendTunnelLog -RedirectStandardError (Join-Path $LogDir "backend-tunnel-err.log") -PassThru
$backendTunnelPid = $backendTunnelProc.Id

$publicBackendUrl = $null
$retries = 30
while ($retries -gt 0) {
    Start-Sleep -Seconds 1
    if (Test-Path $BackendTunnelLog) {
        $content = Get-Content $BackendTunnelLog -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com') {
            $publicBackendUrl = $matches[0]
            break
        }
    }
    $retries--
}

if (-not $publicBackendUrl) {
    Write-Error "Could not retrieve public backend tunnel URL. Check $BackendTunnelLog"
    exit 1
}
Write-Host "[✓] Public Backend URL: $publicBackendUrl" -ForegroundColor Green

# 5. Start Frontend Quick Tunnel (Port 3000)
if (Test-Path $FrontendTunnelLog) { Remove-Item $FrontendTunnelLog -Force }
Write-Host "[+] Launching Frontend Cloudflare Quick Tunnel (http://localhost:3000)..." -ForegroundColor Yellow
$frontendTunnelProc = Start-Process -FilePath $cloudflared -ArgumentList "tunnel --url http://localhost:3000" -RedirectStandardOutput $FrontendTunnelLog -RedirectStandardError (Join-Path $LogDir "frontend-tunnel-err.log") -PassThru
$frontendTunnelPid = $frontendTunnelProc.Id

$publicFrontendUrl = $null
$retries = 30
while ($retries -gt 0) {
    Start-Sleep -Seconds 1
    if (Test-Path $FrontendTunnelLog) {
        $content = Get-Content $FrontendTunnelLog -Raw -ErrorAction SilentlyContinue
        if ($content -match 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com') {
            $publicFrontendUrl = $matches[0]
            break
        }
    }
    $retries--
}

if (-not $publicFrontendUrl) {
    Write-Error "Could not retrieve public frontend tunnel URL. Check $FrontendTunnelLog"
    exit 1
}
Write-Host "[✓] Public Frontend URL: $publicFrontendUrl" -ForegroundColor Green

# 6. Update frontend/.env to point to Public Backend URL
$frontendEnvPath = Join-Path $WorkspaceRoot "frontend\.env"
if (Test-Path $frontendEnvPath) {
    $envLines = Get-Content $frontendEnvPath
    $updatedLines = @()
    $hasBaseUrl = $false
    foreach ($line in $envLines) {
        if ($line -match '^VITE_API_BASE_URL=') {
            $updatedLines += "VITE_API_BASE_URL=$publicBackendUrl/api/v1"
            $hasBaseUrl = $true
        } elseif ($line -match '^VITE_API_URL=') {
            $updatedLines += "VITE_API_URL=$publicBackendUrl/api/v1"
        } else {
            $updatedLines += $line
        }
    }
    if (-not $hasBaseUrl) {
        $updatedLines += "VITE_API_BASE_URL=$publicBackendUrl/api/v1"
    }
    Set-Content -Path $frontendEnvPath -Value $updatedLines
    Write-Host "[✓] Updated frontend/.env with VITE_API_BASE_URL=$publicBackendUrl/api/v1" -ForegroundColor Green
}

# 7. Record PIDs for clean shutdown
$pidsData = @{
    BackendPid = $backendPid
    FrontendPid = $frontendPid
    BackendTunnelPid = $backendTunnelPid
    FrontendTunnelPid = $frontendTunnelPid
    PublicBackendUrl = $publicBackendUrl
    PublicFrontendUrl = $publicFrontendUrl
    Timestamp = (Get-Date).ToString("o")
}
$pidsData | ConvertTo-Json | Set-Content -Path $PidFile

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host "                READY FOR CLIENT SHARING                  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " SHARE THIS URL WITH CLIENTS:" -ForegroundColor Yellow
Write-Host " $publicFrontendUrl`n" -ForegroundColor Green
Write-Host " Public Backend API: $publicBackendUrl/api/v1" -ForegroundColor Gray
Write-Host " Local Frontend:     http://localhost:3000" -ForegroundColor Gray
Write-Host " Local Backend:      http://localhost:8080/api/v1" -ForegroundColor Gray
Write-Host " Logs saved to:      $LogDir" -ForegroundColor Gray
Write-Host " To stop all tunnels and processes: .\stop-cloudflare-tunnel.ps1" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
