# Sentineli Rust Gateway - Multi-stage build for minimal image
FROM rustlang/rust:nightly-slim as builder

# Install OpenSSL and pkg-config for building
RUN apt-get update && \
    apt-get install -y pkg-config libssl-dev && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Copy manifests
COPY Cargo.toml Cargo.lock* ./

# Create dummy main to cache dependencies
RUN mkdir src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Now copy actual source and force rebuild
COPY src ./src

# Force clean rebuild of binary
RUN rm -rf target/release/.fingerprint/sentineli-gateway* target/release/sentineli-gateway target/release/sentineli-gateway.d && \
    cargo build --release

# Runtime stage - minimal Debian
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y ca-certificates libssl3 && \
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
