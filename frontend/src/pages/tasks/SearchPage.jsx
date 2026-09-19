// src/pages/SearchPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { searchApi, orgApi, tasksApi } from '@/api'
import { PageLoader, EmptyState } from '@/components/common'
import TaskCard from '@/components/common/TaskCard' // تم تعديل المسار ليتطابق مع مكان الكارت الموحد
import { getApiError } from '@/utils/helpers'
import { toast } from 'react-hot-toast' // تأكد من استيراد مكتبة الـ toast المفضلة لديك هنا

export default function SearchPage() {
  const queryClient = useQueryClient() // إصلاح: تعريف الـ queryClient المفقود لعمل الـ Invalidation
  
  const [params, setParams] = useState({
    q: '', file_number: '', status: '', priority: '',
    is_urgent: '', department_id: '', due_date_from: '',
    due_date_to: '', created_from: '', created_to: '',
    page: 1,
  })
  const [submitted, setSubmitted] = useState(false)

  // جلب قائمة الإدارات لتغذية حقل الاختيار
  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => orgApi.listDepts({ is_active: true }).then(r => r.data),
  })

  // استدعاء دالة البحث المتقدم
  const { data, isLoading } = useQuery({
    queryKey: ['search', params],
    queryFn: () => searchApi.advanced({
      ...params,
      is_urgent: params.is_urgent === '' ? undefined : params.is_urgent === 'true',
      status: params.status || undefined,
      priority: params.priority || undefined,
      department_id: params.department_id || undefined,
      due_date_from: params.due_date_from || undefined,
      due_date_to: params.due_date_to || undefined,
      created_from: params.created_from || undefined,
      created_to: params.created_to || undefined,
      q: params.q || undefined,
      file_number: params.file_number || undefined,
    }).then(r => r.data),
    enabled: submitted,
    keepPreviousData: true,
  })

  // دالة تحديث المفضلة
  const favMutation = useMutation({
    mutationFn: (taskId) => tasksApi.toggleFavorite(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries(['search', params])
      toast.success('تم تحديث المفضلة بنجاح')
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  // دالة طلب الاستعجال
  const urgencyMutation = useMutation({
    mutationFn: (taskId) => tasksApi.requestUrgency(taskId, {}),
    onSuccess: () => {
      queryClient.invalidateQueries(['search', params])
      toast.success('تم إرسال طلب الاستعجال بنجاح')
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const set = (key, val) => setParams(p => ({ ...p, [key]: val, page: 1 }))

  const handleSearch = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const handleClearAll = () => {
    setParams({
      q: '', file_number: '', status: '', priority: '',
      is_urgent: '', department_id: '', due_date_from: '',
      due_date_to: '', created_from: '', created_to: '',
      page: 1,
    })
    setSubmitted(false)
  }

  const results = data?.items || []
  const total = data?.total || 0

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-0 py-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Search className="w-5 h-5 text-[var(--color-primary-500)]" />
          البحث المتقدم
        </h1>
        <p className="text-sm text-gray-500">ابحث بدقة في جميع المهام والمعاملات المتاحة لك</p>
      </div>

      {/* استمارة الفلاتر والبحث */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 space-y-4 shadow-sm">
        {/* حقول النصوص */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input pr-9 focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]"
              placeholder="ابحث بالعنوان أو الوصف..."
              value={params.q}
              onChange={e => set('q', e.target.value)}
            />
          </div>
          <input
            className="input w-full sm:w-48 focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]"
            placeholder="رقم الملف..."
            value={params.file_number}
            onChange={e => set('file_number', e.target.value)}
          />
        </div>

        {/* فلاتر القوائم المنسدلة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select className="input bg-white text-xs sm:text-sm" value={params.status} onChange={e => set('status', e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="not_started">لم تبدأ</option>
            <option value="in_progress">جارية</option>
            <option value="completed">مكتملة</option>
            <option value="cancelled">ملغاة</option>
          </select>
          <select className="input bg-white text-xs sm:text-sm" value={params.priority} onChange={e => set('priority', e.target.value)}>
            <option value="">كل الأولويات</option>
            <option value="low">منخفضة</option>
            <option value="medium">متوسطة</option>
            <option value="high">عالية</option>
            <option value="critical">حرجة</option>
          </select>
          <select className="input bg-white text-xs sm:text-sm" value={params.is_urgent} onChange={e => set('is_urgent', e.target.value)}>
            <option value="">الكل (درجة الاستعجال)</option>
            <option value="true">مستعجلة</option>
            <option value="false">غير مستعجلة</option>
          </select>
          <select className="input bg-white text-xs sm:text-sm" value={params.department_id} onChange={e => set('department_id', e.target.value)}>
            <option value="">كل الإدارات</option>
            {(depts || []).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>

        {/* نطاقات التواريخ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 mb-1">تاريخ الانتهاء من</label>
            <input type="date" className="input text-xs" value={params.due_date_from} onChange={e => set('due_date_from', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 mb-1">تاريخ الانتهاء إلى</label>
            <input type="date" className="input text-xs" value={params.due_date_to} onChange={e => set('due_date_to', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 mb-1">تاريخ الإنشاء من</label>
            <input type="date" className="input text-xs" value={params.created_from} onChange={e => set('created_from', e.target.value)} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 mb-1">تاريخ الإنشاء إلى</label>
            <input type="date" className="input text-xs" value={params.created_to} onChange={e => set('created_to', e.target.value)} />
          </div>
        </div>

        {/* أزرار التحكم في أسفل الفلتر */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-bold text-gray-400 hover:text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-all"
          >
            مسح الكل
          </button>
          <button type="submit" className="btn-primary bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)]">
            <Search className="w-4 h-4" />
            بحث
          </button>
        </div>
      </form>

      {/* لوحة عرض النتائج المسترجعة */}
      {submitted && (
        <div className="space-y-3">
          {isLoading ? (
            <PageLoader />
          ) : results.length === 0 ? (
            <EmptyState
              icon={Search}
              title="لا توجد نتائج مطابقة"
              description="لم نجد أي مهمة تطابق خيارات الفرز الحالية، جرب تعديل المدخلات."
            />
          ) : (
            <>
              <p className="text-sm text-gray-500 bg-gray-50 inline-block px-3 py-1 rounded-lg">
                تم العثور على {total} نتيجة مطابقة
              </p>
              
              <div className="grid grid-cols-1 gap-3">
                {results.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    // تمرير حالة الانتظار لمعرفة أي كارت يتم تحديثه حالياً ومنع تكرار الضغط
                    isFavPending={favMutation.isPending && favMutation.variables === task.id}
                    isUrgencyPending={urgencyMutation.isPending && urgencyMutation.variables === task.id}
                    onFavorite={() => favMutation.mutate(task.id)}
                    onUrgency={() => urgencyMutation.mutate(task.id)}
                  />
                ))}
              </div>

              {/* أزرار الانتقال بين الصفحات Pagination */}
              {total > 20 && (
                <div className="flex justify-center items-center gap-2 mt-5">
                  <button
                    disabled={params.page === 1}
                    onClick={() => setParams(p => ({ ...p, page: p.page - 1 }))}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-40 transition-all"
                  >
                    السابق
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-gray-500 bg-white rounded-xl border border-gray-150">
                    {params.page} / {Math.ceil(total / 20)}
                  </span>
                  <button
                    disabled={params.page * 20 >= total}
                    onClick={() => setParams(p => ({ ...p, page: p.page + 1 }))}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-40 transition-all"
                  >
                    التالي
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}