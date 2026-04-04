import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import type { ApiResponse, ObservabilityOverview } from '@/types';
import { ExternalLink, HeartPulse, RefreshCw } from 'lucide-react';

function apiOriginFromEnv(): string {
  const base = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!base) return '';
  try {
    return new URL(base).origin;
  } catch {
    return '';
  }
}

export default function Observability() {
  const [data, setData] = useState<ObservabilityOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ApiResponse<ObservabilityOverview>>('/admin/observability/overview');
      setData(res.data.data);
    } catch (e: unknown) {
      console.error(e);
      setError('Não foi possível carregar o resumo de observabilidade.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const pulseOpenUrl = useMemo(() => {
    if (data?.pulse.dashboard_url) return data.pulse.dashboard_url;
    const origin = apiOriginFromEnv();
    if (!origin) return '';
    const path = data?.pulse.dashboard_path ?? '/pulse';
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  }, [data]);

  if (loading && !data) {
    return (
      <div className="py-16 text-center text-gray-500">
        <RefreshCw className="mx-auto mb-3 h-8 w-8 animate-spin text-primary-500" />
        Carregando observabilidade…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Observabilidade da API</h1>
        <p className="mt-4 text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => load()}
          className="mt-4 rounded-lg bg-primary-500 px-4 py-2 text-sm text-white hover:bg-primary-600"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Observabilidade da API</h1>
          <p className="text-gray-500">
            Saúde, filas, cache, amostras Pulse (24h) e ligação ao dashboard detalhado.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          {pulseOpenUrl && data.pulse.enabled && (
            <a
              href={pulseOpenUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              <HeartPulse className="h-4 w-4" />
              Pulse (dashboard completo)
              <ExternalLink className="h-3.5 w-3.5 opacity-80" />
            </a>
          )}
        </div>
      </div>

      {data.pulse.spa_note && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong className="font-semibold">Nota:</strong> {data.pulse.spa_note}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ambiente"
          value={data.application.env}
          sub={data.application.debug ? 'debug ativo' : 'debug desligado'}
          warn={data.application.env === 'production' && data.application.debug}
        />
        <StatCard
          label="Base de dados"
          value={data.health.database_reachable ? 'OK' : 'Indisponível'}
          sub="ping à conexão configurada"
          warn={!data.health.database_reachable}
        />
        <StatCard
          label="Filas"
          value={data.queue.driver}
          sub={
            data.queue.failed_jobs != null && data.queue.pending_jobs != null
              ? `${data.queue.pending_jobs} pendentes · ${data.queue.failed_jobs} falhados`
              : '—'
          }
          warn={(data.queue.failed_jobs ?? 0) > 0}
        />
        <StatCard label="Cache" value={data.cache.store} sub="store por defeito" />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-gray-900">Aplicação</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">PHP</dt>
              <dd className="font-mono text-gray-900">{data.application.php}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Laravel</dt>
              <dd className="font-mono text-gray-900">{data.application.laravel}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="mb-3 font-semibold text-gray-900">Pedidos HTTP (API)</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Header de correlação</dt>
              <dd className="font-mono text-gray-900">{data.observability.request_correlation_header}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Log de todos os pedidos</dt>
              <dd className="text-gray-900">{data.observability.log_all_api_requests ? 'Sim' : 'Não'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Limiar “lento” (log, ms)</dt>
              <dd className="font-mono text-gray-900">{data.observability.slow_request_log_ms}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-gray-900">Laravel Pulse</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-4 sm:block">
            <dt className="text-gray-500">Estado</dt>
            <dd className="text-gray-900">{data.pulse.enabled ? 'Ativo' : 'Desativado'}</dd>
          </div>
          <div className="flex justify-between gap-4 sm:block">
            <dt className="text-gray-500">Tabelas migradas</dt>
            <dd className="text-gray-900">{data.pulse.tables_present ? 'Sim' : 'Não'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-500">Worker de ingestão</dt>
            <dd className="mt-1 font-mono text-xs text-gray-800">{data.pulse.ingest_worker}</dd>
          </div>
          {data.pulse.dashboard_url && (
            <div className="sm:col-span-2">
              <dt className="text-gray-500">URL do dashboard</dt>
              <dd className="mt-1 break-all font-mono text-xs text-gray-800">{data.pulse.dashboard_url}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="font-semibold text-gray-900">Pedidos lentos (amostra 24h · Pulse)</h2>
          <p className="text-xs text-gray-500">Ordenados pelo tempo mais alto registado.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-600">Quando</th>
                <th className="px-4 py-2 text-left text-gray-600">Método</th>
                <th className="px-4 py-2 text-left text-gray-600">Rota</th>
                <th className="px-4 py-2 text-right text-gray-600">ms</th>
              </tr>
            </thead>
            <tbody>
              {data.pulse_samples_24h.slow_requests.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    {!data.pulse.tables_present || !data.pulse.enabled
                      ? 'Pulse indisponível ou desativado — sem amostras.'
                      : 'Nenhum pedido lento registado nas últimas 24h.'}
                  </td>
                </tr>
              ) : (
                data.pulse_samples_24h.slow_requests.map((row, i) => (
                  <tr key={`${row.at}-${i}`} className="border-b border-gray-100">
                    <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                      {new Date(row.at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2 font-mono text-gray-800">{row.method ?? '—'}</td>
                    <td className="px-4 py-2 font-mono text-xs text-gray-800 break-all">
                      {row.path ?? '—'}
                      {row.via ? <span className="text-gray-400"> ({row.via})</span> : null}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums">{row.duration_ms}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="font-semibold text-gray-900">Queries lentas (amostra 24h · Pulse)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-600">Quando</th>
                <th className="px-4 py-2 text-left text-gray-600">Resumo</th>
                <th className="px-4 py-2 text-right text-gray-600">ms</th>
              </tr>
            </thead>
            <tbody>
              {data.pulse_samples_24h.slow_queries.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                    {!data.pulse.tables_present || !data.pulse.enabled
                      ? 'Pulse indisponível ou desativado — sem amostras.'
                      : 'Nenhuma query lenta registada nas últimas 24h.'}
                  </td>
                </tr>
              ) : (
                data.pulse_samples_24h.slow_queries.map((row, i) => (
                  <tr key={`${row.at}-${i}`} className="border-b border-gray-100">
                    <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                      {new Date(row.at).toLocaleString('pt-BR')}
                    </td>
                    <td className="max-w-xl px-4 py-2 font-mono text-xs text-gray-800 break-words">
                      {row.summary}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums">{row.duration_ms}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  warn,
}: {
  label: string;
  value: string;
  sub: string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        warn ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
      }`}
    >
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{sub}</p>
    </div>
  );
}
