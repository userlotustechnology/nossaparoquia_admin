import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';

interface NovenaDay {
  id: number;
  day_number: number;
  title: string;
  prayer_text: string;
  intro: string | null;
  reflection: string | null;
  scripture_reference: string | null;
}

interface NovenaRow {
  id: string;
  title: string;
  status: string;
  total_days: number;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

export default function Novenas() {
  const [data, setData] = useState<NovenaRow[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<NovenaRow | null>(null);
  const [days, setDays] = useState<NovenaDay[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    saint: '',
    intention_prompt: '',
    status: 'draft',
    is_featured: false,
    total_days: 9,
    tags: '',
    parish_id: '' as string | number,
  });
  const [dayForm, setDayForm] = useState({
    id: 0 as number,
    day_number: 1,
    title: '',
    prayer_text: '',
    intro: '',
    reflection: '',
    scripture_reference: '',
  });
  const [editingDay, setEditingDay] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/novenas', {
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

  const loadNovena = async (id: string) => {
    const res = await api.get(`/admin/novenas/${id}`);
    const n = res.data.data;
    setDays(n.days || []);
    setForm({
      title: n.title,
      description: n.description,
      saint: n.saint || '',
      intention_prompt: n.intention_prompt || '',
      status: n.status,
      is_featured: n.is_featured,
      total_days: n.total_days,
      tags: Array.isArray(n.tags) ? n.tags.join(', ') : '',
      parish_id: n.parish_id ?? '',
    });
  };

  const openCreate = () => {
    setSelected(null);
    setDays([]);
    setForm({
      title: '',
      description: '',
      saint: '',
      intention_prompt: '',
      status: 'draft',
      is_featured: false,
      total_days: 9,
      tags: '',
      parish_id: '',
    });
    setDayForm({
      id: 0,
      day_number: 1,
      title: '',
      prayer_text: '',
      intro: '',
      reflection: '',
      scripture_reference: '',
    });
    setEditingDay(false);
    setFormOpen(true);
  };

  const openEdit = async (item: NovenaRow) => {
    setSelected(item);
    setEditingDay(false);
    try {
      await loadNovena(item.id);
      setFormOpen(true);
    } catch {
      alert('Erro ao carregar novena.');
    }
  };

  const saveNovena = async () => {
    setSaving(true);
    try {
      const tags = form.tags
        ? form.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : undefined;
      const payload = {
        title: form.title,
        description: form.description,
        saint: form.saint || null,
        intention_prompt: form.intention_prompt || null,
        status: form.status,
        is_featured: form.is_featured,
        total_days: form.total_days,
        tags,
        parish_id: form.parish_id === '' ? null : Number(form.parish_id),
      };
      if (selected) {
        await api.put(`/admin/novenas/${selected.id}`, payload);
        await loadNovena(selected.id);
      } else {
        const res = await api.post('/admin/novenas', payload);
        const newId = res.data.data.id;
        setSelected({ id: newId, title: form.title, status: form.status, total_days: form.total_days });
        await loadNovena(newId);
      }
      fetchData();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      alert(ax.response?.data?.errors ? Object.values(ax.response.data.errors).flat().join('\n') : 'Erro ao salvar novena.');
    } finally {
      setSaving(false);
    }
  };

  const saveDay = async () => {
    if (!selected) {
      alert('Salve a novena antes de adicionar dias.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        day_number: dayForm.day_number,
        title: dayForm.title,
        prayer_text: dayForm.prayer_text,
        intro: dayForm.intro || null,
        reflection: dayForm.reflection || null,
        scripture_reference: dayForm.scripture_reference || null,
      };
      if (editingDay && dayForm.id) {
        await api.put(`/admin/novenas/${selected.id}/days/${dayForm.id}`, payload);
      } else {
        await api.post(`/admin/novenas/${selected.id}/days`, payload);
      }
      await loadNovena(selected.id);
      setEditingDay(false);
      setDayForm({
        id: 0,
        day_number: days.length + 1,
        title: '',
        prayer_text: '',
        intro: '',
        reflection: '',
        scripture_reference: '',
      });
      fetchData();
    } catch {
      alert('Erro ao salvar dia.');
    } finally {
      setSaving(false);
    }
  };

  const deleteDay = async (d: NovenaDay) => {
    if (!selected || !confirm(`Excluir dia ${d.day_number}?`)) return;
    try {
      await api.delete(`/admin/novenas/${selected.id}/days/${d.id}`);
      await loadNovena(selected.id);
      fetchData();
    } catch {
      alert('Erro ao excluir dia.');
    }
  };

  const handleDeleteNovena = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.delete(`/admin/novenas/${selected.id}`);
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
      key: 'title',
      label: 'Título',
      render: (item: NovenaRow) => <span className="font-medium text-gray-900">{item.title}</span>,
    },
    { key: 'total_days', label: 'Dias' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Novenas</h1>
        <p className="text-gray-500">Conteúdo espiritual por dia</p>
      </div>

      <DataTable
        title="Lista"
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
        createLabel="Nova novena"
        keyExtractor={(item) => item.id}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={selected ? `Editar: ${form.title}` : 'Nova novena'} size="lg">
        <div className="space-y-3 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-700">Paróquia (ID)</label>
              <input
                type="number"
                value={form.parish_id}
                onChange={(e) => setForm((f) => ({ ...f, parish_id: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">Total de dias</label>
              <input
                type="number"
                min={1}
                value={form.total_days}
                onChange={(e) => setForm((f) => ({ ...f, total_days: Number(e.target.value) }))}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Título *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Descrição *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm text-gray-700">Santo</label>
              <input
                value={form.saint}
                onChange={(e) => setForm((f) => ({ ...f, saint: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-gray-700">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
              >
                <option value="draft">Rascunho</option>
                <option value="published">Publicado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Pedido de intenção</label>
            <textarea
              value={form.intention_prompt}
              onChange={(e) => setForm((f) => ({ ...f, intention_prompt: e.target.value }))}
              rows={2}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Tags</label>
            <input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
            />
            <span className="text-sm">Destaque</span>
          </label>

          <button
            type="button"
            onClick={saveNovena}
            disabled={saving}
            className="w-full rounded-lg bg-primary-600 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Salvar dados da novena
          </button>

          {selected && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <h4 className="font-semibold text-gray-900 mb-2">Dias ({days.length})</h4>
              <ul className="space-y-1 mb-3 max-h-40 overflow-y-auto text-sm">
                {days.map((d) => (
                  <li key={d.id} className="flex justify-between gap-2 border-b border-gray-100 py-1">
                    <span>
                      Dia {d.day_number}: {d.title}
                    </span>
                    <span>
                      <button
                        type="button"
                        className="text-primary-600 mr-2"
                        onClick={() => {
                          setEditingDay(true);
                          setDayForm({
                            id: d.id,
                            day_number: d.day_number,
                            title: d.title,
                            prayer_text: d.prayer_text,
                            intro: d.intro || '',
                            reflection: d.reflection || '',
                            scripture_reference: d.scripture_reference || '',
                          });
                        }}
                      >
                        Editar
                      </button>
                      <button type="button" className="text-red-600" onClick={() => deleteDay(d)}>
                        Excluir
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                <p className="text-xs font-medium text-gray-600">{editingDay ? 'Editar dia' : 'Novo dia'}</p>
                <input
                  type="number"
                  min={1}
                  placeholder="Nº dia"
                  value={dayForm.day_number}
                  onChange={(e) => setDayForm((f) => ({ ...f, day_number: Number(e.target.value) }))}
                  className="w-full rounded border px-2 py-1 text-sm"
                />
                <input
                  placeholder="Título do dia"
                  value={dayForm.title}
                  onChange={(e) => setDayForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full rounded border px-2 py-1 text-sm"
                />
                <textarea
                  placeholder="Texto da oração *"
                  value={dayForm.prayer_text}
                  onChange={(e) => setDayForm((f) => ({ ...f, prayer_text: e.target.value }))}
                  rows={3}
                  className="w-full rounded border px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={saveDay}
                  disabled={saving}
                  className="rounded bg-primary-500 px-3 py-1 text-xs text-white"
                >
                  {editingDay ? 'Atualizar dia' : 'Adicionar dia'}
                </button>
                {editingDay && (
                  <button
                    type="button"
                    className="ml-2 text-xs text-gray-600"
                    onClick={() => {
                      setEditingDay(false);
                      setDayForm({
                        id: 0,
                        day_number: days.length + 1,
                        title: '',
                        prayer_text: '',
                        intro: '',
                        reflection: '',
                        scripture_reference: '',
                      });
                    }}
                  >
                    Cancelar edição
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex justify-end border-t pt-3">
          <button type="button" onClick={() => setFormOpen(false)} className="rounded border px-4 py-2 text-sm">
            Fechar
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteNovena}
        title="Excluir novena"
        message={`Excluir "${selected?.title}"?`}
        confirmLabel="Excluir"
        loading={saving}
      />
    </div>
  );
}
