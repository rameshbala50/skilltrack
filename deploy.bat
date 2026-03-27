@echo off
REM ═══════════════════════════════════════════════════════════════
REM SkillTrack — Deploy to GoDaddy (Windows PowerShell FTP)
REM Usage: double-click deploy.bat or run from Command Prompt
REM ═══════════════════════════════════════════════════════════════
powershell -ExecutionPolicy Bypass -File "%~dp0deploy.ps1"
pause
