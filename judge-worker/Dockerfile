FROM node:18-alpine

WORKDIR /app

# Install compilers and dependencies
RUN apk add --no-cache \
    g++ \
    gcc \
    make \
    python3 \
    py3-pip \
    openjdk17 \
    openjdk17-jdk \
    curl \
    bash \
    && rm -rf /var/cache/apk/*

# Verify installations
RUN g++ --version && \
    python3 --version && \
    java -version && \
    javac -version

# Create temp directory for code execution
RUN mkdir -p /tmp && chmod 777 /tmp

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy application code
COPY . .

# Set environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });" || exit 1

CMD ["node", "worker.js"]