@echo off
setlocal

REM Define the commands and paths
set "START_CMD=npm run start"
set "BUILD_CMD=npm run build"
set "URL=http://localhost:3000"
set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"

REM Check if the build directory exists and either build or start the application
if exist ".next" (
    %START_CMD%
) else (
    %BUILD_CMD% && %START_CMD%
)

REM Wait a few seconds to allow the server to start
timeout /t 5 >nul

REM Open Chrome with the specified URL
start "" "%CHROME_PATH%" "%URL%"

endlocal
