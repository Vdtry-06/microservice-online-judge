FROM node:18-alpine
WORKDIR /app

# Install compilers
RUN apk add --no-cache g++ python3 openjdk17

COPY package*.json ./
RUN npm install --production
COPY . .

CMD ["node", "worker.js"]