import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import type { ActivityLog, PaginatedResponse } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function LoginAudit() {
  const [data, setData] = useState<ActivityLog[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<ActivityLog>['meta'] | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [filterUsers, setFilterUsers] = useState<{ id: number; name: string; email: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/login-audit', {
        params: {
          page,
          action: action || undefined,
          user_id: userId || undefined,
        },
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, action, userId]);

  useEffect(() => {
    api.get('/admin/login-audit/filter-users').then((r) => setFilterUsers(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [action, userId]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Auditoria de login</h1>
        <p className="text-gray-500">Logins, falhas, logout e eventos de 2FA</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          <option value="">Todas as ações</option>
          <option value="login">login</option>
          <option value="login_failed">login_failed</option>
          <option value="logout">logout</option>
          <option value="password_changed">password_changed</option>
          <option value="2fa_enabled">2fa_enabled</option>
          <option value="2fa_disabled">2fa_disabled</option>
        </select>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="rounded border px-3 py-2 text-sm min-w-[200px]"
        >
          <option value="">Todos os usuários</option>
          {filterUsers.map((u) => (
            <option key={u.id} value={String(u.id)}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-gray-600">Data</th>
              <th className="px-4 py-2 text-left text-gray-600">Usuário</th>
              <th className="px-4 py-2 text-left text-gray-600">Ação</th>
              <th className="px-4 py-2 text-left text-gray-600">IP</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-400">
                  Carregando…
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b border-gray-100">
                  <td className="px-4 py-2">{row.created_at ? new Date(row.created_at).toLocaleString('pt-BR') : '—'}</td>
                  <td className="px-4 py-2">{row.user ? `${row.user.name} · ${row.user.email}` : '—'}</td>
                  <td className="px-4 py-2 font-mono text-xs">{row.action}</td>
                  <td className="px-4 py-2 text-gray-600">{row.ip_address ?? '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {meta && meta.last_page > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border p-2 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-gray-600">
            {page} / {meta.last_page}
          </span>
          <button
            type="button"
            disabled={page >= meta.last_page}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border p-2 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
