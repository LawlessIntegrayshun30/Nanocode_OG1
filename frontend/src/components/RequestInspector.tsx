import { useState } from 'react';
import type { ApiError, NanocodeRequest, NanocodeResponse } from '../types';
import { apiBaseUrl } from '../api/nanocodeClient';

type Props = {
  request: NanocodeRequest | null;
  response: NanocodeResponse | null;
  error: ApiError | null;
};

function pretty(value: unknown) {
  if (!value) return '—';
  return JSON.stringify(value, null, 2);
}

export default function RequestInspector({ request, response, error }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`inspector ${open ? 'open' : ''}`}>
      <div className="inspector-bar">
        <div>
          <p className="eyebrow">Request/Response details</p>
          <p className="helper">Base URL: {apiBaseUrl}</p>
        </div>
        <button className="ghost-button" onClick={() => setOpen((prev) => !prev)}>
          {open ? 'Hide inspector' : 'Show inspector'}
        </button>
      </div>
      {open && (
        <div className="inspector-body">
          <div>
            <p className="eyebrow">Last request body</p>
            <pre>{pretty(request)}</pre>
          </div>
          <div>
            <p className="eyebrow">Last response body</p>
            <pre>{pretty(response)}</pre>
          </div>
          {error && (
            <div>
              <p className="eyebrow">Last error</p>
              <pre>{pretty({ status: error.status, body: error.body, message: error.message })}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
