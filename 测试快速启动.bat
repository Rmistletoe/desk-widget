@echo off
taskkill /f /im DeskWidget.exe 2>nul
taskkill /f /im FinanceWidget.exe 2>nul
taskkill /f /im 财务桌面便签.exe 2>nul

dotnet build src\DeskWidget\DeskWidget.csproj -c Debug --nologo -v q
if %errorlevel% neq 0 (
    echo 编译出现错误！
    pause
    exit /b %errorlevel%
)

start "" "src\DeskWidget\bin\Debug\net8.0-windows\DeskWidget.exe"
exit
