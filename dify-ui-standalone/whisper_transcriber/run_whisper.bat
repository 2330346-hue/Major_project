@echo off
echo ====================================================
echo Starting Whisper Transcriber Backend on Port 5000...
echo ====================================================
cd /d "%~dp0"
"c:\Users\ASUS\Downloads\scratch\whisper_transcriber\.venv_new\Scripts\python.exe" app.py
pause
