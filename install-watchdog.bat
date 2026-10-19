@echo off
REM Run once as Administrator. Creates a Task Scheduler job that runs the watchdog every minute.
set SCRIPT=C:\pos-health\watchdog.ps1
if not exist C:\pos-health mkdir C:\pos-health
copy /Y "%~dp0watchdog.ps1" %SCRIPT%

schtasks /Create /TN "POS Watchdog" /SC MINUTE /MO 1 /RU SYSTEM /RL HIGHEST /F ^
  /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File %SCRIPT%"

echo Done. Check C:\pos-health\health.log
pause
