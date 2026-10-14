@echo off
setlocal enabledelayedexpansion

:: Base backup directory (where the batch file lives)
set BASE_DIR=%~dp0

:: Extract Date (YYYY-MM-DD) and Time formats
set TODAY=%date:~10,4%-%date:~4,2%-%date:~1,2%
set TIMESTAMP=%date:~10,4%%date:~4,2%%date:~1,2%_%time:~0,2%%time:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%

:: Target directory for today's backups
set TARGET_DIR=%BASE_DIR%backups\%TODAY%

:: Create today's directory if it doesn't exist
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

:: MongoDB Connection URI
set MONGO_URI="mongodb://localhost:27017/mypos"

:: Run MongoDB Dump into the day's folder
mongodump --uri=%MONGO_URI% --gzip --archive="%TARGET_DIR%\pos_backup_%TIMESTAMP%.gz"

:: Delete daily subfolders older than 14 days
forfiles /p "%BASE_DIR%backups" /d -14 /c "cmd /c if @isdir==TRUE rmdir /s /q @path" 2>nul