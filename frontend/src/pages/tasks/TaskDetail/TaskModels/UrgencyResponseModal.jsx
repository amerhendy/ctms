// src/components/tasks/UrgencyResponseModal.jsx
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { tasksApi } from '@/api' // تأكد من مطابقة مسار الـ API لديك
import { Modal } from '@/components/common' // تأكد من مطابقة مسار المودال المشترك لديك

export default function UrgencyResponseModal({ task, onClose }) {
  const queryClient = useQueryClient()
  const [reason, setReason] = useState('')

  // إنشاء الـ Mutation الخاص باتخاذ القرار (اعتماد / رفض) داخلياً
  const urgencyActionMutation = useMutation({
    // نفترض أن الدالة تأخذ معرف المهمة، نوع الإجراء، والسبب
    mutationFn: ({ taskId, action, notes }) => tasksApi.respondUrgency(taskId, { action, notes }),
    onSuccess: (_, variables) => {
      const isApprove = variables.action === 'approve'
      toast.success(isApprove ? 'تم اعتماد وقبول الاستعجال بنجاح' : 'تم رفض طلب الاستعجال وتوثيق المبررات')
      
      // تحديث بيانات المهمة وسجل التغييرات فوراً في الكاش
      queryClient.invalidateQueries(['task', parseInt(task.id)])
      queryClient.invalidateQueries(['task-logs', task.id])
      
      // إغلاق النافذة
      onClose()
    },
    onError: (err) => {
        console.log(err);
        
      toast.error(err.response?.data?.detail || 'حدث خطأ فني أثناء معالجة طلب الاستعجال')
    },
  })

  // دالة معالجة الضغط على الأزرار
  const handleAction = (actionType) => {
    const trimmedReason = reason.trim()

    // التحقق التنظيمي: إلزامية السبب في حالة الرفض
    if (actionType === 'reject' && !trimmedReason) {
      toast.error('يجب تدوين سبب ومبرر الرفض في خانة الملاحظات أولاً')
      return
    }

    // استدعاء الميوتيشن
    urgencyActionMutation.mutate({
      taskId: task.id,
      action: actionType,
      notes: trimmedReason
    })
  }

  const isPending = urgencyActionMutation.isPending

  return (
    <Modal open title="اتخاذ قرار بشأن طلب استعجال المهمة" onClose={onClose} size="sm">
      <div className="space-y-4 pt-1">
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          هناك طلب معلق لاستعجال إنهاء المهمة: <strong className="text-gray-900 font-bold">“{task.title}”</strong>. يُرجى مراجعة وتحديد الإجراء المناسب للهيكل التنظيمي.
        </p>
        
        {/* حقل الملاحظات والمبررات */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700">ملاحظات أو مبررات القرار</label>
          <textarea
            className="input text-sm resize-none h-24 bg-gray-50/50 focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]"
            placeholder="اكتب الأسباب هنا (المبرر اختياري في حالة القبول، ولكنه إلزامي ومطلوب قانوناً في حال الرفض)..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            disabled={isPending}
            maxLength={500}
          />
        </div>

        {/* أزرار اتخاذ القرار الإداري */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            type="button"
            className="btn-primary flex-1 justify-center bg-green-600 hover:bg-green-700 text-xs sm:text-sm font-bold py-2.5 shadow-sm disabled:opacity-50"
            onClick={() => handleAction('approve')}
            disabled={isPending}
          >
            {isPending && urgencyActionMutation.variables?.action === 'approve' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>اعتماد وقبول الاستعجال</span>
              </>
            )}
          </button>
          
          <button
            type="button"
            className="btn-danger flex-1 justify-center bg-red-600 hover:bg-red-700 text-xs sm:text-sm font-bold py-2.5 shadow-sm disabled:opacity-50"
            onClick={() => handleAction('reject')}
            disabled={isPending}
          >
            {isPending && urgencyActionMutation.variables?.action === 'reject' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <X className="w-4 h-4" />
                <span>رفض طلب الاستعجال</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}