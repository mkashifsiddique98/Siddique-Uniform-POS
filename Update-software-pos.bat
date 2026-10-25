@echo off
echo Stopping all PM2 processes...
pm2 stop all

echo Fetching latest code from Git...
cd /d "%~dp0"
git fetch origin main
git reset --hard origin/main

echo Installing dependencies...
npm ci

echo Building the project...
npm run build

echo Restarting PM2 processes...
pm2 start all

echo Deployment completed successfully!
pause
