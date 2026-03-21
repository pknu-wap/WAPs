# Stage 1: Build
FROM --platform=$BUILDPLATFORM gradle:8.5-jdk17 AS builder

WORKDIR /app

COPY build.gradle settings.gradle ./
COPY gradle ./gradle

RUN gradle dependencies --no-daemon || true

COPY src ./src
RUN gradle bootJar --no-daemon -x test

# Stage 2: Runtime
FROM --platform=$TARGETPLATFORM eclipse-temurin:17-jre-jammy

WORKDIR /app

# ubuntu 기반 이미지에서 사용할 런타임 사용자와 헬스체크 도구를 준비한다.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system spring \
    && useradd --system --gid spring --home-dir /app --shell /usr/sbin/nologin spring

COPY --from=builder /app/build/libs/*.jar app.jar

# 소유권 변경
RUN chown spring:spring app.jar

USER spring

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl --fail --silent http://localhost:8080/actuator/health > /dev/null || exit 1

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
