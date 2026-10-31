# ==============================================================================
# start-cloudflare-tunnel.ps1
# Safe Startup Workflow for Sporekart with Cloudflare Quick Tunnels
# ==============================================================================

param(
    [switch]$DualTunnel = $false
)

$ErrorActionPreference = "Stop"
$WorkspaceRoot = $PSScriptRoot
$LogDir = Join-Path $WorkspaceRoot "tunnel-logs"

if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

$BackendLog = Join-Path $LogDir "backend.log"
$FrontendLog = Join-Path $LogDir "frontend.log"
$BackendTunnelLog = Join-Path $LogDir "backend-tunnel.log"
$BackendTunnelErrLog = Join-Path $LogDir "backend-tunnel-err.log"
$FrontendTunnelLog = Join-Path $LogDir "frontend-tunnel.log"
$FrontendTunnelErrLog = Join-Path $LogDir "frontend-tunnel-err.log"
$PidFile = Join-Path $LogDir "pids.json"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Starting Sporekart Cloudflare Quick Tunnel Environment  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Helper function to poll and extract trycloudflare URL from stdout or stderr
function Get-TunnelUrlFromLogs($stdoutPath, $stderrPath, [int]$timeoutSeconds = 30) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $timeoutSeconds) {
        Start-Sleep -Milliseconds 500
        $combined = ""
        if (Test-Path $stdoutPath) {
            $combined += Get-Content $stdoutPath -Raw -ErrorAction SilentlyContinue
        }
        if (Test-Path $stderrPath) {
            $combined += "`n" + (Get-Content $stderrPath -Raw -ErrorAction SilentlyContinue)
        }
        if ($combined -match 'https://[a-zA-Z0-9\-]+\.trycloudflare\.com') {
            return $matches[0]
        }
    }
    return $null
}

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
Write-Host "[OK] Found cloudflared: $cloudflared" -ForegroundColor Green

# 2. Check / Start Backend (Port 8080)
$backendConn = Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue
$backendPid = $null
if ($backendConn) {
    $backendPid = $backendConn.OwningProcess | Select-Object -First 1
    Write-Host "[i] Backend is already running on port 8080 (PID: $backendPid)." -ForegroundColor Yellow
} else {
    $mvnCmd = Get-Command mvn.cmd, mvn -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($mvnCmd) {
        Write-Host "[+] Starting Backend (mvn spring-boot:run)..." -ForegroundColor Yellow
        $backendProc = Start-Process -FilePath $mvnCmd.Source -ArgumentList "spring-boot:run" -WorkingDirectory (Join-Path $WorkspaceRoot "backend") -RedirectStandardOutput $BackendLog -RedirectStandardError (Join-Path $LogDir "backend-err.log") -PassThru
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
            Write-Warning "Backend did not bind to port 8080 within timeout. Continuing with Frontend..."
        } else {
            Write-Host "[OK] Backend is ready on http://127.0.0.1:8080/api/v1" -ForegroundColor Green
        }
    } else {
        Write-Host "[i] Maven (mvn) is not installed on PATH. Backend startup skipped." -ForegroundColor Yellow
        Write-Host "    Frontend will run with direct Supabase cloud configuration." -ForegroundColor Gray
    }
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
    Write-Host "[OK] Frontend is ready on http://127.0.0.1:3000" -ForegroundColor Green
}

# 4. Optional Backend Quick Tunnel (Port 8080)
$backendTunnelPid = $null
$publicBackendUrl = $null
if ($DualTunnel) {
    if (Test-Path $BackendTunnelLog) { Remove-Item $BackendTunnelLog -Force }
    if (Test-Path $BackendTunnelErrLog) { Remove-Item $BackendTunnelErrLog -Force }
    Write-Host "[+] Launching Backend Cloudflare Quick Tunnel (http://127.0.0.1:8080)..." -ForegroundColor Yellow
    $backendTunnelProc = Start-Process -FilePath $cloudflared -ArgumentList "tunnel --url http://127.0.0.1:8080" -RedirectStandardOutput $BackendTunnelLog -RedirectStandardError $BackendTunnelErrLog -PassThru
    $backendTunnelPid = $backendTunnelProc.Id

    $publicBackendUrl = Get-TunnelUrlFromLogs -stdoutPath $BackendTunnelLog -stderrPath $BackendTunnelErrLog -timeoutSeconds 30
    if (-not $publicBackendUrl) {
        Write-Error "Could not retrieve public backend tunnel URL. Check $BackendTunnelErrLog"
        exit 1
    }
    Write-Host "[OK] Public Backend URL: $publicBackendUrl" -ForegroundColor Green
}

# 5. Start Unified Frontend Quick Tunnel (Port 3000)
# Note: Vite proxies /api/v1 to http://127.0.0.1:8080 automatically, so tunneling port 3000 serves both frontend and backend seamlessly without CORS issues!
if (Test-Path $FrontendTunnelLog) { Remove-Item $FrontendTunnelLog -Force }
if (Test-Path $FrontendTunnelErrLog) { Remove-Item $FrontendTunnelErrLog -Force }
Write-Host "[+] Launching Unified Frontend Cloudflare Quick Tunnel (http://127.0.0.1:3000)..." -ForegroundColor Yellow
$frontendTunnelProc = Start-Process -FilePath $cloudflared -ArgumentList "tunnel --url http://127.0.0.1:3000" -RedirectStandardOutput $FrontendTunnelLog -RedirectStandardError $FrontendTunnelErrLog -PassThru
$frontendTunnelPid = $frontendTunnelProc.Id

$publicFrontendUrl = Get-TunnelUrlFromLogs -stdoutPath $FrontendTunnelLog -stderrPath $FrontendTunnelErrLog -timeoutSeconds 30
if (-not $publicFrontendUrl) {
    Write-Error "Could not retrieve public frontend tunnel URL. Check $FrontendTunnelErrLog"
    exit 1
}
Write-Host "[OK] Public Frontend URL: $publicFrontendUrl" -ForegroundColor Green

# 6. Ensure frontend/.env uses clean relative API paths for unified proxying
$frontendEnvPath = Join-Path $WorkspaceRoot "frontend\.env"
if (Test-Path $frontendEnvPath) {
    $envContent = Get-Content $frontendEnvPath -Raw
    if ($DualTunnel -and $publicBackendUrl) {
        $envContent = $envContent -replace '(?m)^VITE_API_BASE_URL=.*$', "VITE_API_BASE_URL=$publicBackendUrl/api/v1"
        $envContent = $envContent -replace '(?m)^VITE_API_URL=.*$', "VITE_API_URL=$publicBackendUrl/api/v1"
    } else {
        $envContent = $envContent -replace '(?m)^VITE_API_BASE_URL=.*$', "VITE_API_BASE_URL=/api/v1"
        $envContent = $envContent -replace '(?m)^VITE_API_URL=.*$', "VITE_API_URL=/api/v1"
    }
    Set-Content -Path $frontendEnvPath -Value $envContent.Trim()
}

# 7. Record PIDs for clean shutdown
$pidsData = @{
    BackendPid = $backendPid
    FrontendPid = $frontendPid
    BackendTunnelPid = $backendTunnelPid
    FrontendTunnelPid = $frontendTunnelPid
    PublicBackendUrl = $(if ($DualTunnel) { $publicBackendUrl } else { "$publicFrontendUrl/api/v1" })
    PublicFrontendUrl = $publicFrontendUrl
    Timestamp = (Get-Date).ToString("o")
}
$pidsData | ConvertTo-Json | Set-Content -Path $PidFile

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "                READY FOR CLIENT SHARING                  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " SHARE THIS URL WITH CLIENTS / TESTERS:" -ForegroundColor Yellow
Write-Host " $publicFrontendUrl" -ForegroundColor Green
Write-Host ""
Write-Host " Public API Endpoint: $publicFrontendUrl/api/v1 (proxied locally via Vite)" -ForegroundColor Gray
Write-Host " Local Frontend:     http://localhost:3000" -ForegroundColor Gray
Write-Host " Local Backend:      http://localhost:8080/api/v1" -ForegroundColor Gray
Write-Host " Logs saved to:      $LogDir" -ForegroundColor Gray
Write-Host " To stop all tunnels and processes: .\stop-tunnel.bat" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
