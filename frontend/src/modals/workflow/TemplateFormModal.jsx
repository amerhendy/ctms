// src/modals/workflow/TemplateFormModal.jsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  GitBranch, Plus, Building2, Users,
  ArrowUp, ArrowDown, X, Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'

import { Modal } from '@/components/common'
import { theme } from '@/constants/theme'
import { workflowTemplatesApi } from '@/api/workflow'
import { getApiError } from '@/utils/helpers'
import SidebarTree from '@/components/DepartmentTrees/SidebarTree'
import clsx from 'clsx'

export default function TemplateFormModal({ template, onClose }) {
  const qc = useQueryClient()
  const isEdit = !!template?.id

  const [showPickerModal, setShowPickerModal] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  const [form, setForm] = useState({
    name: template?.name || '',
    description: template?.description || '',
  })

  const [steps, setSteps] = useState(
    template?.steps?.length
      ? template.steps.map(s => ({
          title: s.title || '',
          description: s.description || '',
          step_order: s.step_order,
          is_parallel: !!s.is_parallel,
          assigned_department_id: s.assigned_department_id || '',
          assigned_user_id: s.assigned_user_id || '',
          assigned_name: s.assigned_user_name || s.assigned_department_name || '',
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
    <Modal open={true} onClose={onClose} title={isEdit ? 'تعديل القالب' : 'إنشاء قالب Workflow جديد'} size="lg">
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
                    type="button"
                    onClick={() => { setShowPickerModal(true); setStepIndex(idx); }} 
                    className="h-9 px-3 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 text-slate-700 dark:text-slate-200"
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
                const isEmployee = !!node.full_name;
                const update = {
                  assigned_department_id: isEmployee ? '' : node.id,
                  assigned_user_id: isEmployee ? node.id : '',
                  assigned_name: node.full_name || node.name
                };
                
                setSteps(prev => prev.map((s, i) => i === stepIndex ? { ...s, ...update } : s));
                setShowPickerModal(false);
              }} 
            />
          </div>
        </Modal>
      )}
    </Modal>
  )
}