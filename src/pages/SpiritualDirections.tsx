import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';

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

  const columns = [
    {
      key: 'directee',
      label: 'Dirigido',
      render: (row: Row) =>
        row.directee ? (
          <div>
            <span className="font-medium text-gray-900">{row.directee.name}</span>
            <p className="text-xs text-gray-500">{row.directee.email}</p>
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'director',
      label: 'Diretor',
      render: (row: Row) =>
        row.director ? (
          <div>
            <span className="font-medium text-gray-900">{row.director.name}</span>
            <p className="text-xs text-gray-500">{row.director.email}</p>
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'parish',
      label: 'Paróquia',
      render: (row: Row) => row.parish?.name ?? '—',
    },
    {
      key: 'status_label',
      label: 'Status',
      render: (row: Row) => <span className="text-gray-900">{row.status_label}</span>,
    },
    {
      key: 'created_at',
      label: 'Criado',
      render: (row: Row) => (
        <span className="text-gray-600">{new Date(row.created_at).toLocaleDateString('pt-BR')}</span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Direção espiritual</h1>
        <p className="text-gray-500">Relacionamentos diretor ↔ dirigido (visão global)</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <label htmlFor="sd-parish" className="mb-1 block text-xs font-medium text-gray-500">
            Paróquia
          </label>
          <select
            id="sd-parish"
            value={parishId}
            onChange={(e) => setParishId(e.target.value)}
            className="min-w-[220px] rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todas as paróquias</option>
            {parishes.map((p) => (
              <option key={p.id} value={String(p.id)}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sd-status" className="mb-1 block text-xs font-medium text-gray-500">
            Status
          </label>
          <select
            id="sd-status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="min-w-[200px] rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos os status</option>
            {Object.entries(statuses).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        title="Relacionamentos"
        columns={columns}
        data={data}
        loading={loading}
        meta={meta}
        onPageChange={setPage}
        canCreate={false}
        keyExtractor={(row) => row.id}
      />
    </div>
  );
}
