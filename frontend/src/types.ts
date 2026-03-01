export interface NanocodeRequest {
  input: string;
  constraints?: string[];
}

export interface NanocodeResponse {
  input: string;
  output: string;
  metadata?: Record<string, unknown>;
}

export interface HealthResponse {
  status: string;
  score?: number;
  [key: string]: unknown;
}

export interface ApiError extends Error {
  status?: number;
  body?: unknown;
}
