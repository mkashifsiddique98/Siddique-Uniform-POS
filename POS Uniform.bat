@echo off
setlocal

REM Define the paths and commands
set "BUILD_DIR=.next"
set "START_CMD=npm run start"
set "BUILD_CMD=npm run build"
set "URL=http://localhost:3000"

REM Function to start the application
:StartApplication
    echo Starting the application...
    start "" cmd /c "%START_CMD%"
    exit /b

REM Function to build the application
:BuildApplication
    echo Building the application...
    %BUILD_CMD%
    if %ERRORLEVEL% neq 0 (
        echo Build failed. Please check the error messages above.
        exit /b %ERRORLEVEL%
    )
    call :StartApplication
    exit /b

REM Check if the build directory exists and start the application accordingly
if exist "%BUILD_DIR%" (
    echo Build directory found.
    call :StartApplication
) else (
    echo Build directory not found.
    call :BuildApplication
)

REM Wait for a moment to ensure the server starts
timeout /t 5 /nobreak > nul

REM Open Chrome with the specified URL
echo Opening Chrome...
start "" chrome "%URL%"

pause
endlocal
