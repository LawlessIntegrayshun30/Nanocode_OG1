"""FastAPI application entrypoint."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.health import router as health_router
from app.logging_config import configure_logging
from app.routers.admin_router import router as admin_router
from app.routers.nanocode_router import router as nanocode_router

settings = get_settings()
configure_logging(settings.log_level)

app = FastAPI(title="Nanocode API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(nanocode_router)
app.include_router(admin_router)
