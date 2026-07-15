// src/pages/tasks/TaskDetail/WorkflowSection.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Check, Loader2, Trash2, Edit3, GitBranch,
  Users, Building2, X, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { theme } from '@/constants/theme'
import { Modal } from '@/components/common'
import { workflowApi } from '@/api/workflow'
import { getApiError } from '@/utils/helpers'
import WorkflowDiagram from '@/components/workflow/WorkflowDiagram'
// 🆕 استيراد المحرر الجديد بدلاً من القديم
import WorkflowBuilderModal from '@/pages/tasks/TaskDetail/TaskModels/WorkflowBuilderModal'

// ── إعدادات حالة الخطوة (للعرض في شريط الأدوات) ──────────────
const STATUS_CONFIG = {
  pending: { label: 'في الانتظار', color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
  in_progress: { label: 'جارٍ التنفيذ', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  completed: { label: 'مكتملة', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/30' },
  skipped: { label: 'متخطاة', color: 'text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800' },
  cancelled: { label: 'ملغية', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
}

// ── المكوّن الرئيسي ──────────────────────────────────────────────
export default function WorkflowSection({ taskId, taskPermissions }) {
  const queryClient = useQueryClient()
  const [selectedStepId, setSelectedStepId] = useState(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingStep, setEditingStep] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [completeNotes, setCompleteNotes] = useState('')
  const [showCompleteModal, setShowCompleteModal] = useState(false)

  const canEdit = taskPermissions?.can_edit_task ?? false

  // ── ١. جلب بيانات الـ Diagram ──────────────────────────────────
  const { data: diagram, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['task-workflow-diagram', taskId],
    queryFn: () => workflowApi.getDiagram(taskId).then(r => r.data),
    retry: (count, err) => err?.response?.status !== 404 && count < 2,
  })
  const edgesWithUniqueIds = (diagram?.edges || []).reduce((acc, edge) => {
    const key = `${edge.source}-${edge.target}`;
    if (!acc.some(e => `${e.source}-${e.target}` === key)) {
      acc.push(edge);
    }
    return acc;
  }, []);


  // استخراج البيانات من الـ Diagram
  const nodes = diagram?.nodes || []
  const edges = diagram?.edges || []
  const workflowStatus = diagram?.workflow_status || 'pending'
  const total = nodes.length
  const completed = nodes.filter(n => n.data?.status === 'completed').length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  // الخطوة المحددة حالياً
  const selectedNode = nodes.find(n => n.id === String(selectedStepId))
  const selectedStep = selectedNode?.data || null
  const selectedStepIdNum = selectedStepId ? parseInt(selectedStepId) : null

  // هل الخطوة قابلة للإنهاء/التعديل/الحذف؟
  const isCompletable = selectedStep?.is_completable ?? false
  const isEditable = selectedStep?.is_editable ?? false
  const isPending = selectedStep?.status === 'pending'

  // ── ٢. حالة عدم وجود Workflow ──────────────────────────────────
  const noWorkflow = isError || !diagram

  // ── ٣. دوال فتح/غلق المحرر ─────────────────────────────────────
  const openBuilderForCreate = () => {
    setIsEditMode(false)
    setShowBuilder(true)
  }

  const openBuilderForEdit = () => {
    if (diagram) {
      setIsEditMode(true)
      setShowBuilder(true)
    }
  }

  const closeBuilder = () => {
    setShowBuilder(false)
    setIsEditMode(false)
  }

  const handleBuilderSuccess = () => {
    refetch() // إعادة تحميل البيانات بعد الحفظ
    closeBuilder()
  }

  // ── ٤. Mutations ──────────────────────────────────────────────

  // إنهاء خطوة
  const completeMutation = useMutation({
    mutationFn: ({ stepId, notes }) => workflowApi.completeStep(stepId, notes),
    onSuccess: () => {
      toast.success('تم إنهاء الخطوة بنجاح')
      queryClient.invalidateQueries({ queryKey: ['task-workflow-diagram', taskId] })
      setSelectedStepId(null)
      setShowCompleteModal(false)
      setCompleteNotes('')
    },
    onError: (err) => toast.error(getApiError(err) || 'فشل إنهاء الخطوة'),
  })

  // حذف خطوة
  const deleteMutation = useMutation({
    mutationFn: (stepId) => workflowApi.deleteStep(stepId),
    onSuccess: () => {
      toast.success('تم حذف الخطوة')
      queryClient.invalidateQueries({ queryKey: ['task-workflow-diagram', taskId] })
      setSelectedStepId(null)
      setConfirmDelete(null)
    },
    onError: (err) => toast.error(getApiError(err) || 'فشل حذف الخطوة'),
  })

  // تحديث خطوة (يتم في EditStepModal)
  const updateMutation = useMutation({
    mutationFn: ({ stepId, data }) => workflowApi.updateStep(stepId, data),
    onSuccess: () => {
      toast.success('تم تعديل الخطوة')
      queryClient.invalidateQueries({ queryKey: ['task-workflow-diagram', taskId] })
      setEditingStep(null)
    },
    onError: (err) => toast.error(getApiError(err) || 'فشل التعديل'),
  })

  // ── ٥. معالجات الأحداث ─────────────────────────────────────────

  // النقر على عقدة في الرسم البياني
  const handleNodeClick = (node) => {
    if (selectedStepId === node.id) {
      setSelectedStepId(null) // إلغاء التحديد إذا نقرت على نفس العقدة
    } else {
      setSelectedStepId(node.id)
    }
  }

  // فتح مودال التعديل
  const handleEdit = () => {
    if (selectedStep) {
      setEditingStep({
        id: selectedStepIdNum,
        title: selectedStep.label || '',
        description: selectedStep.description || '',
        step_order: selectedStep.step_order || 1,
        is_parallel: selectedStep.is_parallel || false,
        assigned_department_id: selectedStep.assigned_department_id || null,
        assigned_user_id: selectedStep.assigned_user_id || null,
      })
    }
  }

  // فتح مودال تأكيد الحذف
  const handleDelete = () => {
    if (selectedStepIdNum) {
      setConfirmDelete(selectedStepIdNum)
    }
  }

  // فتح مودال الإنهاء مع الملاحظات
  const handleCompleteClick = () => {
    setShowCompleteModal(true)
  }

  // تأكيد الإنهاء
  const handleCompleteConfirm = () => {
    if (selectedStepIdNum) {
      completeMutation.mutate({
        stepId: selectedStepIdNum,
        notes: completeNotes || null,
      })
    }
  }

  // ── ٦. حالة التحميل ─────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">جاري تحميل الـ Workflow...</span>
      </div>
    )
  }

  // ── ٧. لا يوجد Workflow ────────────────────────────────────────

  if (noWorkflow) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <GitBranch className="w-7 h-7 text-slate-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">لا يوجد Workflow لهذه المهمة</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">أضف Workflow لتنظيم تسلسل التنفيذ</p>
          </div>
          {canEdit && (
            <button
              onClick={openBuilderForCreate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> إنشاء Workflow
            </button>
          )}
        </div>

        {/* 🆕 مودال المحرر (وضع الإنشاء) */}
        {showBuilder && !isEditMode && (
          <WorkflowBuilderModal
            taskId={taskId}
            existingDiagram={null}
            isEdit={false}
            onClose={closeBuilder}
            onSuccess={handleBuilderSuccess}
          />
        )}
      </>
    )
  }

  // ── ٨. عرض الـ Workflow بالـ Diagram ───────────────────────────

  // حالة الـ Workflow العامة
  const statusColors = {
    pending: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
    in_progress: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
    completed: 'text-green-600 bg-green-50 dark:bg-green-900/30',
    cancelled: 'text-red-500 bg-red-50 dark:bg-red-900/20',
  }
  const statusLabels = {
    pending: 'في الانتظار',
    in_progress: 'جارٍ التنفيذ',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  }

  return (
    <>
      <div className="space-y-4">
        {/* ─── رأس الـ Workflow ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
              <GitBranch className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Workflow المهمة
                </span>
                {workflowStatus && (
                  <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full', statusColors[workflowStatus])}>
                    {statusLabels[workflowStatus]}
                  </span>
                )}
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {completed} من {total} خطوة مكتملة
                </span>
              </div>
              {/* شريط التقدم المصغر */}
              {total > 0 && (
                <div className="w-32 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-l from-primary-500 to-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {canEdit && (
            <button
              onClick={openBuilderForEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium transition-colors flex-shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" /> تعديل Workflow
            </button>
          )}
        </div>

        {/* ─── شريط أدوات الخطوة المحددة ───────────────────────────── */}
        {selectedStep && (
          <div
            className={clsx(
              'flex flex-wrap items-center gap-3 p-3 rounded-xl border transition-all',
              'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
            )}
          >
            {/* معلومات الخطوة */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                #{selectedStep.step_order}
              </span>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                {selectedStep.label}
              </span>
              <span className={clsx(
                'text-[10px] font-medium px-2 py-0.5 rounded-full',
                STATUS_CONFIG[selectedStep.status]?.bg || 'bg-slate-100',
                STATUS_CONFIG[selectedStep.status]?.color || 'text-slate-500'
              )}>
                {STATUS_CONFIG[selectedStep.status]?.label || selectedStep.status}
              </span>
              {selectedStep.assigned_user_name && (
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {selectedStep.assigned_user_name}
                </span>
              )}
              {selectedStep.assigned_department_name && (
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {selectedStep.assigned_department_name}
                </span>
              )}
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isCompletable && (
                <button
                  onClick={handleCompleteClick}
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> إنهاء
                </button>
              )}
              {isEditable && (
                <button
                  onClick={handleEdit}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  title="تعديل الخطوة"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              {isPending && (
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="حذف الخطوة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setSelectedStepId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title="إلغاء التحديد"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ─── الرسوم البياني (ReactFlow) ──────────────────────────── */}
        <div className="w-full h-[500px]">
        <WorkflowDiagram
          nodes={nodes}
          edges={edgesWithUniqueIds}
          onNodeClick={handleNodeClick}
          onAutoLayout={true}
          isLoading={false}
          className="min-h-[500px]"
        />
        </div>
        

        {/* ─── مودال تعديل الخطوة ──────────────────────────────────── */}
        {editingStep && (
          <EditStepModal
            step={editingStep}
            taskId={taskId}
            onClose={() => setEditingStep(null)}
            onSave={(data) => {
              updateMutation.mutate({ stepId: editingStep.id, data })
            }}
            isPending={updateMutation.isPending}
          />
        )}

        {/* ─── مودال تأكيد الحذف ──────────────────────────────────── */}
        {confirmDelete && (
          <Modal onClose={() => setConfirmDelete(null)} title="تأكيد حذف الخطوة">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              هل تريد حذف هذه الخطوة نهائياً؟
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
                onClick={() => deleteMutation.mutate(confirmDelete)}
                disabled={deleteMutation.isPending}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                حذف
              </button>
            </div>
          </Modal>
        )}

        {/* ─── مودال إنهاء الخطوة (مع ملاحظات) ────────────────────── */}
        {showCompleteModal && selectedStep && (
          <Modal onClose={() => { setShowCompleteModal(false); setCompleteNotes('') }} title="إنهاء الخطوة">
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                هل تريد إنهاء الخطوة: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedStep.label}</span>؟
              </p>
              <div className={theme.field.wrapper}>
                <label className={theme.field.label}>ملاحظة الإنهاء (اختياري)</label>
                <textarea
                  value={completeNotes}
                  onChange={e => setCompleteNotes(e.target.value)}
                  placeholder="أضف ملاحظة عن إنجاز هذه الخطوة..."
                  rows={3}
                  className={clsx(theme.input.base, 'resize-none text-sm')}
                />
              </div>
            </div>
            <div className={theme.form.footer}>
              <button
                onClick={() => { setShowCompleteModal(false); setCompleteNotes('') }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleCompleteConfirm}
                disabled={completeMutation.isPending}
                className="px-5 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2"
              >
                {completeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                تأكيد الإنهاء
              </button>
            </div>
          </Modal>
        )}
      </div>

      {/* ─── 🆕 مودال المحرر (وضع الإنشاء أو التعديل) ────────────── */}
      {showBuilder && (
        <WorkflowBuilderModal
          taskId={taskId}
          existingDiagram={isEditMode ? diagram : null}
          isEdit={isEditMode}
          onClose={closeBuilder}
          onSuccess={handleBuilderSuccess}
        />
      )}
    </>
  )
}

// ─── مودال تعديل الخطوة (مبسط) ──────────────────────────────────
function EditStepModal({ step, onClose, onSave, isPending }) {
  const [form, setForm] = useState({
    title: step.title || '',
    description: step.description || '',
    step_order: step.step_order || 1,
    is_parallel: step.is_parallel || false,
    assigned_department_id: step.assigned_department_id || '',
    assigned_user_id: step.assigned_user_id || '',
  })

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error('عنوان الخطوة مطلوب')
      return
    }
    onSave({
      title: form.title,
      description: form.description || null,
      step_order: parseInt(form.step_order),
      is_parallel: form.is_parallel,
      assigned_department_id: form.assigned_department_id ? parseInt(form.assigned_department_id) : null,
      assigned_user_id: form.assigned_user_id ? parseInt(form.assigned_user_id) : null,
    })
  }

  return (
    <Modal onClose={onClose} title="تعديل الخطوة">
      <div className="space-y-3">
        <div className={theme.field.wrapper}>
          <label className={theme.field.label}>العنوان *</label>
          <input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            className={clsx(theme.input.base, 'text-sm')}
          />
        </div>
        <div className={theme.field.wrapper}>
          <label className={theme.field.label}>الوصف</label>
          <input
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className={clsx(theme.input.base, 'text-sm')}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className={theme.field.wrapper}>
            <label className={theme.field.label}>رقم الإدارة</label>
            <input
              type="number"
              value={form.assigned_department_id}
              onChange={e => setForm(p => ({ ...p, assigned_department_id: e.target.value }))}
              className={clsx(theme.input.base, 'text-sm')}
            />
          </div>
          <div className={theme.field.wrapper}>
            <label className={theme.field.label}>رقم الموظف</label>
            <input
              type="number"
              value={form.assigned_user_id}
              onChange={e => setForm(p => ({ ...p, assigned_user_id: e.target.value }))}
              className={clsx(theme.input.base, 'text-sm')}
            />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_parallel}
            onChange={e => setForm(p => ({ ...p, is_parallel: e.target.checked }))}
            className="rounded border-slate-300 dark:border-slate-600 text-primary-600"
          />
          <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <GitBranch className="w-3 h-3 text-violet-500" />
            تنفيذ بالتوازي مع الخطوة السابقة
          </span>
        </label>
      </div>
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
          حفظ التعديلات
        </button>
      </div>
    </Modal>
  )
}