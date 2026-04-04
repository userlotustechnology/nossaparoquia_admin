import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '@/lib/api';

export default function GamificationUserLog() {
  const { uuid } = useParams<{ uuid: string }>();
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uuid) return;
    setLoading(true);
    api
      .get(`/admin/gamification/report/users/${uuid}`)
      .then((r) => setData(r.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [uuid]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando histórico…</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/gamificacao/relatorio" className="text-sm text-primary-600 hover:underline">
          ← Voltar ao relatório
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Histórico de gamificação</h1>
        <p className="text-gray-500 font-mono text-sm">Usuário: {uuid}</p>
      </div>
      <pre className="max-h-[70vh] overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
