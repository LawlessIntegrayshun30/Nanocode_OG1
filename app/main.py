"""FastAPI application entrypoint."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from datetime import datetime, timedelta
from collections import defaultdict
import logging

from app.config import get_settings
from app.health import router as health_router
from app.logging_config import configure_logging
from app.routers.admin_router import router as admin_router
from app.routers.nanocode_router import router as nanocode_router

logger = logging.getLogger(__name__)

settings = get_settings()
configure_logging(settings.log_level)

app = FastAPI(title="Nanocode API", version="0.1.0")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add OWASP security headers to all responses."""

    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting: requests per minute per IP."""

    def __init__(self, app, rate_limit: int = 60):
        super().__init__(app)
        self.rate_limit = rate_limit
        self.requests = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = datetime.now()

        # Clean up old entries (older than 1 minute)
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < timedelta(minutes=1)
        ]

        # Check if rate limit exceeded
        if len(self.requests[client_ip]) >= self.rate_limit:
            logger.warning(f"Rate limit exceeded for IP {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded: maximum 60 requests per minute"},
            )

        # Record this request
        self.requests[client_ip].append(now)
        response = await call_next(request)
        return response


app.add_middleware(RateLimitMiddleware, rate_limit=settings.rate_limit_per_minute)
app.add_middleware(SecurityHeadersMiddleware)

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
