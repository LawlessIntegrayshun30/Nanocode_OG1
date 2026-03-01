"""Nanocode generation endpoint."""
import logging
import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_model_client
from app.model_client import ModelClient
from nanocode.core import postprocess_output, preprocess_prompt
from nanocode.schema import NanocodeRequest, NanocodeResponse
from nanocode.validation import validate_request

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nanocode", tags=["nanocode"])


@router.post("", response_model=NanocodeResponse)
async def generate_nanocode(
    payload: NanocodeRequest,
    client: ModelClient = Depends(get_model_client),
) -> NanocodeResponse:
    """
    Generate nanocode from the provided request payload.
    
    Parameters:
        payload (NanocodeRequest): Request data containing the input prompt and generation options.
    
    Returns:
        NanocodeResponse: The model's output after postprocessing, formatted for the Nanocode API.
    """
    try:
        validate_request(payload)
    except ValueError as exc:
        logger.warning("Invalid Nanocode request", extra={"error": str(exc)})
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    prompt = preprocess_prompt(payload)
    logger.info("Nanocode request received", extra={"has_constraints": bool(payload.constraints)})

    try:
        raw = await client.generate(prompt=prompt)
    except httpx.HTTPStatusError as exc:
        logger.warning(
            "Upstream model error",
            extra={
                "status_code": exc.response.status_code,
                "error_message": str(exc),
                "request_url": str(exc.request.url),
            },
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Upstream model error: {exc.response.status_code}",
        ) from exc
    except httpx.RequestError as exc:
        logger.error(
            "Model server unavailable",
            extra={
                "error_message": str(exc),
                "request_url": str(exc.request.url) if getattr(exc, "request", None) else "",
            },
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model server unavailable",
        ) from exc

    if "metadata" not in raw or raw["metadata"] is None:
        raw["metadata"] = {}
    raw["metadata"].setdefault("prompt", prompt)

    return postprocess_output(payload, raw)
