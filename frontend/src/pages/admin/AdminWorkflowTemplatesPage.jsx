// src/pages/admin/AdminWorkflowTemplatesPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  GitBranch, Plus, Edit, Trash2, ChevronDown, ChevronRight,
  ToggleLeft, ToggleRight, Building2, Users, Search,
  ArrowUp, ArrowDown, X, Loader2, LayoutTemplate
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { workflowTemplatesApi } from '@/api/workflow'
import { getApiError } from '@/utils/helpers'
import { PageLoader, Modal } from '@/components/common'
import PageHeader from '@/components/common/pageheader'
import { theme } from '@/constants/theme'
import useAuthStore from '@/stores/authStore'
import SidebarTree from '@/pages/tasks/TaskDetail/SidebarTree'
import WorkflowBuilderModal from '@/pages/tasks/TaskDetail/TaskModels/WorkflowBuilderModal'

// ══════════════════════════════════════════════════════════════════
// 1. مودال الإنشاء / التعديل السريع (Legacy / Quick Form Modal)
// ══════════════════════════════════════════════════════════════════
function TemplateFormModal({ template, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!template

  const [showPickerModal, setShowPickerModal] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const [form, setForm] = useState({
    name: template?.name || '',
    description: template?.description || '',
  })

  const [steps, setSteps] = useState(
    template?.steps?.length
      ? template.steps.map(s => ({
          title: s.title,
          description: s.description || '',
          step_order: s.step_order,
          is_parallel: s.is_parallel,
          assigned_department_id: s.assigned_department_id || '',
          assigned_user_id: s.assigned_user_id || '',
          assigned_name: s.assigned_name || '',
        }))
      : [{ title: '', description: '', step_order: 1, is_parallel: false, assigned_department_id: '', assigned_user_id: '', assigned_name: '' }]
  )

  const createMutation = useMutation({
    mutationFn: (data) => workflowTemplatesApi.create(data),
    onSuccess: () => {
      toast.success('تم إنشاء القالب بنجاح')
      qc.invalidateQueries({ queryKey: ['workflow-templates'] })
      onClose()
    },
    onError: (err) => toast.error(getApiError(err) || 'فشل إنشاء القالب'),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => workflowTemplatesApi.update(template.id, data),
    onSuccess: () => {
      toast.success('تم تحديث القالب')
      qc.invalidateQueries({ queryKey: ['workflow-templates'] })
      onClose()
    },
    onError: (err) => toast.error(getApiError(err) || 'فشل تحديث القالب'),
  })

  const isPending = createMutation.isPending || updateMutation.isPending

  const addStep = () => setSteps(prev => [
    ...prev,
    { title: '', description: '', step_order: prev.length + 1, is_parallel: false, assigned_department_id: '', assigned_user_id: '', assigned_name: '' }
  ])

  const removeStep = (idx) =>
    setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_order: i + 1 })))

  const updateStep = (idx, field, value) =>
    setSteps(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s))

  const moveStep = (idx, dir) => {
    const next = [...steps]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setSteps(next.map((s, i) => ({ ...s, step_order: i + 1 })))
  }

  const handleSubmit = () => {
    if (!form.name.trim()) return toast.error('اسم القالب مطلوب')
    const invalid = steps.find(s => !s.title.trim() || (!s.assigned_department_id && !s.assigned_user_id))
    if (invalid) return toast.error('كل خطوة لازم يكون ليها عنوان ومسؤول (إدارة أو موظف)')

    const payload = {
      ...form,
      steps: steps.map(s => ({
        title: s.title,
        description: s.description || null,
        step_order: s.step_order,
        is_parallel: s.is_parallel,
        assigned_department_id: s.assigned_department_id ? parseInt(s.assigned_department_id) : null,
        assigned_user_id: s.assigned_user_id ? parseInt(s.assigned_user_id) : null,
      }))
    }

    isEdit ? updateMutation.mutate(payload) : createMutation.mutate(payload)
  }

  return (
    <Modal open={true} onClose={onClose} title={isEdit ? 'تعديل القالب (سريع)' : 'إنشاء قالب سريع'} size="lg">
      <div className="space-y-4">
        {/* معلومات القالب */}
        <div className="grid grid-cols-2 gap-3">
          <div className={theme.field.wrapper}>
            <label className={theme.field.label}>اسم القالب <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="مثال: دورة الموافقة الإدارية"
              className={clsx(theme.input.base, 'text-sm')}
            />
          </div>
          <div className={theme.field.wrapper}>
            <label className={theme.field.label}>الوصف</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="وصف مختصر للقالب..."
              rows={2}
              className={clsx(theme.input.base, 'text-sm resize-none')}
            />
          </div>
        </div>

        {/* الخطوات */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              الخطوات ({steps.length})
            </span>
            <button
              onClick={addStep}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors font-medium"
            >
              <Plus className="w-3.5 h-3.5" /> إضافة خطوة
            </button>
          </div>

          <div className="space-y-2.5 max-h-[400px] overflow-y-auto pe-1">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/30 space-y-2.5"
              >
                {/* رأس الخطوة */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    {step.is_parallel && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <GitBranch className="w-2.5 h-2.5" /> متوازي
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveStep(idx, -1)} disabled={idx === 0}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 transition-colors">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 transition-colors">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    {steps.length > 1 && (
                      <button onClick={() => removeStep(idx)}
                        className="p-1 rounded text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* بيانات الخطوة */}
                <input
                  value={step.title}
                  onChange={e => updateStep(idx, 'title', e.target.value)}
                  placeholder="عنوان الخطوة *"
                  className={clsx(theme.input.base, 'text-sm')}
                />
                <input
                  value={step.description}
                  onChange={e => updateStep(idx, 'description', e.target.value)}
                  placeholder="وصف الخطوة (اختياري)"
                  className={clsx(theme.input.base, 'text-sm')}
                />
                <div className="flex gap-2">
                  <div className={clsx(
                      "flex-1 h-9 flex items-center px-3 text-sm rounded-lg border",
                      "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700",
                      step.assigned_name ? "text-slate-800 dark:text-slate-200" : "text-slate-400"
                    )}>
                      {step.assigned_name || "لم يتم تحديد مسؤول بعد..."}
                  </div>
                  <button 
                    onClick={() => { setShowPickerModal(true); setStepIndex(idx); }} 
                    className="h-9 px-3 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
                  >
                    تحديد
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className={theme.field.wrapper}>
                    <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> ID الإدارة
                    </label>
                    <input
                      type="number"
                      value={step.assigned_department_id}
                      onChange={e => updateStep(idx, 'assigned_department_id', e.target.value)}
                      placeholder="رقم الإدارة"
                      className={clsx(theme.input.base, 'text-sm')}
                    />
                  </div>
                  <div className={theme.field.wrapper}>
                    <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> ID الموظف
                    </label>
                    <input
                      type="number"
                      value={step.assigned_user_id}
                      onChange={e => updateStep(idx, 'assigned_user_id', e.target.value)}
                      placeholder="رقم الموظف"
                      className={clsx(theme.input.base, 'text-sm')}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={step.is_parallel}
                    onChange={e => updateStep(idx, 'is_parallel', e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-primary-600"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    تنفيذ بالتوازي مع الخطوة السابقة (نفس الـ order)
                  </span>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={theme.form.footer}>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          إلغاء
        </button>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? 'حفظ التعديلات' : 'إنشاء القالب'}
        </button>
      </div>

      {/* مودال اختيار المسؤول من الشجرة */}
      {showPickerModal && (
        <Modal 
          open={showPickerModal} 
          onClose={() => setShowPickerModal(false)} 
          title="اختر المسؤول عن هذه الخطوة"
          size="md"
        >
          <div className="h-[400px] overflow-y-auto">
            <SidebarTree 
              onSelectNode={(node) => {
                const isEmployee = !!node.full_name
                const update = {
                  assigned_department_id: isEmployee ? '' : node.id,
                  assigned_user_id: isEmployee ? node.id : '',
                  assigned_name: node.full_name || node.name
                }
                setSteps(prev => prev.map((s, i) => i === stepIndex ? { ...s, ...update } : s))
                setShowPickerModal(false)
              }} 
            />
          </div>
        </Modal>
      )}
    </Modal>
  )
}

// ══════════════════════════════════════════════════════════════════
// 2. بطاقة عرض قالب واحد
// ══════════════════════════════════════════════════════════════════
function TemplateCard({ template, onEditBuilder, onEditQuick, onToggle, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  const statusColors = {
    true: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    false: 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700',
  }

  return (
    <div className={clsx(
      'border rounded-2xl transition-all duration-200 overflow-hidden',
      template.is_active
        ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-70'
    )}>
      <div className="p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
          <LayoutTemplate className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {template.name}
            </h3>
            <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full border', statusColors[template.is_active])}>
              {template.is_active ? 'نشط' : 'معطل'}
            </span>
          </div>
          {template.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{template.description}</p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {template.steps?.length || 0} خطوة
          </p>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(p => !p)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="عرض الخطوات"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEditBuilder(template)}
            className="p-2 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            title="تعديل عبر المحرر المرئي"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEditQuick(template)}
            className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-xs font-bold"
            title="تعديل سريع"
          >
            سريع
          </button>
          <button
            onClick={() => onToggle(template)}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              template.is_active
                ? 'text-green-500 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                : 'text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
            )}
            title={template.is_active ? 'تعطيل' : 'تفعيل'}
          >
            {template.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(template)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="حذف"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && template.steps?.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3 space-y-2">
          {template.steps.map((step, idx) => (
            <div key={step.id || idx} className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                  step.is_parallel
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                )}>
                  {step.step_order}
                </div>
                {idx < template.steps.length - 1 && (
                  <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{step.title}</span>
                  {step.is_parallel && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-500 flex items-center gap-1">
                      <GitBranch className="w-2.5 h-2.5" /> متوازي
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mt-0.5">
                  {step.assigned_department_id && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> إدارة #{step.assigned_department_id}
                    </span>
                  )}
                  {step.assigned_user_id && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> موظف #{step.assigned_user_id}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// 3. الصفحة الرئيسية لإدارة القوالب
// ══════════════════════════════════════════════════════════════════
export default function AdminWorkflowTemplatesPage() {
  const { isAdmin, isPM } = useAuthStore()
  const qc = useQueryClient()

  // حالات منفصلة ونظيفة تماماً لمنع أي تداخل
  const [showQuickModal, setShowQuickModal] = useState(false)
  const [quickTemplateEdit, setQuickTemplateEdit] = useState(null)

  const [showBuilder, setShowBuilder] = useState(false)
  const [editTemplateId, setEditTemplateId] = useState(null)

  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  // جلب القوالب
  const { data: templates = [], isLoading, refetch } = useQuery({
    queryKey: ['workflow-templates'],
    queryFn: () => workflowTemplatesApi.list().then(r => r.data),
  })

  // جلب الـ Diagram للقالب عند استخدام المحرر المرئي المتقدم
  const { data: templateDiagram } = useQuery({
    queryKey: ['workflow-template-diagram', editTemplateId],
    queryFn: () => workflowTemplatesApi.getDiagram(editTemplateId).then(r => r.data),
    enabled: !!editTemplateId && showBuilder,
  })

  // تفعيل/تعطيل القالب
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => workflowTemplatesApi.update(id, { is_active }),
    onSuccess: (_, vars) => {
      toast.success(vars.is_active ? 'تم تفعيل القالب' : 'تم تعطيل القالب')
      qc.invalidateQueries({ queryKey: ['workflow-templates'] })
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  // دوال التحكم بالمحرر المرئي المتقدم
  const openBuilderForCreate = () => {
    setEditTemplateId(null)
    setShowBuilder(true)
  }

  const openBuilderForEdit = (template) => {
    setEditTemplateId(template.id)
    setShowBuilder(true)
  }

  const closeBuilder = () => {
    setShowBuilder(false)
    setEditTemplateId(null)
  }

  const handleBuilderSuccess = () => {
    refetch()
    closeBuilder()
  }

  // دوال التحكم بالنموذج السريع
  const openQuickForCreate = () => {
    setQuickTemplateEdit(null)
    setShowQuickModal(true)
  }

  const openQuickForEdit = (template) => {
    setQuickTemplateEdit(template)
    setShowQuickModal(true)
  }

  // فلترة محلية
  const filtered = templates.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
    const matchActive = filterActive === null || t.is_active === filterActive
    return matchSearch && matchActive
  })

  const activeCount = templates.filter(t => t.is_active).length
  const inactiveCount = templates.length - activeCount

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5 text-right" dir="rtl">
      {/* الترويسة */}
      <PageHeader title="قوالب الـ Workflow" icon={LayoutTemplate}>
        <div className="flex items-center gap-2">
          <button
            onClick={openQuickForCreate}
            className="px-3 py-2 text-xs rounded-xl border border-primary-600 text-primary-600 hover:bg-primary-50 transition-colors"
          >
            + إنشاء سريع
          </button>
          <button
            onClick={openBuilderForCreate}
            className="btn-primary w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>قالب مرئي جديد</span>
          </button>
        </div>
      </PageHeader>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'إجمالي القوالب', value: templates.length, color: 'text-slate-700 dark:text-slate-300', bg: 'bg-slate-100 dark:bg-slate-800' },
          { label: 'نشطة', value: activeCount, color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'معطلة', value: inactiveCount, color: 'text-slate-400 dark:text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/50' },
        ].map(stat => (
          <div key={stat.label} className={clsx('rounded-xl p-3 text-center', stat.bg)}>
            <div className={clsx('text-2xl font-bold', stat.color)}>{stat.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* البحث والفلترة */}
      <div className="flex flex-col gap-3 bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            className="input pr-9 text-sm bg-gray-50/50 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
            placeholder="ابحث باسم القالب..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { label: 'الكل', value: null },
            { label: 'النشطة', value: true },
            { label: 'المعطلة', value: false },
          ].map(tab => (
            <button
              key={String(tab.value)}
              onClick={() => setFilterActive(tab.value)}
              className={clsx(
                'px-3.5 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition-all duration-150',
                filterActive === tab.value
                  ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-900 shadow-sm'
                  : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* قائمة القوالب */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <LayoutTemplate className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {search ? 'لا توجد نتائج للبحث' : 'لا توجد قوالب بعد'}
          </p>
          {!search && (
            <button
              onClick={openBuilderForCreate}
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              أنشئ أول قالب الآن
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onEditBuilder={openBuilderForEdit}
              onEditQuick={openQuickForEdit}
              onToggle={(t) => toggleMutation.mutate({ id: t.id, is_active: !t.is_active })}
              onDelete={(t) => setConfirmDelete(t)}
            />
          ))}
        </div>
      )}

      {/* مودال المحرر المرئي المتقدم */}
      {showBuilder && (
        <WorkflowBuilderModal
          mode="template"
          templateId={editTemplateId}
          existingDiagram={templateDiagram || null}
          isEdit={!!editTemplateId}
          onClose={closeBuilder}
          onSuccess={handleBuilderSuccess}
        />
      )}

      {/* مودال التعديل / الإنشاء السريع */}
      {showQuickModal && (
        <TemplateFormModal
          template={quickTemplateEdit}
          onClose={() => setShowQuickModal(false)}
        />
      )}

      {/* تأكيد الحذف */}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)} title="تأكيد الحذف">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            هل تريد حذف قالب <span className="font-semibold text-slate-800 dark:text-slate-200">"{confirmDelete.name}"</span> نهائياً؟
            <br />
            <span className="text-xs text-red-500 mt-1 block">لا يمكن التراجع عن هذا الإجراء.</span>
          </p>
          <div className={theme.form.footer}>
            <button
              onClick={() => setConfirmDelete(null)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              إلغاء
            </button>
            <button
              onClick={() => {
                toast.error('حذف القوالب غير مدعوم — عطّل القالب بدلاً من ذلك')
                setConfirmDelete(null)
              }}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors"
            >
              حذف
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}