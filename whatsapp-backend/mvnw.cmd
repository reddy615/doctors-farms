@ECHO OFF
SETLOCAL

SET DIR=%~dp0
SET BASEDIR=%DIR%

IF DEFINED JAVA_HOME (
    SET "JAVA_EXEC=%JAVA_HOME%\bin\java.exe"
) ELSE (
    SET "JAVA_EXEC=java"
)

"%JAVA_EXEC%" -cp "%DIR%\.mvn\wrapper\maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain %*
