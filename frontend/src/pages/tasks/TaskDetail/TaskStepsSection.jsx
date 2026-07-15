import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Check, Loader2, Trash2, ArrowDownCircle, Edit3, ArrowUp, ArrowDown, X,ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import { TaskStepsApi } from '@/api' 
import { getApiError, formatDate } from '@/utils/helpers'
import clsx from 'clsx'
import { theme, resolveFieldState } from '@/constants/theme';
import {Modal} from '@/components/common'
import SidebarTree from '@/pages/tasks/TaskDetail/SidebarTree'
export default function TaskStepsSection({ taskId, taskPermissions, task: initialTask }) {
  const queryClient = useQueryClient()
  const [addStepText, setAddStepText] = useState('')
  const [showAddStep, setShowAddStep] = useState(false)
  // أضف هذه الأسطر مع تعريفات الـ useState في بداية الكومبوننت
  const [addStepTitle, setAddStepTitle] = useState(''); // هذا هو المسؤول عن العنوان
  const [addStepDesc, setAddStepDesc] = useState('');   // هذا للوصف
  const [isParallel, setIsParallel] = useState(false);  // هذا للمتوازي
  const [assignedTo, setAssignedTo] = useState({ type: null, id: null, name: '' });
  // إدارة التعديل المحلي لنص الخطوة
  const [editingStepId, setEditingStepId] = useState(null)
  const [editingText, setEditingText] = useState('')

  // إدارة رقم الصفحة محلياً بناءً على نظام apply_pagination الموحد
  const [stepsPage, setStepsPage] = useState(1)
  const [allSteps, setAllSteps] = useState([]) 

  const [showPickerModal, setShowPickerModal] = useState(false);

  const canAddStep = taskPermissions?.can_add_step ?? false
  const canEditStep = taskPermissions?.can_edit_step ?? false
  
  // جلب خطوات المهمة من الـ Endpoint المنفصل الجديد بناءً على الصفحة الحالية
  const { data: stepsPaginationData, isLoading: is_LoadingMore } = useQuery({
    queryKey: ['task-steps', parseInt(taskId), { stepsPage }],
    queryFn: () => TaskStepsApi.listSteps(taskId, { page: stepsPage, limit: 20 }).then(r => r.data),
    placeholderData: (keepPreviousData) => keepPreviousData,
  })

  // استخراج البيانات ومؤشرات الصفحات من هيكل الـ apply_pagination الراجع
  const totalSteps = stepsPaginationData?.total || initialTask?.steps?.total || 0
  const hasMoreSteps = stepsPaginationData ? stepsPaginationData.has_more : (initialTask?.steps?.has_more ?? false)

  // تأثير (Effect) للمزامنة الأولية عند فتح الصفحة من الـ initialTask الممرر
  useEffect(() => {
    if (initialTask?.steps?.items && stepsPage === 1) {
      setAllSteps(initialTask.steps.items)
    }
  }, [initialTask, stepsPage])

  // التأثير المعدل لدمج البيانات حسب طلبك بالظبط
  useEffect(() => {
    if (stepsPaginationData?.items) {
      if (stepsPage === 1) {
        setAllSteps(stepsPaginationData.items)
      } else {
        setAllSteps(prev => {
          const existingIds = new Set(prev.map(item => item.id))
          const newItems = stepsPaginationData.items.filter(item => !existingIds.has(item.id))
          return [...prev, ...newItems]
        })
      }
    }
  }, [stepsPaginationData, stepsPage])

  const completedSteps = allSteps.filter(s => s.is_completed).length || 0
  const progressPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

  // تحديث حالة الخطوة أو نصها (مكتملة / غير مكتملة / تعديل وصف)
  const stepMutation = useMutation({
    mutationFn: ({ stepId, data }) => TaskStepsApi.updateStep(taskId, stepId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', parseInt(taskId)] })
      queryClient.invalidateQueries({ queryKey: ['task-steps', parseInt(taskId)] })
      setEditingStepId(null)
    },
    onError: (err) => toast.error(getApiError(err) || 'فشل تحديث الخطوة'),
  })

  // ميزة إعادة الترتيب الجماعي (Bulk Reorder Mutation)
  const reorderMutation = useMutation({
    mutationFn: (stepsOrderList) => TaskStepsApi.reorderSteps(taskId, stepsOrderList),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-steps', parseInt(taskId)] })
      toast.success('تم تحديث ترتيب الخطوات')
    },
    onError: (err) => {
      toast.error(getApiError(err) || 'فشل حفظ الترتيب الجديد')
      // إعادة جلب البيانات الأصلية في حال حدوث خطأ بالسيرفر للتراجع عن التغيير المحلي
      queryClient.invalidateQueries({ queryKey: ['task-steps', parseInt(taskId)] })
    }
  })

  // إضافة خطوة فرعية جديدة
  const addStepMutation = useMutation({
    mutationFn: (data) => TaskStepsApi.addStep(taskId, data),
    onSuccess: () => {
      setStepsPage(1) // تصفير الـ pagination للعودة لأول صفحة وعرض العنصر الجديد
      queryClient.invalidateQueries({ queryKey: ['task', parseInt(taskId)] })
      queryClient.invalidateQueries({ queryKey: ['task-steps', parseInt(taskId)] })
      setAddStepTitle('')
      setAddStepDesc('')
      setIsParallel(false)
      setAssignedTo({ type: null, id: null, name: '' })
      setShowAddStep(false)
      toast.success('تم إضافة الخطوة بنجاح')
    },
    onError: (err) => toast.error(getApiError(err) || 'فشلت عملية إضافة الخطوة'),
  })

  // حذف الخطوة الفرعية
  const deleteStepMutation = useMutation({
    mutationFn: (stepId) => TaskStepsApi.deleteStep(taskId, stepId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', parseInt(taskId)] })
      queryClient.invalidateQueries({ queryKey: ['task-steps', parseInt(taskId)] })
      setAllSteps(prev => prev.filter(item => item.id !== deleteStepMutation.variables))
      toast.success('تم حذف الخطوة بنجاح')
    },
    onError: (err) => toast.error(getApiError(err) || 'فشلت عملية حذف الخطوة'),
  })

  const handleLoadMore = () => {
    if (is_LoadingMore || !hasMoreSteps) return
    setStepsPage(prev => prev + 1)
  }

  const handleDeleteStep = (stepId) => {
    if (!canEditStep) {
      toast.error('غير مصرح لك بحذف الخطوات الفرعية')
      return
    }
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذه الخطوة؟')) {
      deleteStepMutation.mutate(stepId)
    }
  }

  const handleToggleStep = (stepId, isCompleted) => {
    if (!canEditStep) {
      toast.error('غير مصرح لك بتعديل حالة الخطوات الفرعية')
      return
    }
    if (stepMutation.isPending) return
    
    // Optimistic UI update لتجربة مستخدم فورية فائقة السرعة
    setAllSteps(prev => prev.map(s => s.id === stepId ? { ...s, is_completed: !isCompleted } : s))
    stepMutation.mutate({ stepId, data: { is_completed: !isCompleted } })
  }

  const handleAddStep = () => {
    if (!addStepTitle.trim() || addStepMutation.isPending) return

    const payload = {
      title: addStepTitle.trim(),
      description: addStepDesc.trim(), // أو حقل الوصف الخاص بك
      is_parallel: isParallel,
      assigned_user_id: assignedTo.type === 'employee' ? assignedTo.id : null,
      assigned_department_id: assignedTo.type === 'department' ? assignedTo.id : null,
      status: 'pending' // ثابت كما طلبت
    }
    
    addStepMutation.mutate(payload)
  }

  // تفعيل وضع التعديل للخطوة
  const startEditing = (step) => {
    setEditingStepId(step.id)
    setEditingText(step.description)
  }

  // حفظ النص الجديد للخطوة
  const handleSaveDescription = (stepId) => {
    if (!editingText.trim() || stepMutation.isPending) return
    
    // تحديث محلي فوري (Optimistic)
    setAllSteps(prev => prev.map(s => s.id === stepId ? { ...s, description: editingText.trim() } : s))
    stepMutation.mutate({ stepId, data: { description: editingText.trim() } })
  }

  // منطق تحريك الخطوات (لأعلى / لأسفل) مع الحفظ التلقائي الجماعي
  const handleMoveStep = (index, direction) => {
    if (!canEditStep || reorderMutation.isPending) return
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= allSteps.length) return

    const updatedSteps = [...allSteps]
    // تبديل العناصر في المصفوفة المحلية
    const [movedItem] = updatedSteps.splice(index, 1)
    updatedSteps.splice(targetIndex, 0, movedItem)

    // إعادة حساب الـ step_order بناءً على المؤشر الجديد (Index) لضمان تتابع صحيح للباك آند
    const reorderedPayload = updatedSteps.map((step, idx) => ({
        id: step.id,
        step_order: idx + 1
      }));

    // تحديث الحالة محلياً فوراً لتوفير تجربة سريعة جداً
    setAllSteps(updatedSteps)
    
    // إرسال المصفوفة المرتبة بالكامل للباك آند دفعة واحدة
    reorderMutation.mutate(reorderedPayload)
  }

  return (
    <div className={clsx("p-4 sm:p-5 space-y-4", theme.card.base)}>
      {/* الترويسة وقسم إحصاءات الإنجاز */}
      <div className={clsx("flex items-center justify-between border-b pb-3", theme.card.border)}>
        <div className="space-y-1 min-w-0 flex-1">
          <h3 className={clsx("text-xs sm:text-sm font-bold flex items-center gap-1.5", theme.text.primary)}>
            <span className="w-1.5 h-3 bg-primary-600 rounded-sm inline-block" />
            <span>الخطوات الفرعية والمهام المصغرة ({completedSteps}/{totalSteps})</span>
          </h3>
          {totalSteps > 0 && (
            <div className="flex items-center gap-2 max-w-xs">
              <div className="w-24 bg-gray-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
              </div>
              <span className={clsx("text-[10px] font-bold", theme.text.muted)}>{progressPercentage}%</span>
            </div>
          )}
        </div>

        {canAddStep && (
          <button
            onClick={() => setShowAddStep(!showAddStep)}
            className={clsx(
              "flex items-center gap-1 text-xs font-bold transition-all px-2.5 py-1.5 rounded-lg border",
              // نستخدم نمط "Ghost" أو "Subtle" من الثيم للحصول على مظهر متناسق
              "text-primary-600 dark:text-primary-400",
              "bg-primary-50 dark:bg-primary-900/20",
              "border-primary-100 dark:border-primary-800",
              "hover:bg-primary-100 dark:hover:bg-primary-900/40"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة خطوة</span>
          </button>
        )}
      </div>

      {/* حقل إنشاء خطوة جديدة */}
      {showAddStep && (
        <div className={clsx("flex flex-col gap-3 p-4 rounded-xl border", theme.card.subtle)}>
  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">إضافة خطوة جديدة</h4>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {/* العنوان */}
    <input
      className={clsx("h-9 px-3 text-sm rounded-lg border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500", theme.text.primary)}
      placeholder="عنوان الخطوة..."
      value={addStepTitle} // تأكد من إنشاء state لهذا
      onChange={(e) => setAddStepTitle(e.target.value)}
      maxLength={255}
    />

    {/* الوصف */}
    <input
      className={clsx("h-9 px-3 text-sm rounded-lg border bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500", theme.text.primary)}
      placeholder="وصف إضافي (اختياري)..."
      value={addStepDesc}
      onChange={(e) => setAddStepDesc(e.target.value)}
    />

    {/* المسؤولين (Department / User) */}
    <div className="flex gap-2">
      <div className={clsx(
        "flex-1 h-9 flex items-center px-3 text-sm rounded-lg border",
        "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700",
        "text-slate-500"
      )}>
        {assignedTo.id ? assignedTo.name : "لم يتم تحديد مسؤول بعد..."}
      </div>
      
      {/* هنا يمكنك وضع زر يفتح "مودال" (Modal) يحتوي على SidebarTree لاختيار الموظف */}
      <button 
        onClick={() => setShowPickerModal(true)} 
        className="h-9 px-3 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
      >
        تحديد
      </button>
    </div>
    {/* خيار متوازي */}
    <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
      <input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" onChange={(e) => setIsParallel(e.target.checked)} />
      تنفيذ متوازي (Parallel)
    </label>
  </div>

  <div className="flex items-center justify-between pt-2">
    

    {/* الأزرار */}
    <div className="flex gap-2">
      <button
        className="h-9 px-4 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
        onClick={() => setShowAddStep(false)}
      >
        إلغاء
      </button>
      <button
        className="h-9 px-6 text-xs font-bold rounded-lg bg-primary-600 hover:bg-primary-700 text-white"
        disabled={addStepMutation.isPending}
        onClick={handleAddStep}
      >
        {addStepMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'حفظ الخطوة'}
      </button>
    </div>
  </div>
</div>
      )}

      {/* عرض القائمة والمصفوفة */}
      {allSteps.length === 0 ? (
        <div className={clsx(
          "text-center py-10 px-4 rounded-xl border border-dashed transition-colors",
          // استخدام التوكنز لضمان التوافق مع الثيم
          theme.card.subtle, // خلفية خفيفة
          "border-slate-300 dark:border-slate-700", // حدود منقطة مناسبة للوضع النهاري والليلي
          theme.text.muted // لون نص ثانوي مريح للعين
        )}>
          <div className="flex flex-col items-center gap-2">
            {/* أيقونة اختيارية لتعزيز التجربة البصرية */}
            <ClipboardList className="w-8 h-8 opacity-20" />
            <span className="text-xs font-medium">
              لا توجد أي خطوات فرعية مجدولة لتنفيذ هذه المهمة.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          {/* حاوية التمرير (Scroll) للخطوات فقط */}
          <div className="space-y-2 max-h-80 overflow-y-auto pl-1 custom-scrollbar">
            {allSteps.map((step, index) => {
              const isCurrentStepMutating = stepMutation.isPending && stepMutation.variables?.stepId === step.id;
              const isCurrentStepDeleting = deleteStepMutation.isPending && deleteStepMutation.variables === step.id;
              const isEditing = editingStepId === step.id;

              return (
                <div
                  key={step.id}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm transition-all group',
                    // الحالة المكتملة
                    step.is_completed 
                      ? 'bg-green-50/40 dark:bg-green-900/10 border-green-200 dark:border-green-900/30' 
                      // الحالة العادية (استخدام theme.card.subtle للتناغم)
                      : clsx(theme.card.subtle, "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm"),
                    // حالة الحذف (تأثير مرئي)
                    isCurrentStepDeleting && 'opacity-50 pointer-events-none bg-red-50/20 dark:bg-red-900/20'
                  )}
                >
                  {/* أزرار الأسهم لإعادة الترتيب (تظهر فقط عند صلاحية التعديل وبدون قفل التحميل) */}
                  {canEditStep && !isEditing && (
                    <div className={clsx(
                      "flex flex-col items-center gap-0.5 flex-shrink-0 transition-opacity",
                      // استخدام التوكنز للتحكم في الظهور
                      "opacity-0 group-hover:opacity-100",
                      "focus-within:opacity-100" // لضمان ظهورها أيضاً عند التنقل عبر لوحة المفاتيح
                    )}>
                      <button
                        onClick={() => handleMoveStep(index, 'up')}
                        disabled={index === 0 || reorderMutation.isPending}
                        className={clsx(
                          "p-0.5 transition-colors",
                          "text-slate-400 dark:text-slate-500",
                          "hover:text-primary-600 dark:hover:text-primary-400",
                          "disabled:opacity-20"
                        )}
                        title="تحريك لأعلى"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveStep(index, 'down')}
                        disabled={index === allSteps.length - 1 || reorderMutation.isPending}
                        className={clsx(
                          "p-0.5 transition-colors",
                          "text-slate-400 dark:text-slate-500",
                          "hover:text-primary-600 dark:hover:text-primary-400",
                          "disabled:opacity-20"
                        )}
                        title="تحريك لأسفل"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* الدائرة التفاعلية لتبديل الحالة */}
                  {canEditStep ? (
                    <>
                    <select
                        className="h-8 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 outline-none cursor-pointer"
                        value={step.status}
                        onChange={(e) => handleToggleStep(step.id, step.is_completed)}
                        disabled={isCurrentStepMutating || isCurrentStepDeleting || isEditing}
                      >
                        <option value="pending">معلقة</option>
                        <option value="in_progress">قيد التنفيذ</option>
                        <option value="completed">مكتملة</option>
                        <option value="cancelled">ملغاة</option>
                      </select>
                      
                    <button
                      onClick={() => handleToggleStep(step.id, step.is_completed)}
                      disabled={isCurrentStepMutating || isCurrentStepDeleting || isEditing}
                      className={clsx(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1',
                        // الألوان بناءً على الحالة
                        step.is_completed
                          ? 'bg-green-500 border-green-500 text-white focus:ring-green-400 dark:focus:ring-green-800'
                          : clsx(
                              'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900',
                              'hover:border-primary-500 focus:ring-primary-400'
                            ),
                        // حالة التحميل أو التعديل
                        (isCurrentStepMutating || isEditing) && 'opacity-60 cursor-not-allowed',
                        // تحسين حالة الـ Offset في الوضع الليلي
                        'focus:ring-offset-white dark:focus:ring-offset-slate-800'
                      )}
                      title={step.is_completed ? 'تعيين كغير مكتملة' : 'تعيين كمكتملة'}
                    >
                      {isCurrentStepMutating ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin text-current" />
                      ) : (
                        step.is_completed && <Check className="w-3 h-3 stroke-[3]" />
                      )}
                    </button>
                    </>
                  ) : (
                    <div 
                      className={clsx(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                        // الحالة المكتملة
                        step.is_completed 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800 text-green-600 dark:text-green-400' 
                          // الحالة غير المكتملة
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      )}
                    >
                      {step.is_completed && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  )}

                  {/* نص وصف الإجراء أو حقل إدخال التعديل */}
                  {isEditing ? (
                    <div className="flex-1 flex gap-1.5 items-center">
                      <input
                        className={clsx(
                          "flex-1 h-8 rounded-lg px-2 text-xs font-medium border transition-all",
                          "bg-white dark:bg-slate-950",
                          "border-primary-400 focus:ring-1 focus:ring-primary-500",
                          "text-slate-900 dark:text-slate-100"
                        )}
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveDescription(step.id)}
                        maxLength={255}
                        autoFocus
                      />
                      {/* زر الحفظ */}
                      <button
                        onClick={() => handleSaveDescription(step.id)}
                        disabled={isCurrentStepMutating || !editingText.trim()}
                        className={clsx(
                          "p-1.5 rounded-md transition-colors",
                          "text-white bg-green-600 hover:bg-green-700",
                          "disabled:opacity-50"
                        )}
                        title="حفظ التعديل"
                      >
                        {isCurrentStepMutating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      </button>
                      {/* زر الإلغاء */}
                      <button
                        onClick={() => setEditingStepId(null)}
                        className={clsx(
                          "p-1.5 rounded-md transition-colors",
                          "text-slate-500 dark:text-slate-400",
                          "bg-slate-100 dark:bg-slate-800",
                          "hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                        title="إلغاء التعديل"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span
                      className={clsx(
                        'flex-1 min-w-0 font-medium break-words leading-relaxed transition-colors',
                        step.is_completed 
                          ? 'line-through text-slate-400 dark:text-slate-600 font-normal' 
                          : 'text-slate-700 dark:text-slate-300'
                      )}
                    >
                      {step.description}
                    </span>
                  )}

                  {/* أدوات التحكم الجانبية الحذف والتعديل والوقت */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {step.is_completed && step.completed_at && (
                      <span className={clsx(
                        "text-[10px] sm:text-xs px-2 py-0.5 rounded-md font-semibold whitespace-nowrap border transition-colors",
                        "bg-green-50 dark:bg-green-900/20",
                        "text-green-600 dark:text-green-400",
                        "border-green-200 dark:border-green-800"
                      )}>
                        اكتملت: {formatDate(step.completed_at)}
                      </span>
                    )}

                    {/* زر تشغيل وضع التعديل للنص */}
                    {canEditStep && !isEditing && (
                      <button
                        onClick={() => startEditing(step)}
                        className={clsx(
                          "p-1 rounded-md transition-all duration-200",
                          // الألوان (Text & Hover)
                          "text-slate-400 dark:text-slate-500",
                          "hover:text-primary-600 dark:hover:text-primary-400",
                          "hover:bg-slate-100 dark:hover:bg-slate-800",
                          // التحكم في الظهور
                          "opacity-0 group-hover:opacity-100 focus:opacity-100"
                        )}
                        title="تعديل نص الخطوة"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* زر الحذف الفني */}
                    {canEditStep && !isEditing && (
                      <button
                        onClick={() => handleDeleteStep(step.id)}
                        disabled={isCurrentStepDeleting}
                        className={clsx(
                          "p-1 rounded-md transition-all duration-200",
                          // الألوان (Text & Hover)
                          "text-slate-400 dark:text-slate-500",
                          "hover:text-red-600 dark:hover:text-red-400",
                          "hover:bg-red-50 dark:hover:bg-red-900/20",
                          // التحكم في الظهور
                          "opacity-0 group-hover:opacity-100 focus:opacity-100",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                        title="حذف هذه الخطوة"
                      >
                        {isCurrentStepDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* زر تحميل المزيد */}
            {hasMoreSteps && (
              <div className={clsx(
                "pt-3 flex justify-center border-t",
                theme.card.border, // توحيد لون الحدود
                theme.card.subtle  // توحيد الخلفية الموحدة
              )}>
                <button
                  onClick={handleLoadMore}
                  disabled={is_LoadingMore}
                  className={clsx(
                    "inline-flex items-center gap-1.5 text-xs font-bold px-5 py-2.5 rounded-xl transition-all group",
                    // الألوان والحدود
                    "bg-white dark:bg-slate-900",
                    "border border-slate-200 dark:border-slate-700",
                    "text-slate-500 dark:text-slate-400",
                    // تأثيرات التفاعل
                    "hover:text-primary-600 dark:hover:text-primary-400",
                    "hover:border-primary-200 dark:hover:border-primary-800",
                    "hover:bg-slate-50 dark:hover:bg-slate-800",
                    "disabled:opacity-60"
                  )}
                >
                  {is_LoadingMore ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
                  ) : (
                    <ArrowDownCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-500 transition-colors" />
                  )}
                  <span>عرض المزيد من الخطوات</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
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
                        // إذا كان المود يحتوي على خاصية full_name فهو موظف، وإلا فهو قسم
                        const type = node.full_name ? 'employee' : 'department';
                        console.log(node);
                        
                        setAssignedTo({
                          type: type,
                          id: node.id,
                          name: node.full_name || node.name
                        });
                        setShowPickerModal(false);
                      }} 
                    />
                  </div>
                </Modal>
            )}
    </div>
  )
} 