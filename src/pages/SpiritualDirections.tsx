import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';

interface Row {
  id: string;
  directee: { name: string; email: string } | null;
  director: { name: string; email: string } | null;
  parish: { id: number; name: string } | null;
  status: string;
  status_label: string;
  started_at: string | null;
  created_at: string;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

export default function SpiritualDirections() {
  const [data, setData] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [parishes, setParishes] = useState<{ id: number; name: string }[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [parishId, setParishId] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/spiritual-directions', {
        params: { page, parish_id: parishId || undefined, status: status || undefined, per_page: 20 },
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, parishId, status]);

  useEffect(() => {
    api.get('/admin/spiritual-directions/meta').then((r) => {
      setParishes(r.data.data.parishes);
      setStatuses(r.data.data.statuses || {});
    }).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [parishId, status]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Direção espiritual</h1>
        <p className="text-gray-500">Relacionamentos diretor ↔ dirigido (visão global)</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select value={parishId} onChange={(e) => setParishId(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="">Todas as paróquias</option>
          {parishes.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="">Todos os status</option>
          {Object.entries(statuses).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Dirigido</th>
              <th className="px-4 py-2 text-left">Diretor</th>
              <th className="px-4 py-2 text-left">Paróquia</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Criado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">
                  Carregando…
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="px-4 py-2">{row.directee ? `${row.directee.name}` : '—'}</td>
                  <td className="px-4 py-2">{row.director ? `${row.director.name}` : '—'}</td>
                  <td className="px-4 py-2">{row.parish?.name ?? '—'}</td>
                  <td className="px-4 py-2">{row.status_label}</td>
                  <td className="px-4 py-2 text-gray-600">{new Date(row.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex justify-center gap-2 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded border px-3 py-1 disabled:opacity-40">
            Anterior
          </button>
          <span>{page} / {meta.last_page}</span>
          <button type="button" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} className="rounded border px-3 py-1 disabled:opacity-40">
            Próximo
          </button>
        </div>
      )}
    </div>
  );
}
