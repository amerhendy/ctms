import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { UserPlus, Trash2, Plus, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { taskAssignsApi } from '@/api'
import { Avatar, Modal } from '@/components/common'
import UserContactPopover from '@/components/shared/UserContactPopover'
import useAuthStore from '@/stores/authStore'
import clsx from 'clsx'
import { theme, resolveFieldState } from '@/constants/theme';
import { formatDateTime } from '@/utils/helpers'

// ─── مكون المودال الداخلي المطور لجلب وتعيين فريق العمل ───────────────────────────────────
function AddAssigneeModal({ taskId, currentUserId, onAssign, onClose }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState({})
  const loaderRef = useRef(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ['subordinates-infinite', currentUserId, debouncedSearch],
    queryFn: ({ pageParam = 1 }) => 
      taskAssignsApi.getSubordinates(currentUserId, { 
        page: pageParam, 
        page_size: 10, 
        q: debouncedSearch 
      }).then(r => r.data),
    getNextPageParam: (lastPage) => {
      return lastPage.page < lastPage.pages ? lastPage.page + 1 : undefined
    },
    enabled: !!currentUserId,
  })

  const allSubordinates = data?.pages.flatMap(page => page.items) || []

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage()
      },
      { threshold: 0.1, rootMargin: '20px' }
    )
    if (loaderRef.current) observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <Modal open title="تعيين فريق العمل والمكلفين" onClose={onClose} size="sm">
      <div className="space-y-4 pt-1" dir="rtl">
        <input
          className={clsx(
            "w-full h-10 px-3 border rounded-lg text-sm transition-all outline-none",
            "bg-white dark:bg-slate-950",
            "border-slate-200 dark:border-slate-700",
            "focus:border-primary-500 focus:ring-1 focus:ring-primary-500",
            "text-slate-900 dark:text-slate-100"
          )}
          placeholder="ابحث باسم الموظف في فريقك الفني..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <div className={clsx(
          "max-h-80 overflow-y-auto border rounded-xl divide-y custom-scrollbar",
          theme.card.border,
          "divide-slate-100 dark:divide-slate-800"
        )}>
          {isLoading ? (
            <div className={clsx("p-8 text-center text-xs font-medium flex flex-col items-center gap-2", theme.text.muted)}>
              <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
              <span>جاري جلب قائمة الفريق الحالية...</span>
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500 text-xs font-medium">حدث خطأ أثناء جلب قائمة الموظفين.</div>
          ) : allSubordinates.length === 0 ? (
            <div className={clsx("p-8 text-center text-xs font-medium", theme.text.muted)}>لا يوجد موظفون مطابقون للبحث</div>
          ) : (
            <>
              {allSubordinates.map(u => (
                <div key={u.id} className={clsx(
                  "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 transition-colors",
                  "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                )}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={u.full_name} src={u.avatar_url} size="sm" className="object-cover rounded-full w-9 h-9" />
                    <div className="flex-1 min-w-0 text-right">
                      <p className={clsx("text-xs sm:text-sm font-bold truncate", theme.text.primary)}>{u.full_name}</p>
                      <p className={clsx("text-[11px] truncate", theme.text.muted)}>{u.job_title || 'بدون مسمى وظيفي'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 bg-gray-50 sm:bg-transparent p-1.5 sm:p-0 rounded-lg border border-gray-100 sm:border-0">
                    <select 
                      className={clsx(
                        "text-xs border rounded-lg p-1.5 h-8 outline-none transition-all",
                        "bg-white dark:bg-slate-950",
                        "border-slate-200 dark:border-slate-700",
                        theme.text.primary
                      )}
                      value={selectedTypes[u.id] || 'assignee'}
                      onChange={(e) => handleTypeChange(u.id, e.target.value)}
                    >
                      <option value="assignee">منفذ أساسي</option>
                      <option value="collaborator">متعاون فرعي</option>
                      <option value="viewer">مشاهد ومطلع</option>
                    </select>
                    <button
                      onClick={() => onAssign({ userId: u.id, type: selectedTypes[u.id] || 'assignee' })}
                      className={clsx(
                        "h-8 w-8 flex items-center justify-center rounded-lg border transition-all",
                        "bg-primary-50 dark:bg-primary-900/20",
                        "text-primary-600 dark:text-primary-400",
                        "border-primary-100 dark:border-primary-800",
                        "hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600"
                      )}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div ref={loaderRef} className="flex justify-center py-3">
                {isFetchingNextPage && <Loader2 className="w-4 h-4 animate-spin text-primary-500" />}
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

// ─── المكون الرئيسي لإدارة تكليفات المهمة ───────────────────────────────────────────
export default function TaskAssignmentsSection({ taskId, taskPermissions, task: initialTask }) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [showAddAssignee, setShowAddAssignee] = useState(false)
  
  const canAssign = taskPermissions?.can_assign_executor ?? false
  const canUnassign = taskPermissions?.can_unassign_executor ?? false

  // 🌟 استعلام منفصل لجلب فريق العمل الحالي للمهمة ديناميكياً من الـ API الجديد
  const { data: assignments = [], isLoading: loadingAssignments } = useQuery({
  queryKey: ['task-assignments', parseInt(taskId)],
  queryFn: () => {
    // إرجاع صريح للـ Promise
    return taskAssignsApi.listAssignments(taskId).then(r => r.data)
  },
})

  // طفرة تعيين عضو جديد
  const addAssigneeMutation = useMutation({
    mutationFn: ({ userId, type }) => taskAssignsApi.assign(taskId, userId, type),
    onSuccess: () => {
      toast.success('تم تعيين العضو وإدراجه في المهمة')
      // تحديث قائمة التكليفات حصرياً دون تدمير كاش المهمة بالكامل
      queryClient.invalidateQueries({ queryKey: ['task-assignments', parseInt(taskId)] })
      setShowAddAssignee(false)
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'فشلت عملية التعيين الإداري'),
  })

  // طفرة إلغاء التعيين وحذفه إدارياً (Soft Delete)
  const unassignMutation = useMutation({
    mutationFn: (userId) => taskAssignsApi.unassign(taskId, userId),
    onSuccess: () => {
      toast.success('تم إلغاء التعيين وإزالة العضو بنجاح')
      queryClient.invalidateQueries({ queryKey: ['task-assignments', parseInt(taskId)] })
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'فشلت عملية إلغاء التعيين'),
  })

  const handleAssign = ({ userId, type }) => {
    addAssigneeMutation.mutate({ userId, type })
  }
  return (
    <div className={clsx("p-4 sm:p-5", theme.card.base)} dir="rtl">
      {/* عنوان وتحضير القسم */}
      <div className={clsx("p-4 sm:p-5", theme.card.base)} dir="rtl">
        <h3 className={clsx("text-xs sm:text-sm font-bold flex items-center gap-1.5", theme.text.primary)}>
          <span className="w-1.5 h-3 bg-primary-600 rounded-sm inline-block" />
          <span>المكلفون وفريق العمل الحالي ({assignments.length})</span>
          {loadingAssignments && <Loader2 className="w-3 h-3 animate-spin text-gray-400" />}
        </h3>
        {canAssign && (
          <button
            onClick={() => setShowAddAssignee(true)}
            className="text-primary-600 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all hover:bg-primary-100 dark:hover:bg-primary-900/40"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>تعيين عضو جديد</span>
          </button>
        )}
      </div>

      {/* عرض شبكة المنفذين المكلفين حالياً */}
      {assignments.length === 0 ? (
        <div className={clsx("text-center py-8 text-xs font-medium rounded-xl border border-dashed", theme.card.subtle, theme.card.border, theme.text.muted)}>
          لا يوجد أي مكلفين أو منفذين على هذه المهمة حتى الآن
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-gray-50/80 border border-gray-100 group transition-all hover:bg-white hover:border-gray-200 hover:shadow-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <UserContactPopover user={a.user} taskId={taskId} taskTitle={initialTask?.title}>
                  <Avatar 
                    name={a.user?.full_name || ''} 
                    src={a.user?.avatar_url} 
                    size="sm" 
                    className="object-cover rounded-full w-9 h-9 flex-shrink-0" 
                  />
                </UserContactPopover>
                
                <div className="flex-1 min-w-0 space-y-1 text-right">
                  <p className={clsx("text-xs sm:text-sm font-bold truncate", theme.text.primary)} title={a.user?.full_name}>
                    {a.user?.full_name}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={clsx(
                      "text-[10px] px-2 py-0.5 rounded-full font-bold border whitespace-nowrap",
                      a.assignment_type === 'assignee' ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300" :
                      a.assignment_type === 'collaborator' ? "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800 text-purple-700 dark:text-purple-300" :
                      "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    )}>
                      {a.assignment_type === 'assignee'
                        ? 'منفذ أساسي'
                        : a.assignment_type === 'collaborator'
                        ? 'متعاون فرعي'
                        : 'مشاهد ومطلع'}
                    </span>
                    
                    {a.assigner && (
                      <span className={clsx("text-[10px] font-medium whitespace-nowrap", theme.text.muted)}>
                        بواسطة: <span className={clsx("font-semibold", theme.text.primary)}>{a.assigner.full_name}</span>
                      </span>
                    )}
                  </div>

                  {a.assigned_at && (
                    <p className="text-[10px] text-gray-400/90 font-medium">
                      تاريخ التكليف: {formatDateTime(a.assigned_at)}
                    </p>
                  )}
                </div>
              </div>

              {/* زر إلغاء التعيين */}
              {canUnassign && (
                <button
                  onClick={() => {
                    if (window.confirm(`هل أنت متأكد من رغبتك في إلغاء تعيين واستبعاد "${a.user?.full_name || ''}" من فريق عمل المهمة؟`)) {
                      unassignMutation.mutate(a.user_id)
                    }
                  }}
                  className={clsx(
                    "p-1.5 rounded-lg transition-all flex-shrink-0 border border-transparent hover:border-red-200 dark:hover:border-red-900 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20",
                    "sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                  )}
                  disabled={unassignMutation.isPending}
                  title="إلغاء التعيين"
                >
                  {unassignMutation.isPending && unassignMutation.variables === a.user_id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddAssignee && (
        <AddAssigneeModal
          taskId={taskId}
          currentUserId={user?.id}
          onAssign={handleAssign}
          onClose={() => setShowAddAssignee(false)}
        />
      )}
    </div>
  )
}