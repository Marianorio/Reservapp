@echo off
cd /d "%~dp0backend"
set DB_PASSWORD=Kriptonita
node server.js
pause
