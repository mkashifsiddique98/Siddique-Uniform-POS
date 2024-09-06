@echo off

REM Define the paths and commands
set BUILD_DIR=.next
set START_CMD=npm run start
set BUILD_CMD=npm run build
set URL=http://localhost:3000

REM Check if the build directory exists
if exist %BUILD_DIR% (
    echo Build directory found. Starting the application...
    start cmd /c "%START_CMD%"
) else (
    echo Build directory not found. Building the application...
    %BUILD_CMD%
    if %ERRORLEVEL% equ 0 (
        echo Build succeeded. Starting the application...
        start cmd /c "%START_CMD%"
        pause
    ) else (
        echo Build failed. Please check the error messages above.
        exit /b %ERRORLEVEL%
    )
)

REM Wait for a moment to ensure the server starts
timeout /t 5 /nobreak > nul

REM Open Chrome with the specified URL
echo Opening Chrome...
start chrome %URL%

pause
