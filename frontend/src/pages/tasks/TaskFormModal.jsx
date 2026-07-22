import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Network } from 'lucide-react'
import toast from 'react-hot-toast'
import { tasksApi } from '@/api'
import { Modal, FormField,ToggleSwitch,TextArea } from '@/components/common'
import { getApiError } from '@/utils/helpers'
import useAuthStore from '@/stores/authStore'
import { theme } from '@/constants/theme';
import TaskStepsManager from '@/pages/tasks/TaskStepsManager'
import clsx from 'clsx'
// 🌟 استيراد المودل الشجري الجديد
import DepartmentTreeModal from '@/modals/DepartmentTreeModal'

export default function TaskFormModal({ task, onClose, onSuccess }) {
  const isEdit = !!task
  const qc = useQueryClient()
  const { user } = useAuthStore()


  // حالات التحكم بمودل الشجرة وعرض اسم الإدارة المختار نصياً
  const [isTreeOpen, setIsTreeOpen] = useState(false)
  const [selectedDeptName, setSelectedDeptName] = useState('')
  const sliceDate=(dateInfo,length)=>{
    if(dateInfo == null){return null;}
    return dateInfo.slice(0,length)
  }
  // 2. إعدادات نموذج react-hook-form
  const { register, handleSubmit, control, watch, setValue, trigger, formState: { errors } } = useForm({
    
    defaultValues: task ? {
      title: task.title,
      description: task.description || '',
      file_number: task.file_number || '',
      start_date: sliceDate(task?.start_date,10) || '',
      due_date: sliceDate(task?.due_date,10)  || '',
      reminder_datetime: task.reminder_datetime
        ? task.reminder_datetime.slice(0, 16) : '',
      is_urgent: task.is_urgent,
      is_important: task.is_important,
      priority: task.priority,
      status: task.status,
      progress_percentage: task.progress_percentage,
      department_id: task.department_id,
    } : {
      is_urgent: false,
      is_important: true,
      priority: 'medium',
      department_id: user?.department_id || '',
    },
  })
  // مراقبة حقل معرف القسم لمعرفة القيمة الحالية
  const currentDeptId = watch('department_id')

  // 3. تحديث اسم الإدارة النصي عند فتح الموديل لأول مرة (في وضع التعديل أو الإنشاء التلقائي للمستخدم)
  useEffect(() => {
    
    if (currentDeptId && task.department) {
      setSelectedDeptName(task.department.name)
    }
  }, [currentDeptId, task])

  // 🌟 دالة استقبال القسم المختار من مودل الشجرة
  const handleDepartmentSelect = (data) => {
    let deptId=data?.id
    let deptName=data?.name
    
    setValue('department_id', deptId) // تحديث القيمة بداخل واجهة react-hook-form
    setSelectedDeptName(deptName)      // تحديث النص المعروض للمستخدم
    trigger('department_id')          // إعادة فحص شروط الحقل لإخفاء رسائل الخطأ إن وجدت
  }


  //const { fields: steps, append, remove } = useFieldArray({ control, name: 'steps' })
  const [localSteps, setLocalSteps] = useState(task?.steps || []);

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? tasksApi.update(task.id, data)
      : tasksApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'تم تحديث المهمة' : 'تم إنشاء المهمة')
      qc.invalidateQueries(['tasks'])
      onSuccess?.()
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const onSubmit = (data) => {
    const payload = {
      ...data,
      department_id: data.department_id ? Number(data.department_id) : null,
      progress_percentage: parseInt(data.progress_percentage) || 0,
      start_date: 'data.start_date' || null,
      due_date: data.due_date || null,
      reminder_datetime: data.reminder_datetime || null,
      steps: !isEdit ? localSteps : undefined
    }

    //console.log("Payload to be sent:", payload);
    mutation.mutate(payload)
  }

  const isUrgent = watch('is_urgent')
  const isImportant = watch('is_important')
  const eisenhowerLabel = () => {
    if (isUrgent && isImportant) return '🔴 عاجل ومهم – افعله الآن'
    if (!isUrgent && isImportant) return '🔵 مهم غير عاجل – خطط له'
    if (isUrgent && !isImportant) return '🟡 عاجل غير مهم – فوّضه'
    return '⚪ غير عاجل وغير مهم – تجنبه'
  }

  return (
    <>
      <Modal
        open
        onClose={onClose}
        title={isEdit ? 'تعديل المهمة' : 'إنشاء مهمة جديدة'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <FormField label="عنوان المهمة" required error={errors.title?.message}>
            <input
              placeholder="أدخل عنوان المهمة..."
              {...register('title', { required: 'العنوان مطلوب' })}
              className={clsx(
                theme.input.base, // الخلفية، الحدود، والترانزيشن
                // إضافة لون الخطأ إذا وجد
                errors.title && theme.input.error
              )}
            />
          </FormField>

          {/* Description */}
          <FormField label="الوصف">
          <TextArea
            placeholder="وصف تفصيلي للمهمة (اختياري)..."
            {...register('description')}
            className={clsx(
              "focus:ring-2 focus:ring-indigo-500/20", // التنسيق المخصص الذي تفضله
              "w-full" // ضمان ملء المساحة
            )}
          />
        </FormField>

          <div className="grid grid-cols-2 gap-3">
            {/* File number */}
            <FormField label="رقم الملف">
              <input
                placeholder="مثال: FIN-2024-001"
                {...register('file_number')}
                className={clsx(
                  theme.input.base, // النظام الموحد للثيم
                  "font-mono"       // إضافة فونت monospaced ليعطي طابعاً تقنياً مناسباً لأرقام الملفات
                )}
              />
            </FormField>
            {/* Priority */}
            <FormField label="الأولوية">
              <select 
                {...register('priority')}
                className={clsx(
                  theme.input.base, // الثيم الموحد
                  "appearance-none cursor-pointer", // إزالة السهم الافتراضي إذا أردت تخصيصه لاحقاً
                  "text-sm"
                )}
              >
                <option value="low">منخفضة</option>
                <option value="medium">متوسطة</option>
                <option value="high">عالية</option>
                <option value="critical">حرجة</option>
              </select>
            </FormField>
          </div>

          {/* Eisenhower */}
          <div className={clsx(
          "p-4 rounded-xl border transition-colors",
          "bg-gray-50 dark:bg-gray-800/30",
          "border-gray-200 dark:border-gray-700"
        )}>
          <p className={clsx("text-xs font-semibold mb-4 uppercase tracking-wide", theme.text.muted)}>
            مصفوفة أيزنهاور
          </p>
          
          <div className="flex flex-col gap-4">
            {/* تبديل العاجل */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-600 dark:text-red-400">عاجل</span>
              <ToggleSwitch 
                checked={watch('is_urgent')} 
                onChange={() => setValue('is_urgent', !watch('is_urgent'))} 
              />
            </div>

            {/* تبديل المهم */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">مهم</span>
              <ToggleSwitch 
                checked={watch('is_important')} 
                onChange={() => setValue('is_important', !watch('is_important'))} 
              />
            </div>
          </div>

          <div className={clsx("mt-4 text-xs font-medium p-2 rounded-md bg-white/50 dark:bg-black/20", theme.text.secondary)}>
            {eisenhowerLabel()}
          </div>
        </div>
        {/* Start date */}
        <div className="grid grid-cols-3 gap-4">
          <FormField label="تاريخ البدء">
            <input 
              type="date" 
              {...register('start_date')} 
              className={clsx(
                theme.input.base,
                "uppercase" // لجعل التنسيق موحداً (DD/MM/YYYY)
              )}
            />
          </FormField>

          <FormField label="تاريخ الانتهاء">
            <input 
              type="date" 
              {...register('due_date')} 
              className={clsx(
                theme.input.base,
                "uppercase"
              )}
            />
          </FormField>
          <FormField label="التذكير">
            <input 
              type="datetime-local" 
              {...register('reminder_datetime')} 
              className={clsx(
                theme.input.base, 
                "w-full text-sm",
                "focus:ring-2 focus:ring-indigo-500/20"
              )}
            />
          </FormField>
        </div>
          {/* 🌟 الإدارة المالكة - باستخدام الموديل الهيكلي الجديد */}
          <FormField label="الإدارة المالكة" required error={errors.department_id?.message}>
            {/* حقل الإدخال الخفي */}
            <input 
              type="hidden" 
              {...register('department_id', { required: 'الإدارة مطلوبة' })} 
            />
            
            {/* الحقل النصي التفاعلي */}
            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                onClick={() => setIsTreeOpen(true)}
                value={selectedDeptName ? selectedDeptName : 'اضغط لاختيار القسم من الهيكل التنظيمي الشجري...'}
                className={clsx(
                  theme.input.base, // الثيم الموحد للحدود والخلفية
                  "cursor-pointer pl-10 text-right transition-all",
                  // حالة اختيار قسم (تنسيق مخصص عند التحديد)
                  selectedDeptName 
                    ? "border-indigo-500 dark:border-indigo-400 bg-indigo-50/10 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-300"
                    : "text-gray-400 dark:text-gray-500",
                  // حالة الخطأ
                  errors.department_id && theme.input.error
                )}
              />
              <button
                type="button"
                onClick={() => setIsTreeOpen(true)}
                className={clsx(
                  "absolute left-3 p-1 transition-colors",
                  "text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                )}
              >
                <Network className="w-4 h-4" />
              </button>
            </div>
          </FormField>

          {/* Status & Progress (edit only) */}
          {isEdit && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="الحالة">
                <select className="input bg-white" {...register('status')}>
                  <option value="not_started">لم تبدأ</option>
                  <option value="in_progress">جارية</option>
                  <option value="completed">مكتملة</option>
                  <option value="cancelled">ملغاة</option>
                </select>
              </FormField>
              <FormField label="نسبة الإنجاز">
                <input
                  type="number" min="0" max="100"
                  className="input"
                  {...register('progress_percentage')}
                />
              </FormField>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary flex-1 justify-center"
            >
              {mutation.isPending ? 'جاري الحفظ...' : isEdit ? 'حفظ التغييرات' : 'إنشاء المهمة'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 🌟 المودل الشجري لفلترة واختيار الإدارة بدقة */}
      <DepartmentTreeModal 
        isOpen={isTreeOpen}
        onClose={() => setIsTreeOpen(false)}
        selectedId={Number(currentDeptId)}
        onSelect={handleDepartmentSelect}

      />
    </>
  )
}