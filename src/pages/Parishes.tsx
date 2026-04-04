import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { Parish, PaginatedResponse } from '@/types';

export default function Parishes() {
  const [data, setData] = useState<Parish[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Parish>['meta'] | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Parish | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    email: '',
    phone: '',
    whatsapp: '',
    pix_key: '',
    address: '',
    city: '',
    state: '',
    is_active: true,
    requires_link_approval: false,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/parishes', {
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

  const openCreate = () => {
    setSelected(null);
    setForm({
      name: '',
      slug: '',
      description: '',
      email: '',
      phone: '',
      whatsapp: '',
      pix_key: '',
      address: '',
      city: '',
      state: '',
      is_active: true,
      requires_link_approval: false,
    });
    setFormOpen(true);
  };

  const openEdit = (item: Parish) => {
    setSelected(item);
    setForm({
      name: item.name || '',
      slug: item.slug || '',
      description: item.description || '',
      email: item.email || '',
      phone: item.phone || '',
      whatsapp: item.whatsapp || '',
      pix_key: item.pix_key || '',
      address: item.address || '',
      city: item.city || '',
      state: item.state || '',
      is_active: item.is_active,
      requires_link_approval: item.requires_link_approval,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form };
      if (selected) {
        await api.put(`/admin/parishes/${selected.id}`, payload);
      } else {
        await api.post('/admin/parishes', payload);
      }
      setFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      console.error(err);
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join('\n')
        : (axiosErr?.response?.data?.message || 'Erro ao salvar paróquia.');
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.delete(`/admin/parishes/${selected.id}`);
      setDeleteOpen(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir paróquia.');
    } finally {
      setSaving(false);
    }
  };

  const activeBadge = (active: boolean) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {active ? 'Ativa' : 'Inativa'}
    </span>
  );

  const columns = [
    {
      key: 'name',
      label: 'Nome',
      render: (p: Parish) => (
        <div>
          <div className="font-medium text-gray-900">{p.name}</div>
          <div className="text-xs text-gray-400">{p.slug}</div>
        </div>
      ),
    },
    {
      key: 'city',
      label: 'Cidade/Estado',
      render: (p: Parish) =>
        p.city || p.state
          ? `${p.city || ''}${p.city && p.state ? ' / ' : ''}${p.state || ''}`
          : '-',
    },
    { key: 'is_active', label: 'Status', render: (p: Parish) => activeBadge(p.is_active) },
    {
      key: 'created_at',
      label: 'Criado em',
      render: (p: Parish) => new Date(p.created_at).toLocaleDateString('pt-BR'),
    },
  ];

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Paroquias</h1>
        <p className="text-gray-500">Gerencie todas as paroquias cadastradas no sistema</p>
      </div>

      <DataTable
        title="Lista de Paroquias"
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
        createLabel="Nova Paroquia"
        searchPlaceholder="Buscar por nome..."
        keyExtractor={(p) => p.id}
      />

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={selected ? 'Editar Paroquia' : 'Nova Paroquia'}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
            <input
              value={form.pix_key}
              onChange={(e) => setForm({ ...form, pix_key: e.target.value })}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereco</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className={inputClass}
                maxLength={2}
                placeholder="UF"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="parish_is_active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="parish_is_active" className="text-sm text-gray-700">Ativa</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requires_link_approval"
                checked={form.requires_link_approval}
                onChange={(e) => setForm({ ...form, requires_link_approval: e.target.checked })}
                className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="requires_link_approval" className="text-sm text-gray-700">Requer aprovacao para vincular</label>
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
        title="Excluir Paroquia"
        message={`Tem certeza que deseja excluir "${selected?.name}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={saving}
      />
    </div>
  );
}
