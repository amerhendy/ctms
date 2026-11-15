import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Save, Loader2, HelpCircle, Network,Repeat,Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { recurringTasksApi } from '@/api'
import api from '@/api' 
import clsx from 'clsx'
// 🌟 استيراد المودل الشجري الجديد
import DepartmentTreeModal from '@/modals/DepartmentTreeModal'


const INITIAL_STATE = {
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
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
]

export default function RecurringTaskFormModal({ id, onClose, onSuccess }) {
  const qc = useQueryClient()
  const [formData, setFormData] = useState(INITIAL_STATE)
  // تخزين الاسم النصي للقسم المختار للعرض فقط في الواجهة
  const [selectedDeptName, setSelectedDeptName] = useState('')
  // حالة فتح وإغلاق مودل الشجرة الفرعي
  const [isTreeOpen, setIsTreeOpen] = useState(false)
  
  const [activeHint, setActiveHint] = useState({
    dept: false,
    desc: false,
    pattern: false,
    interval: false,
  })

  const toggleHint = (field) => {
    setActiveHint(prev => ({ ...prev, [field]: !prev[field] }))
  }

  // 1. جلب قائمة الأقسام الخام من السيرفر
  const { data: rawDepartments } = useQuery({
    queryKey: ['departments-list'],
    queryFn: () => api.get('/departments').then(res => res.data)
  })

  const departmentsList = rawDepartments?.items || rawDepartments || [];

  // 2. إذا كنا في وضع التعديل (id موجود)، نقوم بجلب بيانات القالب الحالي
  const { data: templateData, isLoading: isLoadingData } = useQuery({
    queryKey: ['recurring-template', id],
    queryFn: () => recurringTasksApi.getRecurringTask(id).then(res => res.data),
    enabled: !!id,
  })

  // تحديث الاسم النصي للقسم عند تحميل حقول التعديل لأول مرة
  useEffect(() => {
    if (templateData) {
      setFormData({
        title: templateData.title || '',
        description: templateData.description || '',
        department_id: templateData.department_id || '',
        priority: templateData.priority || 'medium',
        recurrence_pattern: templateData.recurrence_pattern || 'daily',
        interval_value: templateData.interval_value || 1,
        day_of_week: templateData.day_of_week !== null ? templateData.day_of_week : '',
        day_of_month: templateData.day_of_month !== null ? templateData.day_of_month : '',
        next_run_date: templateData.next_run_date || '',
        is_active: templateData.is_active !== undefined ? templateData.is_active : true,
        run_time: templateData.run_time ? templateData.run_time.substring(0, 5) : '08:00',
      })
      
      // ابحث عن الاسم الفعلي للقسم ليظهر بداخل مربع الاختيار عند التعديل
      if (templateData.department_id && departmentsList.length > 0) {
        const found = departmentsList.find(d => d.id === templateData.department_id)
        if (found) setSelectedDeptName(found.name)
      }
    }
  }, [templateData, departmentsList])

  // استلام القسم المختار من مودل الشجرة
  const handleDepartmentSelect = (dept) => {
    if(dept == null)return
    if(dept.length==0)return
    let deptId=dept.id
    let deptName=dept.name
    //deptId, deptName
    setFormData(prev => ({ ...prev, department_id: deptId }))
    setSelectedDeptName(deptName)
  }

  // 3. ميوتايشن الحفظ (إنشاء أو تعديل)
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
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title || !formData.department_id || !formData.next_run_date) {
      toast.error('الرجاء ملء الحقول الأساسية (العنوان، القسم، وتاريخ التشغيل الأول)')
      return
    }
    saveMutation.mutate(formData)
  }

  return (
    <div className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto transition-all duration-300",
        // التأثيرات الخلفية (Backdrop)
        "bg-black/50 backdrop-blur-sm"
      )}>
      <div 
        className={clsx(
          "w-full max-w-2xl text-right flex flex-col my-8 rounded-xl shadow-xl transition-colors",
          // الألوان في الوضع النهاري
          "bg-white",
          // الألوان في الوضع الليلي
          "dark:bg-gray-900 dark:border dark:border-gray-800"
        )} 
        dir="rtl"
      >
        
        {/* الهيدر */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Repeat className="w-5 h-5 text-indigo-500" />
            <Zap className="w-3 h-3 text-amber-400 absolute -top-1 -right-1" fill="currentColor" />
          </div>
          <h3 className="text-md font-bold text-gray-900 dark:text-white">
            {id ? 'تعديل إعدادات قالب التكرار' : 'إنشاء قالب أتمتة مهام جديد'}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg transition-colors text-gray-400 
                      hover:bg-gray-100 dark:hover:bg-gray-800 
                      hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoadingData ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs">جاري تحميل بيانات القالب الإداري...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            
            {/* عنوان المهمة وقسمها المطور */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="w-full">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  عنوان المهمة القالب *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="مثال: الفحص الفني المجدول للسيرفرات"
                  className={clsx(
                    "w-full rounded-lg p-2 text-sm transition-all outline-none border",
                    // النهاري
                    "bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-600",
                    // الليلي
                    "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500 dark:focus:border-indigo-500"
                  )}
                />
              </div>

              {/* 🌟 حقل الاختيار الشجري التفاعلي الجديد بدلاً من السيلكت التقليدي */}
              <div className="w-full">
                <div className="flex items-center gap-1 mb-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">القسم المستهدف للمهمة *</label>
                  <button type="button" onClick={() => toggleHint('dept')} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {activeHint.dept && (
                  <div className="mb-2 p-2.5 bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed transition-all">
                    اضغط على حقل الاختيار ليفتح لك شجرة الهيكل الإداري الكاملة للشركة، مما يتيح لك اختيار أي قطاع أو فرع بدقة متناهية.
                  </div>
                )}

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
                        : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800"
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
              </div>
            </div>

            {/* الوصف */}
            <div>
              <div className="w-full">
                <div className="flex items-center gap-1 mb-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    وصف المهمة وتعليمات التنفيذ
                  </label>
                  <button 
                    type="button" 
                    onClick={() => toggleHint('desc')} 
                    className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* رسالة التلميح - تظهر فقط عند التفعيل */}
                {activeHint.desc && (
                  <div className="mb-2 p-3 bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed transition-all">
                    قم بكتابة تعليمات واضحة وشاملة. يُفضل استخدام نقاط مرقمة لخطوات التنفيذ لضمان سهولة فهم المهمة من قبل الموظف المسؤول.
                  </div>
                )}

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="اكتب تفاصيل المهمة هنا..."
                  className={clsx(
                    "w-full rounded-lg p-3 text-xs resize-none transition-all outline-none border",
                    // النهاري
                    "bg-white border-gray-200 text-gray-700 placeholder-gray-400 focus:border-indigo-600",
                    // الليلي
                    "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-indigo-500"
                  )}
                />
              </div>

              {activeHint.desc && (
                <div className="mb-2 p-2.5 bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed transition-all animate-fadeIn">
                  اكتب هنا دليلاً واضحاً وخطوات تفصيلية لكيفية تنفيذ المهمة.
                </div>
              )}

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className={clsx(
                  "w-full border rounded-lg p-2 text-sm transition-all focus:outline-none",
                  // النهاري
                  "bg-white border-gray-200 text-gray-700 placeholder-gray-400 focus:border-indigo-600",
                  // الليلي
                  "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-indigo-500"
                )}
                placeholder="اكتب هنا الخطوات التشغيلية..."
              />
            </div>

            {/* الأولوية ونمط التكرار */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  درجة الأولوية
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className={clsx(
                    "w-full border rounded-lg p-2 text-sm transition-all focus:outline-none cursor-pointer",
                    // النهاري
                    "bg-white border-gray-200 text-gray-700 focus:border-indigo-600",
                    // الليلي
                    "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:border-indigo-500"
                  )}
                >
                  <option value="low" className="dark:bg-gray-800">منخفضة</option>
                  <option value="medium" className="dark:bg-gray-800">متوسطة</option>
                  <option value="high" className="dark:bg-gray-800">عالية</option>
                  <option value="critical" className="dark:bg-gray-800">حرجة</option>
                </select>
              </div>

              <div>
                <div className="flex items-center gap-1 mb-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    نمط التكرار الدوري *
                  </label>
                  <button 
                    type="button" 
                    onClick={() => toggleHint('pattern')} 
                    className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                <select
                  name="recurrence_pattern"
                  value={formData.recurrence_pattern}
                  onChange={handleChange}
                  className={clsx(
                    "w-full border rounded-lg p-2 text-sm transition-all outline-none font-medium cursor-pointer",
                    // النهاري
                    "bg-white border-gray-200 text-gray-700 focus:border-indigo-600",
                    // الليلي
                    "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:border-indigo-500"
                  )}
                >
                  <option value="daily" className="dark:bg-gray-800">يومي (Daily)</option>
                  <option value="weekly" className="dark:bg-gray-800">أسبوعي (Weekly)</option>
                  <option value="monthly" className="dark:bg-gray-800">شهري (Monthly)</option>
                  <option value="quarterly" className="dark:bg-gray-800">ربع سنوي (Quarterly)</option>
                  <option value="yearly" className="dark:bg-gray-800">سنوي (Yearly)</option>
                </select>
              </div>

              <div className="w-full">
                <div className="flex items-center gap-1 mb-1">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    معدل الفاصل الزمني (Interval)
                  </label>
                  <button 
                    type="button" 
                    onClick={() => toggleHint('interval')} 
                    className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* تلميح اختياري */}
                {activeHint.interval && (
                  <div className="mb-2 p-2.5 bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg text-[11px] text-indigo-900 dark:text-indigo-300">
                    حدد القيمة الرقمية للفاصل الزمني (مثلاً: 2 إذا اخترت "أسبوعي" فسيكون التكرار كل أسبوعين).
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">كل</span>
                  <input
                    type="number"
                    name="interval_value"
                    min="1"
                    value={formData.interval_value}
                    onChange={handleChange}
                    className={clsx(
                      "w-20 border rounded-lg p-2 text-sm text-center font-mono focus:outline-none transition-all",
                      // النهاري
                      "bg-white border-gray-200 text-gray-900 focus:border-indigo-600",
                      // الليلي
                      "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-indigo-500"
                    )}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">وحدة زمنية</span>
                </div>
              </div>
            </div>

            {/* الشروط الديناميكية */}
            {formData.recurrence_pattern === 'weekly' && (
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 p-3 rounded-lg animate-fadeIn">
                <label className="block text-xs font-bold text-blue-900 dark:text-blue-200 mb-1">
                  تحديد يوم الصدور الأسبوعي:
                </label>
                <select
                  name="day_of_week"
                  value={formData.day_of_week}
                  onChange={handleChange}
                  className={clsx(
                    "w-full border rounded-lg p-2 text-sm focus:outline-none cursor-pointer transition-all",
                    // النهاري
                    "bg-white border-blue-200 text-gray-900 focus:border-indigo-600",
                    // الليلي
                    "dark:bg-gray-800 dark:border-blue-800 dark:text-white dark:focus:border-indigo-500"
                  )}
                >
                  <option value="" className="dark:bg-gray-800">اختر يوم العمل الأسبوعي...</option>
                  {DAYS_OF_WEEK.map(day => (
                    <option key={day.value} value={day.value} className="dark:bg-gray-800">
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
            )}  

            {formData.recurrence_pattern === 'monthly' && (
              <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/50 p-3 rounded-lg animate-fadeIn">
                <label className="block text-xs font-bold text-purple-900 dark:text-purple-200 mb-1">
                  تحديد تاريخ اليوم في الشهر (1 - 31):
                </label>
                <input
                  type="number"
                  name="day_of_month"
                  min="1"
                  max="31"
                  value={formData.day_of_month}
                  onChange={handleChange}
                  placeholder="مثال: 25"
                  className={clsx(
                    "w-full border rounded-lg p-2 text-sm font-mono transition-all outline-none",
                    // النهاري
                    "bg-white border-purple-200 text-gray-900 focus:border-indigo-600",
                    // الليلي
                    "dark:bg-gray-800 dark:border-purple-800 dark:text-white dark:focus:border-indigo-500",
                    // إخفاء أسهم الأرقام الافتراضية
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  )}
                />
              </div>
            )}

            {/* تاريخ أول تشغيل ووقت الصدور */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  تاريخ التشغيل التلقائي القادم *
                </label>
                <input
                  type="date"
                  name="next_run_date"
                  value={formData.next_run_date}
                  onChange={handleChange}
                  className={clsx(
                    "w-full border rounded-lg p-2 text-sm font-mono focus:outline-none transition-all cursor-pointer",
                    // النهاري
                    "bg-white border-gray-200 text-gray-900 focus:border-indigo-600",
                    // الليلي - نقوم بعكس أيقونة التاريخ باستخدام filter
                    "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-indigo-500 dark:[color-scheme:dark]"
                  )}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  وقت صدور المهمة *
                </label>
                <input
                  type="time"
                  name="run_time"
                  value={formData.run_time}
                  onChange={handleChange}
                  required
                  className={clsx(
                    "w-full border rounded-lg p-2 text-sm font-mono focus:outline-none transition-all cursor-pointer",
                    // النهاري
                    "bg-white border-gray-200 text-gray-900 focus:border-indigo-600",
                    // الليلي - استخدام color-scheme لقلب ألوان أيقونة الوقت
                    "dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-indigo-500 dark:[color-scheme:dark]"
                  )}
                />
              </div>
            </div>

            {/* حالة تفعيل القالب الإداري الدوري */}
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700 mt-2">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  حالة نشاط أتمتة القالب
                </span>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="sr-only peer"
                />
                {/* التعديلات هنا تضمن ظهور التوغل بشكل صحيح في كلا الوضعين */}
                <div className="w-9 h-5 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer 
                                peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full 
                                peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] 
                                after:start-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 
                                after:border after:rounded-full after:h-4 after:w-4 after:transition-all 
                                peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500">
                </div>
              </label>
            </div>

            {/* أزرار التحكم السفلى بالنافذة */}
            <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-4 mt-6">
              {/* زر الإلغاء */}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 
                          text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold transition-colors"
              >
                إلغاء
              </button>

              {/* زر الحفظ */}
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
      </div>

      {/* 🌟 استدعاء مودل شجرة الأقسام الفرعي التفاعلي */}
      <DepartmentTreeModal 
        isOpen={isTreeOpen}
        onClose={() => setIsTreeOpen(false)}
        
        selectedId={formData.department_id}
        onSelect={handleDepartmentSelect}
      />
    </div>
  )
}