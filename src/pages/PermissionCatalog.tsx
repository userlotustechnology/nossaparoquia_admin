import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';

interface PermRow {
  id: number;
  name: string;
  label: string;
  group: string;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

export default function PermissionCatalog() {
  const [data, setData] = useState<PermRow[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [groups, setGroups] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<PermRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', label: '', group: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/permission-catalog', {
        params: { page, search: search || undefined, group: group || undefined, per_page: 15 },
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, group]);

  useEffect(() => {
    api.get('/admin/permission-catalog/groups').then((r) => setGroups(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, group]);

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', label: '', group: group || '' });
    setFormOpen(true);
  };

  const openEdit = (p: PermRow) => {
    setSelected(p);
    setForm({ name: p.name, label: p.label, group: p.group });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selected) {
        await api.put(`/admin/permission-catalog/${selected.id}`, form);
      } else {
        await api.post('/admin/permission-catalog', form);
      }
      setFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      alert(ax.response?.data?.errors ? Object.values(ax.response.data.errors).flat().join('\n') : ax.response?.data?.message || 'Erro.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: PermRow) => {
    if (!confirm(`Excluir permissão "${p.label}"?`)) return;
    try {
      await api.delete(`/admin/permission-catalog/${p.id}`);
      fetchData();
    } catch {
      alert('Erro ao excluir.');
    }
  };

  const columns = [
    { key: 'name', label: 'Nome (chave)', render: (p: PermRow) => <code className="text-xs bg-gray-100 px-1 rounded">{p.name}</code> },
    { key: 'label', label: 'Rótulo' },
    { key: 'group', label: 'Grupo' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de permissões</h1>
        <p className="text-gray-500">Criar e editar definições — use &quot;Permissões&quot; para atribuir papéis</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <select value={group} onChange={(e) => setGroup(e.target.value)} className="rounded border px-3 py-2 text-sm">
          <option value="">Todos os grupos</option>
          {groups.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        title="Permissões"
        columns={columns}
        data={data}
        loading={loading}
        meta={meta}
        onPageChange={setPage}
        onSearch={setSearch}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        canDelete
        createLabel="Nova permissão"
        searchPlaceholder="Buscar..."
        keyExtractor={(p) => p.id}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={selected ? 'Editar permissão' : 'Nova permissão'} size="md">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-700">Nome (recurso.ação)</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
              disabled={!!selected}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Rótulo</label>
            <input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Grupo</label>
            <input
              value={form.group}
              onChange={(e) => setForm((f) => ({ ...f, group: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="ex: usuarios"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <button type="button" onClick={() => setFormOpen(false)} className="rounded border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || !form.name || !form.label || !form.group}
            onClick={handleSave}
            className="rounded bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </Modal>
    </div>
  );
}
