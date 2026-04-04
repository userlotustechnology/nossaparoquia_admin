import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Plus, Trash2, Loader2 } from 'lucide-react';

interface IpRule {
  id: number;
  ip_address: string;
  type: 'whitelist' | 'blacklist';
  reason: string;
  created_at: string;
}

export default function IpRestrictions() {
  const [rules, setRules] = useState<IpRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<IpRule | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    ip_address: '',
    type: 'blacklist' as 'whitelist' | 'blacklist',
    reason: '',
  });

  const fetchData = () => {
    api.get('/admin/ip-rules')
      .then((res) => setRules(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    api.get('/admin/ip-rules')
      .then((res) => { if (!cancelled) setRules(res.data.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const openCreate = () => {
    setForm({ ip_address: '', type: 'blacklist', reason: '' });
    setFormOpen(true);
  };

  const handleSave = () => {
    setSaving(true);
    api.post('/admin/ip-rules', form)
      .then(() => {
        setFormOpen(false);
        fetchData();
      })
      .catch((err) => {
        console.error(err);
        const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const errors = axiosErr?.response?.data?.errors;
        const msg = errors
          ? Object.values(errors).flat().join('\n')
          : (axiosErr?.response?.data?.message || 'Erro ao salvar regra.');
        alert(msg);
      })
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    if (!selected) return;
    setSaving(true);
    api.delete(`/admin/ip-rules/${selected.id}`)
      .then(() => {
        setDeleteOpen(false);
        setSelected(null);
        fetchData();
      })
      .catch((err) => {
        console.error(err);
        alert('Erro ao excluir regra.');
      })
      .finally(() => setSaving(false));
  };

  const typeBadge = (type: string) => {
    const styles: Record<string, string> = {
      whitelist: 'bg-green-100 text-green-700',
      blacklist: 'bg-red-100 text-red-700',
    };
    const labels: Record<string, string> = {
      whitelist: 'Whitelist',
      blacklist: 'Blacklist',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-700'}`}>
        {labels[type] || type}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Restrições de IP</h1>
        <p className="text-gray-500">Gerencie regras de acesso por endereço IP</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Regras de IP</h2>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-lg"
          >
            <Plus className="h-4 w-4" />
            Nova Regra
          </button>
        </div>

        {rules.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">Nenhuma regra de IP cadastrada.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Endereço IP</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Motivo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Criado em</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{rule.ip_address}</td>
                    <td className="py-3 px-4">{typeBadge(rule.type)}</td>
                    <td className="py-3 px-4 text-gray-600">{rule.reason || '—'}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(rule.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => { setSelected(rule); setDeleteOpen(true); }}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Nova Regra de IP" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço IP *</label>
            <input
              value={form.ip_address}
              onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
              placeholder="Ex: 192.168.1.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'whitelist' | 'blacklist' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
            >
              <option value="blacklist">Blacklist</option>
              <option value="whitelist">Whitelist</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setFormOpen(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.ip_address}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 rounded-lg"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Regra"
        message={`Tem certeza que deseja excluir a regra para o IP "${selected?.ip_address}"?`}
        confirmLabel="Excluir"
        loading={saving}
      />
    </div>
  );
}
