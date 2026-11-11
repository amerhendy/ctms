import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2,TriangleAlert,Search,Users,Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { transfersApi, usersApi } from '@/api'
import { Modal, FormField, Avatar } from '@/components/common'
import { getApiError } from '@/utils/helpers'
import useAuthStore from '@/stores/authStore'
import clsx from 'clsx';
import {theme, resolveAlertState, resolveFieldState,resolveListItemState} from '@/constants/theme'
export default function TransferModal({ taskId, currentDeptId, onClose, onSuccess }) {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [note, setNote] = useState('')

  // 1. استخدام useInfiniteQuery لجلب البيانات بنظام الصفحات (Load More)
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage
  } = useInfiniteQuery({
    queryKey: ['users', 'same-level', user?.job_level_id, search],
    queryFn: ({ pageParam = 1 }) => usersApi.list({
      job_level_id: user?.job_level_id,
      q: search || undefined,
      is_active: true,
      page: pageParam, // تمرير رقم الصفحة الحالية للـ API
      page_size: 10,   // حجم الصفحة المفضلة
    }).then(r => r.data),
    enabled: !!user?.job_level_id,
    getNextPageParam: (lastPage) => {
      // التحقق مما إذا كان هناك صفحة تالية بناءً على رد السيرفر الحالي
      return lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined
    }
  })

  // 2. دمج مصفوفات "items" من كل الصفحات المستلمة في مصفوفة واحدة مسطحة
  const allUsers = [];
  if (data && data.pages) {
    
    data.pages.forEach(page => {
      if (page && page.items && Array.isArray(page.items)) {
        allUsers.push(...page.items);
      }
    });
  }

  // 3. فلترة المستخدمين: استبعاد نفس الإدارة واستبعاد المستخدم الحالي (تعمل الآن بدون أخطاء)
  const eligibleUsers = tyrannicalFilter(allUsers, currentDeptId, user?.id)

  const mutation = useMutation({
    mutationFn: () => transfersApi.create({
      task_id: taskId,
      to_department_id: selectedUser.department_id,
      to_user_id: selectedUser.id,
      transfer_note: note || undefined,
    }),
    onSuccess: () => {
      toast.success('تم إرسال طلب التحويل بنجاح')
      qc.invalidateQueries(['transfers'])
      qc.invalidateQueries(['task', taskId])
      onSuccess?.()
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  // دالة الفلترة لضمان معالجة دقيقة للقيم
  function tyrannicalFilter(usersArray, deptId, userId) {
    return usersArray.filter(u => 
      Number(u.department_id) !== Number(deptId) && u.id !== userId
    )
  }

  return (
    <Modal open onClose={onClose} title="تحويل المهمة" size="md">
      <div className="space-y-4 text-right" dir="rtl">
        {/* صندوق معلومات قاعدة التحويل */}
        
        <div className={resolveAlertState('info', theme)}>
          <div className="flex items-start gap-3">
            {/* الأيقونة داخل حاوية لضمان عدم تأثر حجمها بالنصوص */}
            <div className="flex-shrink-0 animate-pulse mt-0.5">
              <TriangleAlert className="w-5 h-5 text-amber-600" />
            </div>
            
            {/* حاوية النص */}
            <div>
              <p className="font-semibold mb-1">قاعدة التحويل:</p>
              <p className="text-xs leading-relaxed">
                يمكن تحويل المهمة فقط إلى مستخدم بنفس المستوى الإداري في إدارة مختلفة.
              </p>
            </div>
          </div>
        </div>

        {/* خانة البحث */}
        <FormField label="بحث عن مستخدم">
          <div className="relative">
            <input
              type="text"
              className={theme.input.withIcon}
              placeholder="ابحث بالاسم أو البريد..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedUser(null);
              }}
            />
            <div className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
          </div>
        </FormField>

        {/* قائمة المستخدمين مع التمرير (Scrollbar) وحساب الصفحات */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {isLoading && 
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
              <p className="text-sm text-slate-400 font-medium">جاري البحث...</p>
            </div>
          }
          
          {!isLoading && eligibleUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
              <div className="p-3 bg-slate-50 rounded-full dark:bg-slate-800">
                <Users className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-sm text-slate-400 font-medium">
                لا يوجد مستخدمون بنفس المستوى الإداري في إدارات أخرى
              </p>
            </div>
          )}

          {eligibleUsers.map(u => (
            <div
                key={u.id}
                onClick={() => setSelectedUser(selectedUser?.id === u.id ? null : u)}
                className={resolveListItemState(theme.list.item, { 
                  isSelected: selectedUser?.id === u.id 
                })}
              >
                <Avatar name={u.full_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{u.full_name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.job_title}</p>
                    <span className="text-[10px] text-slate-300">•</span>
                    <p className="text-[11px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded font-medium dark:bg-primary-900/30">
                      {u.department?.name}
                    </p>
                  </div>
                </div>
                {selectedUser?.id === u.id && (
                  <Check className="w-4 h-4 text-primary-600" />
                )}
              </div>
          ))}

          {/* 🌟 زر تحميل المزيد (Load More) أسفل القائمة في حال وجود صفحات تالية */}
          {hasNextPage && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline disabled:opacity-50 inline-flex items-center gap-1 py-1 px-3 border border-indigo-100 rounded-full bg-indigo-50/20"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>جاري جلب المزيد...</span>
                  </>
                ) : (
                  <span>تحميل المزيد من المستخدمين</span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* الملاحظة للمستلم */}
        <FormField label="ملاحظة للمستلم (اختياري)">
          <textarea
            className="input resize-none h-20"
            placeholder="أضف ملاحظة تشرح سبب تحويل المهمة..."
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </FormField>

        {/* أزرار التحكم والارسال */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={!selectedUser || mutation.isPending}
            className="btn-primary flex-1 justify-center transition-all"
          >
            {mutation.isPending ? 'جاري الإرسال...' : `تحويل إلى ${selectedUser?.full_name || '...'}`}
          </button>
        </div>
      </div>
    </Modal>
  )
}