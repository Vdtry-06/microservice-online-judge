FROM node:18-alpine

WORKDIR /app

# Install compilers and dependencies
RUN apk add --no-cache \
    g++ \
    make \
    python3 \
    openjdk17 \
    curl \
    bash \
    wget \
    && rm -rf /var/cache/apk/*

# Download Gson library for Java
RUN wget https://repo1.maven.org/maven2/com/google/code/gson/gson/2.8.9/gson-2.8.9.jar -O /app/gson-2.8.9.jar

# Download Gson library for C++ (nlohmann/json is header-only)
RUN mkdir -p /usr/include/nlohmann \
  && wget -qO /usr/include/nlohmann/json.hpp \
     https://raw.githubusercontent.com/nlohmann/json/v3.11.2/single_include/nlohmann/json.hpp \
  && chmod 644 /usr/include/nlohmann/json.hpp

# Verify installations
RUN g++ --version && \
    python3 --version && \
    java -version && \
    javac -version && \
    ls -lh /app/gson-2.8.9.jar

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
ENV GSON_JAR=/app/gson-2.8.9.jar

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });" || exit 1

CMD ["node", "worker.js"]