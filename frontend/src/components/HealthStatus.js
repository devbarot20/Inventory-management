'use client';

import { useEffect, useState } from 'react';

import Card from '@/components/ui/Card';
import { API_URL, apiFetch } from '@/lib/api';

const STATUS_STYLES = {
  loading: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  ok: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
};

/**
 * Calls GET /api/health and displays whether the backend is reachable.
 */
export default function HealthStatus() {
  const [state, setState] = useState({ status: 'loading', data: null, error: null });

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    apiFetch('/health')
      .then((data) => {
        if (!ignore) setState({ status: 'ok', data, error: null });
      })
      .catch((err) => {
        if (!ignore) setState({ status: 'error', data: null, error: err.message });
      });
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const check = () => {
    setState({ status: 'loading', data: null, error: null });
    setRefreshKey((key) => key + 1);
  };

  const label = { loading: 'Checking…', ok: 'Online', error: 'Offline' }[state.status];

  return (
    <Card title="API status">
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[state.status]}`}
          role="status"
        >
          {label}
        </span>
        <button
          type="button"
          onClick={check}
          className="rounded-md border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Re-check
        </button>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-zinc-500">Endpoint</dt>
          <dd className="break-all font-mono">{API_URL}/health</dd>
        </div>
        {state.data && (
          <>
            <div>
              <dt className="text-zinc-500">Database</dt>
              <dd
                className={
                  state.data.database === 'connected'
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }
              >
                {state.data.database}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Environment</dt>
              <dd>{state.data.environment}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Uptime</dt>
              <dd>{state.data.uptimeSeconds}s</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Server time</dt>
              <dd>{new Date(state.data.timestamp).toLocaleString()}</dd>
            </div>
          </>
        )}
        {state.error && (
          <div className="sm:col-span-2">
            <dt className="text-zinc-500">Error</dt>
            <dd className="text-red-600 dark:text-red-400">{state.error}</dd>
          </div>
        )}
      </dl>
    </Card>
  );
}
