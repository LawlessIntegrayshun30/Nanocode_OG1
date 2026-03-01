"""Dependency wiring for the FastAPI app."""
import httpx
from fastapi import Depends

from app.config import get_settings
from app.model_client import ModelClient


def get_model_client(settings=Depends(get_settings)) -> ModelClient:
    """
    Provide a configured ModelClient for FastAPI dependency injection.
    
    Parameters:
        settings (Settings): Application settings provided via Depends(get_settings). The client's base URL is taken from settings.model_server_url.
    
    Returns:
        ModelClient: A ModelClient instance configured with the application's model server URL and timeout.
    """
    timeout = httpx.Timeout(
        connect=settings.model_connect_timeout_seconds,
        read=settings.model_read_timeout_seconds,
        write=settings.model_timeout_seconds,
        pool=settings.model_timeout_seconds,
    )

    return ModelClient(
        base_url=str(settings.model_server_url),
        timeout=timeout,
        max_retries=settings.model_max_retries,
        retry_backoff_seconds=settings.model_retry_backoff_seconds,
        retry_max_backoff_seconds=settings.model_retry_max_backoff_seconds,
        retry_on_status=settings.model_retry_on_status,
        idempotency_guard_enabled=settings.model_idempotency_guard_enabled,
        idempotency_max_repeats=settings.model_idempotency_max_repeats,
        idempotency_window_seconds=settings.model_idempotency_window_seconds,
    )
