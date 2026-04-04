import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';

interface Row {
  id: number;
  status: string;
  awarded_at: string | null;
  user: { id: string; name: string; email: string } | null;
  prize: { id: number; name: string; parish_id: number | null } | null;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

export default function GamificationUserPrizes() {
  const [data, setData] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [parishes, setParishes] = useState<{ id: number; name: string }[]>([]);
  const [parishId, setParishId] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/gamification/user-prizes', {
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
    api.get('/admin/gamification/user-prizes/meta').then((r) => setParishes(r.data.data.parishes)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [parishId]);

  const deliver = async (id: number) => {
    if (!confirm('Marcar como entregue?')) return;
    try {
      await api.post(`/admin/gamification/user-prizes/${id}/deliver`);
      load();
    } catch {
      alert('Erro.');
    }
  };

  const cancel = async (id: number) => {
    if (!confirm('Cancelar este prêmio pendente?')) return;
    try {
      await api.post(`/admin/gamification/user-prizes/${id}/cancel`);
      load();
    } catch {
      alert('Erro.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prêmios pendentes</h1>
        <p className="text-gray-500">Entrega e cancelamento de prêmios de gamificação</p>
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
              <th className="px-4 py-2 text-left">Usuário</th>
              <th className="px-4 py-2 text-left">Prêmio</th>
              <th className="px-4 py-2 text-left">Concedido</th>
              <th className="px-4 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">
                  Carregando…
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">
                  Nenhum prêmio pendente
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="px-4 py-2">
                    <div className="font-medium">{row.user?.name ?? '—'}</div>
                    <div className="text-xs text-gray-500">{row.user?.email}</div>
                  </td>
                  <td className="px-4 py-2">{row.prize?.name ?? '—'}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {row.awarded_at ? new Date(row.awarded_at).toLocaleString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button type="button" className="text-green-600 text-xs font-medium" onClick={() => deliver(row.id)}>
                      Entregue
                    </button>
                    <button type="button" className="text-red-600 text-xs font-medium" onClick={() => cancel(row.id)}>
                      Cancelar
                    </button>
                  </td>
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
