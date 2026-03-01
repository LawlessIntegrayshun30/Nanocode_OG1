import { useEffect, useState } from 'react';
import { getHealth } from '../api/nanocodeClient';
import type { HealthResponse } from '../types';

type HealthState = 'loading' | 'ok' | 'degraded' | 'error';

const REFRESH_MS = 90_000;

function deriveState(health: HealthResponse | null, error: boolean): HealthState {
  if (error) return 'error';
  if (!health) return 'loading';
  if ((health.status || '').toString().toLowerCase() === 'ok') return 'ok';
  return 'degraded';
}

export default function HealthIndicator() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasError, setHasError] = useState(false);

  const refresh = async () => {
    try {
      setHasError(false);
      const response = await getHealth();
      setHealth(response);
    } catch {
      setHasError(true);
    } finally {
      setLastUpdated(new Date());
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  const status = deriveState(health, hasError);
  const colorClass =
    status === 'ok' ? 'status-ok' : status === 'degraded' ? 'status-warn' : status === 'loading' ? 'status-idle' : 'status-error';

  return (
    <div className="health-indicator">
      <div className={`dot ${colorClass}`} />
      <div>
        <p className="eyebrow">Wrapper health</p>
        <p className="helper">
          {status === 'ok' && 'Healthy'}
          {status === 'degraded' && 'Degraded'}
          {status === 'loading' && 'Checking...'}
          {status === 'error' && 'Unavailable'}
          {health?.score !== undefined ? ` · Score ${health.score}` : null}
          {lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : null}
        </p>
      </div>
      <button className="ghost-button" onClick={refresh}>
        Refresh
      </button>
    </div>
  );
}
