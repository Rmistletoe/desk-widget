@echo off
taskkill /f /im FinanceWidget.exe 2>nul
taskkill /f /im 财务桌面便签.exe 2>nul
start release\portable\FinanceWidget.exe
exit
