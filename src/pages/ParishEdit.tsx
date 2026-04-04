import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  ArrowLeft, Plus, Trash2, Clock, User, Megaphone, Image,
  Shield, CreditCard, Save, Upload, Check, X,
} from 'lucide-react';
import type { Plan } from '@/types';

// ─── Interfaces ──────────────────────────────────────────────────

interface ParishData {
  id: number;
  name: string;
  slug: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  pix_key: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  latitude: string | null;
  longitude: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  facebook_url: string | null;
  description: string | null;
  banner_url: string | null;
  is_active: boolean;
  requires_link_approval: boolean;
}

interface PlanInfo {
  name: string;
  slug: string;
  color: string;
  badge_label: string | null;
  price_monthly: string | null;
  price_yearly: string | null;
}

interface Subscription {
  plan_name: string;
  started_at: string;
  expires_at: string | null;
  status: string;
}

interface UsageItem {
  resource: string;
  label: string;
  current: number;
  max: number | null;
  percentage: number;
  exceeded: boolean;
  unlimited: boolean;
}

interface FeatureItem {
  key: string;
  label: string;
  enabled: boolean;
}

interface MassScheduleItem {
  id: number;
  day_of_week: number;
  day_name: string;
  time: string;
  description: string | null;
  is_active: boolean;
}

interface PriestItem {
  id: number;
  name: string;
  role: string;
  role_label: string;
  photo_url: string | null;
}

interface NoticeItem {
  id: number;
  title: string;
  content: string;
  expires_at: string | null;
  is_active: boolean;
}

interface GalleryItem {
  id: number;
  image_url: string;
  caption: string | null;
}

interface AdminItem {
  id: number;
  name: string;
  email: string;
  photo_url: string | null;
  is_primary: boolean;
}

// ─── Constants ──────────────────────────────────────────────────

const TABS = [
  { key: 'dados', label: 'Dados Gerais', icon: undefined },
  { key: 'missas', label: 'Horários de Missa', icon: Clock },
  { key: 'padres', label: 'Padres', icon: User },
  { key: 'avisos', label: 'Avisos', icon: Megaphone },
  { key: 'galeria', label: 'Galeria', icon: Image },
  { key: 'admins', label: 'Administradores', icon: Shield },
  { key: 'plano', label: 'Plano', icon: CreditCard },
] as const;
type Tab = typeof TABS[number]['key'];

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const DAYS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

const PRIEST_ROLES = [
  { value: 'paroco', label: 'Pároco' },
  { value: 'administrador_paroquial', label: 'Administrador Paroquial' },
  { value: 'vigario', label: 'Vigário' },
];

const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500';

// ─── Component ──────────────────────────────────────────────────

export default function ParishEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const parishId = id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('dados');

  // Dados Gerais
  const [parish, setParish] = useState<ParishData | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [form, setForm] = useState({
    name: '', slug: '', cnpj: '', email: '', phone: '', whatsapp: '',
    pix_key: '', address: '', city: '', state: '', latitude: '', longitude: '',
    instagram_url: '', youtube_url: '', facebook_url: '', description: '',
    is_active: true, requires_link_approval: false,
  });
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // Missas
  const [schedules, setSchedules] = useState<MassScheduleItem[]>([]);
  const [scheduleForm, setScheduleForm] = useState({ day_of_week: '0', time: '', description: '' });
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Padres
  const [priests, setPriests] = useState<PriestItem[]>([]);
  const [priestForm, setPriestForm] = useState({ name: '', role: 'paroco' });
  const [priestPhoto, setPriestPhoto] = useState<File | null>(null);
  const [savingPriest, setSavingPriest] = useState(false);

  // Avisos
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '', expires_at: '' });
  const [savingNotice, setSavingNotice] = useState(false);

  // Galeria
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<FileList | null>(null);
  const [savingGallery, setSavingGallery] = useState(false);

  // Administradores
  const [admins, setAdmins] = useState<{ sacerdotes: AdminItem[]; secretarias: AdminItem[] }>({ sacerdotes: [], secretarias: [] });
  const [adminForm, setAdminForm] = useState({ user_id: '', parish_role: 'sacerdote' });
  const [savingAdmin, setSavingAdmin] = useState(false);

  // Plano
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planForm, setPlanForm] = useState({ plan_id: '', started_at: '', expires_at: '', notes: '' });
  const [savingPlan, setSavingPlan] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch parish data ─────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/parishes/${parishId}`);
      const d = res.data.data;
      const p = d.parish ?? d;
      setParish(p);
      setPlanInfo(d.plan ?? null);
      setSubscription(d.subscription ?? null);
      setUsage(d.usage ?? []);
      setFeatures(d.features ?? []);

      setForm({
        name: p.name || '', slug: p.slug || '', cnpj: p.cnpj || '',
        email: p.email || '', phone: p.phone || '', whatsapp: p.whatsapp || '',
        pix_key: p.pix_key || '', address: p.address || '', city: p.city || '',
        state: p.state || '', latitude: p.latitude || '', longitude: p.longitude || '',
        instagram_url: p.instagram_url || '', youtube_url: p.youtube_url || '',
        facebook_url: p.facebook_url || '', description: p.description || '',
        is_active: p.is_active, requires_link_approval: p.requires_link_approval,
      });
      setBannerPreview(p.banner_url || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [parishId]);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await api.get(`/admin/parishes/${parishId}/mass-schedules`);
      setSchedules(res.data.data);
    } catch (err) { console.error(err); }
  }, [parishId]);

  const fetchPriests = useCallback(async () => {
    try {
      const res = await api.get(`/admin/parishes/${parishId}/priests`);
      setPriests(res.data.data);
    } catch (err) { console.error(err); }
  }, [parishId]);

  const fetchNotices = useCallback(async () => {
    try {
      const res = await api.get(`/admin/parishes/${parishId}/notices`);
      setNotices(res.data.data);
    } catch (err) { console.error(err); }
  }, [parishId]);

  const fetchGallery = useCallback(async () => {
    try {
      const res = await api.get(`/admin/parishes/${parishId}/gallery`);
      setGallery(res.data.data);
    } catch (err) { console.error(err); }
  }, [parishId]);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await api.get(`/admin/parishes/${parishId}/administrators`);
      setAdmins(res.data.data);
    } catch (err) { console.error(err); }
  }, [parishId]);

  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get('/admin/plans');
      setPlans(res.data.data);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Fetch tab data on tab switch (lazy loading)
  useEffect(() => {
    if (tab === 'missas') fetchSchedules();
    else if (tab === 'padres') fetchPriests();
    else if (tab === 'avisos') fetchNotices();
    else if (tab === 'galeria') fetchGallery();
    else if (tab === 'admins') fetchAdmins();
    else if (tab === 'plano') fetchPlans();
  }, [tab, fetchSchedules, fetchPriests, fetchNotices, fetchGallery, fetchAdmins, fetchPlans]);

  // ─── Handlers ──────────────────────────────────────────────────

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBannerFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('_method', 'PUT');
      Object.entries(form).forEach(([key, val]) => {
        fd.append(key, typeof val === 'boolean' ? (val ? '1' : '0') : val);
      });
      if (bannerFile) fd.append('banner', bannerFile);

      await api.post(`/admin/parishes/${parishId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBannerFile(null);
      fetchData();
      alert('Dados salvos com sucesso!');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      alert(errors ? Object.values(errors).flat().join('\n') : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSchedule = async () => {
    setSavingSchedule(true);
    try {
      await api.post(`/admin/parishes/${parishId}/mass-schedules`, {
        day_of_week: parseInt(scheduleForm.day_of_week),
        time: scheduleForm.time,
        description: scheduleForm.description || null,
      });
      setScheduleForm({ day_of_week: '0', time: '', description: '' });
      fetchSchedules();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      alert(errors ? Object.values(errors).flat().join('\n') : 'Erro ao adicionar horário.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleAddPriest = async () => {
    setSavingPriest(true);
    try {
      const fd = new FormData();
      fd.append('name', priestForm.name);
      fd.append('role', priestForm.role);
      if (priestPhoto) fd.append('photo', priestPhoto);

      await api.post(`/admin/parishes/${parishId}/priests`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPriestForm({ name: '', role: 'paroco' });
      setPriestPhoto(null);
      fetchPriests();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      alert(errors ? Object.values(errors).flat().join('\n') : 'Erro ao adicionar padre.');
    } finally {
      setSavingPriest(false);
    }
  };

  const handleAddNotice = async () => {
    setSavingNotice(true);
    try {
      await api.post(`/admin/parishes/${parishId}/notices`, {
        title: noticeForm.title,
        content: noticeForm.content,
        expires_at: noticeForm.expires_at || null,
      });
      setNoticeForm({ title: '', content: '', expires_at: '' });
      fetchNotices();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      alert(errors ? Object.values(errors).flat().join('\n') : 'Erro ao adicionar aviso.');
    } finally {
      setSavingNotice(false);
    }
  };

  const handleAddGallery = async () => {
    if (!galleryFiles?.length) return;
    setSavingGallery(true);
    try {
      const fd = new FormData();
      Array.from(galleryFiles).forEach((f) => fd.append('images[]', f));
      await api.post(`/admin/parishes/${parishId}/gallery`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setGalleryFiles(null);
      const fileInput = document.getElementById('gallery-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchGallery();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      alert(errors ? Object.values(errors).flat().join('\n') : 'Erro ao enviar fotos.');
    } finally {
      setSavingGallery(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!adminForm.user_id) return;
    setSavingAdmin(true);
    try {
      await api.post(`/admin/parishes/${parishId}/admins`, {
        user_id: parseInt(adminForm.user_id),
        parish_role: adminForm.parish_role,
      });
      setAdminForm({ user_id: '', parish_role: 'sacerdote' });
      fetchAdmins();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      alert(errors ? Object.values(errors).flat().join('\n') : 'Erro ao adicionar administrador.');
    } finally {
      setSavingAdmin(false);
    }
  };

  const handleRemoveAdmin = async (userId: number) => {
    if (!confirm('Tem certeza que deseja remover este administrador?')) return;
    try {
      await api.delete(`/admin/parishes/${parishId}/admins/${userId}`);
      fetchAdmins();
    } catch {
      alert('Erro ao remover administrador.');
    }
  };

  const handleChangePlan = async () => {
    if (!planForm.plan_id) return;
    setSavingPlan(true);
    try {
      await api.post(`/admin/parishes/${parishId}/subscriptions`, {
        plan_id: parseInt(planForm.plan_id),
        started_at: planForm.started_at || null,
        expires_at: planForm.expires_at || null,
        notes: planForm.notes || null,
      });
      setPlanForm({ plan_id: '', started_at: '', expires_at: '', notes: '' });
      fetchData();
      alert('Plano atualizado com sucesso!');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const errors = axiosErr?.response?.data?.errors;
      alert(errors ? Object.values(errors).flat().join('\n') : 'Erro ao alterar plano.');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const urlMap: Record<string, string> = {
        schedule: `/admin/parishes/${parishId}/mass-schedules/${deleteTarget.id}`,
        priest: `/admin/parishes/${parishId}/priests/${deleteTarget.id}`,
        notice: `/admin/parishes/${parishId}/notices/${deleteTarget.id}`,
        gallery: `/admin/parishes/${parishId}/gallery/${deleteTarget.id}`,
      };
      await api.delete(urlMap[deleteTarget.type]);
      setDeleteTarget(null);
      if (deleteTarget.type === 'schedule') fetchSchedules();
      else if (deleteTarget.type === 'priest') fetchPriests();
      else if (deleteTarget.type === 'notice') fetchNotices();
      else if (deleteTarget.type === 'gallery') fetchGallery();
    } catch {
      alert('Erro ao remover.');
    } finally {
      setDeleting(false);
    }
  };

  const fmtDate = (d: string | null) =>
    d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : null;

  // ─── Loading state ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!parish) {
    return (
      <div className="text-center py-24">
        <p className="text-gray-500">Paróquia não encontrada.</p>
        <button onClick={() => navigate('/paroquias')} className="mt-4 text-primary-500 hover:text-primary-600 text-sm font-medium">
          Voltar para lista
        </button>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/paroquias')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Paróquias
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{parish.name}</h1>
        <p className="text-gray-500 text-sm">{parish.slug}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-4 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                tab === t.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.icon && <t.icon className="h-4 w-4" />}
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ─── Tab: Dados Gerais ─────────────────────────────────────── */}
      {tab === 'dados' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados da Paróquia</h2>

          {/* Banner */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner / Foto de Capa</label>
            {bannerPreview && (
              <div className="mb-2">
                <img src={bannerPreview} alt="Banner" className="w-full max-h-44 object-cover rounded-lg" />
              </div>
            )}
            <input type="file" accept="image/*" onChange={handleBannerChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100" />
            <p className="text-xs text-gray-400 mt-1">Dimensão recomendada: 16:9 (ex: 1280x720). Máximo 5 MB.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Paróquia *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Paróquia São João Batista" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug (identificador na URL)</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="paroquia-sao-joao-batista" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Breve descrição da paróquia"
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="paroquia@exemplo.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 0000-0000" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
              <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="11999999999" className={inputClass} />
              <p className="text-xs text-gray-400 mt-0.5">Somente números, com DDD, sem +55</p>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Chave PIX</label>
              <input value={form.pix_key} onChange={(e) => setForm({ ...form, pix_key: e.target.value })} placeholder="E-mail, CPF/CNPJ ou chave aleatória" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
              <input value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} placeholder="https://instagram.com/paroquia" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
              <input value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} placeholder="https://facebook.com/paroquia" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
              <input value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://youtube.com/c/paroquia" className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, número, bairro" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ex: João Pessoa" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
              <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass}>
                <option value="">Selecione...</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="-7.1645349" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="-34.8585186" className={inputClass} />
            </div>

            {/* Toggles */}
            <div className="sm:col-span-2 space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
                <div>
                  <label className="text-sm text-gray-700">Paróquia Ativa</label>
                  <p className="text-xs text-gray-400">Paróquias inativas não aparecem no app nem no portal.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.requires_link_approval} onChange={(e) => setForm({ ...form, requires_link_approval: e.target.checked })}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded" />
                <div>
                  <label className="text-sm text-gray-700">Exigir aprovação para vínculos</label>
                  <p className="text-xs text-gray-400">Quando ativado, os pedidos de vínculo precisam ser aprovados manualmente.</p>
                </div>
              </div>
            </div>

            <div className="sm:col-span-2 pt-4 border-t border-gray-200">
              <button onClick={handleSave} disabled={saving || !form.name}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 rounded-lg">
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar dados'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Tab: Horários de Missa ────────────────────────────────── */}
      {tab === 'missas' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Horários de Missa</h2>
            {schedules.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum horário cadastrado.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {schedules.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{s.day_name}</span>
                      <span className="text-sm text-gray-500 ml-2">às {s.time}</span>
                      {s.description && <span className="text-xs text-gray-400 ml-2">— {s.description}</span>}
                    </div>
                    <button onClick={() => setDeleteTarget({ type: 'schedule', id: s.id, label: `${s.day_name} às ${s.time}` })}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Adicionar Horário</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dia da Semana</label>
                <select value={scheduleForm.day_of_week} onChange={(e) => setScheduleForm({ ...scheduleForm, day_of_week: e.target.value })} className={inputClass}>
                  {DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
                <input type="time" value={scheduleForm.time} onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
                <input value={scheduleForm.description} onChange={(e) => setScheduleForm({ ...scheduleForm, description: e.target.value })}
                  placeholder="Ex: Missa solene" className={inputClass} />
              </div>
            </div>
            <button onClick={handleAddSchedule} disabled={savingSchedule || !scheduleForm.time}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 rounded-lg">
              <Plus className="h-4 w-4" /> {savingSchedule ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Tab: Padres ───────────────────────────────────────────── */}
      {tab === 'padres' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Padres e Clero</h2>
            {priests.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum padre cadastrado.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {priests.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    {p.photo_url ? (
                      <img src={p.photo_url} alt={p.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-500">
                          {p.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.role_label}</p>
                    </div>
                    <button onClick={() => setDeleteTarget({ type: 'priest', id: p.id, label: p.name })}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Adicionar Padre</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input value={priestForm.name} onChange={(e) => setPriestForm({ ...priestForm, name: e.target.value })}
                  placeholder="Pe. João Silva" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Função *</label>
                <select value={priestForm.role} onChange={(e) => setPriestForm({ ...priestForm, role: e.target.value })} className={inputClass}>
                  {PRIEST_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto (opcional)</label>
                <input type="file" accept="image/*" onChange={(e) => setPriestPhoto(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
              </div>
            </div>
            <button onClick={handleAddPriest} disabled={savingPriest || !priestForm.name}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 rounded-lg">
              <Plus className="h-4 w-4" /> {savingPriest ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Tab: Avisos ───────────────────────────────────────────── */}
      {tab === 'avisos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mural de Avisos</h2>
            {notices.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum aviso cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {notices.map((n) => (
                  <div key={n.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">{n.title}</h4>
                          {n.expires_at && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              new Date(n.expires_at + 'T23:59:59') < new Date()
                                ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {new Date(n.expires_at + 'T23:59:59') < new Date() ? 'Expirado' : `Até ${fmtDate(n.expires_at)}`}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-3">{n.content}</p>
                      </div>
                      <button onClick={() => setDeleteTarget({ type: 'notice', id: n.id, label: n.title })}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded flex-shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Novo Aviso</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  placeholder="Ex: Festa do Padroeiro" className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
                <textarea value={noticeForm.content} onChange={(e) => setNoticeForm({ ...noticeForm, content: e.target.value })}
                  rows={3} placeholder="Texto do aviso..." className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expira em (opcional)</label>
                <input type="date" value={noticeForm.expires_at} onChange={(e) => setNoticeForm({ ...noticeForm, expires_at: e.target.value })}
                  className={inputClass} />
              </div>
            </div>
            <button onClick={handleAddNotice} disabled={savingNotice || !noticeForm.title || !noticeForm.content}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 rounded-lg">
              <Plus className="h-4 w-4" /> {savingNotice ? 'Publicando...' : 'Publicar Aviso'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Tab: Galeria ──────────────────────────────────────────── */}
      {tab === 'galeria' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Galeria de Fotos</h2>
            {gallery.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma foto na galeria.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {gallery.map((g) => (
                  <div key={g.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                    <img src={g.image_url} alt={g.caption || 'Foto'} className="w-full h-32 object-cover" />
                    <button onClick={() => setDeleteTarget({ type: 'gallery', id: g.id, label: 'esta foto' })}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Enviar Fotos</h3>
            <input id="gallery-input" type="file" accept="image/*" multiple onChange={(e) => setGalleryFiles(e.target.files)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100" />
            <p className="text-xs text-gray-400 mt-1">Formatos: JPG, PNG, WebP. Máximo 5 MB cada.</p>
            <button onClick={handleAddGallery} disabled={savingGallery || !galleryFiles?.length}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 rounded-lg">
              <Upload className="h-4 w-4" /> {savingGallery ? 'Enviando...' : 'Enviar Fotos'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Tab: Administradores ──────────────────────────────────── */}
      {tab === 'admins' && (
        <div className="space-y-6">
          {/* Sacerdotes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sacerdotes</h2>
            {admins.sacerdotes.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum sacerdote vinculado.</p>
            ) : (
              <div className="space-y-3">
                {admins.sacerdotes.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    {a.photo_url ? (
                      <img src={a.photo_url} alt={a.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                      <p className="text-xs text-gray-500">{a.email}</p>
                    </div>
                    {a.is_primary && (
                      <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">Principal</span>
                    )}
                    <button onClick={() => handleRemoveAdmin(a.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Secretárias */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Secretárias</h2>
            {admins.secretarias.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma secretária vinculada.</p>
            ) : (
              <div className="space-y-3">
                {admins.secretarias.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    {a.photo_url ? (
                      <img src={a.photo_url} alt={a.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                      <p className="text-xs text-gray-500">{a.email}</p>
                    </div>
                    {a.is_primary && (
                      <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">Principal</span>
                    )}
                    <button onClick={() => handleRemoveAdmin(a.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded flex-shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add admin form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Adicionar Administrador</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID do Usuário *</label>
                <input value={adminForm.user_id} onChange={(e) => setAdminForm({ ...adminForm, user_id: e.target.value })}
                  placeholder="ID do usuário" type="number" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil *</label>
                <select value={adminForm.parish_role} onChange={(e) => setAdminForm({ ...adminForm, parish_role: e.target.value })} className={inputClass}>
                  <option value="sacerdote">Sacerdote</option>
                  <option value="secretaria">Secretária</option>
                </select>
              </div>
            </div>
            <button onClick={handleAddAdmin} disabled={savingAdmin || !adminForm.user_id}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 rounded-lg">
              <Plus className="h-4 w-4" /> {savingAdmin ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Tab: Plano ────────────────────────────────────────────── */}
      {tab === 'plano' && (
        <div className="space-y-6">
          {/* Current plan info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Plano da Paróquia</h2>
              {planInfo && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: planInfo.color || '#6b7280' }}>
                  {planInfo.name}
                </span>
              )}
            </div>

            {subscription && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-4">
                <span>Assinatura desde <strong>{fmtDate(subscription.started_at)}</strong></span>
                {subscription.expires_at ? (
                  <span>— vence em <strong>{fmtDate(subscription.expires_at)}</strong></span>
                ) : (
                  <span className="text-green-600">— Sem vencimento</span>
                )}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                  subscription.status === 'expired' ? 'bg-gray-100 text-gray-500' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {subscription.status === 'active' ? 'Ativa' :
                   subscription.status === 'expired' ? 'Expirada' : 'Cancelada'}
                </span>
              </div>
            )}

            {planInfo && (
              <div className="flex gap-4 text-sm text-gray-600">
                {planInfo.price_monthly && (
                  <span>Mensal: <strong>R$ {parseFloat(planInfo.price_monthly).toFixed(2).replace('.', ',')}</strong></span>
                )}
                {planInfo.price_yearly && (
                  <span>Anual: <strong>R$ {parseFloat(planInfo.price_yearly).toFixed(2).replace('.', ',')}</strong></span>
                )}
                {!planInfo.price_monthly && !planInfo.price_yearly && (
                  <span className="text-green-600 font-medium">Gratuito</span>
                )}
              </div>
            )}

            {!planInfo && !subscription && (
              <p className="text-sm text-gray-500">Nenhum plano atribuído a esta paróquia.</p>
            )}
          </div>

          {/* Usage */}
          {usage.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">Uso Atual</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {usage.map((u) => (
                  <div key={u.resource}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{u.label}</span>
                      <span className={u.exceeded ? 'text-red-600' : 'text-gray-500'}>
                        {u.unlimited ? `${u.current} (Ilimitado)` : `${u.current} / ${u.max} (${u.percentage}%)`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${
                        u.unlimited ? 'bg-green-500' :
                        u.exceeded ? 'bg-red-500' :
                        u.percentage >= 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} style={{ width: `${u.unlimited ? 30 : Math.min(100, u.percentage)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-md font-semibold text-gray-900 mb-4">Recursos Incluídos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {features.map((f) => (
                  <div key={f.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                    f.enabled ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-400'
                  }`}>
                    {f.enabled ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Change plan form */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">Alterar Plano</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Plano *</label>
                <select value={planForm.plan_id} onChange={(e) => setPlanForm({ ...planForm, plan_id: e.target.value })} className={inputClass}>
                  <option value="">Selecione um plano...</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} — R$ {parseFloat(p.price_monthly || '0').toFixed(2).replace('.', ',')}/mês</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                <input type="date" value={planForm.started_at} onChange={(e) => setPlanForm({ ...planForm, started_at: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento (opcional)</label>
                <input type="date" value={planForm.expires_at} onChange={(e) => setPlanForm({ ...planForm, expires_at: e.target.value })} className={inputClass} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações (opcional)</label>
                <textarea value={planForm.notes} onChange={(e) => setPlanForm({ ...planForm, notes: e.target.value })}
                  rows={2} placeholder="Anotações sobre a mudança de plano..." className={inputClass} />
              </div>
            </div>
            <button onClick={handleChangePlan} disabled={savingPlan || !planForm.plan_id}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 rounded-lg">
              <Save className="h-4 w-4" /> {savingPlan ? 'Salvando...' : 'Atualizar Plano'}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Confirmar exclusão"
        message={`Tem certeza que deseja remover ${deleteTarget?.label}?`}
        confirmLabel="Remover"
        loading={deleting}
      />
    </div>
  );
}
