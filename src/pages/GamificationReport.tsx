import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface LeaderRow {
  user_id: number;
  total_points: number;
  user: { id: string; name: string; email: string } | null;
}

interface ReportData {
  leaderboard: LeaderRow[];
  total_points: number;
  total_logs: number;
  pending_prizes: number;
  parish_id: number | null;
}

export default function GamificationReport() {
  const [data, setData] = useState<ReportData | null>(null);
  const [parishId, setParishId] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async (idFilter?: string | null) => {
    setLoading(true);
    try {
      const id = idFilter === undefined ? parishId : idFilter;
      const res = await api.get('/admin/gamification/report', {
        params: id ? { parish_id: id } : {},
      });
      setData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(null);
  }, []);

  const applyFilter = () => {
    load(parishId || null);
  };

  if (loading || !data) {
    return <div className="p-8 text-center text-gray-500">Carregando...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gamificação — Relatório</h1>
        <p className="text-gray-500">Ranking e totais (filtro por paróquia opcional)</p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-xs text-gray-500">ID da paróquia</label>
          <input
            type="number"
            value={parishId}
            onChange={(e) => setParishId(e.target.value)}
            className="rounded border px-3 py-2 text-sm"
            placeholder="Todas"
          />
        </div>
        <button type="button" onClick={applyFilter} className="rounded bg-primary-500 px-4 py-2 text-sm text-white">
          Aplicar
        </button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Pontos totais</p>
          <p className="text-2xl font-bold text-gray-900">{data.total_points}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Registros de pontos</p>
          <p className="text-2xl font-bold text-gray-900">{data.total_logs}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Prêmios pendentes</p>
          <p className="text-2xl font-bold text-amber-700">{data.pending_prizes}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-gray-600">#</th>
              <th className="px-4 py-2 text-left text-gray-600">Usuário</th>
              <th className="px-4 py-2 text-left text-gray-600">E-mail</th>
              <th className="px-4 py-2 text-right text-gray-600">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {data.leaderboard.map((row, i) => (
              <tr key={row.user_id} className="border-b border-gray-100">
                <td className="px-4 py-2">{i + 1}</td>
                <td className="px-4 py-2 font-medium">{row.user?.name ?? '—'}</td>
                <td className="px-4 py-2 text-gray-600">{row.user?.email ?? '—'}</td>
                <td className="px-4 py-2 text-right">{row.total_points}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.leaderboard.length === 0 && (
          <p className="p-6 text-center text-gray-500">Sem dados para o filtro.</p>
        )}
      </div>
    </div>
  );
}
