import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { Plan, PaginatedResponse } from '@/types';

const DEFAULT_FEATURES = [
  'dizimos',
  'campanhas',
  'eventos',
  'familias',
  'comunicados',
  'financeiro',
  'relatorios',
  'pastorais',
];

export default function Plans() {
  const [data, setData] = useState<Plan[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Plan>['meta'] | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6366f1',
    price_monthly: '',
    price_yearly: '',
    max_parishioners: '',
    max_families: '',
    max_events: '',
    max_campaigns: '',
    is_active: true,
    is_public: true,
    features: {} as Record<string, boolean>,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/plans', {
        params: {
          page,
          search: search || undefined,
        },
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
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

  const defaultFeatures = (): Record<string, boolean> => {
    const f: Record<string, boolean> = {};
    DEFAULT_FEATURES.forEach((key) => (f[key] = false));
    return f;
  };

  const openCreate = () => {
    setSelected(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      color: '#6366f1',
      price_monthly: '',
      price_yearly: '',
      max_parishioners: '',
      max_families: '',
      max_events: '',
      max_campaigns: '',
      is_active: true,
      is_public: true,
      features: defaultFeatures(),
    });
    setFormOpen(true);
  };

  const openEdit = (item: Plan) => {
    setSelected(item);
    const features = { ...defaultFeatures(), ...(item.features || {}) };
    setForm({
      name: item.name || '',
      slug: item.slug || '',
      description: item.description || '',
      color: item.color || '#6366f1',
      price_monthly: item.price_monthly != null ? String(item.price_monthly) : '',
      price_yearly: item.price_yearly != null ? String(item.price_yearly) : '',
      max_parishioners: item.max_parishioners != null ? String(item.max_parishioners) : '',
      max_families: item.max_families != null ? String(item.max_families) : '',
      max_events: item.max_events != null ? String(item.max_events) : '',
      max_campaigns: item.max_campaigns != null ? String(item.max_campaigns) : '',
      is_active: item.is_active,
      is_public: item.is_public,
      features,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        color: form.color || null,
        price_monthly: form.price_monthly ? parseFloat(form.price_monthly) : 0,
        price_yearly: form.price_yearly ? parseFloat(form.price_yearly) : 0,
        max_parishioners: form.max_parishioners ? parseInt(form.max_parishioners) : null,
        max_families: form.max_families ? parseInt(form.max_families) : null,
        max_events: form.max_events ? parseInt(form.max_events) : null,
        max_campaigns: form.max_campaigns ? parseInt(form.max_campaigns) : null,
        is_active: form.is_active,
        is_public: form.is_public,
        features: form.features,
      };
      if (selected) {
        await api.put(`/admin/plans/${selected.id}`, payload);
      } else {
        await api.post('/admin/plans', payload);
      }
      setFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      console.error(err);
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join('\n')
        : (axiosErr?.response?.data?.message || 'Erro ao salvar plano.');
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.delete(`/admin/plans/${selected.id}`);
      setDeleteOpen(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir plano.');
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (key: string) => {
    setForm({
      ...form,
      features: { ...form.features, [key]: !form.features[key] },
    });
  };

  const colorBadge = (color: string | null, label: string) => (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: color ? `${color}20` : '#f3f4f6',
        color: color || '#6b7280',
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color || '#6b7280' }}
      />
      {label}
    </span>
  );

  const activeBadge = (active: boolean, labelTrue = 'Ativo', labelFalse = 'Inativo') => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {active ? labelTrue : labelFalse}
    </span>
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const columns = [
    {
      key: 'name',
      label: 'Nome',
      render: (p: Plan) => (
        <div>
          <div className="font-medium text-gray-900">{p.name}</div>
          <div className="text-xs text-gray-400">{p.slug}</div>
        </div>
      ),
    },
    {
      key: 'color',
      label: 'Cor',
      render: (p: Plan) => colorBadge(p.color, p.color || '-'),
    },
    {
      key: 'price_monthly',
      label: 'Mensal',
      render: (p: Plan) => formatCurrency(p.price_monthly),
    },
    {
      key: 'price_yearly',
      label: 'Anual',
      render: (p: Plan) => formatCurrency(p.price_yearly),
    },
    { key: 'is_active', label: 'Status', render: (p: Plan) => activeBadge(p.is_active) },
    {
      key: 'is_public',
      label: 'Publico',
      render: (p: Plan) => activeBadge(p.is_public, 'Sim', 'Nao'),
    },
  ];

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm';

  const featureLabels: Record<string, string> = {
    dizimos: 'Dizimos',
    campanhas: 'Campanhas',
    eventos: 'Eventos',
    familias: 'Familias',
    comunicados: 'Comunicados',
    financeiro: 'Financeiro',
    relatorios: 'Relatorios',
    pastorais: 'Pastorais',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
        <p className="text-gray-500">Gerencie os planos de assinatura disponiveis para as paroquias</p>
      </div>

      <DataTable
        title="Lista de Planos"
        columns={columns}
        data={data}
        loading={loading}
        meta={meta}
        onPageChange={setPage}
        onSearch={setSearch}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={(item) => { setSelected(item); setDeleteOpen(true); }}
        canCreate
        canEdit
        canDelete
        createLabel="Novo Plano"
        searchPlaceholder="Buscar por nome..."
        keyExtractor={(p) => p.id}
      />

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={selected ? 'Editar Plano' : 'Novo Plano'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descricao</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="h-10 w-14 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className={inputClass}
                placeholder="#6366f1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preco Mensal (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price_monthly}
                onChange={(e) => setForm({ ...form, price_monthly: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preco Anual (R$)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.price_yearly}
                onChange={(e) => setForm({ ...form, price_yearly: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max. Paroquianos</label>
              <input
                type="number"
                min="0"
                value={form.max_parishioners}
                onChange={(e) => setForm({ ...form, max_parishioners: e.target.value })}
                className={inputClass}
                placeholder="Ilimitado"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max. Familias</label>
              <input
                type="number"
                min="0"
                value={form.max_families}
                onChange={(e) => setForm({ ...form, max_families: e.target.value })}
                className={inputClass}
                placeholder="Ilimitado"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max. Eventos</label>
              <input
                type="number"
                min="0"
                value={form.max_events}
                onChange={(e) => setForm({ ...form, max_events: e.target.value })}
                className={inputClass}
                placeholder="Ilimitado"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max. Campanhas</label>
              <input
                type="number"
                min="0"
                value={form.max_campaigns}
                onChange={(e) => setForm({ ...form, max_campaigns: e.target.value })}
                className={inputClass}
                placeholder="Ilimitado"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="plan_is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="plan_is_active" className="text-sm text-gray-700">Ativo</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="plan_is_public"
                checked={form.is_public}
                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="plan_is_public" className="text-sm text-gray-700">Publico</label>
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Funcionalidades</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {DEFAULT_FEATURES.map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`feature_${key}`}
                    checked={!!form.features[key]}
                    onChange={() => toggleFeature(key)}
                    className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor={`feature_${key}`} className="text-sm text-gray-700">
                    {featureLabels[key] || key}
                  </label>
                </div>
              ))}
            </div>
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
            disabled={saving || !form.name || !form.slug}
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
        title="Excluir Plano"
        message={`Tem certeza que deseja excluir o plano "${selected?.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={saving}
      />
    </div>
  );
}
