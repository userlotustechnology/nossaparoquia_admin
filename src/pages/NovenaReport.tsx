import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';

interface Row {
  id: number;
  title: string;
  parish: { id: number; name: string } | null;
  total_started: number;
  total_completed: number;
  total_abandoned: number;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

export default function NovenaReport() {
  const [data, setData] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [parishes, setParishes] = useState<{ id: number; name: string }[]>([]);
  const [parishId, setParishId] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/novenas/report', {
        params: { page, parish_id: parishId || undefined, per_page: 20 },
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, parishId]);

  useEffect(() => {
    api.get('/admin/novenas/report/meta').then((r) => setParishes(r.data.data.parishes)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [parishId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Relatório de novenas</h1>
        <p className="text-gray-500">Participação por novena (iniciadas, concluídas, abandonadas)</p>
      </div>

      <div className="mb-4">
        <select value={parishId} onChange={(e) => setParishId(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="">Todas as paróquias</option>
          {parishes.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Novena</th>
              <th className="px-4 py-2 text-left">Paróquia</th>
              <th className="px-4 py-2 text-right">Iniciadas</th>
              <th className="px-4 py-2 text-right">Concluídas</th>
              <th className="px-4 py-2 text-right">Abandonadas</th>
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
                  <td className="px-4 py-2 font-medium">{row.title}</td>
                  <td className="px-4 py-2">{row.parish?.name ?? 'Global'}</td>
                  <td className="px-4 py-2 text-right">{row.total_started}</td>
                  <td className="px-4 py-2 text-right text-green-700">{row.total_completed}</td>
                  <td className="px-4 py-2 text-right text-amber-700">{row.total_abandoned}</td>
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
