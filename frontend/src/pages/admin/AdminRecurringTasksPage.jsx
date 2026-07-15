// src/pages/admin/AdminRecurringTasksPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, RefreshCw, Trash2, CheckCircle, XCircle,  Loader2,Plus, History } from 'lucide-react'
import toast from 'react-hot-toast'
import { recurringTasksApi } from '@/api'
//import RecurringTasksLogs from './RecurringTasksLogs'
import RecurringTasksLogs from './RecurringTasksLogs'
import RecurringTaskFormModal from '@/modals/RecurringTaskFormModal'
import useAuthStore from '@/stores/authStore'
import PageHeader from '@/components/common/pageheader'
import PaginationProvider from '@/components/common/PaginationProvider'
export default function AdminRecurringTasksPage() {
  const qc = useQueryClient()
  const { isAdmin } = useAuthStore()
  const navigate = useNavigate()
  // حالات التحكم في النوافذ المنبثقة (Modal States)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false)

  // 1. جلب كل القوالب المتكررة من السيرفر
  const { data: templates, isLoading } = useQuery({
    queryKey: ['recurring-templates'],
    queryFn: () => recurringTasksApi.listRecurringTasks().then(res => res.data?.items)
  })

  // 2. ميوتايشن التفعيل والتعطيل السريع (Toggle Status)
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => recurringTasksApi.updateRecurringTask(id, { is_active }),
    onSuccess: () => {
      toast.success('تم تحديث حالة تفعيل القالب بنجاح')
      qc.invalidateQueries(['recurring-templates'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'فشل تحديث حالة القالب')
    }
  })

  // 3. ميوتايشن الحذف النهائي (Soft Delete)
  const deleteMutation = useMutation({
    mutationFn: (id) => recurringTasksApi.deleteRecurringTask(id),
    onSuccess: () => {
      toast.success('تم حذف قالب التكرار بنجاح')
      qc.invalidateQueries(['recurring-templates'])
    },
    onError: (err) => {
      toast.error(err.response?.data?.detail || 'فشل حذف القالب')
    }
  })

  // فتح المودال للإضافة الجديدة
  const handleCreateClick = () => {
    setSelectedTemplateId(null)
    setIsFormModalOpen(true)
  }

  // فتح المودال لتعديل قالب موجود
  const handleEditClick = (id) => {
    setSelectedTemplateId(id)
    setIsFormModalOpen(true)
  }

  // ترجمة أنماط التكرار لواجهة عربية مفهومة للمدراء
  const translatePattern = (pattern) => {
    const dict = {
      daily: 'يومي',
      weekly: 'أسبوعي',
      monthly: 'شهري',
      quarterly: 'ربع سنوي',
      yearly: 'سنوي'
    }
    return dict[pattern] || pattern
  }

  return (
    <div className="container mx-auto px-4 py-6 text-right" dir="rtl">
      
      {/* الهيدر العلوي */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <PageHeader title="أتمتة المهام المتكررة" icon={Calendar}>
            <p className="text-xs text-gray-400 mt-1">
              إنشاء وجدولة قوالب المهام التشغيلية والدورية لإصدارها تلقائياً للأقسام.
            </p>
           
          </PageHeader>
        
        </div>
         {isAdmin() && (
              <button 
                onClick={() => setIsLogsModalOpen(true)}
                className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-gray-200 shadow-sm transition-colors"
              >
                <History className="w-3.5 h-3.5 text-gray-500" />
                <span>سجل عمليات الأتمتة (Logs)</span>
              </button>
            )}
            {isAdmin() && (
              <button 
                onClick={handleCreateClick}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2.5 rounded-lg font-bold shadow-sm shadow-indigo-100 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                إنشاء قالب دوري جديد
              </button>
            )}
      </div>

      {/* منطقة الجدول واستعراض البيانات */}
      <PaginationProvider storageKey="admin_recurring">
        {({ currentParams, handleSort, updateState }) => {
          const { data: apiResponse, isLoading } = useQuery({
            queryKey: ['recurring-templates', currentParams.page, currentParams.page_size,currentParams.search, currentParams.sort_by, currentParams.sort_order],
            queryFn: () => {
              const cleanParams = {
                page: currentParams.page,
                page_size: currentParams.page_size,
                sort_by: currentParams.sort_by || 'created_at',
                sort_order: currentParams.sort_order || 'desc'
              }
              if (currentParams.search && currentParams.search.trim() !== '') {
                cleanParams.search = currentParams.search.trim()
              }
              return recurringTasksApi.listRecurringTasks(cleanParams).then(res => res.data)
            }
          })

          // استخراج المصفوفة القادمة من الباك إند بناءً على الـ Response الجديد
          const templates = apiResponse?.items || []
          const totalPages = apiResponse?.pages || 1
          PaginationProvider.totalPages = totalPages;
          return (
          <div className="space-y-4">
            
            {/* 🌟 هنا تظهر البيانات والتحكمات "فوق الجدول" مباشرة كما طلبت */}
            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-400 flex flex-wrap gap-4 font-medium transition-colors">
              <div>
                الحالة الحالية للبحث: 
                <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-1">
                  {currentParams.search || 'لا يوجد'}
                </span>
              </div>
              <div>
                الترتيب حسب: 
                <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-1">
                  {currentParams.sort_by} ({currentParams.sort_order})
                </span>
              </div>
              <div>
                الصفحة الحالية: 
                <span className="text-indigo-600 dark:text-indigo-400 font-bold ml-1">
                  {currentParams.page}
                </span>
              </div>
            </div>

            {/* منطقة الجدول واستعراض البيانات */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-xs font-medium">جاري جلب قوالب المهام المتكررة من النظام...</span>
              </div>
            ) : (
              <div className="card overflow-hidden p-0 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-right text-gray-500">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
                      <tr>
                        <th 
                            onClick={() => handleSort('title')} 
                            className="px-6 py-3.5 font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            عنوان قالب المهمة {currentParams.sort_by === 'title' ? (currentParams.sort_order === 'asc' ? ' 🔼' : ' 🔽') : ''}
                          </th>
                        <th className="px-6 py-3.5 font-bold">دورية التكرار</th>
                        <th className="px-6 py-3.5 font-bold">الفاصل الزمني</th>
                        <th 
                            onClick={() => handleSort('next_run_date')} 
                            className="px-6 py-3.5 font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                          >
                            تاريخ النشر التلقائي القادم {currentParams.sort_by === 'next_run_date' ? (currentParams.sort_order === 'asc' ? ' 🔼' : ' 🔽') : ''}
                          </th>
                        <th className="px-6 py-3.5 font-bold">حالة الأتمتة</th>
                        <th className="px-6 py-3.5 font-bold text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {templates?.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="px-6 py-4 font-semibold text-gray-900">{t.title}</td>
                          <td className="px-6 py-4">
                            <span className="bg-indigo-50 text-indigo-700 text-[11px] px-2.5 py-1 rounded-full font-bold">
                              {translatePattern(t.recurrence_pattern)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600 font-medium">كل {t.interval_value}</td>
                          <td className="px-6 py-4 text-xs text-gray-600 font-mono">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>{t.next_run_date}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => toggleActiveMutation.mutate({ id: t.id, is_active: !t.is_active })}
                              disabled={toggleActiveMutation.isPending}
                              className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-bold transition-colors ${
                                t.is_active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              }`}
                            >
                              {t.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                              {t.is_active ? 'نشط ويولّد مهام' : 'موقوف مؤقتاً'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              <button onClick={() => handleEditClick(t.id)} className="text-indigo-600 hover:text-indigo-900 text-xs font-bold transition-colors">تعديل الإعدادات</button>
                              <button 
                                onClick={() => {
                                  if (confirm('هل أنت متأكد من حذف قالب الأتمتة التشغيلي هذا؟ لن يتم توليد أي مهمة تابعة له في المستقبل.')) {
                                    deleteMutation.mutate(t.id)
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                                className="text-rose-600 hover:text-rose-900 transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {templates?.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-12 text-gray-700 dark:text-gray-300 text-xs font-medium">لا توجد قوالب مهام متكررة مجدولة حالياً في هذا القسم.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}}
      </PaginationProvider>


      {/* المودال الذكي للإضافة والتعديل التفاعلي */}
      {isFormModalOpen && (
        <RecurringTaskFormModal
          id={selectedTemplateId}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => setIsFormModalOpen(false)}
        />
      )}
      {isLogsModalOpen && (
        <RecurringTasksLogs onClose={() => setIsLogsModalOpen(false)} />
      )}
    </div>
  )
}