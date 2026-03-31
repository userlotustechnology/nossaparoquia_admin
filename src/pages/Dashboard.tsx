import { useAuth } from '@/contexts/AuthContext';
import { Users, Church, CreditCard, Activity } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();

  const cards = [
    { label: 'Usuários', icon: Users, description: 'Gerenciar usuários do sistema' },
    { label: 'Paróquias', icon: Church, description: 'Gerenciar paróquias cadastradas' },
    { label: 'Planos', icon: CreditCard, description: 'Gerenciar planos e assinaturas' },
    { label: 'Atividade', icon: Activity, description: 'Monitorar logs do sistema' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bem-vindo, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500">Painel Administrativo — Nossa Paróquia Online</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="h-12 w-12 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
              <card.icon className="h-6 w-6 text-primary-500" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">{card.label}</h3>
            <p className="text-xs text-gray-500 mt-1">{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
