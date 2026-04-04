import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';

interface PrizeRow {
  id: number;
  name: string;
  is_active: boolean;
  min_points: number | null;
  level: { id: number; name: string } | null;
}

interface LevelOpt {
  id: number;
  name: string;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
  pending_prizes_count?: number;
}

export default function GamificationPrizes() {
  const [data, setData] = useState<PrizeRow[]>([]);
  const [levels, setLevels] = useState<LevelOpt[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<PrizeRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    level_id: '' as string,
    min_points: '' as string,
    quantity: '' as string,
    is_active: true,
    available_from: '',
    available_until: '',
    parish_id: '' as string,
  });

  const loadLevels = useCallback(async () => {
    const res = await api.get('/admin/gamification/levels');
    setLevels(res.data.data.map((l: { id: number; name: string }) => ({ id: l.id, name: l.name })));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/gamification/prizes', { params: { page, per_page: 15 } });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setSelected(null);
    setForm({
      name: '',
      description: '',
      level_id: '',
      min_points: '',
      quantity: '',
      is_active: true,
      available_from: '',
      available_until: '',
      parish_id: '',
    });
    setFormOpen(true);
  };

  const openEdit = async (item: PrizeRow) => {
    setSelected(item);
    try {
      const res = await api.get(`/admin/gamification/prizes/${item.id}`);
      const p = res.data.data;
      setForm({
        name: p.name,
        description: p.description || '',
        level_id: p.level_id?.toString() ?? '',
        min_points: p.min_points?.toString() ?? '',
        quantity: p.quantity?.toString() ?? '',
        is_active: p.is_active,
        available_from: p.available_from || '',
        available_until: p.available_until || '',
        parish_id: p.parish_id?.toString() ?? '',
      });
      setFormOpen(true);
    } catch {
      alert('Erro ao carregar.');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        level_id: form.level_id === '' ? null : Number(form.level_id),
        min_points: form.min_points === '' ? null : Number(form.min_points),
        quantity: form.quantity === '' ? null : Number(form.quantity),
        is_active: form.is_active,
        available_from: form.available_from || null,
        available_until: form.available_until || null,
        parish_id: form.parish_id === '' ? null : Number(form.parish_id),
      };
      if (selected) {
        await api.put(`/admin/gamification/prizes/${selected.id}`, payload);
      } else {
        await api.post('/admin/gamification/prizes', payload);
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
      await api.delete(`/admin/gamification/prizes/${selected.id}`);
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
    { key: 'name', label: 'Nome', render: (item: PrizeRow) => <span className="font-medium">{item.name}</span> },
    {
      key: 'level',
      label: 'Nível',
      render: (item: PrizeRow) => item.level?.name ?? '—',
    },
    { key: 'min_points', label: 'Pts mín.', render: (item: PrizeRow) => item.min_points ?? '—' },
    {
      key: 'ativa',
      label: 'Ativo',
      render: (item: PrizeRow) => (item.is_active ? 'Sim' : 'Não'),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gamificação — Prêmios</h1>
          {meta?.pending_prizes_count != null && (
            <p className="text-sm text-amber-700 mt-1">Pendentes de entrega: {meta.pending_prizes_count}</p>
          )}
        </div>
      </div>

      <DataTable
        title="Prêmios"
        columns={columns}
        data={data}
        loading={loading}
        meta={meta}
        onPageChange={setPage}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={(item) => {
          setSelected(item);
          setDeleteOpen(true);
        }}
        canDelete
        createLabel="Novo prêmio"
        keyExtractor={(item) => item.id}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={selected ? 'Editar prêmio' : 'Novo prêmio'} size="md">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-700">Paróquia ID</label>
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
            <label className="mb-1 block text-sm text-gray-700">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Nível</label>
            <select
              value={form.level_id}
              onChange={(e) => setForm((f) => ({ ...f, level_id: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {levels.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm text-gray-700">Pts mínimos</label>
              <input
                value={form.min_points}
                onChange={(e) => setForm((f) => ({ ...f, min_points: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">Quantidade</label>
              <input
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm text-gray-700">Disponível de</label>
              <input
                type="date"
                value={form.available_from}
                onChange={(e) => setForm((f) => ({ ...f, available_from: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">Até</label>
              <input
                type="date"
                value={form.available_until}
                onChange={(e) => setForm((f) => ({ ...f, available_until: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            <span className="text-sm">Ativo</span>
          </label>
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
        title="Excluir prêmio"
        message={`Excluir "${selected?.name}"?`}
        loading={saving}
      />
    </div>
  );
}
