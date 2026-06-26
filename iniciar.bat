@echo off
cd /d "%~dp0backend"
set DB_PASSWORD=Kriptonita
node src/server.js
pause
