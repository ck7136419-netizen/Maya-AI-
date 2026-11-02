# Multi-stage production build for YASMIN AI on Google Cloud Run
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package manifests
COPY package*.json tsconfig*.json ./

# Install all dependencies
RUN npm ci

# Copy application source code
COPY . .

# Build production Vite bundle
RUN npm run build

# Stage 2: Minimal Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled frontend and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json
COPY --from=builder /app/.env.example ./.env.example

# Expose Cloud Run default port
EXPOSE 3000

# Start production server
CMD ["node", "--import", "tsx", "server.ts"]
