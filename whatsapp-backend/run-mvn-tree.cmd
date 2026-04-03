@echo off
cd /d "c:\Users\Dell\Desktop\DOCTORS FARMS\whatsapp-backend"
java -Dmaven.multiModuleProjectDirectory="%CD%" -cp ".mvn\wrapper\maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain dependency:tree -Dscope=compile -Dscope=test -Dscope=runtime -DoutputFile=dependency-tree.txt
