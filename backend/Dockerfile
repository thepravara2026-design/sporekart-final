# Step 1: Build & Automated Test Verification stage
FROM maven:3.9.8-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
ARG SKIP_TESTS=false
RUN if [ "$SKIP_TESTS" = "true" ]; then \
        mvn clean package -DskipTests; \
    else \
        mvn clean test package; \
    fi

# Step 2: Lean Distroless / Alpine JRE Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
VOLUME /tmp
COPY --from=builder /app/target/sporekart-backend-*.jar app.jar
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
