FROM debian:bookworm-slim

# Install GnuCOBOL and Node.js
RUN apt-get update && apt-get install -y \
    gnucobol \
    nodejs \
    npm \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package.json first for caching
COPY package.json .
RUN npm install

# Copy the rest of the application
COPY . .

# Compile COBOL programs
# We'll create a script to compile everything, but for now let's compile main
# equivalent to: cobc -x -o main src/main.cob
RUN mkdir -p bin

EXPOSE 3000

# Start the Node.js bridge
CMD ["node", "src/bridge/server.js"]
