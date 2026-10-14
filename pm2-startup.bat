@echo off
:: Navigate to your project directory
cd /d "%~dp0"

:: Start PM2 and resurrect saved processes
pm2 resurrect
