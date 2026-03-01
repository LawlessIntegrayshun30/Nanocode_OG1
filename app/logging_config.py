"""Structured logging configuration for the FastAPI app."""
import logging
from logging.config import dictConfig


LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s %(levelname)s [%(name)s] %(message)s",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        }
    },
    "root": {
        "level": "INFO",
        "handlers": ["console"],
    },
}


def configure_logging(level: str = "INFO") -> None:
    """
    Configure the module-wide logging using the provided root logger level.
    
    Parameters:
        level (str): Logging level name for the root logger (e.g., "DEBUG", "INFO", "WARNING").
    """
    LOGGING_CONFIG["root"]["level"] = level
    dictConfig(LOGGING_CONFIG)
    logging.getLogger(__name__).debug("Logging configured", extra={"level": level})