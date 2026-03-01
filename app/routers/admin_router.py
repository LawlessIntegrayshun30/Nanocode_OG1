"""Admin endpoints placeholder."""
from fastapi import APIRouter

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/ping")
async def ping() -> dict:
    """
    Return a simple health-check payload for the admin router.
    
    Returns:
        dict: A mapping containing {"status": "ok"}.
    """
    return {"status": "ok"}