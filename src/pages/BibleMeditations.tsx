import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';

interface Row {
  id: string;
  title: string;
  passage_reference: string;
  status: string;
  published_at: string | null;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

export default function BibleMeditations() {
  const [data, setData] = useState<Row[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    passage_reference: '',
    passage_text: '',
    reflection: '',
    status: 'draft',
    published_at: '',
    author: '',
    tags: '',
    parish_id: '' as string | number,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/bible-meditations', {
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
      passage_reference: '',
      passage_text: '',
      reflection: '',
      status: 'draft',
      published_at: '',
      author: '',
      tags: '',
      parish_id: '',
    });
    setFormOpen(true);
  };

  const openEdit = async (item: Row) => {
    setSelected(item);
    try {
      const res = await api.get(`/admin/bible-meditations/${item.id}`);
      const d = res.data.data;
      setForm({
        title: d.title,
        passage_reference: d.passage_reference,
        passage_text: d.passage_text,
        reflection: d.reflection,
        status: d.status,
        published_at: d.published_at ? d.published_at.slice(0, 16) : '',
        author: d.author || '',
        tags: Array.isArray(d.tags) ? d.tags.join(', ') : '',
        parish_id: d.parish_id ?? '',
      });
      setFormOpen(true);
    } catch {
      alert('Erro ao carregar meditação.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tags = form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined;
      const payload = {
        title: form.title,
        passage_reference: form.passage_reference,
        passage_text: form.passage_text,
        reflection: form.reflection,
        status: form.status,
        published_at: form.published_at || null,
        author: form.author || null,
        tags,
        parish_id: form.parish_id === '' ? null : Number(form.parish_id),
      };
      if (selected) {
        await api.put(`/admin/bible-meditations/${selected.id}`, payload);
      } else {
        await api.post('/admin/bible-meditations', payload);
      }
      setFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const errors = ax.response?.data?.errors;
      alert(errors ? Object.values(errors).flat().join('\n') : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.delete(`/admin/bible-meditations/${selected.id}`);
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
      render: (item: Row) => <span className="font-medium text-gray-900">{item.title}</span>,
    },
    { key: 'passage_reference', label: 'Referência' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meditações bíblicas</h1>
        <p className="text-gray-500">Publicadas no app e no mural</p>
      </div>

      <DataTable
        title="Meditações"
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
        createLabel="Nova meditação"
        keyExtractor={(item) => item.id}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={selected ? 'Editar meditação' : 'Nova meditação'} size="lg">
        <div className="space-y-3 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Paróquia (ID, opcional)</label>
            <input
              type="number"
              value={form.parish_id}
              onChange={(e) => setForm((f) => ({ ...f, parish_id: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Vazio = global"
            />
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
            <label className="mb-1 block text-sm font-medium text-gray-700">Referência bíblica *</label>
            <input
              value={form.passage_reference}
              onChange={(e) => setForm((f) => ({ ...f, passage_reference: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Texto da passagem *</label>
            <textarea
              value={form.passage_text}
              onChange={(e) => setForm((f) => ({ ...f, passage_text: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Reflexão *</label>
            <textarea
              value={form.reflection}
              onChange={(e) => setForm((f) => ({ ...f, reflection: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Publicação (ISO local)</label>
              <input
                type="datetime-local"
                value={form.published_at}
                onChange={(e) => setForm((f) => ({ ...f, published_at: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Autor</label>
            <input
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tags (vírgula)</label>
            <input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir meditação"
        message={`Excluir "${selected?.title}"?`}
        confirmLabel="Excluir"
        loading={saving}
      />
    </div>
  );
}
