@echo off
echo Stopping all PM2 processes...
pm2 stop all

echo Fetching latest code from Git...
<<<<<<< HEAD
cd /d "%~dp0"
=======
cd /d "D:\Dd\MYSHOP\my-shop"  REM Change this to your actual project path
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
git fetch origin main
git reset --hard origin/main

echo Installing dependencies...
npm install

echo Building the project...
npm run build

echo Restarting PM2 processes...
pm2 start all

echo Deployment completed successfully!
pause
