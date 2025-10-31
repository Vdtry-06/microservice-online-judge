FROM node:18-alpine
WORKDIR /app

# Install compilers
RUN apk add --no-cache \
    g++ \
    python3 \
    py3-pip \
    openjdk17 \
    curl \
    && rm -rf /var/cache/apk/*
    
# === CÀI ĐẶT nlohmann/json cho C++ (header-only) ===
RUN mkdir -p /usr/local/include/nlohmann && \
    curl -L -o /usr/local/include/nlohmann/json.hpp \
    https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp

COPY package*.json ./
RUN npm install --production
COPY . .

CMD ["node", "worker.js"]