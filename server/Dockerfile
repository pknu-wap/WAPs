FROM --platform=$BUILDPLATFORM gradle:8.5-jdk17 AS builder

WORKDIR /app

COPY gradlew ./
COPY gradle ./gradle
COPY build.gradle settings.gradle ./

RUN chmod +x ./gradlew
RUN ./gradlew dependencies --no-daemon || true

COPY src ./src
RUN ./gradlew bootJar --no-daemon -x test

FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system spring \
    && useradd --system --gid spring --home-dir /app --shell /usr/sbin/nologin spring

COPY --from=builder /app/build/libs/*.jar app.jar

RUN chown spring:spring app.jar

USER spring

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl --fail --silent http://localhost:8080/actuator/health > /dev/null || exit 1

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
