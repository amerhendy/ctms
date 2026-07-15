import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { transfersApi } from '@/api' // تأكد من استيراد ملف الـ API الخاص بك
import { Loader2, Check, X, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'

export default function ShareResponseModal({ isOpen, onClose, shareData, taskTitle }) {
  const qc = useQueryClient()
  const [actionType, setActionType] = useState(null) // 'accepted' | 'rejected'
  const [rejectionReason, setRejectionReason] = useState('')

  // الـ Mutation المسؤول عن إرسال رد القبول أو الرفض للباك إند
  const respondMutation = useMutation({
    mutationFn: ({ id, body }) => transfersApi.respond(id, body),
    onSuccess: (data, variables) => {
      // تحديث كاش الإشعارات والمعاملة الحالية لإخفاء الزرار فوراً بعد التحديث
      qc.invalidateQueries(['notifications'])
      qc.invalidateQueries(['task', shareData?.task_id])
      
      toast.success(variables.body.status === 'accepted' ? 'تم قبول طلب التحويل بنجاح' : 'تم رفض طلب التحويل')
      handleClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || 'حدث خطأ أثناء معالجة رد التحويل')
    }
  })

  if (!isOpen || !shareData) return null

  const handleClose = () => {
    setActionType(null)
    setRejectionReason('')
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (actionType === 'rejected' && !rejectionReason.trim()) {
      toast.error('يجب كتابة سبب الرفض لحفظ الإجراء')
      return
    }

    respondMutation.mutate({
      id: shareData.id, // الـ ID الخاص بالـ share المعلق (مثلاً 5 أو 7)
      body: {
        status: actionType, // 'accepted' أو 'rejected'
        rejection_reason: actionType === 'rejected' ? rejectionReason : null
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-right">
        
        {/* رأس المودال */}
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-950 flex items-center gap-2">
            <span className="text-lg">📨</span>
            طلب تحويل صلاحية وارد
          </h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-200/50 text-gray-400 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* تفاصيل المعاملة */}
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 space-y-2">
            <span className="text-xs text-gray-400 block">المعاملة المراد تحويلها:</span>
            <p className="text-sm font-bold text-gray-950">{taskTitle}</p>
            <div className="pt-2 border-t border-amber-200/30 text-xs text-gray-600 flex items-center gap-4">
              <p>الصلاحية المطلوبة: <span className="font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">{shareData.permission === 'edit' ? 'تعديل' : 'عرض'}</span></p>
              <p>بواسطة رئيس القسم/المحول رقم: <span className="font-bold text-gray-800">{shareData.shared_by}</span></p>
            </div>
          </div>

          {/* تحديد نوع الإجراء */}
          {actionType === null ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActionType('accepted')}
                className="flex flex-col items-center justify-center p-4 border border-green-100 bg-green-50/20 hover:bg-green-50 text-green-700 rounded-xl font-bold transition-all gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Check className="w-4 h-4 text-green-600 stroke-[3]" />
                </div>
                <span className="text-xs">قبول التحويل</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('rejected')}
                className="flex flex-col items-center justify-center p-4 border border-red-100 bg-red-50/20 hover:bg-red-50 text-red-700 rounded-xl font-bold transition-all gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <X className="w-4 h-4 text-red-600 stroke-[3]" />
                </div>
                <span className="text-xs">رفض الطلب</span>
              </button>
            </div>
          ) : (
            /* نموذج التأكيد النهائي بناءً على الزر المضغوط */
            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-200">
              {actionType === 'accepted' ? (
                <div className="flex items-start gap-2 text-xs bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-blue-600 mt-0.5" />
                  <p>بالموافقة على التحويل، ستحصل رسمياً على صلاحية الـ <strong>{shareData.permission}</strong> على هذه المعاملة وتتحمل مسؤوليتها الإدارية.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    سبب الرفض الإداري للتحويل: <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="اكتب هنا سبب الرفض ليظهر للمستخدم المحوِّل..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* أزرار الإرسال والتراجع */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={respondMutation.isPending}
                  className={clsx(
                    "flex-1 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50",
                    actionType === 'accepted' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                  )}
                >
                  {respondMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>تأكيد {actionType === 'accepted' ? 'قبول التحويل' : 'إرسال الرفض'}</span>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setActionType(null)}
                  disabled={respondMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                >
                  تراجع
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}