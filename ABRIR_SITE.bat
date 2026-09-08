@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title DLSN Imports - Central Local
color 0F
set PORT=8080

:menu
cls
echo.
echo  ============================================================
echo                    D L S N   I M P O R T S
echo  ============================================================
echo.
echo      [1] Abrir loja local
echo      [2] Abrir painel ADMIN local
echo      [3] Abrir projeto no VS Code
echo      [4] Abrir pasta do projeto
echo      [5] Abrir site publicado no GitHub
echo      [0] Sair
echo.
echo  ------------------------------------------------------------
echo      ADMIN LOCAL: usuario admin  ^|  senha dlsn1997
echo  ------------------------------------------------------------
echo.
set /p OP=Escolha uma opcao: 

if "%OP%"=="1" goto site
if "%OP%"=="2" goto admin
if "%OP%"=="3" goto vscode
if "%OP%"=="4" goto pasta
if "%OP%"=="5" goto online
if "%OP%"=="0" exit
goto menu

:server
netstat -ano | findstr ":%PORT% " >nul 2>nul
if %errorlevel%==0 exit /b
where py >nul 2>nul
if %errorlevel%==0 (
  start "DLSN Local Server" /min cmd /c "cd /d ""%~dp0"" && py -m http.server %PORT%"
  timeout /t 2 /nobreak >nul
  exit /b
)
where python >nul 2>nul
if %errorlevel%==0 (
  start "DLSN Local Server" /min cmd /c "cd /d ""%~dp0"" && python -m http.server %PORT%"
  timeout /t 2 /nobreak >nul
  exit /b
)
exit /b

:site
call :server
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/"
) else (
  start "" "%~dp0index.html"
)
goto menu

:admin
call :server
where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/admin.html"
) else (
  start "" "%~dp0admin.html"
)
goto menu

:vscode
where code >nul 2>nul
if %errorlevel%==0 (
  start "" code .
) else (
  echo.
  echo  O comando "code" nao foi encontrado.
  echo  Abra o VS Code e use: Arquivo ^> Abrir Pasta.
  pause
)
goto menu

:pasta
start "" explorer "%~dp0"
goto menu

:online
start "" "https://tonsql.github.io/dlsn/"
goto menu
