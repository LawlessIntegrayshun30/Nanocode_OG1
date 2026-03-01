#!/usr/bin/env bash
set -e

curl -X POST http://localhost:9000/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Write a two-sentence summary of Nanocode."}'
