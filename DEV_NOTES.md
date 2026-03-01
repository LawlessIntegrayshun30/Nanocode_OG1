### Running with OpenAI model server

export OPENAI_API_KEY="<your_api_key>"
export OPENAI_MODEL="gpt-4o"

uvicorn model_server.server:app --host 0.0.0.0 --port 9000
