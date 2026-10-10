@echo off
chcp 65001 >nul
cd /d "%~dp0."

echo 正在准备启动 DeskWidget 桌面挂件...
taskkill /f /im DeskWidget.exe >nul 2>nul

echo 正在增量编译...
dotnet build src\DeskWidget\DeskWidget.csproj -c Debug --nologo -v q
if %errorlevel% neq 0 (
    echo.
    echo [错误] 编译失败，请查看报错！
    pause
    exit /b 1
)

echo 正在启动挂件...
start "" /d "%~dp0src\DeskWidget\bin\Debug\net8.0-windows" "DeskWidget.exe"
exit