FROM amazoncorretto:26.0.0-alpine3.22 AS build

WORKDIR /app
COPY . .

RUN chmod +x gradlew && ./gradlew bootJar --no-daemon

FROM amazoncorretto:26.0.0-alpine3.22

WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]