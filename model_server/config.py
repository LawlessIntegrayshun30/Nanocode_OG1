"""Settings for the local model server."""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class ModelServerSettings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="MODEL_", env_file=".env", env_file_encoding="utf-8")

    host: str = "0.0.0.0"
    port: int = 9000


@lru_cache
def get_settings() -> ModelServerSettings:
    """
    Provide the application's ModelServerSettings instance; the returned object is cached for reuse.
    
    Returns:
        ModelServerSettings: The configured settings for the local model server.
    """
    return ModelServerSettings()
