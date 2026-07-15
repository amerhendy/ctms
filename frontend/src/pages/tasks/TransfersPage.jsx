import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { ArrowLeftRight, Check, X } from 'lucide-react'
import { transfersApi } from '@/api'
import { PageLoader, EmptyState, Modal } from '@/components/common'
import { formatDateTime, getApiError } from '@/utils/helpers'

export default function TransfersPage() {
  const qc = useQueryClient()
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: pending, isLoading } = useQuery({
    queryKey: ['transfers', 'pending'],
    queryFn: () => transfersApi.pending().then(r => r.data),
  })

  const respondMutation = useMutation({
    mutationFn: ({ id, status, reason }) =>
      transfersApi.respond(id, { status, rejection_reason: reason }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'accepted' ? 'تم قبول التحويل' : 'تم رفض التحويل')
      qc.invalidateQueries(['transfers'])
      qc.invalidateQueries(['tasks'])
      setRejectModal(null)
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">التحويلات المعلقة</h1>
        <p className="text-sm text-gray-500">
          المهام المحولة إليك بانتظار قبولك أو رفضك
        </p>
      </div>

      {!pending?.length ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="لا توجد تحويلات معلقة"
          description="ستظهر هنا المهام المحولة إليك من إدارات أخرى"
        />
      ) : (
        <div className="space-y-3">
          {pending.map(t => (
            <div key={t.id} className="card border-r-4 border-orange-400">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowLeftRight className="w-4 h-4 text-orange-500" />
                    <h3 className="font-semibold text-gray-800">{t.task_title}</h3>
                  </div>
                  <div className="text-sm text-gray-500 space-y-0.5">
                    <p>من: <span className="text-gray-700 font-medium">{t.from_user_name}</span></p>
                    <p>من إدارة: <span className="text-gray-700">{t.from_department}</span></p>
                    <p>إلى إدارة: <span className="text-gray-700">{t.to_department}</span></p>
                    {t.transfer_note && (
                      <p className="mt-1 p-2 bg-gray-50 rounded-lg text-gray-600 italic">
                        "{t.transfer_note}"
                      </p>
                    )}
                    <p className="text-xs text-gray-400">{formatDateTime(t.created_at)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => respondMutation.mutate({ id: t.id, status: 'accepted' })}
                    disabled={respondMutation.isPending}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium"
                  >
                    <Check className="w-4 h-4" />
                    قبول
                  </button>
                  <button
                    onClick={() => { setRejectModal(t.id); setRejectReason('') }}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                  >
                    <X className="w-4 h-4" />
                    رفض
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject reason modal */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="سبب الرفض" size="sm">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">يرجى إدخال سبب رفض التحويل (مطلوب):</p>
          <textarea
            className="input resize-none h-24"
            placeholder="سبب الرفض..."
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div className="flex gap-2">
            <button className="btn-secondary flex-1 justify-center" onClick={() => setRejectModal(null)}>
              إلغاء
            </button>
            <button
              className="btn-danger flex-1 justify-center"
              disabled={!rejectReason.trim()}
              onClick={() => respondMutation.mutate({
                id: rejectModal, status: 'rejected', reason: rejectReason
              })}
            >
              تأكيد الرفض
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
