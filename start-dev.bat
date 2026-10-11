@echo off
rem Starts the site on http://localhost:3000. Double-click this file.
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Install the LTS version from https://nodejs.org and run this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies. This takes a few minutes the first time...
  call npm install
  if errorlevel 1 (
    echo npm install failed. See the messages above.
    pause
    exit /b 1
  )
)
echo Starting the site. Your browser opens in a few seconds. Keep this window open; close it to stop the site.
start "" cmd /c "timeout /t 10 >nul & start http://localhost:3000"
call npm run dev
pause
