"""Mock backend returning canned responses."""
from typing import Dict


def generate(prompt: str) -> Dict[str, str]:
    """
    Return a canned mock response that echoes the given prompt.
    
    Parameters:
        prompt (str): Input text to be echoed in the response's `output` field.
    
    Returns:
        Dict[str, str]: A dictionary with keys:
            - "output": A string in the form "Echo: {prompt}".
            - "metadata": A mapping containing {"backend": "mock"}.
    """
    return {"output": f"Echo: {prompt}", "metadata": {"backend": "mock"}}