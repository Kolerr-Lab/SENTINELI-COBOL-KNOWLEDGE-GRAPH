FROM debian:bookworm-slim

# Metadata
LABEL maintainer="Kolerr Lab"
LABEL description="Sentineli - COBOL Knowledge Graph with AI"
LABEL version="1.0.0"

# Install dependencies
RUN apt-get update && apt-get install -y \
    gnucobol \
    nodejs \
    npm \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user (security: don't run as root)
RUN useradd -m -u 1001 -s /bin/bash appuser

# Set working directory
WORKDIR /app

# Copy package files first (for Docker layer caching)
COPY --chown=appuser:appuser package*.json ./

# Install Node.js dependencies (including dev dependencies for development)
RUN npm ci && \
    npm cache clean --force

# Copy application files
COPY --chown=appuser:appuser . .

# Create bin directory and compile COBOL programs
RUN mkdir -p bin && \
    if [ -d src/cobol ] && [ "$(ls -A src/cobol/*.cob 2>/dev/null)" ]; then \
        node scripts/compile-cobol.js || echo "COBOL compilation skipped"; \
    fi

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3050

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3050/health || exit 1

# Start application
CMD ["node", "src/bridge/server.js"]
