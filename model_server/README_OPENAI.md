# OpenAI configuration

The OpenAI-backed model server requires environment variables for authentication and model selection. Set them in your shell before running the server.

```bash
# Set your own API key; do not check secrets into source control
export OPENAI_API_KEY="<Your_API_Key>"
export OPENAI_MODEL="gpt-4o"
```

These variables are read at startup by `model_server/server.py`. If `OPENAI_API_KEY` is missing, the server will fail fast with a clear error so you can provide the credentials via `.env`, `.bashrc`, or `.profile`.
