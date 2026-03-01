import os
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from openai import AsyncOpenAI

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable is not set.")

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

client = AsyncOpenAI(api_key=OPENAI_API_KEY)

# -----------------------------------------------------------------------------
# FastAPI app
# -----------------------------------------------------------------------------

app = FastAPI(title="Nanocode OpenAI Model Server", version="0.1.0")


class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="Full prompt string provided by the Nanocode backend.")


class GenerateResponse(BaseModel):
    output: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


@app.post("/generate", response_model=GenerateResponse)
async def generate(payload: GenerateRequest) -> GenerateResponse:
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt must not be empty.")

    try:
        response = await client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are Nanocode, a highly structured and helpful assistant."},
                {"role": "user", "content": prompt},
            ],
        )

        choice = response.choices[0]
        output_text = choice.message.content or ""

        metadata: Dict[str, Any] = {
            "prompt": prompt,
            "model": OPENAI_MODEL,
        }

        if getattr(response, "usage", None) is not None:
            metadata["usage"] = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }

        return GenerateResponse(output=output_text, metadata=metadata)

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Error from OpenAI backend: {exc}",
        ) from exc
