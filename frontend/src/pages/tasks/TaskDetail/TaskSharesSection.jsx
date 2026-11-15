// src/components/tasks/TaskSharesSection.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Share2, Loader2, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { sharesApi } from '@/api'
import { Avatar } from '@/components/common'
import { formatDate, SHARE_PERMISSION_LABELS, getApiError } from '@/utils/helpers'
import ShareModal from '../ShareModal' 
import UserContactPopover from '@/components/shared/UserContactPopover'
import clsx from 'clsx'
import { theme, resolveFieldState } from '@/constants/theme';
export default function TaskSharesSection({ taskId, taskPermissions, task }) {
  const queryClient = useQueryClient()
  const [showShare, setShowShare] = useState(false)

  // استخراج وتدقيق صلاحيات مشاركة المهمة من الخادم
  const canShareAdd = taskPermissions?.can_share_add ?? false
  const canShareRemove = taskPermissions?.can_share_remove ?? false

  // جلب قائمة التراخيص والمشاركات الخارجية للمهمة
  const { data: shares, isLoading } = useQuery({
    queryKey: ['task-shares', taskId],
    queryFn: () => sharesApi.getForTask(taskId).then(r => r.data),
    enabled: !!taskId,
  })

  // طفرة تعديل بيانات ترخيص المشاركة (صلاحية الاطلاع / تاريخ الانتهاء)
  const updateShareMutation = useMutation({
    mutationFn: ({ shareId, permission, expiresAt }) => 
      sharesApi.updateShare(shareId, permission, expiresAt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-shares', taskId] })
      toast.success('تم تحديث صلاحيات المشاركة بنجاح')
    },
    onError: (err) => toast.error(getApiError(err) || 'حدث خطأ أثناء تحديث بيانات المشاركة'),
  })

  // إلغاء ترخيص ومشاركة المهمة مع مستخدم معين
  const revokeShareMutation = useMutation({
    mutationFn: (shareId) => sharesApi.revoke(shareId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-shares', taskId] })
      toast.success('تم إلغاء مشاركة وتراخيص المهمة بنجاح')
    },
    onError: (err) => toast.error(getApiError(err) || 'حدث خطأ فني أثناء إلغاء ترخيص المشاركة'),
  })

  // معالجة نجاح عملية إضافة مشارك جديد
  const handleShareSuccess = () => {
    setShowShare(false)
    queryClient.invalidateQueries({ queryKey: ['task-shares', taskId] })
  }

  // معالجة تغيير الخيارات الفورية
  const handleInlineUpdate = (shareId, currentPermission, currentExpiresAt, updatedFields) => {
    updateShareMutation.mutate({
      shareId,
      permission: updatedFields.permission !== undefined ? updatedFields.permission : currentPermission,
      expiresAt: updatedFields.expiresAt !== undefined ? updatedFields.expiresAt : currentExpiresAt
    })
  }

  return (
    <div className={clsx("p-4 sm:p-5 space-y-4", theme.card.base)} dir="rtl">
      {/* الترويسة العلوية وزر إضافة مشارك جديد */}
      <div className={clsx("flex items-center justify-between border-b pb-3", theme.card.border)}>
        <h3 className={clsx("text-xs sm:text-sm font-bold flex items-center gap-1.5", theme.text.primary)}>
          <span className="w-1.5 h-3 bg-primary-600 rounded-sm inline-block" />
          <Share2 className="w-4 h-4 text-slate-400" />
          المشاركون والمطلعون الخارجيون ({shares?.length || 0})
        </h3>
        
        {canShareAdd && (
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 px-2.5 py-1.5 rounded-lg transition-all hover:bg-primary-100 dark:hover:bg-primary-900/40"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>مشاركة المهمة الإدارية</span>
          </button>
        )}
      </div>

      {/* سرد لوحة المستخدمين المشاركين */}
      {isLoading ? (
        <div className={clsx("text-center py-6 text-xs font-medium", theme.text.muted)}>جاري تحميل مصفوفة التراخيص...</div>
      ) : shares?.length === 0 ? (
        <div className={clsx("text-center py-8 text-xs font-medium rounded-xl border border-dashed", theme.card.subtle, theme.card.border, theme.text.muted)}>
          لا توجد أي تراخيص أو مشاركات خارجية مسجلة لهذه المهمة بعد.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto pl-1 custom-scrollbar">
          {shares?.map((s) => {
            const isCurrentShareRevoking = revokeShareMutation.isPending && revokeShareMutation.variables === s.id;
            const isCurrentShareUpdating = updateShareMutation.isPending && updateShareMutation.variables?.shareId === s.id;
            console.log(`Share ID: ${s.id}, Raw expires_at:`, s.expires_at,s);
            return (
              <div key={s.id} className={clsx(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all",
                theme.card.subtle,
                "hover:border-slate-300 dark:hover:border-slate-700"
              )}>
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <UserContactPopover user={s.shared_with} taskId={taskId} taskTitle={task.title}>
                    <Avatar src={s.shared_with?.avatar_url || s.shared_with?.user?.avatar_url} name={s.shared_with?.full_name || ''} size="sm" className="flex-shrink-0" />
                  </UserContactPopover>
                  
                  <div className="flex-1 min-w-0 space-y-1 text-right">
                    <p className={clsx("text-xs sm:text-sm font-bold truncate", theme.text.primary)}>
                      {s.shared_with?.full_name}
                    </p>
                    
                    {/* اختيار الصلاحية المباشر أو العرض الثابت بناءً على صلاحية canShareAdd */}
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                      <span className={theme.text.muted}>صلاحية الاطلاع:</span>
                      {canShareAdd ? (
                        <select
                          value={s.permission}
                          disabled={isCurrentShareUpdating}
                          onChange={(e) => handleInlineUpdate(s.id, s.permission, s.expires_at, { permission: e.target.value })}
                          className={clsx("font-semibold rounded px-1 outline-none border bg-transparent", theme.text.primary, "border-slate-200 dark:border-slate-700")}
                        >
                          {Object.keys(SHARE_PERMISSION_LABELS).map((key) => (
                            <option key={key} value={key}>{SHARE_PERMISSION_LABELS[key]}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-primary-600 font-semibold">{SHARE_PERMISSION_LABELS[s.permission]}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* تاريخ نهاية صلاحية الترخيص والتحكم به وأزرار الإجراءات */}
                {/* أدوات التحكم والتاريخ */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0 border-t sm:border-0 pt-2 sm:pt-0 border-slate-200 dark:border-slate-800">
                    <div className={clsx("flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md border", "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800")}>
                      <Calendar className="w-3 h-3" />
                      {canShareAdd ? (
                        
                        <input
                          type="date"
                          disabled={isCurrentShareUpdating}
                          value={s.expires_at ? s.expires_at.split('T')[0] : ''}
                          onChange={(e) => handleInlineUpdate(s.id, s.permission, s.expires_at, { expiresAt: e.target.value || null })}
                          className="bg-transparent outline-none font-bold cursor-pointer"
                        />
                      ) : (
                        <span>{s.expires_at ? formatDate(s.expires_at) : 'دائم'}</span>
                      )}
                    </div>

                    {canShareRemove && (
                      <button
                        onClick={() => revokeShareMutation.mutate(s.id)}
                        disabled={isCurrentShareRevoking}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal نافذة ضبط وإضافة تراخيص المشاركة الجديدة */}
      {showShare && (
        <ShareModal
          taskId={taskId}
          onClose={() => setShowShare(false)}
          onSuccess={handleShareSuccess}
        />
      )}
    </div>
  )
}