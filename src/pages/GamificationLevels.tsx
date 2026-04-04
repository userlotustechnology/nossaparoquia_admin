import { useEffect, useState } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';

interface LevelRow {
  id: number;
  name: string;
  min_points: number;
  icon: string | null;
  color: string | null;
  sort_order: number;
  parish_id: number | null;
}

export default function GamificationLevels() {
  const [data, setData] = useState<LevelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<LevelRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    min_points: 0,
    icon: '',
    color: '#1b4d3e',
    sort_order: 0,
    parish_id: '' as string,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/gamification/levels');
      setData(res.data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', min_points: 0, icon: '', color: '#1b4d3e', sort_order: 0, parish_id: '' });
    setFormOpen(true);
  };

  const openEdit = (item: LevelRow) => {
    setSelected(item);
    setForm({
      name: item.name,
      min_points: item.min_points,
      icon: item.icon || '',
      color: item.color || '#1b4d3e',
      sort_order: item.sort_order,
      parish_id: item.parish_id?.toString() ?? '',
    });
    setFormOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        min_points: form.min_points,
        icon: form.icon || null,
        color: form.color || null,
        sort_order: form.sort_order,
        parish_id: form.parish_id === '' ? null : Number(form.parish_id),
      };
      if (selected) {
        await api.put(`/admin/gamification/levels/${selected.id}`, payload);
      } else {
        await api.post('/admin/gamification/levels', payload);
      }
      setFormOpen(false);
      load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      alert(ax.response?.data?.errors ? Object.values(ax.response.data.errors).flat().join('\n') : 'Erro.');
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.delete(`/admin/gamification/levels/${selected.id}`);
      setDeleteOpen(false);
      setSelected(null);
      load();
    } catch {
      alert('Erro ao excluir.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Nome', render: (item: LevelRow) => <span className="font-medium">{item.name}</span> },
    { key: 'min_points', label: 'Pontos mín.' },
    { key: 'sort_order', label: 'Ordem' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gamificação — Níveis</h1>
      </div>
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <DataTable
          title="Níveis"
          columns={columns}
          data={data}
          loading={false}
          onCreate={openCreate}
          onEdit={openEdit}
          onDelete={(item) => {
            setSelected(item);
            setDeleteOpen(true);
          }}
          canDelete
          createLabel="Novo nível"
          keyExtractor={(item) => item.id}
        />
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={selected ? 'Editar nível' : 'Novo nível'}>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-700">Paróquia ID (opcional)</label>
            <input
              value={form.parish_id}
              onChange={(e) => setForm((f) => ({ ...f, parish_id: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Pontos mínimos *</label>
            <input
              type="number"
              value={form.min_points}
              onChange={(e) => setForm((f) => ({ ...f, min_points: Number(e.target.value) }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Cor (#hex)</label>
            <input
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Ícone</label>
            <input
              value={form.icon}
              onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Ordem</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <button type="button" onClick={() => setFormOpen(false)} className="rounded border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button type="button" disabled={saving || !form.name} onClick={save} className="rounded bg-primary-500 px-4 py-2 text-sm text-white">
            Salvar
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={del}
        title="Excluir nível"
        message={`Excluir "${selected?.name}"?`}
        confirmLabel="Excluir"
        loading={saving}
      />
    </div>
  );
}
