@echo off
chcp 65001 >nul
cd /d "%~dp0."

echo ========================================================
echo  正在打包发布原生绿色单文件版 DeskWidget.exe...
echo ========================================================

taskkill /f /im DeskWidget.exe >nul 2>nul

dotnet publish src\DeskWidget\DeskWidget.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o release\portable

if %errorlevel% neq 0 (
    echo 发布失败！
    pause
    exit /b 1
)

echo.
echo ========================================================
echo  打包成功！
echo  独立版文件位置: release\portable\DeskWidget.exe
echo  任何无开发环境的 Windows 电脑直接双击即可运行！
echo ========================================================
pause