# =============================================================================
# Stage 1: Build
# =============================================================================
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /workspace

# Copy only the POM first so Maven's dependency layer is cached independently
# of source changes — subsequent builds that only touch .java files skip
# re-downloading the internet.
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q dependency:go-offline

COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -q clean package -DskipTests \
    && cp target/hms-backend.jar /workspace/app.jar

# =============================================================================
# Stage 2: Runtime
# =============================================================================
FROM eclipse-temurin:21-jre-jammy AS runtime

# curl is needed for the HEALTHCHECK below; the JRE base image doesn't include it.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Run as a non-root user — never run a JVM as PID-1 root in production.
RUN groupadd -r hms && useradd -r -g hms -d /app -s /sbin/nologin hms
WORKDIR /app

COPY --from=build /workspace/app.jar ./app.jar

# Where uploaded files (profile photos, lab reports, prescription PDFs) live.
# Mounted as a named volume in docker-compose so uploads survive container recreation.
RUN mkdir -p /app/uploads && chown -R hms:hms /app

USER hms

EXPOSE 8080

# Matches server.servlet.context-path (/api) + Spring Boot Actuator's health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD curl -f http://localhost:8080/api/actuator/health || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
