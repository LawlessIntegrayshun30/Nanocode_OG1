"""Health check helpers for the API service."""
from fastapi import APIRouter
from nanocode.health import compute_health_score
from nanocode.schema import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def healthcheck() -> HealthResponse:
    """
    Provide the service health status and current health score.
    
    The returned HealthResponse has its `status` set to "ok" and `score` set to the current service health score.
    
    Returns:
        HealthResponse: The health response with `status` "ok" and the current numeric `score`.
    """
    return HealthResponse(status="ok", score=compute_health_score())