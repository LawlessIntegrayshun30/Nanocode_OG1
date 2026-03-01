#!/usr/bin/env bash
set -euo pipefail

###############################################################################
# Fast dev launcher for Nanocode with OpenAI Model Server
#
# Features:
#   - Auto-loads .env if present
#   - Verifies OPENAI_API_KEY is set
#   - Starts:
#       1. Model server  (port 9000)
#       2. API backend   (port 8000)
#       3. Vite frontend dev (port 5173)
###############################################################################

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Nanocode Dev Launcher ==="

# -----------------------------------------------------------------------------
# LOAD .env (if it exists)
# -----------------------------------------------------------------------------
if [ -f "$ROOT_DIR/.env" ]; then
    echo "Loading environment variables from .env ..."
    # Export each line (ignoring comments)
    export $(grep -v '^#' "$ROOT_DIR/.env" | xargs) || true
else
    echo "No .env file found. You can create one by running:"
    echo "  ./configure_nanocode.sh"
    echo ""
fi

# -----------------------------------------------------------------------------
# SOFT-CHECK FOR MODEL PROVIDERS
# -----------------------------------------------------------------------------
if [ -z "${OPENAI_API_KEY:-}" ] && [ -z "${ANTHROPIC_API_KEY:-}" ] && [ -z "${CUSTOM_MODEL_BASE_URL:-}" ]; then
    echo ""
    echo "WARNING: No model provider appears to be configured."
    echo "You can run './configure_nanocode.sh' to set a provider."
    echo ""
fi

echo "Using OpenAI model: ${OPENAI_MODEL:-gpt-4o}"

# -----------------------------------------------------------------------------
# LOCATE FRONTEND DIRECTORY
# -----------------------------------------------------------------------------
if [ -d "$ROOT_DIR/frontend" ]; then
    FRONTEND_DIR="$ROOT_DIR/frontend"
elif [ -d "$ROOT_DIR/Frontend" ]; then
    FRONTEND_DIR="$ROOT_DIR/Frontend"
else
    echo "ERROR: Could not find frontend directory (tried 'frontend' and 'Frontend')."
    exit 1
fi

echo "Frontend directory: $FRONTEND_DIR"

# -----------------------------------------------------------------------------
# START MODEL SERVER
# -----------------------------------------------------------------------------
echo ""
echo "Starting model server on port 9000 ..."
(
    cd "$ROOT_DIR"
    uvicorn model_server.server:app --host 0.0.0.0 --port 9000
) &
MODEL_PID=$!
echo "Model server PID: $MODEL_PID"

sleep 1

# -----------------------------------------------------------------------------
# START API SERVER
# -----------------------------------------------------------------------------
echo ""
echo "Starting Nanocode API on port 8000 ..."
(
    cd "$ROOT_DIR"
    uvicorn app.main:app --host 0.0.0.0 --port 8000
) &
API_PID=$!
echo "API PID: $API_PID"

sleep 1

# -----------------------------------------------------------------------------
# START FRONTEND DEV SERVER
# -----------------------------------------------------------------------------
echo ""
echo "Starting Vite frontend dev server on port 5173 ..."
(
    cd "$FRONTEND_DIR"
    VITE_NANOCODE_API_BASE_URL=http://localhost:8000 \
        npm run dev -- --host 0.0.0.0 --port 5173
) &
FRONT_PID=$!
echo "Frontend PID: $FRONT_PID"

# -----------------------------------------------------------------------------
# CLEAN SHUTDOWN
# -----------------------------------------------------------------------------
cleanup() {
    echo ""
    echo "Shutting down Nanocode dev stack..."
    kill "$MODEL_PID" "$API_PID" "$FRONT_PID" 2>/dev/null || true
    echo "All processes terminated."
    exit 0
}

trap cleanup SIGINT SIGTERM

echo ""
echo "=== Nanocode Dev Environment Running ==="
echo "Frontend:  http://localhost:5173"
echo "API:       http://localhost:8000"
echo "Model:     http://localhost:9000"
echo ""
echo "Press CTRL+C to stop everything."

wait
