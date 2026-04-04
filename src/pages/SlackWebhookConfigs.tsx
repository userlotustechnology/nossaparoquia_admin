import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Modal from '@/components/Modal';
import DataTable from '@/components/DataTable';

interface WebhookRow {
  id: number;
  name: string;
  channel_key: string;
  webhook_url: string;
  description: string | null;
  is_active: boolean;
  masked_url: string;
}

export default function SlackWebhookConfigs() {
  const [data, setData] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<WebhookRow | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    channel_key: '',
    webhook_url: '',
    description: '',
    is_active: true,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/slack-webhook-configs');
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
    setForm({ name: '', channel_key: '', webhook_url: '', description: '', is_active: true });
    setFormOpen(true);
  };

  const openEdit = (w: WebhookRow) => {
    setSelected(w);
    setForm({
      name: w.name,
      channel_key: w.channel_key,
      webhook_url: w.webhook_url,
      description: w.description || '',
      is_active: w.is_active,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, is_active: form.is_active };
      if (selected) {
        await api.put(`/admin/slack-webhook-configs/${selected.id}`, payload);
      } else {
        await api.post('/admin/slack-webhook-configs', payload);
      }
      setFormOpen(false);
      load();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      alert(ax.response?.data?.errors ? Object.values(ax.response.data.errors).flat().join('\n') : ax.response?.data?.message || 'Erro.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (w: WebhookRow) => {
    if (!confirm(`Excluir webhook "${w.name}"?`)) return;
    try {
      await api.delete(`/admin/slack-webhook-configs/${w.id}`);
      load();
    } catch {
      alert('Erro ao excluir.');
    }
  };

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'channel_key', label: 'Chave', render: (w: WebhookRow) => <code className="text-xs">{w.channel_key}</code> },
    {
      key: 'url',
      label: 'URL',
      render: (w: WebhookRow) => <span className="text-xs text-gray-500">{w.masked_url}</span>,
    },
    {
      key: 'is_active',
      label: 'Ativo',
      render: (w: WebhookRow) => (w.is_active ? 'Sim' : 'Não'),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Webhooks Slack (canais)</h1>
        <p className="text-gray-500">Registros usados pelo serviço de notificação — além das configurações gerais em Webhooks</p>
      </div>

      <DataTable
        title="Integrações"
        columns={columns}
        data={data}
        loading={loading}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={handleDelete}
        canDelete
        canCreate
        canEdit
        createLabel="Novo webhook"
        keyExtractor={(w) => w.id}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={selected ? 'Editar webhook' : 'Novo webhook'} size="md">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-gray-700">Nome</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Chave do canal (snake_case)</label>
            <input
              value={form.channel_key}
              onChange={(e) => setForm((f) => ({ ...f, channel_key: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
              disabled={!!selected}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">URL do webhook</label>
            <input
              value={form.webhook_url}
              onChange={(e) => setForm((f) => ({ ...f, webhook_url: e.target.value }))}
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
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
            <span className="text-sm">Ativo</span>
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <button type="button" onClick={() => setFormOpen(false)} className="rounded border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || !form.name || !form.channel_key || !form.webhook_url}
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
