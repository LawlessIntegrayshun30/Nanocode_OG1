"""Pydantic models for Nanocode payloads."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class NanocodeRequest(BaseModel):
    input: str = Field(..., description="User request for Nanocode generation")
    constraints: Optional[List[str]] = Field(default=None, description="Optional constraints")


class NanocodeResponse(BaseModel):
    input: str
    output: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    status: str
    score: float
