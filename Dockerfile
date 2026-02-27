FROM node:22-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./
COPY client/package.json ./client/
COPY server/package.json ./server/

# Install all dependencies
RUN npm install

# Copy source
COPY client/ ./client/
COPY server/ ./server/

# Build client
RUN npm run build -w client

# Build server
RUN npm run build -w server

# --- Production stage ---
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
COPY server/package.json ./server/

# Install production deps only
RUN npm install -w server --omit=dev

# Copy built server
COPY --from=builder /app/server/dist ./server/dist
COPY server/src/db/schema.sql ./server/dist/db/

# Copy built client
COPY --from=builder /app/client/dist ./client/dist

# Copy sound files
COPY client/public/sounds ./client/dist/sounds

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

# Data volume for SQLite persistence
VOLUME /app/server/data

CMD ["node", "server/dist/index.js"]
