"""Application configuration loaded from environment variables with defaults."""
from functools import lru_cache
import json
from typing import Any
from pydantic import AnyHttpUrl
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"  # Ignore unknown fields from .env
    )

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    model_server_url: AnyHttpUrl = "http://localhost:9000"
    log_level: str = "INFO"
    
    # Security settings
    max_request_body_size: int = 1_000_000  # 1MB max request body
    model_timeout_seconds: float = 180.0
    model_connect_timeout_seconds: float = 10.0
    model_read_timeout_seconds: float = 180.0
    model_max_retries: int = 2
    model_retry_backoff_seconds: float = 0.5
    model_retry_max_backoff_seconds: float = 4.0
    model_retry_on_status: tuple[int, ...] = (429, 502, 503, 504)
    model_idempotency_guard_enabled: bool = False
    model_idempotency_max_repeats: int = 3
    model_idempotency_window_seconds: float = 60.0
    rate_limit_per_minute: int = 60  # Rate limit: 60 requests per minute per IP

    @field_validator("model_retry_on_status", mode="before")
    @classmethod
    def parse_model_retry_on_status(cls, value: Any) -> tuple[int, ...]:
        """Accept either JSON list syntax or a comma-delimited string."""
        if isinstance(value, tuple):
            return value
        if isinstance(value, list):
            return tuple(int(item) for item in value)
        if isinstance(value, str):
            raw_value = value.strip()
            if not raw_value:
                return tuple()
            if raw_value.startswith("["):
                parsed = json.loads(raw_value)
                if not isinstance(parsed, list):
                    raise ValueError("model_retry_on_status must be a list")
                return tuple(int(item) for item in parsed)
            return tuple(int(item.strip()) for item in raw_value.split(",") if item.strip())
        raise ValueError("Unsupported value for model_retry_on_status")


@lru_cache
def get_settings() -> Settings:
    """
    Get the application's Settings object, cached for reuse across the process.
    
    Returns:
        settings (Settings): The cached Settings instance containing configuration
        values (e.g., api_host, api_port, model_server_url, log_level).
    """
    return Settings()
