// pages/tasks/TaskDetail/TaskModels/CreateWorkflowModal
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,  Loader2, X, GitBranch, LayoutTemplate
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { theme } from '@/constants/theme'
import { Modal } from '@/components/common'
import { workflowApi, workflowTemplatesApi } from '@/api/workflow'
import { getApiError } from '@/utils/helpers'
import SidebarTree from '@/pages/tasks/TaskDetail/SidebarTree'
export default function CreateWorkflowModal({ taskId, onClose, onSuccess }) {
  const [mode, setMode]           = useState('custom') // 'template' | 'custom'
  const [templateId, setTemplateId] = useState('')
  const [steps, setSteps]         = useState([
    { title: '', description: '', step_order: 1, is_parallel: false, assigned_department_id: '', assigned_user_id: '' }
  ])
   const [showPickerModal, setShowPickerModal] = useState(false);
    const[stepIndex,setStepIndex]=useState(0)
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ['workflow-templates'],
    queryFn: () => workflowTemplatesApi.list().then(r => r.data),
  })

  const queryClient = useQueryClient()
  const createMutation = useMutation({
    mutationFn: (data) => workflowApi.create(taskId, data),
    onSuccess: () => {
      toast.success('تم إنشاء الـ Workflow بنجاح')
      queryClient.invalidateQueries({ queryKey: ['task-workflow', taskId] })
      onSuccess()
    },
    onError: (err) => toast.error(getApiError(err) || 'فشل إنشاء الـ Workflow'),
  })

  const addStep = () => setSteps(prev => [
    ...prev,
    { title: '', description: '', step_order: prev.length + 1, is_parallel: false, assigned_department_id: '', assigned_user_id: '' }
  ])

  const removeStep = (idx) => setSteps(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_order: i + 1 })))

  const updateStep = (idx, field, value) => setSteps(prev =>
    prev.map((s, i) => i === idx ? { ...s, [field]: value } : s)
  )

  const handleSubmit = () => {
    if (mode === 'template') {
      if (!templateId) return toast.error('اختر قالباً')
      createMutation.mutate({ template_id: parseInt(templateId) })
    } else {
      const invalid = steps.find(s => !s.title || (!s.assigned_department_id && !s.assigned_user_id))
      if (invalid) return toast.error('كل خطوة لازم يكون ليها عنوان ومسؤول')
      createMutation.mutate({
        steps: steps.map(({ assigned_name, ...s }) => ({
          ...s,
          assigned_department_id: s.assigned_department_id ? parseInt(s.assigned_department_id) : null,
          assigned_user_id: s.assigned_user_id ? parseInt(s.assigned_user_id) : null,
        }))
      })
    }
  }

  return (
    <Modal open={true} onClose={onClose} title="إنشاء Workflow للمهمة" size="lg">
      {/* اختيار الطريقة */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'custom', label: 'خطوات مخصصة', icon: GitBranch },
          { key: 'template', label: 'من قالب', icon: LayoutTemplate },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMode(key)}
            className={clsx(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all',
              mode === key
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* من قالب */}
      {mode === 'template' && (
        <div className={theme.field.wrapper}>
          <label className={theme.field.label}>اختر القالب</label>
          {loadingTemplates ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-3">
              <Loader2 className="w-4 h-4 animate-spin" /> جاري التحميل...
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-3 text-center">لا توجد قوالب متاحة</p>
          ) : (
            <div className="space-y-2">
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(String(t.id))}
                  className={clsx(
                    'w-full text-right rtl:text-right p-3 rounded-xl border text-sm transition-all',
                    templateId === String(t.id)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <div className="font-medium">{t.name}</div>
                  {t.description && <div className="text-xs text-slate-400 mt-0.5">{t.description}</div>}
                  <div className="text-xs text-slate-400 mt-1">{t.steps?.length || 0} خطوة</div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* خطوات مخصصة */}
      {mode === 'custom' && (
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2.5 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-500">خطوة {idx + 1}</span>
                {steps.length > 1 && (
                  <button onClick={() => removeStep(idx)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

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
                  <input 
                      type="hidden" 
                      name={`steps[${idx}].assigned_id`} 
                      value={step.assigned_user_id || step.assigned_department_id || ''} 
                    />
                  <div className={clsx(
                      "flex-1 h-9 flex items-center px-3 text-sm rounded-lg border",
                      "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700",
                      step.assigned_name ? "text-slate-800 dark:text-slate-200" : "text-slate-400"
                    )}>
                      {step.assigned_name || "لم يتم تحديد مسؤول بعد..."}
                  </div>
                  
                  {/* هنا يمكنك وضع زر يفتح "مودال" (Modal) يحتوي على SidebarTree لاختيار الموظف */}
                  <button 
                    onClick={() => {setShowPickerModal(true); setStepIndex(idx);}} 
                    className="h-9 px-3 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
                  >
                    تحديد
                  </button>
                </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={step.is_parallel}
                  onChange={e => updateStep(idx, 'is_parallel', e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-primary-600"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-violet-500" />
                  تنفيذ بالتوازي مع الخطوة السابقة
                </span>
              </label>
            </div>
          ))}

          <button
            onClick={addStep}
            className="w-full py-2 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-sm text-slate-500 dark:text-slate-400 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> إضافة خطوة
          </button>
        </div>
      )}

      {/* أزرار التأكيد */}
      <div className={theme.form.footer}>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          إلغاء
        </button>
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          إنشاء الـ Workflow
        </button>
      </div>
      {showPickerModal &&(
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
                          assigned_user_id:       isEmployee ? node.id : '',
                          assigned_name:          node.full_name || node.name
                        };
                        
                        // تحديث الخطوة المختارة فقط
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