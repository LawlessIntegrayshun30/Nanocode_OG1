#!/usr/bin/env bash
set -euo pipefail

export $(grep -v '^#' .env.example | xargs) >/dev/null 2>&1 || true
uvicorn model_server.server:app --host "${MODEL_HOST:-0.0.0.0}" --port "${MODEL_PORT:-9000}"
