@echo off
setlocal

if not "%JAVA_HOME%"=="" set "JAVA_HOME=%JAVA_HOME:"=%"
if exist "%USERPROFILE%\.jdks\corretto-24.0.2\bin\javac.exe" set "JAVA_HOME=%USERPROFILE%\.jdks\corretto-24.0.2"
if not exist "%JAVA_HOME%\bin\javac.exe" if exist "C:\Program Files\Java\jdk-24\bin\javac.exe" set "JAVA_HOME=C:\Program Files\Java\jdk-24"

if not exist "%JAVA_HOME%\bin\javac.exe" (
  echo Cannot find a Java 21+ JDK. Set JAVA_HOME to a JDK 21 or newer install. >&2
  exit /b 1
)

"%JAVA_HOME%\bin\javac.exe" --release 21 -version >nul 2>nul
if errorlevel 1 (
  echo JAVA_HOME must point to a JDK 21 or newer install. >&2
  exit /b 1
)

set "MVN_CMD=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.14-bin\1cb7fhup6b5n3bed6kckbrnspv\apache-maven-3.9.14\bin\mvn.cmd"
if not exist "%MVN_CMD%" set "MVN_CMD=%USERPROFILE%\.m2\wrapper\dists\apache-maven-3.9.12-bin\5nmfsn99br87k5d4ajlekdq10k\apache-maven-3.9.12\bin\mvn.cmd"

if not exist "%MVN_CMD%" (
  echo Cannot find a cached Maven distribution in %USERPROFILE%\.m2\wrapper\dists >&2
  exit /b 1
)

call "%MVN_CMD%" %*
exit /b %ERRORLEVEL%
