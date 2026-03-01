"""Dependency wiring for the FastAPI app."""
from fastapi import Depends

from app.config import get_settings
from app.model_client import ModelClient


def get_model_client(settings=Depends(get_settings)) -> ModelClient:
    """
    Provide a configured ModelClient for FastAPI dependency injection.
    
    Parameters:
        settings (Settings): Application settings provided via Depends(get_settings). The client's base URL is taken from settings.model_server_url.
    
    Returns:
        ModelClient: A ModelClient instance configured with the application's model server URL.
    """
    return ModelClient(base_url=str(settings.model_server_url))