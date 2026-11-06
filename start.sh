#!/bin/sh

# Default ports (Cloud Run injects PORT, default 8080)
export FRONTEND_PORT=${FRONTEND_PORT:-3000}
export PORT=${PORT:-8080}
export FRONTEND_INTERNAL_URL="http://127.0.0.1:${FRONTEND_PORT}"

echo "=========================================================="
echo "🚀 Starting EFV Unified Service (Cloud Run / Monorepo)"
echo "   Public Gateway & Backend API: Port ${PORT}"
echo "   Internal Frontend Service:   Port ${FRONTEND_PORT}"
echo "=========================================================="

# 1. Launch Next.js Standalone Frontend in the background with auto-supervisor
start_frontend() {
    while true; do
        if [ -f /app/frontend/server.js ]; then
            echo "▶️ Launching Next.js Frontend on 127.0.0.1:${FRONTEND_PORT}..."
            (cd /app/frontend && PORT=${FRONTEND_PORT} HOSTNAME="127.0.0.1" node server.js)
        fi
        echo "⚠️ Next.js stopped. Restarting in 2 seconds..."
        sleep 2
    done
}

start_frontend &

# 2. Launch Express Backend & Gateway directly as the main process (binds 0.0.0.0:PORT)
echo "▶️ Launching Express Backend & Gateway on 0.0.0.0:${PORT}..."
cd /app/backend
exec node src/server.js
