FROM node:18-alpine
WORKDIR /app

# Install g++ compiler for C++ Java
RUN apk add --no-cache g++ python3 openjdk17

COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]