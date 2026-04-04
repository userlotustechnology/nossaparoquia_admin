import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';

interface PrayerCat {
  id: number;
  name: string;
}

interface PrayerRow {
  id: string;
  category_id: number;
  title: string;
  text: string;
  status: string;
  is_featured: boolean;
  category: { id: number; name: string } | null;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

export default function Prayers() {
  const [data, setData] = useState<PrayerRow[]>([]);
  const [categories, setCategories] = useState<PrayerCat[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<PrayerRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    category_id: 0,
    title: '',
    text: '',
    author: '',
    origin: '',
    status: 'draft',
    is_featured: false,
    tags: '' as string,
  });

  const fetchCategories = useCallback(async () => {
    const res = await api.get('/admin/prayer-categories', { params: { per_page: 200 } });
    setCategories(res.data.data.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/prayers', {
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
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openCreate = () => {
    setSelected(null);
    setForm({
      category_id: categories[0]?.id ?? 0,
      title: '',
      text: '',
      author: '',
      origin: '',
      status: 'draft',
      is_featured: false,
      tags: '',
    });
    setFormOpen(true);
  };

  const openEdit = (item: PrayerRow) => {
    setSelected(item);
    setForm({
      category_id: item.category_id,
      title: item.title,
      text: item.text,
      author: '',
      origin: '',
      status: item.status,
      is_featured: item.is_featured,
      tags: '',
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.category_id || !form.title || !form.text) {
      alert('Preencha categoria, título e texto.');
      return;
    }
    setSaving(true);
    try {
      const tags = form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined;
      const payload = {
        category_id: form.category_id,
        title: form.title,
        text: form.text,
        author: form.author || null,
        origin: form.origin || null,
        status: form.status,
        is_featured: form.is_featured,
        tags,
      };
      if (selected) {
        await api.put(`/admin/prayers/${selected.id}`, payload);
      } else {
        await api.post('/admin/prayers', payload);
      }
      setFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      const errors = ax.response?.data?.errors;
      alert(errors ? Object.values(errors).flat().join('\n') : ax.response?.data?.message || 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.delete(`/admin/prayers/${selected.id}`);
      setDeleteOpen(false);
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
      key: 'title',
      label: 'Título',
      render: (item: PrayerRow) => <span className="font-medium text-gray-900">{item.title}</span>,
    },
    {
      key: 'category',
      label: 'Categoria',
      render: (item: PrayerRow) => item.category?.name ?? '—',
    },
    { key: 'status', label: 'Status' },
    {
      key: 'destaque',
      label: 'Destaque',
      render: (item: PrayerRow) => (item.is_featured ? 'Sim' : 'Não'),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orações</h1>
        <p className="text-gray-500">Conteúdo exibido no app e no portal</p>
      </div>

      <DataTable
        title="Lista de orações"
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
        createLabel="Nova oração"
        searchPlaceholder="Buscar..."
        keyExtractor={(item) => item.id}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={selected ? 'Editar oração' : 'Nova oração'} size="lg">
        <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Categoria *</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm((f) => ({ ...f, category_id: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Título *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Texto *</label>
            <textarea
              value={form.text}
              onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
              rows={8}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Autor</label>
              <input
                value={form.author}
                onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Origem</label>
              <input
                value={form.origin}
                onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tags (vírgula)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Destaque</span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir oração"
        message={`Excluir "${selected?.title}"?`}
        confirmLabel="Excluir"
        loading={saving}
      />
    </div>
  );
}
