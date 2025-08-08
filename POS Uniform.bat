@echo off
setlocal

REM Define the commands and paths
set "START_CMD=npm run start"
set "BUILD_CMD=npm run build"
set "URL=http://localhost:3000"
set "CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe"

REM Check if the build directory exists and either build or start the application in a new CMD window
if exist ".next" (
    echo Starting the application in a new Command Prompt window...
    start cmd /k "%START_CMD%"
) else (
    echo Building the application in a new Command Prompt window...
    start cmd /k "%BUILD_CMD%"
    if errorlevel 1 (
        echo Build failed. Exiting script.
        exit /b 1
    )
    echo Starting the application in a new Command Prompt window...
    start cmd /k "%START_CMD%"
)

REM Wait a few seconds to allow the server to start
echo Waiting for the server to start...
timeout /t 5 >nul

REM Check if Chrome is installed at the specified path
if exist "%CHROME_PATH%" (
    echo Opening Chrome...
    start "" "%CHROME_PATH%" "%URL%"
) else (
    echo Chrome is not found at "%CHROME_PATH%". Opening in the default browser...
    start "" "%URL%"
)

endlocal
