import type { ApiError, HealthResponse, NanocodeRequest, NanocodeResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_NANOCODE_API_BASE_URL || 'http://localhost:8000';
const NANOCODE_PATH = '/nanocode';

async function parseResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  let data: unknown;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!response.ok) {
    const error: ApiError = new Error('Request to Nanocode failed');
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data as T;
}

export async function generate(request: NanocodeRequest): Promise<NanocodeResponse> {
  const url = `${API_BASE_URL}${NANOCODE_PATH}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  return parseResponse<NanocodeResponse>(response);
}

export async function getHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return parseResponse<HealthResponse>(response);
}

export { API_BASE_URL as apiBaseUrl };
