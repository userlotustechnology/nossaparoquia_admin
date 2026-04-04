import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Users,
  Activity,
  UserCog,
  Church,
  CreditCard,
  FileText,
  Newspaper,
  Tag,
  HelpCircle,
  Image,
  Settings,
  Shield,
  Lock,
  Webhook,
  LogOut,
  Menu,
  X,
  ChevronDown,
  BookOpen,
  Heart,
  ScrollText,
  Flame,
  GraduationCap,
  Award,
  Zap,
  Layers,
  Gift,
  PieChart,
  Link2,
  Scroll,
  HandHelping,
  KeyRound,
  Clock3,
  MessageSquare,
  HeartPulse,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, section: null },
  // Usuários
  { name: 'Usuários', href: '/usuarios', icon: Users, section: 'Usuários' },
  { name: 'Logs de Atividade', href: '/logs', icon: Activity, section: 'Usuários' },
  { name: 'Auditoria de login', href: '/auditoria-login', icon: UserCog, section: 'Usuários' },
  { name: 'Vínculos pendentes', href: '/vinculos-paroquia', icon: Link2, section: 'Usuários' },
  // Paróquias
  { name: 'Paróquias', href: '/paroquias', icon: Church, section: 'Paróquias' },
  { name: 'Planos', href: '/planos', icon: CreditCard, section: 'Paróquias' },
  // Conteúdo espiritual
  { name: 'Cat. de orações', href: '/oracoes/categorias', icon: BookOpen, section: 'Espiritual' },
  { name: 'Orações', href: '/oracoes', icon: Heart, section: 'Espiritual' },
  { name: 'Meditações', href: '/meditacoes', icon: ScrollText, section: 'Espiritual' },
  { name: 'Novenas', href: '/novenas', icon: Flame, section: 'Espiritual' },
  { name: 'Relatório novenas', href: '/novenas/relatorio', icon: Scroll, section: 'Espiritual' },
  { name: 'Direção espiritual', href: '/direcao-espiritual', icon: HandHelping, section: 'Espiritual' },
  // Formação
  { name: 'Cursos', href: '/cursos', icon: GraduationCap, section: 'Formação' },
  { name: 'Certificados', href: '/certificados', icon: Award, section: 'Formação' },
  // Gamificação
  { name: 'Ações (pontos)', href: '/gamificacao/acoes', icon: Zap, section: 'Gamificação' },
  { name: 'Níveis', href: '/gamificacao/niveis', icon: Layers, section: 'Gamificação' },
  { name: 'Prêmios', href: '/gamificacao/premios', icon: Gift, section: 'Gamificação' },
  { name: 'Relatório', href: '/gamificacao/relatorio', icon: PieChart, section: 'Gamificação' },
  { name: 'Prêmios pendentes', href: '/gamificacao/premios-pendentes', icon: Clock3, section: 'Gamificação' },
  // CMS
  { name: 'Páginas', href: '/paginas', icon: FileText, section: 'CMS' },
  { name: 'Posts', href: '/posts', icon: Newspaper, section: 'CMS' },
  { name: 'Categorias', href: '/categorias', icon: Tag, section: 'CMS' },
  { name: 'FAQ', href: '/faq', icon: HelpCircle, section: 'CMS' },
  { name: 'Banners', href: '/banners', icon: Image, section: 'CMS' },
  // Sistema
  { name: 'Configurações', href: '/configuracoes', icon: Settings, section: 'Sistema' },
  { name: 'Permissões', href: '/permissoes', icon: Shield, section: 'Sistema' },
  { name: 'Catálogo de permissões', href: '/permissoes/catalogo', icon: KeyRound, section: 'Sistema' },
  { name: 'Restrições de IP', href: '/ip-restricoes', icon: Lock, section: 'Sistema' },
  { name: 'Webhooks', href: '/webhooks', icon: Webhook, section: 'Sistema' },
  { name: 'Slack (canais)', href: '/integracoes/slack', icon: MessageSquare, section: 'Sistema' },
  { name: 'Observabilidade API', href: '/observabilidade', icon: HeartPulse, section: 'Sistema' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isImpersonating, stopImpersonation } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleStopImpersonation = async () => {
    try {
      await stopImpersonation();
    } catch {
      alert('Não foi possível voltar ao administrador.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50">
            <SidebarContent
              nav={navigation}
              currentPath={location.pathname}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
        <div className="flex flex-col w-full bg-white border-r border-gray-200">
          <SidebarContent
            nav={navigation}
            currentPath={location.pathname}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {isImpersonating && (
          <div className="sticky top-0 z-40 bg-amber-100 border-b border-amber-200 px-4 py-2 text-sm text-amber-950 flex flex-wrap items-center justify-center gap-3">
            <span>
              Você está acessando como <strong>{user?.name}</strong> (não administrador).
            </span>
            <button
              type="button"
              onClick={handleStopImpersonation}
              className="rounded-md bg-amber-800 px-3 py-1 text-white text-xs font-medium hover:bg-amber-900"
            >
              Voltar ao painel administrativo
            </button>
          </div>
        )}

        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6">
            <button
              className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1" />

            {/* User menu */}
            <div className="relative">
              <button
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="h-8 w-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:block">{user?.name}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

interface SidebarContentProps {
  nav: typeof navigation;
  currentPath: string;
  onClose?: () => void;
}

function SidebarContent({ nav, currentPath, onClose }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 h-16 px-4 border-b border-gray-200">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/logo.png" alt="Logo" className="h-9 w-9 rounded-full shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate leading-tight">Nossa Paróquia Online</p>
            <p className="text-xs text-gray-500 leading-tight">Super Admin</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600 shrink-0">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {nav.map((item, idx) => {
          const prevSection = idx > 0 ? nav[idx - 1].section : null;
          const showSectionLabel = item.section && item.section !== prevSection;
          const isActive = currentPath === item.href;

          return (
            <div key={item.name}>
              {showSectionLabel && (
                <p className="text-xs uppercase text-gray-400 font-semibold px-3 py-2 mt-2 mb-1">
                  {item.section}
                </p>
              )}
              <Link
                to={item.href}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">Painel Administrativo</p>
      </div>
    </div>
  );
}
