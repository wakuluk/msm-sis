FROM amazoncorretto:26.0.0-alpine3.22 AS build

WORKDIR /app

COPY gradlew gradlew.bat build.gradle settings.gradle ./
COPY gradle gradle

RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon

COPY src src

RUN ./gradlew bootJar --no-daemon -x test

FROM amazoncorretto:26.0.0-alpine3.22

WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
EXPOSE 5005
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
