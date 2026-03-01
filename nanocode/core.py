"""Core preprocessing and postprocessing logic."""
from nanocode.prompts import build_prompt
from nanocode.schema import NanocodeRequest, NanocodeResponse


def preprocess_prompt(request: NanocodeRequest) -> str:
    """
    Convert a NanocodeRequest into a model-ready prompt string.
    
    Parameters:
        request (NanocodeRequest): The input request containing user data and instructions to be converted into a prompt.
    
    Returns:
        prompt (str): Prompt string generated from the provided request.
    """
    return build_prompt(request)


def postprocess_output(request: NanocodeRequest, raw_response: dict) -> NanocodeResponse:
    """
    Convert a raw model response and the original request into a NanocodeResponse.
    
    Parameters:
        request (NanocodeRequest): The original request whose `input` is preserved in the response.
        raw_response (dict): Raw response dictionary; expects an "output" key (defaults to an empty string if missing) and may include "metadata" (defaults to an empty dict).
    
    Returns:
        NanocodeResponse: Object containing `input` copied from `request.input`, `output` extracted from `raw_response["output"]`, and `metadata` from `raw_response["metadata"]` or `{}` if absent.
    """
    content = raw_response.get("output", "")
    metadata = raw_response.get("metadata", {}) or {}
    return NanocodeResponse(input=request.input, output=content, metadata=metadata)
