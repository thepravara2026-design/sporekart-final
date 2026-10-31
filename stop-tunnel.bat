@echo off
setlocal
cd /d "%~dp0"
echo ==========================================================
echo Stopping Sporekart Cloudflare Tunnel and dev processes...
echo ==========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0stop-cloudflare-tunnel.ps1"
pause

