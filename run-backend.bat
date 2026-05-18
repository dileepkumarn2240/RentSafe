@echo off
set "PROJECT_ROOT=%~dp0"
set "MAVEN_HOME=%PROJECT_ROOT%rentsafe-backend\apache-maven-3.9.6"
set "PATH=%MAVEN_HOME%\bin;%PATH%"

echo ===================================================
echo [RentSafe] Initializing Backend Environment...
echo ===================================================

:: Attempt to set JAVA_HOME if not already defined
if "%JAVA_HOME%"=="" (
    echo [INFO] JAVA_HOME not detected. Attempting to locate Java...
    for /f "delims=" %%i in ('where java 2^>nul') do (
        set "JAVA_EXE_PATH=%%i"
        goto :found_java
    )
    echo [ERROR] Java not found in PATH. Please install Java 17+.
    pause
    exit /b 1

    :found_java
    :: Remove \bin\java.exe from the path to get JAVA_HOME
    for %%j in ("%JAVA_EXE_PATH%") do set "JAVA_BIN_DIR=%%~dpj"
    set "JAVA_HOME=%JAVA_BIN_DIR:~0,-5%"
    echo [INFO] Set JAVA_HOME to: %JAVA_HOME%
)

echo.
echo Maven Home: %MAVEN_HOME%
echo Java Home:  %JAVA_HOME%
call mvn -version

cd rentsafe-backend

echo.
echo ===================================================
echo [RentSafe] Building Backend...
echo ===================================================
call mvn clean install -DskipTests

if errorlevel 1 (
    echo.
    echo [ERROR] Build Failed! Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ===================================================
echo [RentSafe] Starting Spring Boot Server...
echo ===================================================
call mvn spring-boot:run

pause
