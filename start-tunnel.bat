@echo off
setlocal
cd /d "%~dp0"
echo ==========================================================
echo Starting Sporekart with Cloudflare Tunnel...
echo ==========================================================
powershell -ExecutionPolicy Bypass -File "%~dp0start-cloudflare-tunnel.ps1"
pause

