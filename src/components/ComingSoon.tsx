import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description?: string;
}

export default function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
          <Construction className="h-8 w-8 text-primary-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Em breve</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          {description || 'Esta funcionalidade está sendo desenvolvida e estará disponível em breve.'}
        </p>
      </div>
    </div>
  );
}
