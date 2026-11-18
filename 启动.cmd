@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title 米游档案 - 本地抽卡档案
set "ELECTRON_RUN_AS_NODE="

if exist "dist\米游档案-win32-x64\米游档案.exe" (
  start "" "dist\米游档案-win32-x64\米游档案.exe"
  exit /b 0
)

if exist "node_modules\electron\dist\electron.exe" (
  start "" "node_modules\electron\dist\electron.exe" "%~dp0"
  exit /b 0
)

echo.
echo 未找到桌面运行环境。
echo 请在项目目录执行：
echo   npm install
echo   npm run desktop
echo.
echo 或者构建便携版：
echo   npm run pack
echo.
pause
