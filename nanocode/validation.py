"""Validation helpers."""
from nanocode.schema import NanocodeRequest


def validate_request(request: NanocodeRequest) -> None:
    """
    Validate that a NanocodeRequest has a non-empty input string.
    
    Parameters:
        request (NanocodeRequest): Request whose `input` field will be validated.
    
    Raises:
        ValueError: If `request.input` is empty or contains only whitespace.
    """
    if not request.input.strip():
        raise ValueError("Request input cannot be empty")