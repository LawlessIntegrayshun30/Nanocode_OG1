#!/usr/bin/env bash
set -euo pipefail

export $(grep -v '^#' .env.example | xargs) >/dev/null 2>&1 || true
uvicorn app.main:app --host "${API_HOST:-0.0.0.0}" --port "${API_PORT:-8000}"
