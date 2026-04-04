import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '@/lib/api';
import Modal from '@/components/Modal';
import { FORMATION_CATEGORIES, FORMATION_LEVELS } from '@/constants/formationCourses';
import { ArrowLeft, BookOpen, GraduationCap, Library, Users } from 'lucide-react';

type ManageTab = 'overview' | 'enrollments' | 'curriculum' | 'library';

interface CourseDetail {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  instructor_name: string | null;
  price: number;
  duration_hours: number;
  category: string | null;
  category_label: string | null;
  level: string | null;
  level_label: string | null;
  is_active: boolean;
  is_featured: boolean;
  has_classes: boolean;
  requires_approval: boolean;
  max_students: number | null;
  thumbnail_path: string | null;
  thumbnail_url: string | null;
  enrollments_count: number | null;
}

interface Meta {
  current_page: number;
  last_page: number;
  total: number;
}

interface MaterialRow {
  id: number;
  lesson_id: number;
  title: string;
  file_path: string;
  file_type: string;
  file_size: number | null;
  file_url: string;
  sort_order: number;
}

interface LessonRow {
  id: number;
  module_id: number;
  title: string;
  type: string;
  content: unknown;
  video_url: string | null;
  pdf_path: string | null;
  pdf_url?: string | null;
  duration_minutes: number | null;
  sort_order: number;
  materials?: MaterialRow[];
}

interface ModuleRow {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: LessonRow[];
}

interface EnrollRow {
  id: string;
  course_id: number;
  user: { id: string; name: string; email: string } | null;
  class: { id: number; name: string } | null;
  payment_status: string;
  payment_status_label: string;
  payment_link: string | null;
  payment_amount: number | null;
  paid_at: string | null;
  enrolled_at: string | null;
  completed_at: string | null;
  certificate: { certificate_code: string } | null;
}

function formatBRL(n: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
}

function formatBytes(n: number | null | undefined) {
  if (n == null || n <= 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FormationCourseManage() {
  const { courseId: courseIdParam } = useParams<{ courseId: string }>();
  const courseId = Number(courseIdParam);

  const [tab, setTab] = useState<ManageTab>('overview');
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState('');

  const [formOpen, setFormOpen] = useState(false);
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

  const [enrollments, setEnrollments] = useState<EnrollRow[]>([]);
  const [enrollMeta, setEnrollMeta] = useState<Meta | undefined>();
  const [enrollPage, setEnrollPage] = useState(1);
  const [paymentFilter, setPaymentFilter] = useState('');
  const [enrollLoading, setEnrollLoading] = useState(false);

  const [payModal, setPayModal] = useState<EnrollRow | null>(null);
  const [payForm, setPayForm] = useState({ payment_link: '', payment_amount: '' as string | number });

  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [lessonModal, setLessonModal] = useState<{ module: ModuleRow; lesson: LessonRow | null } | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    type: 'text' as 'video' | 'text' | 'pdf' | 'quiz',
    video_url: '',
    pdf_path: '',
    duration_minutes: '' as string | number,
    sort_order: '' as string | number,
    contentJson: '',
  });
  const [lessonPdfUploading, setLessonPdfUploading] = useState(false);

  const [matModal, setMatModal] = useState<{
    module: ModuleRow;
    lesson: LessonRow;
    material: MaterialRow | null;
  } | null>(null);
  const [matForm, setMatForm] = useState({ title: '' });
  const [matFileUploading, setMatFileUploading] = useState(false);
  const [matFileMeta, setMatFileMeta] = useState<{ path: string; type: string; size: number } | null>(null);

  const loadCourse = useCallback(async () => {
    if (!Number.isFinite(courseId) || courseId < 1) return;
    setCourseLoading(true);
    setCourseError('');
    try {
      const res = await api.get(`/admin/courses/${courseId}`);
      setCourse(res.data.data);
    } catch {
      setCourse(null);
      setCourseError('Curso não encontrado ou sem permissão.');
    } finally {
      setCourseLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void loadCourse();
  }, [loadCourse]);

  const fetchModules = useCallback(async () => {
    if (!Number.isFinite(courseId) || courseId < 1) return;
    setCurriculumLoading(true);
    try {
      const res = await api.get(`/admin/courses/${courseId}/modules`);
      setModules(Array.isArray(res.data.data) ? res.data.data : []);
    } catch {
      setModules([]);
    } finally {
      setCurriculumLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (tab !== 'curriculum' && tab !== 'library') return;
    void fetchModules();
  }, [tab, fetchModules]);

  const fetchEnrollments = useCallback(async () => {
    if (!Number.isFinite(courseId) || courseId < 1) return;
    setEnrollLoading(true);
    try {
      const res = await api.get(`/admin/courses/${courseId}/enrollments`, {
        params: {
          page: enrollPage,
          per_page: 20,
          ...(paymentFilter ? { payment_status: paymentFilter } : {}),
        },
      });
      setEnrollments(res.data.data);
      setEnrollMeta(res.data.meta);
    } catch {
      setEnrollments([]);
    } finally {
      setEnrollLoading(false);
    }
  }, [courseId, enrollPage, paymentFilter]);

  useEffect(() => {
    if (tab === 'enrollments') {
      void fetchEnrollments();
    }
  }, [tab, fetchEnrollments]);

  const openEditCourse = () => {
    if (!course) return;
    setForm({
      title: course.title,
      slug: course.slug,
      description: course.description || '',
      instructor_name: course.instructor_name || '',
      price: course.price,
      duration_hours: course.duration_hours,
      category: course.category || 'other',
      level: course.level || 'beginner',
      is_active: course.is_active,
      is_featured: course.is_featured,
      has_classes: course.has_classes,
      requires_approval: course.requires_approval,
      max_students: course.max_students ?? '',
      thumbnail_path: course.thumbnail_path ?? null,
      thumbnail_preview_url: course.thumbnail_url ?? '',
    });
    setFormOpen(true);
  };

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
      const ax = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
      const errs = ax.response?.data?.errors;
      alert(errs ? Object.values(errs).flat().join('\n') : ax.response?.data?.message || 'Erro ao enviar imagem.');
    } finally {
      setThumbUploading(false);
    }
  };

  const saveCourseForm = async () => {
    if (!course) return;
    setSaving(true);
    try {
      const { thumbnail_preview_url: _p, ...rest } = form;
      void _p;
      await api.put(`/admin/courses/${course.id}`, {
        ...rest,
        slug: form.slug || undefined,
        max_students: form.max_students === '' ? null : Number(form.max_students),
        thumbnail_path: form.thumbnail_path || null,
      });
      setFormOpen(false);
      await loadCourse();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      alert(ax.response?.data?.errors ? Object.values(ax.response.data.errors).flat().join('\n') : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const confirmPay = async (e: EnrollRow) => {
    try {
      await api.post(`/admin/course-enrollments/${e.id}/confirm-payment`);
      void fetchEnrollments();
      void loadCourse();
    } catch {
      alert('Erro ao confirmar pagamento.');
    }
  };

  const issueCert = async (e: EnrollRow) => {
    try {
      await api.post(`/admin/course-enrollments/${e.id}/issue-certificate`);
      void fetchEnrollments();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      alert(ax.response?.data?.message || 'Erro ao emitir certificado.');
    }
  };

  const openPayModal = (e: EnrollRow) => {
    setPayForm({
      payment_link: e.payment_link || '',
      payment_amount: e.payment_amount ?? '',
    });
    setPayModal(e);
  };

  const savePayModal = async () => {
    if (!payModal) return;
    setSaving(true);
    try {
      await api.put(`/admin/course-enrollments/${payModal.id}`, {
        payment_link: payForm.payment_link || null,
        payment_amount: payForm.payment_amount === '' ? null : Number(payForm.payment_amount),
      });
      setPayModal(null);
      void fetchEnrollments();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      alert(ax.response?.data?.errors ? Object.values(ax.response.data.errors).flat().join('\n') : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const addModule = async () => {
    if (!newModuleTitle.trim()) return;
    setSaving(true);
    try {
      await api.post(`/admin/courses/${courseId}/modules`, { title: newModuleTitle.trim() });
      setNewModuleTitle('');
      await fetchModules();
    } catch {
      alert('Erro ao criar módulo.');
    } finally {
      setSaving(false);
    }
  };

  const deleteModule = async (m: ModuleRow) => {
    if (!confirm('Remover módulo e aulas?')) return;
    try {
      await api.delete(`/admin/courses/${courseId}/modules/${m.id}`);
      await fetchModules();
    } catch {
      alert('Erro.');
    }
  };

  const openLesson = (module: ModuleRow, lesson: LessonRow | null) => {
    setLessonModal({ module, lesson });
    if (lesson) {
      setLessonForm({
        title: lesson.title,
        type: lesson.type as typeof lessonForm.type,
        video_url: lesson.video_url || '',
        pdf_path: lesson.pdf_path || '',
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
        pdf_path: '',
        duration_minutes: '',
        sort_order: '',
        contentJson: '',
      });
    }
  };

  const uploadLessonPdf = async (file: File) => {
    setLessonPdfUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/files/upload', fd);
      const d = res.data?.data as { path?: string };
      if (d?.path) setLessonForm((f) => ({ ...f, pdf_path: d.path! }));
    } catch {
      alert('Erro ao enviar PDF.');
    } finally {
      setLessonPdfUploading(false);
    }
  };

  const saveLesson = async () => {
    if (!lessonModal) return;
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
      pdf_path: lessonForm.pdf_path || null,
      duration_minutes: lessonForm.duration_minutes === '' ? null : Number(lessonForm.duration_minutes),
      sort_order: lessonForm.sort_order === '' ? undefined : Number(lessonForm.sort_order),
      content,
    };
    setSaving(true);
    try {
      if (lesson) {
        await api.put(`/admin/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}`, payload);
      } else {
        await api.post(`/admin/courses/${courseId}/modules/${module.id}/lessons`, payload);
      }
      setLessonModal(null);
      await fetchModules();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      alert(ax.response?.data?.message || 'Erro ao salvar aula.');
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (module: ModuleRow, lesson: LessonRow) => {
    if (!confirm('Excluir aula?')) return;
    try {
      await api.delete(`/admin/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}`);
      await fetchModules();
    } catch {
      alert('Erro.');
    }
  };

  const openMaterial = (module: ModuleRow, lesson: LessonRow, material: MaterialRow | null) => {
    setMatForm({ title: material?.title ?? '' });
    setMatFileMeta(
      material
        ? { path: material.file_path, type: material.file_type,  size: material.file_size ?? 0 }
        : null
    );
    setMatModal({ module, lesson, material });
  };

  const uploadMatFile = async (file: File) => {
    setMatFileUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/files/upload', fd);
      const d = res.data?.data as { path?: string; mime?: string; size?: number };
      if (d?.path) {
        setMatFileMeta({
          path: d.path,
          type: d.mime || file.type || 'file',
          size: d.size ?? file.size,
        });
      }
    } catch {
      alert('Erro ao enviar arquivo.');
    } finally {
      setMatFileUploading(false);
    }
  };

  const saveMaterial = async () => {
    if (!matModal || !matForm.title.trim()) return;
    const { module, lesson, material } = matModal;
    if (!material && !matFileMeta) {
      alert('Envie um arquivo ou abra uma edição existente.');
      return;
    }
    setSaving(true);
    try {
      if (material) {
        await api.put(
          `/admin/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}/materials/${material.id}`,
          {
            title: matForm.title.trim(),
            ...(matFileMeta
              ? {
                  file_path: matFileMeta.path,
                  file_type: matFileMeta.type,
                  file_size: matFileMeta.size,
                }
              : {}),
          }
        );
      } else {
        await api.post(`/admin/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}/materials`, {
          title: matForm.title.trim(),
          file_path: matFileMeta!.path,
          file_type: matFileMeta!.type,
          file_size: matFileMeta!.size,
        });
      }
      setMatModal(null);
      setMatFileMeta(null);
      await fetchModules();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      alert(ax.response?.data?.message || 'Erro ao salvar material.');
    } finally {
      setSaving(false);
    }
  };

  const deleteMaterial = async (module: ModuleRow, lesson: LessonRow, material: MaterialRow) => {
    if (!confirm('Remover este material da biblioteca?')) return;
    try {
      await api.delete(
        `/admin/courses/${courseId}/modules/${module.id}/lessons/${lesson.id}/materials/${material.id}`
      );
      await fetchModules();
    } catch {
      alert('Erro.');
    }
  };

  const libraryRows = modules.flatMap((m) =>
    (m.lessons || []).flatMap((l) =>
      (l.materials || []).map((mat) => ({
        mat,
        moduleTitle: m.title,
        lessonTitle: l.title,
        module: m,
        lesson: l,
      }))
    )
  );

  if (!Number.isFinite(courseId) || courseId < 1) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-600">ID de curso inválido.</p>
        <Link to="/cursos" className="mt-4 inline-block text-primary-600">
          Voltar à lista
        </Link>
      </div>
    );
  }

  if (courseLoading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (courseError || !course) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-600">{courseError || 'Curso não encontrado.'}</p>
        <Link to="/cursos" className="mt-4 inline-flex items-center gap-2 text-sm text-primary-600">
          <ArrowLeft className="h-4 w-4" />
          Voltar à lista
        </Link>
      </div>
    );
  }

  const tabs: { id: ManageTab; label: string; icon: typeof Users }[] = [
    { id: 'overview', label: 'Visão geral', icon: GraduationCap },
    { id: 'enrollments', label: 'Matrículas e pagamentos', icon: Users },
    { id: 'curriculum', label: 'Módulos e aulas', icon: BookOpen },
    { id: 'library', label: 'Biblioteca', icon: Library },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/cursos"
          className="mb-3 inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Cursos de formação
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-gray-400">Sem capa</div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {course.category_label || course.category || '—'} · {course.level_label || course.level || '—'} ·{' '}
              {course.is_active ? <span className="text-green-700">Ativo</span> : <span className="text-amber-700">Inativo</span>}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              {course.enrollments_count ?? 0} matrículas · {formatBRL(course.price)} · {course.duration_hours}h
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-primary-100 text-primary-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'overview' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Dados do curso</h2>
            <button
              type="button"
              onClick={openEditCourse}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Editar dados
            </button>
          </div>
          {course.description ? (
            <div
              className="prose prose-sm mt-4 max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: course.description }}
            />
          ) : (
            <p className="mt-4 text-sm text-gray-500">Sem descrição.</p>
          )}
          {course.instructor_name ? (
            <p className="mt-4 text-sm text-gray-600">Instrutor: {course.instructor_name}</p>
          ) : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Preço</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatBRL(course.price)}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Matrículas</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{course.enrollments_count ?? 0}</p>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Slug</p>
              <p className="mt-1 font-mono text-sm text-gray-800">{course.slug}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'enrollments' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-900">Matrículas e pagamentos</h2>
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setEnrollPage(1);
              }}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="free">Gratuito</option>
              <option value="refunded">Reembolsado</option>
            </select>
          </div>
          {enrollLoading ? (
            <p className="text-sm text-gray-500">Carregando…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2 pr-2">Aluno</th>
                    <th className="py-2 pr-2">Turma</th>
                    <th className="py-2 pr-2">Pagamento</th>
                    <th className="py-2 pr-2">Valor</th>
                    <th className="py-2 pr-2">Link</th>
                    <th className="py-2 pr-2">Cert.</th>
                    <th className="py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((e) => (
                    <tr key={e.id} className="border-b border-gray-100">
                      <td className="py-2 pr-2">
                        <div className="font-medium text-gray-900">{e.user?.name ?? '—'}</div>
                        <div className="text-xs text-gray-500">{e.user?.email}</div>
                      </td>
                      <td className="py-2 pr-2 text-gray-700">{e.class?.name ?? '—'}</td>
                      <td className="py-2 pr-2">
                        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                          {e.payment_status_label}
                        </span>
                      </td>
                      <td className="py-2 pr-2">
                        {e.payment_amount != null ? formatBRL(Number(e.payment_amount)) : '—'}
                      </td>
                      <td className="max-w-[140px] truncate py-2 pr-2">
                        {e.payment_link ? (
                          <a href={e.payment_link} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                            Abrir
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        {e.certificate ? e.certificate.certificate_code.slice(0, 8) + '…' : '—'}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <button
                            type="button"
                            className="text-xs text-primary-600 hover:underline"
                            onClick={() => openPayModal(e)}
                          >
                            Editar pagamento
                          </button>
                          {e.payment_status !== 'paid' && e.payment_status !== 'free' && (
                            <button
                              type="button"
                              className="text-xs text-green-700 hover:underline"
                              onClick={() => void confirmPay(e)}
                            >
                              Confirmar pago
                            </button>
                          )}
                          {!e.certificate && (
                            <button type="button" className="text-xs text-primary-600 hover:underline" onClick={() => void issueCert(e)}>
                              Certificado
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {enrollMeta && enrollMeta.last_page > 1 && (
            <div className="mt-4 flex justify-center gap-2 text-sm">
              <button
                type="button"
                disabled={enrollPage <= 1}
                onClick={() => setEnrollPage((p) => p - 1)}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="px-2 py-1">
                {enrollPage} / {enrollMeta.last_page}
              </span>
              <button
                type="button"
                disabled={enrollPage >= enrollMeta.last_page}
                onClick={() => setEnrollPage((p) => p + 1)}
                className="rounded border px-3 py-1 disabled:opacity-40"
              >
                Próximo
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'curriculum' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Módulos e aulas</h2>
          {curriculumLoading ? (
            <p className="text-sm text-gray-500">Carregando…</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <input
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="Título do novo módulo"
                  className="min-w-[200px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={saving || !newModuleTitle.trim()}
                  onClick={() => void addModule()}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Adicionar módulo
                </button>
              </div>
              {modules.map((m) => (
                <div key={m.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{m.title}</h3>
                    <div className="flex gap-2">
                      <button type="button" className="text-xs text-primary-600 hover:underline" onClick={() => openLesson(m, null)}>
                        + Aula
                      </button>
                      <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => void deleteModule(m)}>
                        Excluir módulo
                      </button>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {(m.lessons || []).map((l) => (
                      <li key={l.id} className="rounded-md bg-gray-50 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <span className="font-medium text-gray-900">{l.title}</span>
                            <span className="ml-2 text-xs text-gray-500">({l.type})</span>
                            {(l.materials?.length ?? 0) > 0 ? (
                              <span className="ml-2 text-xs text-gray-500">
                                · {l.materials!.length} arquivo(s) na biblioteca
                              </span>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" className="text-xs text-primary-600 hover:underline" onClick={() => openLesson(m, l)}>
                              Editar aula
                            </button>
                            <button type="button" className="text-xs text-primary-600 hover:underline" onClick={() => openMaterial(m, l, null)}>
                              + Material
                            </button>
                            <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => void deleteLesson(m, l)}>
                              Excluir aula
                            </button>
                          </div>
                        </div>
                        {(l.materials?.length ?? 0) > 0 && (
                          <ul className="mt-2 space-y-1 border-t border-gray-200 pt-2 text-xs text-gray-600">
                            {l.materials!.map((mat) => (
                              <li key={mat.id} className="flex flex-wrap items-center justify-between gap-2">
                                <a href={mat.file_url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline">
                                  {mat.title}
                                </a>
                                <span className="flex gap-2">
                                  <button type="button" className="text-primary-600 hover:underline" onClick={() => openMaterial(m, l, mat)}>
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    className="text-red-600 hover:underline"
                                    onClick={() => void deleteMaterial(m, l, mat)}
                                  >
                                    Remover
                                  </button>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {modules.length === 0 && <p className="text-sm text-gray-500">Nenhum módulo cadastrado.</p>}
            </div>
          )}
        </div>
      )}

      {tab === 'library' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Biblioteca do curso</h2>
          <p className="mb-4 text-sm text-gray-500">
            Todos os materiais complementares das aulas. Adicione ou edite pelos módulos na aba anterior.
          </p>
          {curriculumLoading ? (
            <p className="text-sm text-gray-500">Carregando…</p>
          ) : libraryRows.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum material cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="py-2">Módulo</th>
                    <th className="py-2">Aula</th>
                    <th className="py-2">Arquivo</th>
                    <th className="py-2">Tipo / Tamanho</th>
                    <th className="py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {libraryRows.map(({ mat, moduleTitle, lessonTitle, module, lesson }) => (
                    <tr key={mat.id} className="border-b border-gray-100">
                      <td className="py-2 text-gray-800">{moduleTitle}</td>
                      <td className="py-2 text-gray-800">{lessonTitle}</td>
                      <td className="py-2">
                        <a href={mat.file_url} target="_blank" rel="noreferrer" className="font-medium text-primary-600 hover:underline">
                          {mat.title}
                        </a>
                      </td>
                      <td className="py-2 text-gray-600">
                        {mat.file_type} · {formatBytes(mat.file_size)}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          className="text-xs text-primary-600 hover:underline"
                          onClick={() => {
                            setTab('curriculum');
                            openMaterial(module, lesson, mat);
                          }}
                        >
                          Gerenciar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Editar curso" size="lg">
        <div className="grid gap-3 sm:grid-cols-2 max-h-[70vh] overflow-y-auto pr-1">
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
              Capa {form.is_active ? <span className="text-red-600">*</span> : null}
            </label>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex h-24 w-40 items-center justify-center overflow-hidden rounded border bg-gray-50">
                {form.thumbnail_preview_url ? (
                  <img src={form.thumbnail_preview_url} alt="" className="h-full w-full object-cover" />
                ) : thumbUploading ? (
                  <span className="text-xs text-gray-400">Enviando…</span>
                ) : (
                  <span className="text-xs text-gray-400">Sem imagem</span>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  disabled={thumbUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) void uploadThumbnail(f);
                  }}
                  className="text-sm"
                />
                {form.thumbnail_path ? (
                  <button
                    type="button"
                    className="mt-1 block text-xs text-red-600"
                    onClick={() => setForm((f) => ({ ...f, thumbnail_path: null, thumbnail_preview_url: '' }))}
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
              {FORMATION_CATEGORIES.map((c) => (
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
              {FORMATION_LEVELS.map((c) => (
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
            {(['is_active', 'is_featured', 'has_classes', 'requires_approval'] as const).map((k) => (
              <label key={k} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form[k]}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.checked }))}
                />
                <span className="text-sm">
                  {k === 'is_active'
                    ? 'Ativo'
                    : k === 'is_featured'
                      ? 'Destaque'
                      : k === 'has_classes'
                        ? 'Turmas'
                        : 'Exige aprovação'}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <button type="button" onClick={() => setFormOpen(false)} className="rounded border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || thumbUploading || !form.title}
            onClick={() => void saveCourseForm()}
            className="rounded bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </Modal>

      <Modal open={!!payModal} onClose={() => setPayModal(null)} title="Pagamento da matrícula" size="md">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Aluno: <strong>{payModal?.user?.name}</strong>
          </p>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              value={payForm.payment_amount}
              onChange={(e) => setPayForm((f) => ({ ...f, payment_amount: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-700">Link de pagamento (PIX, checkout, etc.)</label>
            <textarea
              value={payForm.payment_link}
              onChange={(e) => setPayForm((f) => ({ ...f, payment_link: e.target.value }))}
              rows={3}
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t pt-4">
          <button type="button" onClick={() => setPayModal(null)} className="rounded border px-4 py-2 text-sm">
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void savePayModal()}
            className="rounded bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </Modal>

      <Modal open={!!lessonModal} onClose={() => setLessonModal(null)} title={lessonModal?.lesson ? 'Editar aula' : 'Nova aula'} size="lg">
        <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
          <div>
            <label className="mb-1 block text-sm">Título *</label>
            <input
              value={lessonForm.title}
              onChange={(e) => setLessonForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
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
          <div>
            <label className="mb-1 block text-sm">PDF da aula (caminho no storage)</label>
            <input
              value={lessonForm.pdf_path}
              onChange={(e) => setLessonForm((f) => ({ ...f, pdf_path: e.target.value }))}
              className="w-full rounded border px-3 py-2 font-mono text-xs"
            />
            <input
              type="file"
              accept="application/pdf"
              disabled={lessonPdfUploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void uploadLessonPdf(f);
              }}
              className="mt-1 text-sm"
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
            onClick={() => void saveLesson()}
            className="rounded bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Salvar aula
          </button>
        </div>
      </Modal>

      <Modal
        open={!!matModal}
        onClose={() => {
          setMatModal(null);
          setMatFileMeta(null);
        }}
        title={matModal?.material ? 'Editar material' : 'Novo material'}
        size="md"
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm">Título *</label>
            <input
              value={matForm.title}
              onChange={(e) => setMatForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Arquivo</label>
            {matModal?.material && !matFileMeta ? (
              <p className="text-xs text-gray-500">
                Arquivo atual mantido. Envie outro arquivo abaixo para substituir.
              </p>
            ) : null}
            {matFileMeta ? (
              <p className="rounded bg-gray-50 px-2 py-2 font-mono text-xs text-gray-800">{matFileMeta.path}</p>
            ) : null}
            <input
              type="file"
              disabled={matFileUploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) void uploadMatFile(f);
              }}
              className="mt-1 text-sm"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2 border-t pt-4">
          <button
            type="button"
            onClick={() => {
              setMatModal(null);
              setMatFileMeta(null);
            }}
            className="rounded border px-4 py-2 text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || !matForm.title.trim() || matFileUploading}
            onClick={() => void saveMaterial()}
            className="rounded bg-primary-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Salvar
          </button>
        </div>
      </Modal>
    </div>
  );
}
