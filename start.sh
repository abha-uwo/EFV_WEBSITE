#!/bin/sh
set -e

# Default ports (Cloud Run injects PORT, default 8080)
export FRONTEND_PORT=${FRONTEND_PORT:-3000}
export PORT=${PORT:-8080}
export FRONTEND_INTERNAL_URL="http://127.0.0.1:${FRONTEND_PORT}"

echo "=========================================================="
echo "🚀 Starting EFV Unified Service (Cloud Run / Monorepo)"
echo "   Public Gateway & Backend API: Port ${PORT}"
echo "   Internal Frontend Service:   Port ${FRONTEND_PORT}"
echo "=========================================================="

# 1. Launch Next.js Standalone Frontend in the background
echo "▶️ Launching Next.js Frontend on internal port ${FRONTEND_PORT}..."
(cd /app/frontend && PORT=${FRONTEND_PORT} HOSTNAME="127.0.0.1" node server.js) &
FRONTEND_PID=$!

# 2. Launch Express Backend Gateway
echo "▶️ Launching Express Backend & Gateway on port ${PORT}..."
(cd /app/backend && node src/server.js) &
BACKEND_PID=$!

# Graceful cleanup on shutdown
cleanup() {
    echo "🛑 Received termination signal. Shutting down EFV services..."
    kill -TERM "$FRONTEND_PID" "$BACKEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" "$BACKEND_PID" 2>/dev/null || true
    exit 0
}

trap cleanup SIGTERM SIGINT

# Monitor both processes: if either process exits, shutdown the container cleanly
while kill -0 "$FRONTEND_PID" 2>/dev/null && kill -0 "$BACKEND_PID" 2>/dev/null; do
    sleep 2
done

echo "⚠️ A critical service process stopped unexpectedly. Shutting down container..."
cleanup
