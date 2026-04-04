import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Save, Loader2, Send } from 'lucide-react';

interface WebhookSetting {
  key: string;
  value: string;
  type: string;
  label: string;
  description?: string;
}

export default function Webhooks() {
  const [settings, setSettings] = useState<WebhookSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/admin/settings', { params: { group: 'slack' } })
      .then((res) => {
        const data: Record<string, WebhookSetting[]> = res.data.data;
        const slackSettings = data.slack || Object.values(data).flat();
        setSettings(slackSettings);
        const initial: Record<string, string> = {};
        slackSettings.forEach((s) => {
          initial[s.key] = s.value ?? '';
        });
        setValues(initial);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    const payload = {
      settings: settings.map((s) => ({
        key: s.key,
        value: values[s.key] ?? s.value,
      })),
    };
    api.put('/admin/settings', payload)
      .then(() => alert('Configurações de webhook salvas com sucesso!'))
      .catch((err) => {
        console.error(err);
        alert('Erro ao salvar configurações.');
      })
      .finally(() => setSaving(false));
  };

  const handleTest = () => {
    setTesting(true);
    api.post('/admin/webhooks/test')
      .then(() => alert('Mensagem de teste enviada com sucesso!'))
      .catch((err) => {
        console.error(err);
        alert('Erro ao enviar mensagem de teste.');
      })
      .finally(() => setTesting(false));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
        <p className="text-gray-500">Gerencie integrações de webhooks com Slack e outros serviços</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Configurações do Slack</h2>
          <button
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {testing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar Teste
          </button>
        </div>

        <div className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {setting.label}
              </label>
              {setting.description && (
                <p className="text-xs text-gray-500 mb-1">{setting.description}</p>
              )}
              <input
                type="text"
                value={values[setting.key] ?? ''}
                onChange={(e) => handleChange(setting.key, e.target.value)}
                placeholder={setting.label}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
              />
            </div>
          ))}
        </div>

        {settings.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-8">
            Nenhuma configuração de webhook encontrada.
          </p>
        )}

        {settings.length > 0 && (
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
              Salvar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
