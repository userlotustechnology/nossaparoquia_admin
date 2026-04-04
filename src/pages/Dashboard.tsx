import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import {
  Users,
  Church,
  CreditCard,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  MapPin,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

const PIE_COLORS = ['#2563eb', '#0891b2', '#7c3aed', '#d97706', '#16a34a', '#dc2626'];

type DashboardStats = {
  new_users: number;
  new_users_variation: number | null;
  active_users: number;
  total_parishioners: number;
  monthly_revenue: number;
  revenue_variation: number | null;
};

type PastoralRow = {
  id: string;
  name: string;
  members_count: number;
  percent: number;
  logo_url: string | null;
};

type AgeGroupRow = {
  label: string;
  icon: string;
  color: string;
  count: number;
  percent: number;
};

type ActiveUserRow = {
  id: string;
  name: string;
  photo_url: string | null;
  created_at: string | null;
};

type UpcomingEventRow = {
  id: string;
  title: string;
  starts_at: string | null;
  location: string | null;
  status: string;
  status_label: string;
};

type DashboardPayload = {
  stats: DashboardStats;
  pastorals_for_chart: { name: string; count: number }[];
  pastorals_with_percent: PastoralRow[];
  age_groups: AgeGroupRow[];
  active_users: ActiveUserRow[];
  upcoming_events: UpcomingEventRow[];
  charts: {
    new_users_by_day: number[];
    revenue_by_day: number[];
    weekly_activity_by_day: number[];
    financial_in_by_day: number[];
    financial_out_by_day: number[];
    weekday_labels: string[];
    last_7_day_labels: string[];
  };
};

function formatBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function formatPercent(variation: number | null | undefined) {
  if (variation === null || variation === undefined) return null;
  return `${variation >= 0 ? '+' : ''}${variation}%`;
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const pts = data.map((v, i) => ({ i, v }));
  if (!pts.length) return <div className="h-9 w-20" />;
  return (
    <div className="h-9 w-24 shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pts} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function VariationBadge({ value }: { value: number | null | undefined }) {
  const text = formatPercent(value);
  if (text === null) return null;
  const up = (value ?? 0) >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-xs ${
        up
          ? 'border-green-200 bg-green-50 text-green-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {text}
    </span>
  );
}

function ageColorClass(color: string) {
  const m: Record<string, string> = {
    primary: 'text-primary-600',
    info: 'text-sky-600',
    warning: 'text-amber-600',
    success: 'text-emerald-600',
  };
  return m[color] ?? 'text-gray-600';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: DashboardPayload }>('/admin/dashboard');
      setData(res.data.data);
    } catch {
      setError('Não foi possível carregar o painel. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const quickCards = [
    { label: 'Usuários', icon: Users, description: 'Gerenciar usuários do sistema', href: '/usuarios' },
    { label: 'Paróquias', icon: Church, description: 'Gerenciar paróquias cadastradas', href: '/paroquias' },
    { label: 'Planos', icon: CreditCard, description: 'Gerenciar planos e assinaturas', href: '/planos' },
    { label: 'Atividade', icon: Activity, description: 'Monitorar logs do sistema', href: '/logs' },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 rounded bg-gray-200" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p>{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-3 text-sm font-medium text-primary-700 underline"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  const { stats, charts } = data;
  const financialChartRows = charts.last_7_day_labels.map((label, i) => ({
    label,
    entradas: charts.financial_in_by_day[i] ?? 0,
    saídas: charts.financial_out_by_day[i] ?? 0,
  }));
  const weeklyRow = charts.weekday_labels.map((label, i) => ({
    label,
    eventos: charts.weekly_activity_by_day[i] ?? 0,
  }));
  const ageBarData = data.age_groups.map((g) => ({ name: g.label, usuários: g.count }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500">
          Painel administrativo — visão geral da plataforma (todas as paróquias)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Novos usuários</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.new_users}</p>
            </div>
            <Sparkline data={charts.new_users_by_day} color="#16a34a" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <VariationBadge value={stats.new_users_variation} />
            <span className="text-xs text-gray-500">Esta semana</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Usuários ativos</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.active_users}</p>
            </div>
            <Sparkline data={charts.new_users_by_day} color="#2563eb" />
          </div>
          <p className="mt-3 text-xs text-gray-500">Fiéis vinculados</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Paroquianos</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">{stats.total_parishioners}</p>
            </div>
            <Sparkline data={charts.new_users_by_day} color="#d97706" />
          </div>
          <p className="mt-3 text-xs text-gray-500">Cadastrados</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-gray-500">Receita mensal</p>
              <p className="mt-1 text-2xl font-semibold text-gray-900">
                {formatBRL(stats.monthly_revenue)}
              </p>
            </div>
            <Sparkline data={charts.revenue_by_day} color="#16a34a" />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <VariationBadge value={stats.revenue_variation} />
            <span className="text-xs text-gray-500">vs mês anterior</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Pastorais (membros)</h2>
          <div className="mx-auto mt-4 h-[200px] w-full max-w-[280px]">
            {data.pastorals_for_chart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.pastorals_for_chart as { name: string; count: number }[]}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={72}
                    dataKey="count"
                    nameKey="name"
                    label={({ name, percent }) =>
                      `${String(name).slice(0, 12)}${String(name).length > 12 ? '…' : ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                  >
                    {data.pastorals_for_chart.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Membros']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="flex h-full items-center justify-center text-sm text-gray-500">
                Nenhuma pastoral com membros cadastrados.
              </p>
            )}
          </div>
          <ul className="mt-4 divide-y divide-dashed divide-gray-200">
            {data.pastorals_with_percent.length === 0 ? (
              <li className="py-3 text-sm text-gray-500">Sem dados de pastorais.</li>
            ) : (
              data.pastorals_with_percent.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
                      {row.logo_url ? (
                        <img src={row.logo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-primary-500">✝</div>
                      )}
                    </div>
                    <span className="truncate font-medium text-gray-800">{row.name}</span>
                  </div>
                  <span className="shrink-0 text-gray-600">{row.members_count}</span>
                  <span className="shrink-0 text-gray-500">{row.percent}%</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Faixa etária (usuários fiéis)</h2>
          <div className="mt-4 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageBarData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 11 }} width={32} />
                <Tooltip formatter={(v: number) => [v, 'Usuários']} />
                <Bar dataKey="usuários" fill="#1b4d3e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-gray-500">
                  <th className="pb-2 pr-2 font-medium">Faixa</th>
                  <th className="pb-2 pr-2 font-medium">Usuários</th>
                  <th className="pb-2 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {data.age_groups.map((g) => (
                  <tr key={g.label} className="border-b border-gray-50">
                    <td className={`py-2 pr-2 font-medium ${ageColorClass(g.color)}`}>{g.label}</td>
                    <td className="py-2 pr-2 text-gray-700">{g.count}</td>
                    <td className="py-2 text-gray-600">{g.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border-0 bg-gradient-to-b from-[#5c4edb] to-[#796df6] p-5 text-white shadow-sm">
            <h2 className="text-lg font-semibold">Atividades da semana</h2>
            <p className="text-xs text-white/80">Eventos publicados por dia (semana atual)</p>
            <div className="mt-2 h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyRow} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="wk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 11 }} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 11 }} width={28} />
                  <Tooltip
                    contentStyle={{ background: '#fff', borderRadius: 8 }}
                    labelStyle={{ color: '#333' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="eventos"
                    stroke="#ffffff"
                    fill="url(#wk)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Relatório financeiro</h2>
            <p className="text-xs text-gray-500">Entradas e saídas (últimos 7 dias, todas as paróquias)</p>
            <div className="mt-2 h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={financialChartRows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16a34a" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="outG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={40} />
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="entradas" stroke="#16a34a" fill="url(#inG)" strokeWidth={2} />
                  <Area type="monotone" dataKey="saídas" stroke="#dc2626" fill="url(#outG)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-5">
          <h2 className="text-lg font-semibold text-gray-900">Usuários mais ativos</h2>
          <p className="text-xs text-gray-500">Por registros de atividade na última semana</p>
          <ul className="mt-4 divide-y divide-gray-100">
            {data.active_users.length === 0 ? (
              <li className="py-6 text-center text-sm text-gray-500">
                Nenhum usuário com atividade recente.
              </li>
            ) : (
              data.active_users.map((u) => (
                <li key={u.id} className="flex items-center gap-3 py-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-100">
                    {u.photo_url ? (
                      <img src={u.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <Users className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">{u.name}</p>
                    <p className="text-xs text-gray-500">
                      Desde{' '}
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('pt-BR', {
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : '—'}
                    </p>
                  </div>
                  <Link
                    to={`/usuarios?search=${encodeURIComponent(u.name)}`}
                    className="shrink-0 text-sm font-medium text-primary-600 hover:text-primary-800"
                  >
                    Ver na lista
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-7">
          <div className="border-b border-gray-100 p-5">
            <h2 className="text-lg font-semibold text-gray-900">Próximos eventos</h2>
            <p className="text-xs text-gray-500">Publicados em qualquer paróquia</p>
          </div>
          <div className="overflow-x-auto p-5 pt-0">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 pr-2 font-medium">Evento</th>
                  <th className="pb-2 pr-2 font-medium">Data</th>
                  <th className="pb-2 pr-2 font-medium">Local</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.upcoming_events.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      Nenhum evento próximo.
                    </td>
                  </tr>
                ) : (
                  data.upcoming_events.map((ev) => (
                    <tr key={ev.id} className="border-b border-gray-50">
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 shrink-0 text-primary-600" />
                          <span className="font-medium text-gray-900">{ev.title}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-2 text-gray-700">
                        {ev.starts_at
                          ? new Date(ev.starts_at).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="max-w-[140px] truncate py-3 pr-2 text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {ev.location || '—'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          {ev.status_label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Acesso rápido</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickCards.map((card) => (
            <Link
              key={card.label}
              to={card.href}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
                <card.icon className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{card.label}</h3>
              <p className="mt-1 text-xs text-gray-500">{card.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
