// src/pages/admin/RecurringTasksLogs.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, CheckCircle2, XCircle, Clock, RefreshCw, X,Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { recurringTasksApi } from '@/api' // ملف الأكسيوس الرئيسي لتوجيه الطلبات
import PaginationProvider from '@/components/common/PaginationProvider'
export default function RecurringTasksLogs({ onClose }) {
  const qc = useQueryClient()

  // 1. جلب السجلات من الباك إند
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['recurring-logs'],
    queryFn: () => recurringTasksApi.getRecurringTasksLog().then(res => res.data),
  })

  // 2. ميوتايشن لتشغيل الأتمتة يدوياً فوراً للفحص
  const triggerMutation = useMutation({
    mutationFn: () => recurringTasksApi.triggerAutomation(),
    onSuccess: (res) => {
      toast.success(`اكتمل الفحص الإداري! تم توليد (${res.data.tasks_generated}) مهمة جديدة.`);
      qc.invalidateQueries(['recurring-logs']); // تحديث الجدول فوراً
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تشغيل محرك الأتمتة الدوري');
    }
  })

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
  <div className="bg-white rounded-xl shadow-2xl h-full w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
    
    {/* 1. الهيدر وأزرار التحكم (ثابت في الأعلى خارج منطقة السكرول) */}
    <div className="p-6 pb-2 text-right flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border-b border-gray-100" dir="rtl">
      <div>
        <h2 className="text-md font-bold text-gray-900">سجل عمليات نظام الأتمتة (Execution Logs)</h2>
        <p className="text-xs text-gray-400 mt-1">تابع عمليات فحص الخادم، المهام الصادرة تلقائياً، والتوثيق الرقابي للأتمتة.</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => refetch()}
          className="p-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          title="تحديث البيانات"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => triggerMutation.mutate()}
          disabled={triggerMutation.isPending}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>تشغيل محرك الأتمتة والفحص فوراً</span>
        </button>

        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors mr-2">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </div>

    {/* 2. منطقة المحتوى القابلة للتمرير (Scrollable Body) */}
    <div className="p-6 pt-4 flex-1 overflow-y-auto min-h-0 text-right" dir="rtl">
      
      {/* جدول السجلات والتوثيق */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <PaginationProvider storageKey="admin_log_recurring">
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
                return recurringTasksApi.getRecurringTasksLog(cleanParams).then(res => res.data)
              }
            });
            const logs = apiResponse?.items || []
            const totalPages = apiResponse?.pages || 1
            PaginationProvider.totalPages = totalPages;
            return(
            <div className="space-y-4">
              
              {/* 🌟 هنا تظهر البيانات والتحكمات "فوق الجدول" مباشرة كما طلبت */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs text-gray-600 flex flex-wrap gap-4 font-medium">
                <div>الحالة الحالية للبحث: <span className="text-indigo-600 font-bold">{currentParams.search || 'لا يوجد'}</span></div>
                <div>الترتيب حسب: <span className="text-indigo-600 font-bold">{currentParams.sort_by} ({currentParams.sort_order})</span></div>
                <div>الصفحة الحالية: <span className="text-indigo-600 font-bold">{currentParams.page}</span></div>
              </div>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  <span className="text-xs font-medium">جاري تحميل سجلات الأتمتة الإدارية...</span>
                </div>
              ) : !logs || logs.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400">لا توجد سجلات تشغيل متوفرة حتى الآن في النظام.</div>
              ):(
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right text-gray-500">
                      <thead>
                        <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100 sticky top-0 z-10 shadow-[inset_0_-1px_0_rgba(243,244,246,1)]">
                          <th className="p-4">قالب المهمة الدوري</th>
                          <th className="p-4">توقيت التشغيل الفعلي</th>
                          <th className="p-4">حالة العملية</th>
                          <th className="p-4">المهمة الناتجة للمكتب</th>
                          <th className="p-4">تفاصيل الفشل والتقارير</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4 font-semibold text-gray-900">{log.template_title}</td>
                            <td className="p-4 font-mono text-gray-500 text-[11px]">
                              {new Date(log.run_at).toLocaleString('ar-EG')}
                            </td>
                            <td className="p-4">
                              {log.status === 'success' || log.status === 'SUCCESS' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-100">
                                  <CheckCircle2 className="w-3 h-3" /> ناجحة
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-100">
                                  <XCircle className="w-3 h-3" /> فشلت
                                </span>
                              )}
                            </td>
                            <td className="p-4 font-medium text-indigo-600">
                              {log.generated_task_id ? `مهمة رقم #${log.generated_task_id}` : '—'}
                            </td>
                            <td className="p-4 text-gray-400 max-w-xs truncate" title={log.error_message}>
                              {log.error_message ? (
                                <span className="text-red-500 font-mono text-[11px] block text-wrap">{log.error_message}</span>
                              ) : (
                                <span className="text-gray-400">تمت جدولة الدورة القادمة بنجاح</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            )
          }}

        </PaginationProvider>
        
      </div>

    </div>
  </div>
</div>
  )
}