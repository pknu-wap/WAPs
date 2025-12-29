# ================================
# Stage 1: Build
# ================================
FROM gradle:8.5-jdk17 AS builder

WORKDIR /app

# Gradle 캐시 최적화를 위해 의존성 파일만 먼저 복사
COPY build.gradle settings.gradle ./
COPY gradle ./gradle

# 의존성 다운로드 (캐시 레이어)
RUN gradle dependencies --no-daemon || true

# 소스 코드 복사 및 빌드
COPY src ./src
RUN gradle bootJar --no-daemon -x test

# ================================
# Stage 2: Runtime
# ================================
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# 보안: non-root 사용자 생성
RUN addgroup -S spring && adduser -S spring -G spring

# 빌드된 JAR 복사
COPY --from=builder /app/build/libs/*.jar app.jar

# 소유권 변경
RUN chown spring:spring app.jar

USER spring

# 헬스체크
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
