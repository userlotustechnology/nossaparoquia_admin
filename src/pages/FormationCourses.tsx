import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'theology', label: 'Teologia' },
  { value: 'scripture', label: 'Escritura Sagrada' },
  { value: 'faith', label: 'Fé e Espiritualidade' },
  { value: 'liturgy', label: 'Liturgia' },
  { value: 'sacraments', label: 'Sacramentos' },
  { value: 'pastoral', label: 'Pastoral' },
  { value: 'education', label: 'Educação' },
  { value: 'other', label: 'Outro' },
];

const LEVELS = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
];

interface CourseRow {
  id: number;
  title: string;
  slug: string;
  is_active: boolean;
  enrollments_count: number;
  price: number;
}

interface EnrollRow {
  id: string;
  user: { id: string; name: string; email: string } | null;
  payment_status: string;
  payment_status_label: string;
  certificate: { certificate_code: string } | null;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

export default function FormationCourses() {
  const [data, setData] = useState<CourseRow[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selected, setSelected] = useState<CourseRow | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollRow[]>([]);
  const [enrollMeta, setEnrollMeta] = useState<Meta | undefined>();
  const [enrollPage, setEnrollPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    instructor_name: '',
    price: 0,
    duration_hours: 0,
    category: 'other',
    level: 'beginner',
    is_active: true,
    is_featured: false,
    has_classes: false,
    requires_approval: false,
    max_students: '' as string | number,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/courses', {
        params: { page, search: search || undefined, per_page: 15 },
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

  const openCreate = () => {
    setSelected(null);
    setForm({
      title: '',
      slug: '',
      description: '',
      instructor_name: '',
      price: 0,
      duration_hours: 0,
      category: 'other',
      level: 'beginner',
      is_active: true,
      is_featured: false,
      has_classes: false,
      requires_approval: false,
      max_students: '',
    });
    setFormOpen(true);
  };

  const openEdit = async (item: CourseRow) => {
    setSelected(item);
    try {
      const res = await api.get(`/admin/courses/${item.id}`);
      const c = res.data.data;
      setForm({
        title: c.title,
        slug: c.slug,
        description: c.description || '',
        instructor_name: c.instructor_name || '',
        price: c.price,
        duration_hours: c.duration_hours,
        category: c.category || 'other',
        level: c.level || 'beginner',
        is_active: c.is_active,
        is_featured: c.is_featured,
        has_classes: c.has_classes,
        requires_approval: c.requires_approval,
        max_students: c.max_students ?? '',
      });
      setFormOpen(true);
    } catch {
      alert('Erro ao carregar curso.');
    }
  };

  const openEnrollments = async (item: CourseRow) => {
    setSelected(item);
    setEnrollPage(1);
    setEnrollOpen(true);
  };

  const fetchEnrollments = useCallback(async () => {
    if (!selected) return;
    try {
      const res = await api.get(`/admin/courses/${selected.id}/enrollments`, {
        params: { page: enrollPage, per_page: 15 },
      });
      setEnrollments(res.data.data);
      setEnrollMeta(res.data.meta);
    } catch {
      console.error('enrollments');
    }
  }, [selected, enrollPage]);

  useEffect(() => {
    if (enrollOpen && selected) fetchEnrollments();
  }, [enrollOpen, selected, enrollPage, fetchEnrollments]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || undefined,
        max_students: form.max_students === '' ? null : Number(form.max_students),
      };
      if (selected) {
        await api.put(`/admin/courses/${selected.id}`, payload);
      } else {
        await api.post('/admin/courses', payload);
      }
      setFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      alert(ax.response?.data?.errors ? Object.values(ax.response.data.errors).flat().join('\n') : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.delete(`/admin/courses/${selected.id}`);
      setDeleteOpen(false);
      setFormOpen(false);
      setSelected(null);
      fetchData();
    } catch {
      alert('Erro ao excluir.');
    } finally {
      setSaving(false);
    }
  };

  const confirmPay = async (e: EnrollRow) => {
    try {
      await api.post(`/admin/course-enrollments/${e.id}/confirm-payment`);
      fetchEnrollments();
      fetchData();
    } catch {
      alert('Erro ao confirmar pagamento.');
    }
  };

  const issueCert = async (e: EnrollRow) => {
    try {
      await api.post(`/admin/course-enrollments/${e.id}/issue-certificate`);
      fetchEnrollments();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      alert(ax.response?.data?.message || 'Erro ao emitir certificado.');
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Curso',
      render: (item: CourseRow) => <span className="font-medium text-gray-900">{item.title}</span>,
    },
    { key: 'enrollments_count', label: 'Matrículas' },
    {
      key: 'price',
      label: 'Preço',
      render: (item: CourseRow) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price),
    },
    {
      key: 'ativa',
      label: 'Ativo',
      render: (item: CourseRow) => (item.is_active ? 'Sim' : 'Não'),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cursos de formação</h1>
        <p className="text-gray-500">CRUD e matrículas (conteúdo detalhado pode continuar no monólito)</p>
      </div>

      <DataTable
        title="Cursos"
        columns={columns}
        data={data}
        loading={loading}
        meta={meta}
        onPageChange={setPage}
        onSearch={setSearch}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={(item) => {
          setSelected(item);
          setDeleteOpen(true);
        }}
        canDelete
        createLabel="Novo curso"
        keyExtractor={(item) => item.id}
        extraActions={(item) => (
          <button
            type="button"
            className="text-xs text-primary-600 hover:underline"
            onClick={() => openEnrollments(item)}
          >
            Matrículas
          </button>
        )}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={selected ? 'Editar curso' : 'Novo curso'} size="lg">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-gray-700">Título *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Instrutor</label>
            <input
              value={form.instructor_name}
              onChange={(e) => setForm((f) => ({ ...f, instructor_name: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-gray-700">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Preço</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Carga horária</label>
            <input
              type="number"
              value={form.duration_hours}
              onChange={(e) => setForm((f) => ({ ...f, duration_hours: Number(e.target.value) }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Categoria</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Nível</label>
            <select
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              {LEVELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Máx. alunos</label>
            <input
              type="number"
              value={form.max_students}
              onChange={(e) => setForm((f) => ({ ...f, max_students: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <span className="text-sm">Ativo</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
              />
              <span className="text-sm">Destaque</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.has_classes}
                onChange={(e) => setForm((f) => ({ ...f, has_classes: e.target.checked }))}
              />
              <span className="text-sm">Turmas</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.requires_approval}
                onChange={(e) => setForm((f) => ({ ...f, requires_approval: e.target.checked }))}
              />
              <span className="text-sm">Exige aprovação</span>
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <button type="button" onClick={() => setFormOpen(false)} className="rounded border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || !form.title}
            onClick={handleSave}
            className="rounded bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </Modal>

      <Modal open={enrollOpen} onClose={() => setEnrollOpen(false)} title={`Matrículas: ${selected?.title}`} size="lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">Aluno</th>
                <th className="py-2">Pagamento</th>
                <th className="py-2">Cert.</th>
                <th className="py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} className="border-b border-gray-100">
                  <td className="py-2">{e.user?.name ?? '—'}</td>
                  <td className="py-2">{e.payment_status_label}</td>
                  <td className="py-2">{e.certificate ? e.certificate.certificate_code.slice(0, 8) + '…' : '—'}</td>
                  <td className="py-2 text-right space-x-1">
                    {e.payment_status !== 'paid' && (
                      <button type="button" className="text-xs text-primary-600" onClick={() => confirmPay(e)}>
                        Confirmar pago
                      </button>
                    )}
                    {!e.certificate && (
                      <button type="button" className="text-xs text-primary-600" onClick={() => issueCert(e)}>
                        Certificado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {enrollMeta && enrollMeta.last_page > 1 && (
          <div className="mt-3 flex justify-center gap-2 text-sm">
            <button
              type="button"
              disabled={enrollPage <= 1}
              onClick={() => setEnrollPage((p) => p - 1)}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              Anterior
            </button>
            <span>
              {enrollPage} / {enrollMeta.last_page}
            </span>
            <button
              type="button"
              disabled={enrollPage >= enrollMeta.last_page}
              onClick={() => setEnrollPage((p) => p + 1)}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              Próximo
            </button>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir curso"
        message={`Excluir "${selected?.title}"?`}
        confirmLabel="Excluir"
        loading={saving}
      />
    </div>
  );
}
