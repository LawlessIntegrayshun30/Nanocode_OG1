import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiError } from '../types';
import { generate } from './nanocodeClient';

describe('nanocodeClient.generate', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes JSON API errors with status and message', async () => {
    const body = { message: 'Invalid constraint payload' };

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(body), {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(generate({ input: 'hello', constraints: [] })).rejects.toMatchObject({
      status: 422,
      body,
      message: 'Invalid constraint payload',
    });
  });

  it('preserves non-JSON 5xx response bodies for debugging', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('gateway timeout', { status: 504 }));

    await expect(generate({ input: 'hello', constraints: [] })).rejects.toMatchObject({
      status: 504,
      body: 'gateway timeout',
      message: 'gateway timeout',
    });
  });

  it('converts network failures to ApiError shape', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'));

    try {
      await generate({ input: 'hello', constraints: [] });
      throw new Error('Expected generate to throw');
    } catch (error) {
      const apiError = error as ApiError;
      expect(apiError.message).toBe('Failed to fetch');
      expect(apiError.status).toBeUndefined();
      expect(apiError.body).toBeUndefined();
    }
  });

  it('rejects invalid success payloads with a normalized error', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ output: 'missing input field' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(generate({ input: 'hello', constraints: [] })).rejects.toMatchObject({
      status: 200,
      message: 'Nanocode returned an invalid response payload',
      body: { output: 'missing input field' },
    });
  });

  it('normalizes non-Error thrown objects and preserves status/body', async () => {
    vi.mocked(fetch).mockRejectedValue({
      status: 503,
      body: { detail: 'Service unavailable' },
      message: 'Service unavailable',
    });

    await expect(generate({ input: 'hello', constraints: [] })).rejects.toMatchObject({
      status: 503,
      body: { detail: 'Service unavailable' },
      message: 'Service unavailable',
    });
  });
});
