import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { Save, Loader2, Network } from 'lucide-react'
import toast from 'react-hot-toast'
import { recurringTasksApi } from '@/api'
import api from '@/api'
import clsx from 'clsx'
import { Modal, FormField } from '@/components/common'

import DepartmentTreeModal from '@/components/DepartmentTrees/DepartmentTreeModal'
import RecurringTaskStepsManager from '@/components/Recurring/RecurringTaskStepsManager'

const DAYS_OF_WEEK = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
]

const DEFAULT_FORM_VALUES = {
  title: '',
  description: '',
  department_id: '',
  priority: 'medium',
  recurrence_pattern: 'daily',
  interval_value: 1,
  day_of_week: '',
  day_of_month: '',
  next_run_date: '',
  is_active: true,
  run_time: '08:00',
  steps: [],
}

export default function RecurringTaskFormModal({isOpen, id, onClose, onSuccess }) {
  const qc = useQueryClient()
  const [selectedDeptName, setSelectedDeptName] = useState('')
  const [isTreeOpen, setIsTreeOpen] = useState(false)

  // 1. إعداد react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: DEFAULT_FORM_VALUES,
  })

  // مراقبة حقل نمط التكرار لعرض الحقول الشرطية
  const recurrencePattern = watch('recurrence_pattern')

  // 2. جلب قائمة الأقسام المطابقة للـ Dropdown أو البحث بالاسم
  const { data: rawDepartments } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => api.get('/departments').then((res) => res.data),
  })

  const departmentsList = rawDepartments?.items || rawDepartments || []

  // 3. جلب بيانات القالب الحالي في حالة التعديل
  const { data: templateData, isLoading: isLoadingData } = useQuery({
    queryKey: ['recurring-template', id],
    queryFn: () => recurringTasksApi.getRecurringTask(id).then((res) => res.data),
    enabled: !!id,
  })

  // 4. عمل Reset للحقول ومزامنة الحالة فور وصول البيانات من الـ API
  useEffect(() => {
    if (templateData) {
      reset({
        title: templateData.title || '',
        description: templateData.description || '',
        department_id: templateData.department_id || '',
        priority: templateData.priority || 'medium',
        recurrence_pattern: templateData.recurrence_pattern || 'daily',
        interval_value: templateData.interval_value || 1,
        day_of_week: templateData.day_of_week !== null && templateData.day_of_week !== undefined ? templateData.day_of_week : '',
        day_of_month: templateData.day_of_month !== null && templateData.day_of_month !== undefined ? templateData.day_of_month : '',
        next_run_date: templateData.next_run_date || '',
        is_active: templateData.is_active !== undefined ? templateData.is_active : true,
        run_time: templateData.run_time ? templateData.run_time.substring(0, 5) : '08:00',
        steps: templateData.steps || [],
      })

      if (templateData.department_id && departmentsList.length > 0) {
        const found = departmentsList.find((d) => d.id === templateData.department_id)
        if (found) setSelectedDeptName(found.name)
      }
    }
  }, [templateData, departmentsList, reset])

  // التعامل مع اختيار القسم من شجرة الهيكل
  const handleDepartmentSelect = (dept) => {
    if (!dept || Array.isArray(dept) && dept.length === 0) return
    const targetDept = Array.isArray(dept) ? dept[0] : dept
    setValue('department_id', targetDept.id, { shouldValidate: true, shouldDirty: true })
    setSelectedDeptName(targetDept.name)
  }

  // 5. Mutation الحفظ والتعامل مع تنظيف Payload
  const saveMutation = useMutation({
    mutationFn: (data) => {
      const cleanData = { ...data }
      if (cleanData.priority) cleanData.priority = cleanData.priority.toLowerCase()

      if (cleanData.recurrence_pattern === 'weekly') {
        cleanData.day_of_week = cleanData.day_of_week !== '' ? Number(cleanData.day_of_week) : null
        cleanData.day_of_month = null
      } else if (cleanData.recurrence_pattern === 'monthly') {
        cleanData.day_of_month = cleanData.day_of_month !== '' ? Number(cleanData.day_of_month) : null
        cleanData.day_of_week = null
      } else {
        cleanData.day_of_week = null
        cleanData.day_of_month = null
      }

      if (cleanData.steps && cleanData.steps.length > 0) {
        cleanData.steps = cleanData.steps.map((st, idx) => ({
          title: st.title,
          description: st.description || '',
          step_order: idx + 1,
          is_parallel: !!st.is_parallel,
          assigned_department_id: st.assigned_department_id || null,
          assigned_user_id: st.assigned_user_id || null,
        }))
      }

      if (id) return recurringTasksApi.updateRecurringTask(id, cleanData)
      return recurringTasksApi.createRecurringTask(cleanData)
    },
    onSuccess: () => {
      toast.success(id ? 'تم تحديث قالب التكرار بنجاح' : 'تم حفظ قالب التكرار التلقائي بنجاح')
      qc.invalidateQueries(['recurring-templates'])
      onSuccess()
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'حدث خطأ أثناء حفظ القالب')
    },
  })

  const onSubmit = (formData) => {
    saveMutation.mutate(formData)
  }

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={id ? 'تعديل إعدادات قالب التكرار' : 'إنشاء قالب أتمتة مهام جديد'}
      size="lg"
    >
      {isLoadingData ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500 gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs">جاري تحميل بيانات القالب الإداري...</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2" dir="rtl">
          
          {/* عنوان المهمة والقسم */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="عنوان المهمة" required error={errors.title?.message}>
              <input
                type="text"
                placeholder="مثال: الفحص الفني المجدول للسيرفرات"
                className={clsx(
                  "w-full rounded-lg p-2 text-sm transition-all outline-none border",
                  "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-600",
                  "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-500",
                  errors.title && "border-red-500 dark:border-red-500"
                )}
                {...register('title', { required: 'عنوان المهمة مطلوب' })}
              />
            </FormField>

            <FormField
              label="القسم المستهدف للمهمة"
              hint="اضغط على حقل الاختيار ليفتح لك شجرة الهيكل الإداري الكاملة للشركة، مما يتيح لك اختيار أي قطاع أو فرع بدقة متناهية."
              required
              error={errors.department_id?.message}
            >
              <input
                type="hidden"
                {...register('department_id', { required: 'يرجى اختيار القسم المستهدف' })}
              />
              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  onClick={() => setIsTreeOpen(true)}
                  value={selectedDeptName ? selectedDeptName : 'اضغط لاختيار القسم من الهيكل الشجري...'}
                  className={clsx(
                    "w-full border rounded-lg p-2 text-xs text-right cursor-pointer pl-10 focus:outline-none transition-colors",
                    selectedDeptName
                      ? "border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-bold bg-indigo-50/30 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800",
                    errors.department_id && "border-red-500 dark:border-red-500"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setIsTreeOpen(true)}
                  className="absolute left-2 p-1 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Network className="w-4 h-4" />
                </button>
              </div>
            </FormField>
          </div>

          {/* وصف المهمة */}
          <FormField
            label="وصف المهمة"
            hint="قم بكتابة تعليمات واضحة وشاملة لضمان سهولة فهم المهمة من قبل الموظف المسؤول."
            error={errors.description?.message}
          >
            <textarea
              rows={3}
              placeholder="اكتب تفاصيل والخطوات التشغيلية للمهمة هنا..."
              className={clsx(
                "w-full rounded-lg p-3 text-xs resize-none transition-all outline-none border",
                "bg-white border-gray-200 text-gray-700 placeholder-gray-400 focus:border-indigo-600",
                "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-indigo-500"
              )}
              {...register('description')}
            />
          </FormField>

          {/* الأولوية، نمط التكرار والفاصل الزمني */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="درجة الأولوية" required error={errors.priority?.message}>
              <select
                className={clsx(
                  "w-full border rounded-lg p-2 text-sm transition-all focus:outline-none cursor-pointer",
                  "bg-white border-gray-200 text-gray-700 focus:border-indigo-600",
                  "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:border-indigo-500"
                )}
                {...register('priority', { required: 'درجة الأولوية مطلوبة' })}
              >
                <option value="low" className="dark:bg-gray-800">منخفضة</option>
                <option value="medium" className="dark:bg-gray-800">متوسطة</option>
                <option value="high" className="dark:bg-gray-800">عالية</option>
                <option value="critical" className="dark:bg-gray-800">حرجة</option>
              </select>
            </FormField>

            <FormField label="نمط التكرار الدوري" required error={errors.recurrence_pattern?.message}>
              <select
                className={clsx(
                  "w-full border rounded-lg p-2 text-sm transition-all outline-none font-medium cursor-pointer",
                  "bg-white border-gray-200 text-gray-700 focus:border-indigo-600",
                  "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:border-indigo-500"
                )}
                {...register('recurrence_pattern', { required: 'نمط التكرار مطلوب' })}
              >
                <option value="daily" className="dark:bg-gray-800">يومي (Daily)</option>
                <option value="weekly" className="dark:bg-gray-800">أسبوعي (Weekly)</option>
                <option value="monthly" className="dark:bg-gray-800">شهري (Monthly)</option>
                <option value="quarterly" className="dark:bg-gray-800">ربع سنوي (Quarterly)</option>
                <option value="yearly" className="dark:bg-gray-800">سنوي (Yearly)</option>
              </select>
            </FormField>

            <FormField
              label="معدل الفاصل الزمني"
              hint='حدد القيمة الرقمية للفاصل الزمني (مثلاً: 2 إذا اخترت "أسبوعي" فسيكون التكرار كل أسبوعين).'
              required
              error={errors.interval_value?.message}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">كل</span>
                <input
                  type="number"
                  min="1"
                  className={clsx(
                    "w-20 border rounded-lg p-2 text-sm text-center font-mono focus:outline-none transition-all",
                    "bg-white border-gray-200 text-gray-900 focus:border-indigo-600",
                    "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-indigo-500"
                  )}
                  {...register('interval_value', {
                    required: 'مطلوب',
                    valueAsNumber: true,
                    min: { value: 1, message: 'يجب أن يكون 1 على الأقل' }
                  })}
                />
                <span className="text-xs text-gray-500 dark:text-gray-400">وحدة زمنية</span>
              </div>
            </FormField>
          </div>

          {/* الشروط الديناميكية لعرض أيام التكرار */}
          {recurrencePattern === 'weekly' && (
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 p-3 rounded-lg">
              <label className="block text-xs font-bold text-blue-900 dark:text-blue-200 mb-1">
                تحديد يوم الصدور الأسبوعي:
              </label>
              <select
                className={clsx(
                  "w-full border rounded-lg p-2 text-sm focus:outline-none cursor-pointer transition-all",
                  "bg-white border-blue-200 text-gray-900 focus:border-indigo-600",
                  "dark:bg-gray-800 dark:border-blue-800 dark:text-white dark:focus:border-indigo-500"
                )}
                {...register('day_of_week')}
              >
                <option value="" className="dark:bg-gray-800">اختر يوم العمل الأسبوعي...</option>
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value} className="dark:bg-gray-800">
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {recurrencePattern === 'monthly' && (
            <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/50 p-3 rounded-lg">
              <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1">
                تحديد تاريخ اليوم في الشهر (1 - 31):
              </label>
              <input
                type="number"
                min="1"
                max="31"
                placeholder="مثال: 25"
                className={clsx(
                  "w-full border rounded-lg p-2 text-sm font-mono transition-all outline-none",
                  "bg-white border-purple-200 text-gray-900 focus:border-indigo-600",
                  "dark:bg-gray-800 dark:border-purple-800 dark:text-white dark:focus:border-indigo-500"
                )}
                {...register('day_of_month')}
              />
            </div>
          )}

          {/* تاريخ التشغيل ووقت الصدور */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="تاريخ التشغيل التلقائي القادم" required error={errors.next_run_date?.message}>
              <input
                type="date"
                className={clsx(
                  "w-full border rounded-lg p-2 text-sm font-mono focus:outline-none transition-all cursor-pointer",
                  "bg-white border-gray-200 text-gray-900 focus:border-indigo-600",
                  "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-indigo-500 dark:[color-scheme:dark]",
                  errors.next_run_date && "border-red-500 dark:border-red-500"
                )}
                {...register('next_run_date', { required: 'تاريخ التشغيل مطلوب' })}
              />
            </FormField>

            <FormField label="وقت صدور المهمة" required error={errors.run_time?.message}>
              <input
                type="time"
                className={clsx(
                  "w-full border rounded-lg p-2 text-sm font-mono focus:outline-none transition-all cursor-pointer",
                  "bg-white border-gray-200 text-gray-900 focus:border-indigo-600",
                  "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-indigo-500 dark:[color-scheme:dark]",
                  errors.run_time && "border-red-500 dark:border-red-500"
                )}
                {...register('run_time', { required: 'وقت الصدور مطلوب' })}
              />
            </FormField>
          </div>

          {/* حالة تفعيل القالب */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 mt-2">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              حالة نشاط أتمتة القالب
            </span>

            <Controller
              name="is_active"
              control={control}
              render={({ field: { value, onChange } }) => (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer 
                                  peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                                  peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                                  after:start-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 
                                  after:border after:rounded-full after:h-4 after:w-4 after:transition-all 
                                  peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500">
                  </div>
                </label>
              )}
            />
          </div>

          {/* إدارة خطوات المهمة */}
          <Controller
            name="steps"
            control={control}
            render={({ field: { value, onChange } }) => (
              <RecurringTaskStepsManager
                steps={value || []}
                onChange={onChange}
              />
            )}
          />

          {/* أزرار الإجراءات */}
          <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                        text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 
                        text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{id ? 'تحديث وحفظ الإعدادات' : 'حفظ وجدولة القالب'}</span>
            </button>
          </div>
        </form>
      )}

      {/* مودل شجرة الأقسام الفرعي */}
      <DepartmentTreeModal
        isOpen={isTreeOpen}
        onClose={() => setIsTreeOpen(false)}
        selectedId={watch('department_id')}
        onSelect={handleDepartmentSelect}
      />
    </Modal>
  )
}