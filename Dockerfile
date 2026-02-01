# Stage 1: Build Client
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build Server
FROM node:20-alpine AS server-builder
WORKDIR /app/server
RUN apk add --no-cache openssl
COPY server/package*.json ./
RUN npm install
COPY server/prisma ./prisma/
RUN npx prisma generate
COPY server/ ./

# Stage 3: Runner
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=client-builder /app/client/dist ./client/dist
COPY --from=server-builder /app/server ./server

WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 8880

CMD ["sh", "-c", "npx prisma db push && node prisma/seed.js && node src/index.js"]
