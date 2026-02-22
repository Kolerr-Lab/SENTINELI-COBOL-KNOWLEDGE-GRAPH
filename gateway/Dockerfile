# Sentineli Rust Gateway - Multi-stage build for minimal image
FROM rust:1.83-slim as builder

WORKDIR /build

# Copy manifests
COPY Cargo.toml Cargo.lock* ./

# Create dummy main to cache dependencies
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release || true && \
    rm -rf src

# Now copy actual source
COPY src ./src

# Build for release
RUN cargo build --release

# Runtime stage - minimal Debian
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binary from builder
COPY --from=builder /build/target/release/sentineli-gateway /app/

# Create non-root user
RUN useradd -m -u 1001 gateway && \
    chown -R gateway:gateway /app

USER gateway

EXPOSE 3000

CMD ["./sentineli-gateway"]
