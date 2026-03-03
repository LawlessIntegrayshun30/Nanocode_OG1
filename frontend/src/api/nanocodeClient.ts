import type { ApiError, HealthResponse, NanocodeRequest, NanocodeResponse } from '../types';
import { z } from 'zod';

const API_BASE_URL = import.meta.env.VITE_NANOCODE_API_BASE_URL || 'http://localhost:8000';
const NANOCODE_PATH = '/nanocode';
const DEFAULT_ERROR_MESSAGE = 'Request to Nanocode failed';
const INVALID_RESPONSE_MESSAGE = 'Nanocode returned an invalid response payload';

const nanocodeResponseSchema = z.object({
  input: z.string(),
  output: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const healthResponseSchema: z.ZodType<HealthResponse> = z
  .object({
    status: z.string(),
    score: z.number().optional(),
  })
  .catchall(z.unknown());

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function messageFromBody(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body.trim().length > 0) return body;
  if (isRecord(body)) {
    for (const key of ['message', 'error', 'detail']) {
      const value = body[key];
      if (typeof value === 'string' && value.trim().length > 0) return value;
    }
  }
  return fallback;
}

function createApiError(message: string, extras?: Partial<ApiError>): ApiError {
  const error: ApiError = new Error(message);
  if (extras?.status !== undefined) error.status = extras.status;
  if (extras?.body !== undefined) error.body = extras.body;
  return error;
}

export function toApiError(error: unknown, fallbackMessage = DEFAULT_ERROR_MESSAGE): ApiError {
  if (error instanceof Error) {
    const apiError = error as ApiError;
    if (apiError.status !== undefined || apiError.body !== undefined) {
      return apiError;
    }
    return createApiError(error.message || fallbackMessage);
  }

  if (isRecord(error)) {
    const status = typeof error.status === 'number' ? error.status : undefined;
    const body = 'body' in error ? error.body : error;
    return createApiError(messageFromBody(error, fallbackMessage), { status, body });
  }

  return createApiError(messageFromBody(error, fallbackMessage), { body: error });
}

async function parseResponse<T>(response: Response, schema: z.ZodSchema<T>): Promise<T> {
  const raw = await response.text();
  let data: unknown;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!response.ok) {
    throw createApiError(messageFromBody(data, DEFAULT_ERROR_MESSAGE), {
      status: response.status,
      body: data,
    });
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw createApiError(INVALID_RESPONSE_MESSAGE, {
      status: response.status,
      body: data,
    });
  }

  return parsed.data;
}

export async function generate(request: NanocodeRequest): Promise<NanocodeResponse> {
  try {
    const url = `${API_BASE_URL}${NANOCODE_PATH}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return parseResponse(response, nanocodeResponseSchema);
  } catch (error) {
    throw toApiError(error);
  }
}

export async function getHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return parseResponse(response, healthResponseSchema);
  } catch (error) {
    throw toApiError(error);
  }
}

export { API_BASE_URL as apiBaseUrl };
