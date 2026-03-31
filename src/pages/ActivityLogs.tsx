import { Fragment, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { ActivityLog, PaginatedResponse } from '@/types';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Filter } from 'lucide-react';

export default function ActivityLogs() {
  const [data, setData] = useState<ActivityLog[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<ActivityLog>['meta'] | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [modelType, setModelType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/activity-logs', {
        params: {
          page,
          action: action || undefined,
          model_type: modelType || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
        },
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, action, modelType, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [action, modelType, dateFrom, dateTo]);

  const formatModelType = (type: string | null) => {
    if (!type) return '—';
    const parts = type.split('\\');
    return parts[parts.length - 1];
  };

  const actionBadge = (actionName: string) => {
    const styles: Record<string, string> = {
      created: 'bg-green-100 text-green-700',
      updated: 'bg-blue-100 text-blue-700',
      deleted: 'bg-red-100 text-red-700',
      restored: 'bg-yellow-100 text-yellow-700',
      login: 'bg-purple-100 text-purple-700',
      logout: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[actionName] || 'bg-gray-100 text-gray-700'}`}>
        {actionName}
      </span>
    );
  };

  const clearFilters = () => {
    setAction('');
    setModelType('');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = action || modelType || dateFrom || dateTo;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Logs de Atividade</h1>
        <p className="text-gray-500">Monitore as ações realizadas no sistema</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Registros</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
              hasFilters
                ? 'border-primary-500 text-primary-600 bg-primary-50'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasFilters && (
              <span className="ml-1 h-5 w-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
                {[action, modelType, dateFrom, dateTo].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Ação</label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
                >
                  <option value="">Todas</option>
                  <option value="created">created</option>
                  <option value="updated">updated</option>
                  <option value="deleted">deleted</option>
                  <option value="restored">restored</option>
                  <option value="login">login</option>
                  <option value="logout">logout</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Modelo</label>
                <input
                  type="text"
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value)}
                  placeholder="Ex: User, Parish..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Data início</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Data fim</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
            </div>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-500 w-10"></th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Data</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Usuário</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Ação</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Modelo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                data.map((log) => (
                  <Fragment key={log.id}>
                    <tr
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3">
                        {(log.old_values || log.new_values) && (
                          expandedId === log.id
                            ? <ChevronUp className="h-4 w-4 text-gray-400" />
                            : <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        {log.user ? (
                          <div>
                            <div className="font-medium text-gray-900">{log.user.name}</div>
                            <div className="text-xs text-gray-500">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sistema</span>
                        )}
                      </td>
                      <td className="px-4 py-3">{actionBadge(log.action)}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatModelType(log.model_type)}
                        {log.model_id && <span className="text-gray-400 ml-1">#{log.model_id}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {log.ip_address || '—'}
                      </td>
                    </tr>
                    {expandedId === log.id && (log.old_values || log.new_values) && (
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            {log.old_values && Object.keys(log.old_values).length > 0 && (
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">Valores anteriores</p>
                                <pre className="bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto text-gray-600">
                                  {JSON.stringify(log.old_values, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.new_values && Object.keys(log.new_values).length > 0 && (
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">Valores novos</p>
                                <pre className="bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto text-gray-600">
                                  {JSON.stringify(log.new_values, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              {meta.total} registro{meta.total !== 1 && 's'}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-gray-600 px-2">
                {meta.current_page} / {meta.last_page}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= meta.last_page}
                className="p-1.5 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
