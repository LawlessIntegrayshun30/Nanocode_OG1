"""Client for communicating with the local model server."""
import asyncio
import hashlib
import json
import logging
import time
from collections import defaultdict, deque
from typing import Any, Deque, Dict, Optional
import httpx

logger = logging.getLogger(__name__)


class IdempotencyLoopError(ValueError):
    """Raised when identical requests repeat too frequently within the guard window."""


class ModelClient:
    def __init__(
        self,
        base_url: str,
        timeout: httpx.Timeout | float = 30.0,
        client: Optional[httpx.AsyncClient] = None,
        max_retries: int = 2,
        retry_backoff_seconds: float = 0.5,
        retry_max_backoff_seconds: float = 4.0,
        retry_on_status: tuple[int, ...] = (429, 502, 503, 504),
        idempotency_guard_enabled: bool = False,
        idempotency_max_repeats: int = 3,
        idempotency_window_seconds: float = 60.0,
    ) -> None:
        """
        Initialize the ModelClient with the server base URL and an optional HTTP client.
        
        Parameters:
            base_url (str): Base URL of the model server; any trailing slashes are removed.
            timeout (httpx.Timeout | float): Request timeout. Float values are converted to
                httpx.Timeout using the same value for all timeout phases.
            client (Optional[httpx.AsyncClient]): External AsyncClient to use for requests. If omitted, a temporary AsyncClient will be created per request.
        """
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout if isinstance(timeout, httpx.Timeout) else httpx.Timeout(timeout)
        self._client = client
        self.max_retries = max(0, max_retries)
        self.retry_backoff_seconds = max(0.0, retry_backoff_seconds)
        self.retry_max_backoff_seconds = max(self.retry_backoff_seconds, retry_max_backoff_seconds)
        self.retry_on_status = set(retry_on_status)
        self.idempotency_guard_enabled = idempotency_guard_enabled
        self.idempotency_max_repeats = max(1, idempotency_max_repeats)
        self.idempotency_window_seconds = max(1.0, idempotency_window_seconds)
        self._idempotency_history_size = 1024
        self._idempotency_events: Deque[tuple[str, float]] = deque()
        self._idempotency_counts: dict[str, int] = defaultdict(int)

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

        if self.idempotency_guard_enabled:
            self._check_idempotency(payload)

        max_attempts = self.max_retries + 1
        for attempt in range(max_attempts):
            try:
                response = await self._post_generate(payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as exc:
                status_code = exc.response.status_code
                should_retry = attempt < self.max_retries and status_code in self.retry_on_status
                if not should_retry:
                    raise
                delay = self._retry_delay(attempt)
                logger.warning(
                    "Retrying model call after HTTP status error",
                    extra={
                        "attempt": attempt + 1,
                        "max_retries": self.max_retries,
                        "status_code": status_code,
                        "retry_delay_seconds": delay,
                    },
                )
                await asyncio.sleep(delay)
            except httpx.RequestError as exc:
                if attempt >= self.max_retries:
                    raise
                delay = self._retry_delay(attempt)
                logger.warning(
                    "Retrying model call after transient request error",
                    extra={
                        "attempt": attempt + 1,
                        "max_retries": self.max_retries,
                        "error_type": type(exc).__name__,
                        "retry_delay_seconds": delay,
                    },
                )
                await asyncio.sleep(delay)

        # Should be unreachable because the loop returns or raises.
        raise RuntimeError("ModelClient retry loop exited unexpectedly")

    async def _post_generate(self, payload: Dict[str, Any]) -> httpx.Response:
        # When no client is injected we create a short-lived AsyncClient. This keeps
        # current behavior while leaving room to share a client at app startup later.
        if self._client is None:
            async with httpx.AsyncClient(base_url=self.base_url, timeout=self.timeout) as client:
                return await client.post("/generate", json=payload)

        # If a client is provided (e.g., in tests with MockTransport), use it and
        # send an absolute URL to avoid relying on its base_url configuration.
        return await self._client.post(f"{self.base_url}/generate", json=payload, timeout=self.timeout)

    def _retry_delay(self, attempt: int) -> float:
        return min(self.retry_backoff_seconds * (2 ** attempt), self.retry_max_backoff_seconds)

    def _check_idempotency(self, payload: Dict[str, Any]) -> None:
        now = time.monotonic()
        window_start = now - self.idempotency_window_seconds

        while self._idempotency_events and self._idempotency_events[0][1] < window_start:
            old_hash, _ = self._idempotency_events.popleft()
            self._idempotency_counts[old_hash] -= 1
            if self._idempotency_counts[old_hash] <= 0:
                del self._idempotency_counts[old_hash]

        payload_hash = hashlib.sha256(
            json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()
        current_repeats = self._idempotency_counts.get(payload_hash, 0)
        if current_repeats >= self.idempotency_max_repeats:
            raise IdempotencyLoopError("Repeated identical model request blocked by idempotency guard")

        self._idempotency_events.append((payload_hash, now))
        self._idempotency_counts[payload_hash] = current_repeats + 1

        while len(self._idempotency_events) > self._idempotency_history_size:
            old_hash, _ = self._idempotency_events.popleft()
            self._idempotency_counts[old_hash] -= 1
            if self._idempotency_counts[old_hash] <= 0:
                del self._idempotency_counts[old_hash]
