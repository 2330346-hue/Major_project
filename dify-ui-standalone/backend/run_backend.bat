@echo off
echo ====================================================
echo  Starting Ollama Backend Server on Port 5001...
echo ====================================================
cd /d "%~dp0"
node server.js
pause
