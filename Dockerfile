# ==============================================================================
# EFV UNIFIED SERVICE DOCKERFILE (Frontend + Backend in One Service)
# Optimized for Google Cloud Run, Debian Slim (Rock-Solid glibc & Next.js 15)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build Next.js Frontend
# ------------------------------------------------------------------------------
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package manifests first for caching
COPY EFV-F/package*.json ./
RUN npm install

# Copy frontend source code
COPY EFV-F ./

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js standalone application
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Install Backend Production Dependencies
# ------------------------------------------------------------------------------
FROM node:20-slim AS backend-deps
WORKDIR /app/backend

COPY EFV-B/package*.json ./
RUN npm install --omit=dev

# ------------------------------------------------------------------------------
# Stage 3: Production Runner Image
# ------------------------------------------------------------------------------
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV FRONTEND_PORT=3000
ENV FRONTEND_INTERNAL_URL=http://127.0.0.1:3000

# 1. Setup Next.js Standalone Frontend
WORKDIR /app/frontend
COPY --from=frontend-builder /app/frontend/.next/standalone ./
COPY --from=frontend-builder /app/frontend/.next/static ./.next/static
COPY --from=frontend-builder /app/frontend/public ./public

# 2. Setup Express Backend
WORKDIR /app/backend
COPY EFV-B ./
COPY --from=backend-deps /app/backend/node_modules ./node_modules
RUN mkdir -p src/uploads/covers src/uploads/ebooks src/uploads/gallery src/uploads/audios src/uploads/profiles src/uploads/products data

# 3. Setup Process Entrypoint
WORKDIR /app
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
