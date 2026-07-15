// src/pages/admin/RecurringTasksLogsModal.jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, CheckCircle2, XCircle, RefreshCw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { recurringTasksApi } from '@/api'

export default function RecurringTasksLogsModal({ onClose }) {
  const qc = useQueryClient()

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['recurring-logs'],
    queryFn: () => recurringTasksApi.getRecurringTasksLog().then(res => res.data),
  })

  const triggerMutation = useMutation({
    mutationFn: () => recurringTasksApi.triggerAutomation(),
    onSuccess: (res) => {
      toast.success(`اكتمل الفحص الإداري! تم توليد (${res.data.tasks_generated}) مهمة جديدة.`);
      qc.invalidateQueries(['recurring-logs']);
    },
    onError: () => {
      toast.error('حدث خطأ أثناء تشغيل محرك الأتمتة الدوري');
    }
  })

  return (
    // خلفية المودال (overlay)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      {/* محتوى المودال - منع انتشار الضغط للخلفية */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        
        {/* الهيدر مع زر الإغلاق */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h2 className="text-md font-bold text-gray-900">سجل عمليات نظام الأتمتة (Execution Logs)</h2>
            <p className="text-xs text-gray-400 mt-1">تابع عمليات فحص الخادم، المهام الصادرة تلقائياً، والتوثيق الرقابي للأتمتة.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* أزرار التحكم (تحديث - تشغيل يدوي) */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 text-gray-600 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
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
          </div>
        </div>

        {/* منطقة الجدول مع تمرير عمودي */}
        <div className="overflow-y-auto flex-1 p-4">
          {isLoading ? (
            <div className="text-center py-12 text-xs text-gray-400">جاري تحميل سجلات الأتمتة الإدارية...</div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-400">لا توجد سجلات تشغيل متوفرة حتى الآن في النظام.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-100">
                    <th className="p-4">قالب المهمة الدوري</th>
                    <th className="p-4">توقيت التشغيل الفعلي</th>
                    <th className="p-4">حالة العملية</th>
                    <th className="p-4">المهمة الناتجة للمكتب</th>
                    <th className="p-4">تفاصيل الفشل والتقارير</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-semibold text-gray-900">{log.template_title}</td>
                      <td className="p-4 font-mono text-gray-500 text-[11px]">
                        {new Date(log.run_at).toLocaleString('ar-EG')}
                      </td>
                      <td className="p-4">
                        {log.status === 'success' ? (
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
          )}
        </div>
      </div>
    </div>
  )
}