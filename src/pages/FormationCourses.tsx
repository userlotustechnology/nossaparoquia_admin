import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmDialog from '@/components/ConfirmDialog';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'theology', label: 'Teologia' },
  { value: 'scripture', label: 'Escritura Sagrada' },
  { value: 'faith', label: 'Fé e Espiritualidade' },
  { value: 'liturgy', label: 'Liturgia' },
  { value: 'sacraments', label: 'Sacramentos' },
  { value: 'pastoral', label: 'Pastoral' },
  { value: 'education', label: 'Educação' },
  { value: 'other', label: 'Outro' },
];

const LEVELS = [
  { value: 'beginner', label: 'Iniciante' },
  { value: 'intermediate', label: 'Intermediário' },
  { value: 'advanced', label: 'Avançado' },
];

interface CourseRow {
  id: number;
  title: string;
  slug: string;
  is_active: boolean;
  enrollments_count: number;
  price: number;
  thumbnail_url?: string | null;
}

interface EnrollRow {
  id: string;
  user: { id: string; name: string; email: string } | null;
  payment_status: string;
  payment_status_label: string;
  certificate: { certificate_code: string } | null;
}

interface LessonRow {
  id: number;
  module_id: number;
  title: string;
  type: string;
  content: unknown;
  video_url: string | null;
  pdf_path: string | null;
  duration_minutes: number | null;
  sort_order: number;
}

interface ModuleRow {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: LessonRow[];
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

export default function FormationCourses() {
  const [data, setData] = useState<CourseRow[]>([]);
  const [meta, setMeta] = useState<Meta | undefined>();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [selected, setSelected] = useState<CourseRow | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollRow[]>([]);
  const [enrollMeta, setEnrollMeta] = useState<Meta | undefined>();
  const [enrollPage, setEnrollPage] = useState(1);
  const [curriculumOpen, setCurriculumOpen] = useState(false);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [lessonModal, setLessonModal] = useState<{ module: ModuleRow; lesson: LessonRow | null } | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'text' as 'video' | 'text' | 'pdf' | 'quiz',
    video_url: '',
    duration_minutes: '' as string | number,
    sort_order: '' as string | number,
    contentJson: '',
  });
  const [saving, setSaving] = useState(false);
  const [thumbUploading, setThumbUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    instructor_name: '',
    price: 0,
    duration_hours: 0,
    category: 'other',
    level: 'beginner',
    is_active: true,
    is_featured: false,
    has_classes: false,
    requires_approval: false,
    max_students: '' as string | number,
    thumbnail_path: '' as string | null,
    thumbnail_preview_url: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/courses', {
        params: { page, search: search || undefined, per_page: 15 },
      });
      setData(res.data.data);
      setMeta(res.data.meta);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const openCreate = () => {
    setSelected(null);
    setForm({
      title: '',
      slug: '',
      description: '',
      instructor_name: '',
      price: 0,
      duration_hours: 0,
      category: 'other',
      level: 'beginner',
      is_active: true,
      is_featured: false,
      has_classes: false,
      requires_approval: false,
      max_students: '',
      thumbnail_path: null,
      thumbnail_preview_url: '',
    });
    setFormOpen(true);
  };

  const openEdit = async (item: CourseRow) => {
    setSelected(item);
    try {
      const res = await api.get(`/admin/courses/${item.id}`);
      const c = res.data.data;
      setForm({
        title: c.title,
        slug: c.slug,
        description: c.description || '',
        instructor_name: c.instructor_name || '',
        price: c.price,
        duration_hours: c.duration_hours,
        category: c.category || 'other',
        level: c.level || 'beginner',
        is_active: c.is_active,
        is_featured: c.is_featured,
        has_classes: c.has_classes,
        requires_approval: c.requires_approval,
        max_students: c.max_students ?? '',
        thumbnail_path: c.thumbnail_path ?? null,
        thumbnail_preview_url: c.thumbnail_url ?? '',
      });
      setFormOpen(true);
    } catch {
      alert('Erro ao carregar curso.');
    }
  };

  const openEnrollments = async (item: CourseRow) => {
    setSelected(item);
    setEnrollPage(1);
    setEnrollOpen(true);
  };

  const fetchCurriculum = async (courseId: number) => {
    setCurriculumLoading(true);
    try {
      const res = await api.get(`/admin/courses/${courseId}/modules`);
      setModules(res.data.data);
    } catch {
      setModules([]);
    } finally {
      setCurriculumLoading(false);
    }
  };

  const openCurriculum = (item: CourseRow) => {
    setSelected(item);
    setCurriculumOpen(true);
    setNewModuleTitle('');
    fetchCurriculum(item.id);
  };

  const addModule = async () => {
    if (!selected || !newModuleTitle.trim()) return;
    setSaving(true);
    try {
      await api.post(`/admin/courses/${selected.id}/modules`, { title: newModuleTitle.trim() });
      setNewModuleTitle('');
      await fetchCurriculum(selected.id);
    } catch {
      alert('Erro ao criar módulo.');
    } finally {
      setSaving(false);
    }
  };

  const deleteModule = async (m: ModuleRow) => {
    if (!selected || !confirm('Remover módulo e aulas?')) return;
    try {
      await api.delete(`/admin/courses/${selected.id}/modules/${m.id}`);
      await fetchCurriculum(selected.id);
    } catch {
      alert('Erro.');
    }
  };

  const openLesson = (module: ModuleRow, lesson: LessonRow | null) => {
    setLessonModal({ module, lesson });
    if (lesson) {
      setLessonForm({
        title: lesson.title,
        type: lesson.type as 'video' | 'text' | 'pdf' | 'quiz',
        video_url: lesson.video_url || '',
        duration_minutes: lesson.duration_minutes ?? '',
        sort_order: lesson.sort_order ?? '',
        contentJson:
          lesson.content && typeof lesson.content === 'object'
            ? JSON.stringify(lesson.content, null, 2)
            : String(lesson.content || ''),
      });
    } else {
      setLessonForm({
        title: '',
        type: 'text',
        video_url: '',
        duration_minutes: '',
        sort_order: '',
        contentJson: '',
      });
    }
  };

  const saveLesson = async () => {
    if (!selected || !lessonModal) return;
    const { module, lesson } = lessonModal;
    let content: unknown = null;
    if (lessonForm.contentJson.trim()) {
      try {
        content = JSON.parse(lessonForm.contentJson);
      } catch {
        content = lessonForm.contentJson;
      }
    }
    const payload = {
      title: lessonForm.title,
      type: lessonForm.type,
      video_url: lessonForm.video_url || null,
      duration_minutes: lessonForm.duration_minutes === '' ? null : Number(lessonForm.duration_minutes),
      sort_order: lessonForm.sort_order === '' ? undefined : Number(lessonForm.sort_order),
      content,
    };
    setSaving(true);
    try {
      if (lesson) {
        await api.put(`/admin/courses/${selected.id}/modules/${module.id}/lessons/${lesson.id}`, payload);
      } else {
        await api.post(`/admin/courses/${selected.id}/modules/${module.id}/lessons`, payload);
      }
      setLessonModal(null);
      await fetchCurriculum(selected.id);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      alert(ax.response?.data?.message || 'Erro ao salvar aula.');
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (module: ModuleRow, lesson: LessonRow) => {
    if (!selected || !confirm('Excluir aula?')) return;
    try {
      await api.delete(`/admin/courses/${selected.id}/modules/${module.id}/lessons/${lesson.id}`);
      await fetchCurriculum(selected.id);
    } catch {
      alert('Erro.');
    }
  };

  const fetchEnrollments = useCallback(async () => {
    if (!selected) return;
    try {
      const res = await api.get(`/admin/courses/${selected.id}/enrollments`, {
        params: { page: enrollPage, per_page: 15 },
      });
      setEnrollments(res.data.data);
      setEnrollMeta(res.data.meta);
    } catch {
      console.error('enrollments');
    }
  }, [selected, enrollPage]);

  useEffect(() => {
    if (enrollOpen && selected) fetchEnrollments();
  }, [enrollOpen, selected, enrollPage, fetchEnrollments]);

  const uploadThumbnail = async (file: File) => {
    setThumbUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/files/upload', fd);
      const d = res.data?.data as { path?: string; url?: string };
      if (d?.path) {
        setForm((f) => ({
          ...f,
          thumbnail_path: d.path ?? null,
          thumbnail_preview_url: d.url ?? f.thumbnail_preview_url,
        }));
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = ax.response?.data?.errors;
      const msg = errs
        ? Object.values(errs).flat().join('\n')
        : ax.response?.data?.message || 'Erro ao enviar imagem.';
      alert(msg);
    } finally {
      setThumbUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { thumbnail_preview_url: _preview, ...rest } = form;
      void _preview;
      const payload = {
        ...rest,
        slug: form.slug || undefined,
        max_students: form.max_students === '' ? null : Number(form.max_students),
        thumbnail_path: form.thumbnail_path || null,
      };
      if (selected) {
        await api.put(`/admin/courses/${selected.id}`, payload);
      } else {
        await api.post('/admin/courses', payload);
      }
      setFormOpen(false);
      fetchData();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      alert(ax.response?.data?.errors ? Object.values(ax.response.data.errors).flat().join('\n') : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.delete(`/admin/courses/${selected.id}`);
      setDeleteOpen(false);
      setFormOpen(false);
      setSelected(null);
      fetchData();
    } catch {
      alert('Erro ao excluir.');
    } finally {
      setSaving(false);
    }
  };

  const confirmPay = async (e: EnrollRow) => {
    try {
      await api.post(`/admin/course-enrollments/${e.id}/confirm-payment`);
      fetchEnrollments();
      fetchData();
    } catch {
      alert('Erro ao confirmar pagamento.');
    }
  };

  const issueCert = async (e: EnrollRow) => {
    try {
      await api.post(`/admin/course-enrollments/${e.id}/issue-certificate`);
      fetchEnrollments();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      alert(ax.response?.data?.message || 'Erro ao emitir certificado.');
    }
  };

  const columns = [
    {
      key: 'cover',
      label: '',
      render: (item: CourseRow) => (
        <div className="h-10 w-14 shrink-0 overflow-hidden rounded bg-gray-100">
          {item.thumbnail_url ? (
            <img src={item.thumbnail_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-gray-400">—</div>
          )}
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Curso',
      render: (item: CourseRow) => <span className="font-medium text-gray-900">{item.title}</span>,
    },
    { key: 'enrollments_count', label: 'Matrículas' },
    {
      key: 'price',
      label: 'Preço',
      render: (item: CourseRow) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price),
    },
    {
      key: 'ativa',
      label: 'Ativo',
      render: (item: CourseRow) => (item.is_active ? 'Sim' : 'Não'),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cursos de formação</h1>
        <p className="text-gray-500">CRUD, módulos, aulas e matrículas</p>
      </div>

      <DataTable
        title="Cursos"
        columns={columns}
        data={data}
        loading={loading}
        meta={meta}
        onPageChange={setPage}
        onSearch={setSearch}
        onCreate={openCreate}
        onEdit={openEdit}
        onDelete={(item) => {
          setSelected(item);
          setDeleteOpen(true);
        }}
        canDelete
        createLabel="Novo curso"
        keyExtractor={(item) => item.id}
        extraActions={(item) => (
          <span className="flex flex-col items-end gap-1 sm:flex-row sm:gap-2">
            <button type="button" className="text-xs text-primary-600 hover:underline" onClick={() => openCurriculum(item)}>
              Currículo
            </button>
            <button type="button" className="text-xs text-primary-600 hover:underline" onClick={() => openEnrollments(item)}>
              Matrículas
            </button>
          </span>
        )}
      />

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={selected ? 'Editar curso' : 'Novo curso'} size="lg">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-gray-700">Título *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Slug</label>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Instrutor</label>
            <input
              value={form.instructor_name}
              onChange={(e) => setForm((f) => ({ ...f, instructor_name: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-gray-700">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="mb-1 block text-sm text-gray-700">
              Capa do curso
              {form.is_active ? <span className="text-red-600"> *</span> : null}
            </label>
            <p className="text-xs text-gray-500">
              Obrigatória enquanto o curso estiver ativo. Formatos: JPG, PNG ou GIF (conforme configuração da API).
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex h-28 w-44 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-50">
                {form.thumbnail_preview_url ? (
                  <img src={form.thumbnail_preview_url} alt="" className="h-full w-full object-cover" />
                ) : thumbUploading ? (
                  <span className="text-xs text-gray-400">Enviando…</span>
                ) : (
                  <span className="text-xs text-gray-400">Sem imagem</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  disabled={thumbUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) void uploadThumbnail(f);
                  }}
                  className="max-w-[220px] text-sm file:mr-2 file:rounded file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-700"
                />
                {form.thumbnail_path ? (
                  <button
                    type="button"
                    disabled={thumbUploading}
                    onClick={() =>
                      setForm((f) => ({ ...f, thumbnail_path: null, thumbnail_preview_url: '' }))
                    }
                    className="self-start text-xs text-red-600 hover:underline disabled:opacity-50"
                  >
                    Remover capa
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Preço</label>
            <input
              type="number"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Carga horária</label>
            <input
              type="number"
              value={form.duration_hours}
              onChange={(e) => setForm((f) => ({ ...f, duration_hours: Number(e.target.value) }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Categoria</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Nível</label>
            <select
              value={form.level}
              onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              {LEVELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Máx. alunos</label>
            <input
              type="number"
              value={form.max_students}
              onChange={(e) => setForm((f) => ({ ...f, max_students: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              <span className="text-sm">Ativo</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
              />
              <span className="text-sm">Destaque</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.has_classes}
                onChange={(e) => setForm((f) => ({ ...f, has_classes: e.target.checked }))}
              />
              <span className="text-sm">Turmas</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.requires_approval}
                onChange={(e) => setForm((f) => ({ ...f, requires_approval: e.target.checked }))}
              />
              <span className="text-sm">Exige aprovação</span>
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <button type="button" onClick={() => setFormOpen(false)} className="rounded border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || thumbUploading || !form.title}
            onClick={handleSave}
            className="rounded bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </Modal>

      <Modal open={enrollOpen} onClose={() => setEnrollOpen(false)} title={`Matrículas: ${selected?.title}`} size="lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2">Aluno</th>
                <th className="py-2">Pagamento</th>
                <th className="py-2">Cert.</th>
                <th className="py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} className="border-b border-gray-100">
                  <td className="py-2">{e.user?.name ?? '—'}</td>
                  <td className="py-2">{e.payment_status_label}</td>
                  <td className="py-2">{e.certificate ? e.certificate.certificate_code.slice(0, 8) + '…' : '—'}</td>
                  <td className="py-2 text-right space-x-1">
                    {e.payment_status !== 'paid' && (
                      <button type="button" className="text-xs text-primary-600" onClick={() => confirmPay(e)}>
                        Confirmar pago
                      </button>
                    )}
                    {!e.certificate && (
                      <button type="button" className="text-xs text-primary-600" onClick={() => issueCert(e)}>
                        Certificado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {enrollMeta && enrollMeta.last_page > 1 && (
          <div className="mt-3 flex justify-center gap-2 text-sm">
            <button
              type="button"
              disabled={enrollPage <= 1}
              onClick={() => setEnrollPage((p) => p - 1)}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              Anterior
            </button>
            <span>
              {enrollPage} / {enrollMeta.last_page}
            </span>
            <button
              type="button"
              disabled={enrollPage >= enrollMeta.last_page}
              onClick={() => setEnrollPage((p) => p + 1)}
              className="rounded border px-2 py-1 disabled:opacity-40"
            >
              Próximo
            </button>
          </div>
        )}
      </Modal>

      <Modal open={curriculumOpen} onClose={() => setCurriculumOpen(false)} title={`Currículo: ${selected?.title}`} size="lg">
        {curriculumLoading ? (
          <p className="text-gray-500">Carregando…</p>
        ) : (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              <input
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="Novo módulo"
                className="flex-1 min-w-[180px] rounded border px-3 py-2 text-sm"
              />
              <button type="button" disabled={saving || !newModuleTitle.trim()} onClick={addModule} className="rounded bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50">
                Adicionar módulo
              </button>
            </div>
            {modules.map((m) => (
              <div key={m.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-gray-900">{m.title}</strong>
                  <div className="flex gap-2">
                    <button type="button" className="text-xs text-primary-600" onClick={() => openLesson(m, null)}>
                      + Aula
                    </button>
                    <button type="button" className="text-xs text-red-600" onClick={() => deleteModule(m)}>
                      Excluir módulo
                    </button>
                  </div>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {(m.lessons || []).map((l) => (
                    <li key={l.id} className="flex items-center justify-between rounded bg-gray-50 px-2 py-1">
                      <span>
                        {l.title} <span className="text-gray-400">({l.type})</span>
                      </span>
                      <span>
                        <button type="button" className="mr-2 text-xs text-primary-600" onClick={() => openLesson(m, l)}>
                          Editar
                        </button>
                        <button type="button" className="text-xs text-red-600" onClick={() => deleteLesson(m, l)}>
                          Excluir
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal open={!!lessonModal} onClose={() => setLessonModal(null)} title={lessonModal?.lesson ? 'Editar aula' : 'Nova aula'} size="md">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">Título *</label>
            <input value={lessonForm.title} onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Tipo</label>
            <select
              value={lessonForm.type}
              onChange={(e) => setLessonForm((f) => ({ ...f, type: e.target.value as typeof f.type }))}
              className="w-full rounded border px-3 py-2 text-sm"
            >
              <option value="text">Texto</option>
              <option value="video">Vídeo</option>
              <option value="pdf">PDF</option>
              <option value="quiz">Quiz</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm">URL do vídeo</label>
            <input
              value={lessonForm.video_url}
              onChange={(e) => setLessonForm((f) => ({ ...f, video_url: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-sm">Minutos</label>
              <input
                type="number"
                value={lessonForm.duration_minutes}
                onChange={(e) => setLessonForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm">Ordem</label>
              <input
                type="number"
                value={lessonForm.sort_order}
                onChange={(e) => setLessonForm((f) => ({ ...f, sort_order: e.target.value }))}
                className="w-full rounded border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm">Conteúdo (JSON ou texto)</label>
            <textarea
              value={lessonForm.contentJson}
              onChange={(e) => setLessonForm((f) => ({ ...f, contentJson: e.target.value }))}
              rows={5}
              className="w-full rounded border px-3 py-2 font-mono text-xs"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
          <button type="button" onClick={() => setLessonModal(null)} className="rounded border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || !lessonForm.title}
            onClick={saveLesson}
            className="rounded bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Salvar aula
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Excluir curso"
        message={`Excluir "${selected?.title}"?`}
        confirmLabel="Excluir"
        loading={saving}
      />
    </div>
  );
}
