import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { User, PaginatedResponse } from '@/types';
import { RotateCcw, Trash2 } from 'lucide-react';

type StatusFilter = 'active' | 'trashed' | 'all';

export default function Users() {
  const [data, setData] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<User>['meta'] | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [forceDeleteOpen, setForceDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    is_active: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: {
          page,
          search: search || undefined,
          status: statusFilter,
        },
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', email: '', password: '', role: 'user', is_active: true });
    setFormOpen(true);
  };

  const openEdit = (item: User) => {
    setSelected(item);
    setForm({
      name: item.name || '',
      email: item.email || '',
      password: '',
      role: item.role || 'user',
      is_active: item.is_active,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        is_active: form.is_active,
      };
      if (form.password) {
        payload.password = form.password;
        payload.password_confirmation = form.password;
      }
      if (selected) {
        await api.put(`/admin/users/${selected.id}`, payload);
      } else {
        await api.post('/admin/users', payload);
      }
      setFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      console.error(err);
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      const msg = errors
        ? Object.values(errors).flat().join('\n')
        : (axiosErr?.response?.data?.message || 'Erro ao salvar usuário.');
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.delete(`/admin/users/${selected.id}`);
      setDeleteOpen(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir usuário.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (user: User) => {
    try {
      await api.post(`/admin/users/${user.id}/restore`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao restaurar usuário.');
    }
  };

  const handleForceDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.delete(`/admin/users/${selected.id}/force-delete`);
      setForceDeleteOpen(false);
      setSelected(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir permanentemente.');
    } finally {
      setSaving(false);
    }
  };

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      parish_admin: 'bg-blue-100 text-blue-700',
      user: 'bg-gray-100 text-gray-700',
    };
    const labels: Record<string, string> = {
      admin: 'Admin',
      parish_admin: 'Admin Paróquia',
      user: 'Usuário',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] || styles.user}`}>
        {labels[role] || role}
      </span>
    );
  };

  const activeBadge = (active: boolean) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {active ? 'Ativo' : 'Inativo'}
    </span>
  );

  const isTrashed = statusFilter === 'trashed';

  const columns = [
    {
      key: 'name',
      label: 'Nome',
      render: (u: User) => (
        <div className="font-medium text-gray-900">{u.name}</div>
      ),
    },
    { key: 'email', label: 'E-mail', render: (u: User) => u.email },
    { key: 'role', label: 'Perfil', render: (u: User) => roleBadge(u.role) },
    { key: 'is_active', label: 'Status', render: (u: User) => activeBadge(u.is_active) },
    {
      key: 'created_at',
      label: 'Criado em',
      render: (u: User) => new Date(u.created_at).toLocaleDateString('pt-BR'),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <p className="text-gray-500">Gerencie os usuários do sistema</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { value: 'active' as StatusFilter, label: 'Ativos' },
          { value: 'trashed' as StatusFilter, label: 'Excluídos' },
          { value: 'all' as StatusFilter, label: 'Todos' },
        ]).map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              statusFilter === tab.value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DataTable
        title="Lista de Usuários"
        columns={columns}
        data={data}
        loading={loading}
        meta={meta}
        onPageChange={setPage}
        onSearch={setSearch}
        onCreate={!isTrashed ? openCreate : undefined}
        onEdit={!isTrashed ? openEdit : undefined}
        onDelete={!isTrashed ? (item) => { setSelected(item); setDeleteOpen(true); } : undefined}
        canCreate={!isTrashed}
        canEdit={!isTrashed}
        canDelete={!isTrashed}
        createLabel="Novo Usuário"
        searchPlaceholder="Buscar por nome, e-mail..."
        keyExtractor={(u) => u.id}
        extraActions={isTrashed ? (item) => (
          <>
            <button
              onClick={() => handleRestore(item)}
              className="p-1.5 text-gray-400 hover:text-green-600 rounded"
              title="Restaurar"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setSelected(item); setForceDeleteOpen(true); }}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded"
              title="Excluir permanentemente"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        ) : undefined}
      />

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={selected ? 'Editar Usuário' : 'Novo Usuário'}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha {selected ? '(deixe em branco para manter)' : '*'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              required={!selected}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Perfil *</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">Ativo</label>
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
            disabled={saving || !form.name || !form.email || (!selected && !form.password)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 rounded-lg"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </Modal>

      {/* Soft Delete Confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Usuário"
        message={`Tem certeza que deseja excluir "${selected?.name}"? O usuário poderá ser restaurado depois.`}
        confirmLabel="Excluir"
        loading={saving}
      />

      {/* Force Delete Confirm */}
      <ConfirmDialog
        open={forceDeleteOpen}
        onClose={() => setForceDeleteOpen(false)}
        onConfirm={handleForceDelete}
        title="Excluir Permanentemente"
        message={`Tem certeza que deseja excluir permanentemente "${selected?.name}"? Esta ação NÃO pode ser desfeita.`}
        confirmLabel="Excluir Permanentemente"
        loading={saving}
      />
    </div>
  );
}
