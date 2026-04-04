import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { FORMATION_CATEGORIES, FORMATION_LEVELS } from '@/constants/formationCourses';

interface CourseRow {
  id: number;
  title: string;
  slug: string;
  is_active: boolean;
  enrollments_count: number;
  price: number;
  thumbnail_url?: string | null;
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
  const [selected, setSelected] = useState<CourseRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
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
    thumbnail_path: '' as string | null,
    thumbnail_preview_url: '',
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
      thumbnail_path: null,
      thumbnail_preview_url: '',
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
        thumbnail_path: c.thumbnail_path ?? null,
        thumbnail_preview_url: c.thumbnail_url ?? '',
      });
      setFormOpen(true);
    } catch {
      alert('Erro ao carregar curso.');
    }
  };

  const uploadThumbnail = async (file: File) => {
    setThumbUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/files/upload', fd);
      const d = res.data?.data as { path?: string; url?: string };
      if (d?.path) {
        setForm((f) => ({
          ...f,
          thumbnail_path: d.path ?? null,
          thumbnail_preview_url: d.url ?? f.thumbnail_preview_url,
        }));
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = ax.response?.data?.errors;
      const msg = errs
        ? Object.values(errs).flat().join('\n')
        : ax.response?.data?.message || 'Erro ao enviar imagem.';
      alert(msg);
    } finally {
      setThumbUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { thumbnail_preview_url: _preview, ...rest } = form;
      void _preview;
      const payload = {
        ...rest,
        slug: form.slug || undefined,
        max_students: form.max_students === '' ? null : Number(form.max_students),
        thumbnail_path: form.thumbnail_path || null,
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

  const columns = [
    {
      key: 'cover',
      label: '',
      render: (item: CourseRow) => (
        <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-gray-100">
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-gray-400">—</div>
          )}
        </div>
      ),
    },
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
        <p className="text-gray-500">
          Lista e cadastro. Abra <strong>Gerenciar</strong> para matrículas, pagamentos, módulos, aulas e biblioteca.
        </p>
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
          <Link to={`/cursos/${item.id}`} className="text-xs font-medium text-primary-600 hover:underline">
            Gerenciar
          </Link>
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
          <div className="sm:col-span-2 space-y-2">
            <label className="mb-1 block text-sm text-gray-700">
              Capa do curso
              {form.is_active ? <span className="text-red-600"> *</span> : null}
            </label>
            <p className="text-xs text-gray-500">
              Obrigatória enquanto o curso estiver ativo. Formatos: JPG, PNG ou GIF (conforme configuração da API).
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex h-28 w-44 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50">
                {form.thumbnail_preview_url ? (
                  <img src={form.thumbnail_preview_url} alt="" className="h-full w-full object-cover" />
                ) : thumbUploading ? (
                  <span className="text-xs text-gray-400">Enviando…</span>
                ) : (
                  <span className="text-xs text-gray-400">Sem imagem</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  disabled={thumbUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) void uploadThumbnail(f);
                  }}
                  className="max-w-[220px] text-sm file:mr-2 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-700"
                />
                {form.thumbnail_path ? (
                  <button
                    type="button"
                    disabled={thumbUploading}
                    onClick={() =>
                      setForm((f) => ({ ...f, thumbnail_path: null, thumbnail_preview_url: '' }))
                    }
                    className="self-start text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    Remover capa
                  </button>
                ) : null}
              </div>
            </div>
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
              {FORMATION_CATEGORIES.map((c) => (
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
              {FORMATION_LEVELS.map((c) => (
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
            disabled={saving || thumbUploading || !form.title}
            onClick={handleSave}
            className="rounded bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
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
