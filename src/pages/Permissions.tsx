import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Save, Loader2 } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  label: string;
  group: string;
}

interface PermissionsData {
  roles: string[];
  permissions: Permission[];
  role_permissions: Record<string, number[]>;
}

export default function Permissions() {
  const [data, setData] = useState<PermissionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<Record<string, number[]>>({});

  useEffect(() => {
    api.get('/admin/permissions')
      .then((res) => {
        const d = res.data.data;
        const safe: PermissionsData = {
          roles: Array.isArray(d?.roles) ? d.roles : [],
          permissions: Array.isArray(d?.permissions) ? d.permissions : [],
          role_permissions: d?.role_permissions && typeof d.role_permissions === 'object' ? d.role_permissions : {},
        };
        setData(safe);
        setRolePermissions({ ...safe.role_permissions });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const togglePermission = (role: string, permissionId: number) => {
    setRolePermissions((prev) => {
      const current = prev[role] || [];
      const has = current.includes(permissionId);
      return {
        ...prev,
        [role]: has
          ? current.filter((id) => id !== permissionId)
          : [...current, permissionId],
      };
    });
  };

  const handleSave = () => {
    if (!data) return;
    setSaving(true);

    const promises = data.roles.map((role) =>
      api.put(`/admin/permissions/${role}`, {
        permissions: rolePermissions[role] || [],
      })
    );

    Promise.all(promises)
      .then(() => alert('Permissões salvas com sucesso!'))
      .catch((err) => {
        console.error(err);
        alert('Erro ao salvar permissões.');
      })
      .finally(() => setSaving(false));
  };

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    parish_admin: 'Admin Paróquia',
    secretary: 'Secretária',
    priest: 'Sacerdote',
    user: 'Usuário',
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const grouped = data.permissions.reduce<Record<string, Permission[]>>((acc, p) => {
    if (!acc[p.group]) acc[p.group] = [];
    acc[p.group].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Permissões</h1>
        <p className="text-gray-500">Gerencie as permissões e roles de acesso ao sistema</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-700 min-w-[200px]">
                Permissão
              </th>
              {data.roles.map((role) => (
                <th key={role} className="text-center py-3 px-4 font-medium text-gray-700">
                  {roleLabels[role] || role}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([groupName, permissions]) => (
              <>
                <tr key={`group-${groupName}`}>
                  <td
                    colSpan={data.roles.length + 1}
                    className="py-3 px-4 font-semibold text-gray-900 bg-gray-50 text-xs uppercase tracking-wide"
                  >
                    {groupName}
                  </td>
                </tr>
                {permissions.map((perm) => (
                  <tr key={perm.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-4 text-gray-700">{perm.label}</td>
                    {data.roles.map((role) => (
                      <td key={`${role}-${perm.id}`} className="text-center py-2 px-4">
                        <input
                          type="checkbox"
                          checked={(rolePermissions[role] || []).includes(perm.id)}
                          onChange={() => togglePermission(role, perm.id)}
                          className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 rounded-lg"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Permissões
          </button>
        </div>
      </div>
    </div>
  );
}
