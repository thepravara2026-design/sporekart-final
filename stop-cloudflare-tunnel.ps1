# ==============================================================================
# stop-cloudflare-tunnel.ps1
# Safe Shutdown Workflow for Sporekart Cloudflare Quick Tunnels
# ==============================================================================

$WorkspaceRoot = $PSScriptRoot
$LogDir = Join-Path $WorkspaceRoot "tunnel-logs"
$PidFile = Join-Path $LogDir "pids.json"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Stopping Sporekart Cloudflare Quick Tunnel Environment  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

function Stop-SafeProcessById([int]$pidToStop, [string]$name) {
    if ($pidToStop -and $pidToStop -gt 0) {
        $proc = Get-Process -Id $pidToStop -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "[+] Stopping $name (PID: $pidToStop)..." -ForegroundColor Yellow
            try {
                Stop-Process -Id $pidToStop -Force -ErrorAction Stop
                Write-Host "[✓] Stopped $name (PID: $pidToStop)" -ForegroundColor Green
            } catch {
                Write-Warning "Could not stop $name: $_"
            }
        } else {
            Write-Host "[i] $name (PID: $pidToStop) is not currently running." -ForegroundColor Gray
        }
    }
}

if (Test-Path $PidFile) {
    try {
        $pidsData = Get-Content $PidFile -Raw | ConvertFrom-Json
        Stop-SafeProcessById -pidToStop $pidsData.FrontendTunnelPid -name "Frontend Cloudflare Tunnel"
        Stop-SafeProcessById -pidToStop $pidsData.BackendTunnelPid -name "Backend Cloudflare Tunnel"
        Stop-SafeProcessById -pidToStop $pidsData.FrontendPid -name "Frontend Dev Server"
        Stop-SafeProcessById -pidToStop $pidsData.BackendPid -name "Backend Service"
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    } catch {
        Write-Warning "Failed to parse $PidFile : $_"
    }
} else {
    Write-Host "[!] No tracking PID file found ($PidFile). Checking listening ports and tunnel processes..." -ForegroundColor Yellow
    
    # Safely find cloudflared processes running trycloudflare tunnels
    $cfProcs = Get-Process -Name "cloudflared" -ErrorAction SilentlyContinue
    foreach ($p in $cfProcs) {
        Stop-SafeProcessById -pidToStop $p.Id -name "cloudflared"
    }

    # Stop services on ports 3000 and 8080 if they are node/java
    $connections = Get-NetTCPConnection -State Listen -LocalPort 3000,8080 -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
        if ($proc -and ($proc.ProcessName -match "node|java")) {
            Stop-SafeProcessById -pidToStop $proc.Id -name "$($proc.ProcessName) on port $($conn.LocalPort)"
        }
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      All Tunnel & Application Processes Stopped          " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
