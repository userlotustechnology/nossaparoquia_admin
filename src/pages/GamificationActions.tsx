import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Modal from '@/components/Modal';

interface ActionRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
  points: number;
  is_active: boolean;
  max_per_day: number | null;
  max_total: number | null;
}

export default function GamificationActions() {
  const [data, setData] = useState<ActionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<ActionRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    points: 0,
    is_active: true,
    max_per_day: '' as string,
    max_total: '' as string,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/gamification/actions');
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

  const openEdit = (a: ActionRow) => {
    setSelected(a);
    setForm({
      points: a.points,
      is_active: a.is_active,
      max_per_day: a.max_per_day?.toString() ?? '',
      max_total: a.max_total?.toString() ?? '',
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/admin/gamification/actions/${selected.id}`, {
        points: form.points,
        is_active: form.is_active,
        max_per_day: form.max_per_day === '' ? null : Number(form.max_per_day),
        max_total: form.max_total === '' ? null : Number(form.max_total),
      });
      setModalOpen(false);
      load();
    } catch {
      alert('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gamificação — Ações</h1>
        <p className="text-gray-500">Pontos por comportamento no app</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-gray-600">Código</th>
              <th className="px-4 py-2 text-left text-gray-600">Nome</th>
              <th className="px-4 py-2 text-left text-gray-600">Pontos</th>
              <th className="px-4 py-2 text-left text-gray-600">Ativa</th>
              <th className="px-4 py-2 text-right text-gray-600">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.map((a) => (
              <tr key={a.id} className="border-b border-gray-100">
                <td className="px-4 py-2 font-mono text-xs">{a.code}</td>
                <td className="px-4 py-2">{a.name}</td>
                <td className="px-4 py-2">{a.points}</td>
                <td className="px-4 py-2">{a.is_active ? 'Sim' : 'Não'}</td>
                <td className="px-4 py-2 text-right">
                  <button type="button" className="text-primary-600 text-xs" onClick={() => openEdit(a)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? `Editar: ${selected.name}` : ''} size="md">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-700">Pontos *</label>
            <input
              type="number"
              min={0}
              value={form.points}
              onChange={(e) => setForm((f) => ({ ...f, points: Number(e.target.value) }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Máx. por dia</label>
            <input
              type="number"
              min={1}
              value={form.max_per_day}
              onChange={(e) => setForm((f) => ({ ...f, max_per_day: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Máx. total</label>
            <input
              type="number"
              min={1}
              value={form.max_total}
              onChange={(e) => setForm((f) => ({ ...f, max_total: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            <span className="text-sm">Ativa</span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <button type="button" onClick={() => setModalOpen(false)} className="rounded border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={save}
            className="rounded bg-primary-500 px-4 py-2 text-sm text-white"
          >
            Salvar
          </button>
        </div>
      </Modal>
    </div>
  );
}
