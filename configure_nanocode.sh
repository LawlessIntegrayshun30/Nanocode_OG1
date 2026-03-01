#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/.env"
EXAMPLE_ENV_FILE="$ROOT_DIR/.env.example"

if [ ! -f "$ENV_FILE" ] && [ -f "$EXAMPLE_ENV_FILE" ]; then
  cp "$EXAMPLE_ENV_FILE" "$ENV_FILE"
fi

set_env() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

echo "Configure Nanocode model provider"
echo "--------------------------------"
echo "1) OpenAI"
echo "2) Anthropic"
echo "3) Custom HTTP backend"
read -r -p "Choose provider [1-3]: " choice

case "$choice" in
  1)
    read -r -p "Enter your OpenAI API key: " openai_key
    read -r -p "Enter OpenAI model name [gpt-4o]: " openai_model
    openai_model=${openai_model:-gpt-4o}
    set_env "OPENAI_API_KEY" "$openai_key"
    set_env "OPENAI_MODEL" "$openai_model"
    ;;
  2)
    read -r -p "Enter your Anthropic API key: " anth_key
    read -r -p "Enter Anthropic model name [claude-3-5-sonnet]: " anth_model
    anth_model=${anth_model:-claude-3-5-sonnet}
    set_env "ANTHROPIC_API_KEY" "$anth_key"
    set_env "ANTHROPIC_MODEL" "$anth_model"
    ;;
  3)
    read -r -p "Enter custom model base URL (e.g. http://localhost:9000): " base_url
    read -r -p "Enter custom model API key (if any, empty to skip): " custom_key
    read -r -p "Enter custom model name (identifier): " custom_name
    set_env "CUSTOM_MODEL_BASE_URL" "$base_url"
    set_env "CUSTOM_MODEL_API_KEY" "$custom_key"
    set_env "CUSTOM_MODEL_NAME" "$custom_name"
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

echo ""
echo "Updated $ENV_FILE with selected provider configuration."
echo "You can re-run this script anytime to change provider settings."
