@echo off
cd /d "c:\Users\Dell\Desktop\DOCTORS FARMS\whatsapp-backend"
java -Dmaven.multiModuleProjectDirectory="%CD%" -cp ".mvn\wrapper\maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain clean test -DskipTests=false
