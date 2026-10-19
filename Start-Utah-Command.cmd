@echo off
setlocal
title Utah Command - Keep open while playing
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0Launch-UtahCommand.ps1"
if errorlevel 1 (
 echo.
 echo Launcher failed. Send the error above to larrykuzniak@mac.com.
 pause
)
endlocal
