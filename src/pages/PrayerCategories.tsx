import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';

interface PrayerCategoryRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: boolean;
  prayers_count: number;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

export default function PrayerCategories() {
  const [data, setData] = useState<PrayerCategoryRow[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<PrayerCategoryRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    color: '',
    sort_order: 0,
    is_active: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/prayer-categories', {
        params: { page, per_page: 20, search: search || undefined },
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
      name: '',
      slug: '',
      description: '',
      icon: '',
      color: '',
      sort_order: 0,
      is_active: true,
    });
    setFormOpen(true);
  };

  const openEdit = (item: PrayerCategoryRow) => {
    setSelected(item);
    setForm({
      name: item.name,
      slug: item.slug,
      description: item.description || '',
      icon: item.icon || '',
      color: item.color || '',
      sort_order: item.sort_order,
      is_active: item.is_active,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || undefined,
        description: form.description || null,
        icon: form.icon || null,
        color: form.color || null,
      };
      if (selected) {
        await api.put(`/admin/prayer-categories/${selected.id}`, payload);
      } else {
        await api.post('/admin/prayer-categories', payload);
      }
      setFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
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
      await api.delete(`/admin/prayer-categories/${selected.id}`);
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
      key: 'name',
      label: 'Nome',
      render: (item: PrayerCategoryRow) => <span className="font-medium text-gray-900">{item.name}</span>,
    },
    { key: 'slug', label: 'Slug' },
    {
      key: 'prayers_count',
      label: 'Orações',
      render: (item: PrayerCategoryRow) => (
        <span className="inline-flex rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-800">
          {item.prayers_count}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Ativa',
      render: (item: PrayerCategoryRow) => (item.is_active ? 'Sim' : 'Não'),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categorias de oração</h1>
        <p className="text-gray-500">Organize a biblioteca de orações</p>
      </div>

      <DataTable
        title="Categorias"
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
        createLabel="Nova categoria"
        searchPlaceholder="Buscar..."
        keyExtractor={(item) => item.id}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={selected ? 'Editar categoria' : 'Nova categoria'} size="md">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Slug (opcional)</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Ícone</label>
              <input
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cor</label>
              <input
                value={form.color}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ordem</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">Ativa</span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-4">
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || !form.name}
            onClick={handleSave}
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:bg-primary-300"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir categoria"
        message={`Excluir "${selected?.name}"?`}
        confirmLabel="Excluir"
        loading={saving}
      />
    </div>
  );
}
