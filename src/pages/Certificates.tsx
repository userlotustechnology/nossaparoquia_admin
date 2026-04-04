import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';

interface Row {
  id: number;
  certificate_code: string;
  course_title: string;
  student_name: string;
  issued_at: string | null;
  pdf_url: string | null;
  user: { email: string } | null;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

export default function Certificates() {
  const [data, setData] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/certificates', {
        params: { page, search: search || undefined, per_page: 20 },
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const columns = [
    {
      key: 'code',
      label: 'Código',
      render: (item: Row) => (
        <code className="text-xs bg-gray-100 px-1 rounded">{item.certificate_code}</code>
      ),
    },
    { key: 'course_title', label: 'Curso' },
    { key: 'student_name', label: 'Aluno' },
    {
      key: 'issued_at',
      label: 'Emissão',
      render: (item: Row) =>
        item.issued_at ? new Date(item.issued_at).toLocaleString('pt-BR') : '—',
    },
    {
      key: 'pdf',
      label: 'PDF',
      render: (item: Row) =>
        item.pdf_url ? (
          <a href={item.pdf_url} className="text-primary-600 text-xs" target="_blank" rel="noreferrer">
            Abrir
          </a>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Certificados</h1>
        <p className="text-gray-500">Emitidos via cursos de formação</p>
      </div>

      <DataTable
        title="Certificados emitidos"
        columns={columns}
        data={data}
        loading={loading}
        meta={meta}
        onPageChange={setPage}
        onSearch={setSearch}
        canCreate={false}
        canEdit={false}
        canDelete={false}
        searchPlaceholder="Código, aluno ou curso..."
        keyExtractor={(item) => item.id}
      />
    </div>
  );
}
