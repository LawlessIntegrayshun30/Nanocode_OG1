import pytest
import httpx

from app.model_client import IdempotencyLoopError, ModelClient


@pytest.mark.anyio("asyncio")
async def test_model_client_generate():
    async def handler(request):
        return httpx.Response(200, json={"output": "ok"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as mock_client:
        client = ModelClient(base_url="http://test", client=mock_client)
        result = await client.generate("hi")
    assert result["output"] == "ok"


@pytest.mark.anyio("asyncio")
async def test_model_client_retries_on_request_error_then_succeeds():
    call_count = 0

    async def handler(request):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            raise httpx.ReadTimeout("temporary timeout", request=request)
        return httpx.Response(200, json={"output": "ok-after-retry"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as mock_client:
        client = ModelClient(
            base_url="http://test",
            client=mock_client,
            max_retries=2,
            retry_backoff_seconds=0.0,
            retry_max_backoff_seconds=0.0,
        )
        result = await client.generate("retry-me")

    assert result["output"] == "ok-after-retry"
    assert call_count == 2


@pytest.mark.anyio("asyncio")
async def test_model_client_retries_only_for_configured_statuses():
    call_count_503 = 0

    async def handler_503_then_success(request):
        nonlocal call_count_503
        call_count_503 += 1
        if call_count_503 == 1:
            return httpx.Response(503, json={"error": "unavailable"})
        return httpx.Response(200, json={"output": "ok-after-503"})

    transport_503 = httpx.MockTransport(handler_503_then_success)
    async with httpx.AsyncClient(transport=transport_503) as mock_client_503:
        client_503 = ModelClient(
            base_url="http://test",
            client=mock_client_503,
            max_retries=2,
            retry_backoff_seconds=0.0,
            retry_max_backoff_seconds=0.0,
            retry_on_status=(503,),
        )
        result = await client_503.generate("status-503")

    assert result["output"] == "ok-after-503"
    assert call_count_503 == 2

    call_count_500 = 0

    async def handler_500(request):
        nonlocal call_count_500
        call_count_500 += 1
        return httpx.Response(500, json={"error": "server-error"})

    transport_500 = httpx.MockTransport(handler_500)
    async with httpx.AsyncClient(transport=transport_500) as mock_client_500:
        client_500 = ModelClient(
            base_url="http://test",
            client=mock_client_500,
            max_retries=2,
            retry_backoff_seconds=0.0,
            retry_max_backoff_seconds=0.0,
            retry_on_status=(503,),
        )
        with pytest.raises(httpx.HTTPStatusError):
            await client_500.generate("status-500")

    assert call_count_500 == 1


@pytest.mark.anyio("asyncio")
async def test_model_client_idempotency_guard_blocks_repeated_identical_requests():
    call_count = 0

    async def handler(request):
        nonlocal call_count
        call_count += 1
        return httpx.Response(200, json={"output": "ok"})

    transport = httpx.MockTransport(handler)
    async with httpx.AsyncClient(transport=transport) as mock_client:
        client = ModelClient(
            base_url="http://test",
            client=mock_client,
            idempotency_guard_enabled=True,
            idempotency_max_repeats=2,
            idempotency_window_seconds=60.0,
        )

        await client.generate("same-request", temperature=0.2)
        await client.generate("same-request", temperature=0.2)
        with pytest.raises((IdempotencyLoopError, ValueError)):
            await client.generate("same-request", temperature=0.2)

    assert call_count == 2
