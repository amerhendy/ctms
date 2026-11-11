import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { transfersApi } from '@/api'
import { Loader2, Check, X, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import clsx from 'clsx'

export default function TransferRespondModal({ isOpen, onClose, transferData, taskTitle }) {
    console.log('TransferRespondModal rendered with transferData:', transferData) // Debug log
  const qc = useQueryClient()
  const [actionType, setActionType] = useState(null) // 'accepted' | 'rejected'
  const [rejectionReason, setRejectionReason] = useState('')

  // Mutation لمعالجة الرد على السيرفر
  const respondMutation = useMutation({
    mutationFn: ({ id, body }) => transfersApi.respond(id, body),
    onSuccess: (data, variables) => {
      // تحديث الكاش لإخفاء الإشعارات أو الطلبات المعلقة
      qc.invalidateQueries(['notifications'])
      qc.invalidateQueries(['transfers', 'pending'])
      qc.invalidateQueries(['task', transferData?.task_id]) // تحديث تفاصيل المهمة نفسها لأن قسمها تغير
      
      toast.success(variables.body.status === 'accepted' ? 'تم قبول تحويل المهمة بنجاح' : 'تم رفض طلب التحويل')
      handleClose()
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || 'حدث خطأ أثناء معالجة الطلب')
    }
  })

  if (!isOpen || !transferData) return null

  const handleClose = () => {
    setActionType(null)
    setRejectionReason('')
    onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (actionType === 'rejected' && !rejectionReason.strip()) {
      toast.error('يجب كتابة سبب الرفض تماشياً مع قواعد النظام')
      return
    }

    respondMutation.mutate({
      id: transferData.id,
      body: {
        status: actionType, // 'accepted' أو 'rejected'
        rejection_reason: actionType === 'rejected' ? rejectionReason : null
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl border border-gray-100 w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-right">
        
        {/* رأس المودال */}
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-950 flex items-center gap-2">
            <span className="text-xl">📨</span>
            طلب تحويل وارد للداخل
          </h2>
          <button onClick={handleClose} className="p-1 rounded-lg hover:bg-gray-200/50 text-gray-400 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* تفاصيل الطلب الوارد */}
          <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 space-y-2">
            <p className="text-xs text-gray-500">موضوع المعاملة:</p>
            <p className="text-sm font-bold text-gray-900">{taskTitle || transferData.task_title}</p>
            
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/40 text-xs">
              <div>
                <span className="text-gray-400 block">من القسم:</span>
                <span className="font-semibold text-gray-700">{transferData.from_department_name}</span>
                <span className="text-gray-400 block">إلى القسم:</span>
                <span className="font-semibold text-gray-700">{transferData.to_department_name}</span>
              </div>
              <div>
                <span className="text-gray-400 block">بواسطة:</span>
                <span className="font-semibold text-gray-700">{transferData.from_user_name}</span>
              </div>
            </div>

            {transferData.transfer_note && (
              <div className="mt-2 pt-2 border-t border-amber-200/40">
                <span className="text-xs text-gray-400 block">ملاحظة المحوّل:</span>
                <p className="text-xs text-gray-600 italic bg-white/80 p-2 rounded-lg mt-1 border border-gray-100">
                  "{transferData.transfer_note}"
                </p>
              </div>
            )}
          </div>

          {/* الاختيار الافتراضي للإجراء */}
          {actionType === null ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActionType('accepted')}
                className="flex flex-col items-center justify-center p-4 border border-green-100 bg-green-50/30 hover:bg-green-50 text-green-700 rounded-xl font-bold transition-all gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Check className="w-4 h-4 text-green-600 stroke-[3]" />
                </div>
                <span className="text-sm">قبول وتسلّم المهمة</span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('rejected')}
                className="flex flex-col items-center justify-center p-4 border border-red-100 bg-red-50/30 hover:bg-red-50 text-red-700 rounded-xl font-bold transition-all gap-1.5 group"
              >
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <X className="w-4 h-4 text-red-600 stroke-[3]" />
                </div>
                <span className="text-sm">رفض وإعادة الطلب</span>
              </button>
            </div>
          ) : (
            /* في حال اختيار إجراء محدد */
            <div className="space-y-3 animate-in slide-in-from-bottom-2 duration-200">
              {actionType === 'accepted' ? (
                <div className="flex items-start gap-2 text-xs bg-blue-50 text-blue-800 p-3 rounded-xl border border-blue-100">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-blue-600 mt-0.5" />
                  <p>عند الموافقة، سيتم نقل تبعية المعاملة وصلاحيات الإدارة بالكامل إلى قسمك الحلي <strong>({transferData.to_department})</strong> فوراً.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center justify-between">
                    <span>سبب رفض استلام المعاملة: <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-gray-400 font-medium">مطلوب للباك إند</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="يرجى كتابة المبرر الإداري لرفض التحويل ليظهر في سجل المعاملة..."
                    className="w-full text-xs p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all resize-none leading-relaxed"
                  />
                </div>
              )}

              {/* أزرار التأكيد النهائي */}
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
                    <span>تأكيد {actionType === 'accepted' ? 'القبول والتسلّم' : 'الرفض الإداري'}</span>
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