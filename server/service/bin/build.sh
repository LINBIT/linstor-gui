cd ./minstor-service/
git pull
sh gradlew :service:bootJar && \
cp -r ./service/build/libs/service.jar ../  && \
cd ../ && sh service.sh stop &&  mv service.jar service-app.jar && sh start.sh && tail -f out.log

