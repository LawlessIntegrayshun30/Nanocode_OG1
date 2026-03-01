"""Client for communicating with the local model server."""
from typing import Any, Dict, Optional
import httpx


class ModelClient:
    def __init__(self, base_url: str, client: Optional[httpx.AsyncClient] = None) -> None:
        """
        Initialize the ModelClient with the server base URL and an optional HTTP client.
        
        Parameters:
            base_url (str): Base URL of the model server; any trailing slashes are removed.
            client (Optional[httpx.AsyncClient]): External AsyncClient to use for requests. If omitted, a temporary AsyncClient will be created per request.
        """
        self.base_url = base_url.rstrip("/")
        self._client = client

    async def generate(self, prompt: str, **kwargs: Any) -> Dict[str, Any]:
        """
        Send the prompt to the model server's /generate endpoint and return the parsed JSON response.
        
        Parameters:
            prompt (str): Text prompt to send to the model.
            **kwargs: Additional key/value pairs to include in the request JSON body.
        
        Returns:
            dict: Parsed JSON response from the server.
        
        Raises:
            httpx.HTTPStatusError: If the server responds with an HTTP error status.
        """
        payload = {"prompt": prompt, **kwargs}

        # When no client is injected we create a short-lived AsyncClient. This keeps
        # current behavior while leaving room to share a client at app startup later.
        if self._client is None:
            async with httpx.AsyncClient(base_url=self.base_url) as client:
                response = await client.post("/generate", json=payload, timeout=30.0)
                response.raise_for_status()
                return response.json()

        # If a client is provided (e.g., in tests with MockTransport), use it and
        # send an absolute URL to avoid relying on its base_url configuration.
        response = await self._client.post(f"{self.base_url}/generate", json=payload, timeout=30.0)
        response.raise_for_status()
        return response.json()
