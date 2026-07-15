import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Check } from 'lucide-react'

import toast from 'react-hot-toast'
import { sharesApi, usersApi } from '@/api'
import { Modal, FormField, Avatar } from '@/components/common'
import { getApiError, SHARE_PERMISSION_LABELS } from '@/utils/helpers'
import clsx from 'clsx'
import { theme, resolveFieldState } from '@/constants/theme';
export default function ShareModal({ taskId, onClose, onSuccess }) {
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [permission, setPermission] = useState('view')
  const [expiresAt, setExpiresAt] = useState('') // 🌟 حقل التاريخ الجديد

  // جلب البيانات من الـ API
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', 'search', search],
    queryFn: () => usersApi.list({ q: search, is_active: true }).then(r => r.data),
    enabled: search.length > 1,
  })

  // استخراج مصفوفة المستخدمين الفعلية بأمان من داخل الـ items
  const userList = usersData?.items || []

  const mutation = useMutation({
    mutationFn: () => sharesApi.share({
      task_id: taskId,
      shared_with_user_id: selectedUser.id,
      permission,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null, // 🌟 إرسال التاريخ بالصيغة القياسية أو null إذا ترك فارغاً
    }),
    onSuccess: (res) => {
      toast.success(res.data.message)
      onSuccess?.()
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  return (
    <Modal open onClose={onClose} title="مشاركة المهمة" size="md">
      <div className={clsx("space-y-4 text-right", theme.text.primary)} dir="rtl">
        
        {/* حقل البحث */}
        <FormField label="ابحث عن مستخدم">
          <input
            className={clsx(
              "w-full h-10 px-3 border rounded-lg text-sm transition-all outline-none",
              "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700",
              "focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            )}
            placeholder="اكتب اسم أو بريد المستخدم..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedUser(null) }}
          />
        </FormField>

        {/* نتائج البحث */}
        {!isLoading && usersData && search.length > 1 && (
          <div className={clsx("max-h-48 overflow-y-auto border rounded-xl divide-y", theme.card.border, "divide-slate-100 dark:divide-slate-800")}>
            {userList.length === 0 ? (
              <p className={clsx("text-sm p-4 text-center", theme.text.muted)}>لا توجد نتائج</p>
            ) : (
              userList.map(u => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={clsx(
                    "flex items-center gap-3 p-3 cursor-pointer transition-colors border-r-2",
                    selectedUser?.id === u.id 
                      ? "bg-primary-50 dark:bg-primary-900/20 border-primary-500" 
                      : "bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  <Avatar name={u.full_name} size="sm" src={u.avatar_url} />
                  <div className="flex-1 min-w-0 text-right">
                    <p className={clsx("text-sm font-semibold", theme.text.primary)}>{u.full_name}</p>
                    <p className={clsx("text-xs", theme.text.muted)}>{u.email}</p>
                  </div>
                  {selectedUser?.id === u.id && <Check className="w-4 h-4 text-primary-600" />}
                </div>
              ))
            )}
          </div>
        )}

        {/* اختيار الصلاحية */}
        <FormField label="مستوى الصلاحية">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(SHARE_PERMISSION_LABELS).map(([val, label]) => (
              <label
                key={val}
                className={clsx(
                  "flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all",
                  permission === val 
                    ? "border-primary-300 bg-primary-50 dark:bg-primary-900/20" 
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                )}
              >
                <input
                  type="radio"
                  name="permission"
                  value={val}
                  checked={permission === val}
                  onChange={() => setPermission(val)}
                  className="text-primary-600"
                />
                <span className={clsx("text-sm font-medium", theme.text.primary)}>{label}</span>
              </label>
            ))}
          </div>
        </FormField>

        {/* تاريخ الانتهاء */}
        <FormField label="تاريخ انتهاء الصلاحية (اختياري)">
          <input
            type="date"
            className={clsx(
              "w-full h-10 px-3 border rounded-lg text-sm cursor-pointer",
              "bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700",
              theme.text.primary
            )}
            value={expiresAt}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setExpiresAt(e.target.value)}
          />
        </FormField>

        {/* أزرار الإجراءات */}
        <div className={clsx("flex gap-2 pt-2 border-t", theme.card.border)}>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">إلغاء</button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!selectedUser || mutation.isPending}
            className="btn-primary flex-1"
          >
            {mutation.isPending ? 'جاري المشاركة...' : 'مشاركة'}
          </button>
        </div>
      </div>
    </Modal>
  )
}