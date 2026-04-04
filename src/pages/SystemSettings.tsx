import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Save, Loader2 } from 'lucide-react';

interface Setting {
  key: string;
  value: string;
  type: string;
  label: string;
  description?: string;
}

type SettingsData = Record<string, Setting[]>;

export default function SystemSettings() {
  const [groups, setGroups] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [savingGroup, setSavingGroup] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get('/admin/settings')
      .then((res) => {
        const data: SettingsData = res.data.data;
        setGroups(data);
        const initial: Record<string, string> = {};
        Object.values(data).flat().forEach((s) => {
          initial[s.key] = s.value ?? '';
        });
        setEditedValues(initial);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveGroup = (groupName: string) => {
    const groupSettings = groups[groupName];
    if (!groupSettings) return;

    const payload = {
      settings: groupSettings.map((s) => ({
        key: s.key,
        value: editedValues[s.key] ?? s.value,
      })),
    };

    setSavingGroup(groupName);
    api.put('/admin/settings', payload)
      .then(() => {
        alert('Configurações salvas com sucesso!');
      })
      .catch((err) => {
        console.error(err);
        alert('Erro ao salvar configurações.');
      })
      .finally(() => setSavingGroup(null));
  };

  const groupLabels: Record<string, string> = {
    geral: 'Geral',
    login_social: 'Login Social',
    email: 'E-mail',
    notifications: 'Notificações',
  };

  const renderField = (setting: Setting) => {
    const value = editedValues[setting.key] ?? setting.value ?? '';

    if (setting.type === 'boolean') {
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={setting.key}
            checked={value === '1' || value === 'true'}
            onChange={(e) => handleChange(setting.key, e.target.checked ? '1' : '0')}
            className="h-4 w-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor={setting.key} className="text-sm text-gray-700">
            {setting.label}
          </label>
        </div>
      );
    }

    if (setting.type === 'number') {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{setting.label}</label>
          {setting.description && (
            <p className="text-xs text-gray-500 mb-1">{setting.description}</p>
          )}
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          />
        </div>
      );
    }

    if (setting.type === 'text' && value.length > 100) {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{setting.label}</label>
          {setting.description && (
            <p className="text-xs text-gray-500 mb-1">{setting.description}</p>
          )}
          <textarea
            value={value}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          />
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{setting.label}</label>
        {setting.description && (
          <p className="text-xs text-gray-500 mb-1">{setting.description}</p>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(setting.key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
        />
      </div>
    );
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
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500">Gerencie as configurações globais do sistema</p>
      </div>

      <div className="space-y-6">
        {Object.entries(groups).map(([groupName, settings]) => (
          <div key={groupName} className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {groupLabels[groupName] || groupName}
            </h2>
            <div className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.key}>{renderField(setting)}</div>
              ))}
            </div>
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleSaveGroup(groupName)}
                disabled={savingGroup === groupName}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 rounded-lg"
              >
                {savingGroup === groupName ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Salvar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
