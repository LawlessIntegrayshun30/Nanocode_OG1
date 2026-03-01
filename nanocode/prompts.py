"""Prompt templates for Nanocode generation."""
from nanocode.constants import DEFAULT_SYSTEM_PROMPT
from nanocode.schema import NanocodeRequest


def build_prompt(request: NanocodeRequest) -> str:
    """
    Builds the final prompt string used for Nanocode generation.
    
    Parameters:
        request (NanocodeRequest): Request containing the user input and optional constraints.
    
    Returns:
        str: The prompt starting with the default system prompt and a "User request: {input}" line. If the request includes constraints, a "Constraints: {c1, c2, ...}" line with a comma-separated list of constraints is appended.
    """
    base = f"{DEFAULT_SYSTEM_PROMPT}\nUser request: {request.input}"
    if request.constraints:
        return f"{base}\nConstraints: {', '.join(request.constraints)}"
    return base
