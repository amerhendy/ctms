import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Loader2, ArrowLeft, Trash2, Eraser } from 'lucide-react'
import { notificationsApi } from '@/api'
import { PageLoader, EmptyState } from '@/components/common'
<<<<<<< HEAD
import PaginationProvider from '@/components/common/PaginationProvider'
import { formatDateTime, getApiError } from '@/utils/helpers'
import { theme, resolveTabState } from '@/constants/theme'
=======
import PaginationProvider from '@/components/common/PaginationProvider' // <--- استيراد النظام المشترك الجديد
import { formatDateTime, getApiError } from '@/utils/helpers'
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
import { toast } from 'react-hot-toast'
import clsx from 'clsx'

const NOTIF_ICONS = {
  transfer_request: '📨',
  transfer_accepted: '✅',
  transfer_rejected: '❌',
  urgent_request: '🚨',
  urgent_approved: '⚡',
  urgent_rejected: '🚫',
  task_assigned: '📋',
  share_granted: '🔗',
  delegation_granted: '🤝',
  delegation_revoked: '⛔',
  reminder: '⏰',
  task_overdue: '⚠️',
}

export default function NotificationsPage() {
  const qc = useQueryClient()
  const [filter, setFilter] = useState('all') // 'all' | 'unread'
  const [page, setPage] = useState(1)
  const pageSize = 15

  // 1. جلب قائمة الإشعارات المقسمة من السيرفر
  const { data: responseData, isLoading, isFetching } = useQuery({
    queryKey: ['notifications', 'list', filter, page],
    queryFn: () => 
      notificationsApi.list({ 
        page: page, 
        page_size: pageSize, 
        unread_only: filter === 'unread' 
      }).then(r => r.data),
    keepPreviousData: true,
  })

  // 2. جلب العدد الإجمالي غير المقروء بشكل منفصل دائم للتنبيهات والعدادات
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count-page'],
    queryFn: () => notificationsApi.unreadCount().then(r => r.data),
  })

  // 3. دالة قراءة كل الإشعارات
  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('تم تعيين جميع الإشعارات كمقروءة')
    },
    onError: (err) => toast.error(getApiError(err))
  })

  // 4. دالة قراءة إشعار واحد
  const markOneMutation = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: (err) => toast.error(getApiError(err))
  })

  // 5. دالة حذف إشعار محدد
  const deleteMutation = useMutation({
    mutationFn: (id) => notificationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast.success('تم حذف الإشعار بنجاح')
    },
    onError: (err) => toast.error(getApiError(err))
  })

  // 6. دالة تنظيف وحذف كافة الإشعارات المقروءة
  const clearReadMutation = useMutation({
    mutationFn: () => notificationsApi.clearAllRead(),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      setPage(1)
      toast.success(res?.message || 'تم تنظيف الإشعارات المقروءة')
    },
    onError: (err) => toast.error(getApiError(err))
  })

  if (isLoading) return <PageLoader />

<<<<<<< HEAD
  const meta = responseData?.meta || { total_items: 0, total_pages: 0, current_page: 1 }
  const totalUnread = unreadData?.count || 0
=======
  const notificationsList = responseData?.items || []
  const meta = responseData?.meta || { total_items: 0, total_pages: 0, current_page: 1 }
  const totalUnread = unreadData?.count || 0
  
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
  const hasReadNotifications = meta.total_items > totalUnread

  const handleNotificationClick = async (n) => {
    if (!n.read_at) {
      markOneMutation.mutate(n.id)
    }
  }

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    setPage(1)
  }

  return (
<<<<<<< HEAD
    <div className={clsx("min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 pb-12 space-y-6")}>
      
      {/* رأس الصفحة وصندوق الإدارة العلوي */}
      <div className={clsx(theme.card.base, "flex flex-col sm:flex-row sm:items-center justify-between gap-4")}>
        <div className="space-y-1">
          <h1 className={clsx(theme.text.pageTitle, "flex items-center gap-2.5")}>
            <span className="p-2 text-amber-500 flex items-center justify-center shadow-sm">
              <Bell className="w-5 h-5 stroke-[2.2]" />
            </span>
            مركز الإشعارات
          </h1>
          {totalUnread > 0 ? (
            <p className={clsx("text-xs font-semibold px-2.5 py-1 rounded-md inline-block", theme.alert.warning)}>
              لديك {totalUnread} إشعار جديد بحاجة للمتابعة الفورية
            </p>
          ) : (
            <p className={theme.text.muted}>جميع الإشعارات والتوثيقات الإدارية الواردة مُحدثة</p>
          )}
        </div>
        
        {/* أزرار الإجراءات الجماعية */}
        <div className="flex items-center gap-2.5 self-start sm:self-center">
=======
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-0 py-4 text-right " dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">

        <div className="space-y-0.5">
          <h1 className="text-xl font-bold text-gray-950 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[var(--color-primary-600)] rounded-md inline-block" />
            مركز الإشعارات
          </h1>
          {totalUnread > 0 ? (
            <p className="text-xs sm:text-sm font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
              لديك {totalUnread} إشعار جديد بحاجة للمتابعة
            </p>
          ) : (
            <p className="text-xs text-gray-400">جميع الإشعارات والتوثيقات الإدارية الواردة</p>
          )}
        </div>
        
        {/* التحكم الجماعي بالأعلى */}
        <div className="flex items-center gap-2 self-start sm:self-center">
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
          {hasReadNotifications && (
            <button
              onClick={() => {
                if(confirm('هل أنت متأكد من حذف كافة الإشعارات المقروءة نهائياً لتنظيف اللوحة؟')) {
                  clearReadMutation.mutate()
                }
              }}
              disabled={clearReadMutation.isPending}
<<<<<<< HEAD
              className={clsx(theme.button.base, theme.button.danger, "text-xs px-3 py-2")}
=======
              className="text-xs font-bold px-3 py-2 border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 flex items-center gap-1.5 rounded-xl transition-all disabled:opacity-50"
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
              title="تنظيف اللوحة وحذف المقروء نهائياً"
            >
              {clearReadMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
<<<<<<< HEAD
                <Eraser className="w-3.5 h-3.5" />
=======
                <Eraser className="w-3.5 h-3.5 stroke-[2]" />
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
              )}
              <span>تنظيف المقروء</span>
            </button>
          )}

          {totalUnread > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
<<<<<<< HEAD
              className={clsx(theme.button.base, theme.button.secondary, "text-xs px-3 py-2")}
            >
              {markAllMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
=======
              className="text-xs font-bold px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-1.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {markAllMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5 text-green-600 stroke-[2.5]" />
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
              )}
              <span>تعليم الكل كمقروء</span>
            </button>
          )}
        </div>
      </div>

<<<<<<< HEAD
      {/* شريط الفلاتر والتبويبات الموحد */}
      <div className={clsx(theme.card.base, "py-3 space-y-4")}>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs">
          <button 
            onClick={() => handleFilterChange('all')}
            className={resolveTabState(theme.tabs.filter.base, filter === 'all', theme.tabs.filter.active + " flex-1 py-2 text-center")}
          >
            الكل {filter === 'all' ? `(${meta.total_items})` : ''}
          </button>
          <button 
            onClick={() => handleFilterChange('unread')}
            className={resolveTabState(theme.tabs.filter.base, filter === 'unread', theme.tabs.filter.active + " flex-1 py-2 text-center")}
          >
            غير المقروء ({totalUnread})
          </button>
        </div>

        <PaginationProvider storageKey="notifications">
          {({ currentParams }) => {
            const { data: apiResponse, isLoading } = useQuery({
              queryKey: ['notifications', currentParams.page, currentParams.page_size, currentParams.search, currentParams.sort_by, currentParams.sort_order, filter],
=======
      {/* شريط الفلاتر */}
      <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200/60 text-xs">
        <button 
          onClick={() => handleFilterChange('all')}
          className={clsx('flex-1 py-2 rounded-lg font-bold transition-all', filter === 'all' ? 'bg-white text-[var(--color-primary-700)] shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900')}
        >
          الكل {filter === 'all' ? `(${meta.total_items})` : ''}
        </button>
        <button 
          onClick={() => handleFilterChange('unread')}
          className={clsx('flex-1 py-2 rounded-lg font-bold transition-all', filter === 'unread' ? 'bg-white text-[var(--color-primary-700)] shadow-sm border border-gray-100' : 'text-gray-500 hover:text-gray-900')}
        >
          غير المقروء ({totalUnread})
        </button>
      </div>
      <PaginationProvider storageKey="notifications">
        {({ currentParams, handleSort, updateState }) => {
          const { data: apiResponse, isLoading } = useQuery({
              queryKey: ['notifications', currentParams.page, currentParams.page_size,currentParams.search, currentParams.sort_by, currentParams.sort_order],
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
              queryFn: () => {
                const cleanParams = {
                  page: currentParams.page,
                  page_size: currentParams.page_size,
                  unread_only: filter === 'unread' 
                }
                if (currentParams.search && currentParams.search.trim() !== '') {
                  cleanParams.search = currentParams.search.trim()
                }
                return notificationsApi.list(cleanParams).then(res => res.data)
              }
            });
<<<<<<< HEAD

            const notificationsList = apiResponse?.items || []
            const totalPages = apiResponse?.pages || 1
            PaginationProvider.totalPages = totalPages;

            return (
              <div className="space-y-4">
                {isFetching && !isLoading && (
                  <div className="flex items-center justify-center text-xs text-slate-400 gap-1.5 py-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري تحديث البيانات الإدارية...</span>
                  </div>
                )}

                {!notificationsList.length ? (
                  <EmptyState
                    icon={Bell}
                    title="لا توجد إشعارات"
                    description={filter === 'unread' ? "لا توجد أي إشعارات غير مقروءة حالياً." : "صندوق الإشعارات فارغ تماماً."}
                  />
                ) : (
                  <div className="space-y-3">
                    {notificationsList.map(n => {
                      const isUnread = !n.read_at
                      const isMarkingThis = markOneMutation.isPending && markOneMutation.variables === n.id
                      const isDeletingThis = deleteMutation.isPending && deleteMutation.variables === n.id
                      
                      return (
                        <div
                          key={n.id}
                          onClick={() => isUnread && !isMarkingThis && !isDeletingThis && handleNotificationClick(n)}
                          className={clsx(
                            theme.card.base,
                            "transition-all duration-200 relative group text-right p-4",
                            isUnread 
                              ? 'border-r-4 border-r-primary-500 bg-primary-50/20 dark:bg-primary-950/10 shadow-sm cursor-pointer hover:shadow-md' 
                              : 'opacity-85 hover:opacity-100 hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <span className="text-xl flex-shrink-0 bg-slate-100 dark:bg-slate-800 w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
                              {NOTIF_ICONS[n.type] || '🔔'}
                            </span>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <p className={clsx('text-sm font-bold leading-tight', isUnread ? 'text-slate-950 dark:text-white' : 'text-slate-700 dark:text-slate-300')}>
                                  {n.title}
                                </p>
                                
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className={theme.text.helper}>
                                    {formatDateTime(n.created_at)}
                                  </span>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if(confirm('حذف هذا الإشعار؟')) {
                                        deleteMutation.mutate(n.id)
                                      }
                                    }}
                                    disabled={isDeletingThis}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    title="حذف الإشعار"
                                  >
                                    {isDeletingThis ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                              
                              <p className={clsx("text-xs sm:text-sm mt-1 leading-relaxed", theme.text.muted)}>
                                {n.body}
                              </p>
                              
                              <div className="flex flex-wrap items-center gap-2 mt-3">
                                {n.related_task_id && (
                                  <Link
                                    to={`/tasks/${n.related_task_id}`}
                                    onClick={() => handleNotificationClick(n)}
                                    className={clsx(theme.badge.base, "text-xs font-bold text-primary-700 bg-primary-50 border border-primary-200 dark:bg-primary-950/50 dark:text-primary-300 dark:border-primary-900 px-3 py-1 hover:bg-primary-100 transition-all")}
                                  >
                                    <span>استعراض ملف المعاملة</span>
                                    <ArrowLeft className="w-3 h-3 stroke-[2.5]" />
                                  </Link>
                                )}

                                {n.type === 'transfer_request' && (
                                  <Link
                                    to="/transfers"
                                    onClick={() => handleNotificationClick(n)}
                                    className={clsx(theme.badge.base, "text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900 px-3 py-1 hover:bg-amber-100 transition-all")}
                                  >
                                    <span>اتخاذ إجراء الإحالة</span>
                                    <span>📨</span>
                                  </Link>
                                )}
                              </div>
                            </div>
                            
                            {isUnread && (
                              <div className="flex-shrink-0 self-center">
                                {isMarkingThis ? (
                                  <Loader2 className="w-3 h-3 animate-spin text-primary-500" />
                                ) : (
                                  <span className="w-2.5 h-2.5 bg-primary-500 rounded-full block animate-pulse" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }}
        </PaginationProvider>
      </div>

=======
            const notificationsList = apiResponse?.items || []
            const totalPages = apiResponse?.pages || 1
            PaginationProvider.totalPages = totalPages;
          return (
            <div className="sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
              {isFetching && !isLoading && (
                <div className="flex items-center justify-center text-xs text-gray-400 gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري تحديث البيانات الإدارية...</span>
                </div>
              )}
              {!notificationsList.length ? (
                <EmptyState
                  icon={Bell}
                  title="لا توجد إشعارات"
                  description={filter === 'unread' ? "لا توجد أي إشعارات غير مقروءة حالياً." : "صندوق الإشعارات فارغ تماماً."}
                />
              ) : (
                <div className="space-y-2.5">
                  {notificationsList.map(n => {
                    const isUnread = !n.read_at
                    const isMarkingThis = markOneMutation.isPending && markOneMutation.variables === n.id
                    const isDeletingThis = deleteMutation.isPending && deleteMutation.variables === n.id
                    return(
                              <div
                                key={n.id}
                                onClick={() => isUnread && !isMarkingThis && !isDeletingThis && handleNotificationClick(n)}
                                className={clsx(
                                  'bg-white rounded-2xl border border-gray-100 transition-all duration-200 p-4 relative group text-right',
                                  isUnread ? 'border-r-4 border-r-[var(--color-primary-500)] bg-[var(--color-primary-50,rgba(59,130,246,0.01))] shadow-sm' : 'opacity-85 hover:bg-gray-50/50',
                                  isUnread && 'cursor-pointer hover:shadow-md',
                                  isDeletingThis && 'opacity-40 pointer-events-none'
                                )}
                              >
                                <div className="flex items-start gap-3.5">
                                  
                                  <span className="text-2xl flex-shrink-0 bg-gray-50 w-10 h-10 rounded-xl flex items-center justify-center border border-gray-100 shadow-sm">
                                    {NOTIF_ICONS[n.type] || '🔔'}
                                  </span>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-3">
                                      <p className={clsx('text-sm font-bold leading-tight', isUnread ? 'text-gray-950' : 'text-gray-600')}>
                                        {n.title}
                                      </p>
                                      
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-[10px] font-medium text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                          {formatDateTime(n.created_at)}
                                        </span>
                                        
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if(confirm('حذف هذا الإشعار؟')) {
                                              deleteMutation.mutate(n.id)
                                            }
                                          }}
                                          disabled={isDeletingThis}
                                          className="p-1 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                          title="حذف الإشعار"
                                        >
                                          {isDeletingThis ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                          ) : (
                                            <Trash2 className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                    
                                    <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">{n.body}</p>
                                    
                                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                      {n.related_task_id && (
                                        <Link
                                          to={`/tasks/${n.related_task_id}`}
                                          onClick={() => handleNotificationClick(n)}
                                          className="text-xs font-bold text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] inline-flex items-center gap-1 bg-[var(--color-primary-50)] px-2.5 py-1 rounded-lg border border-[var(--color-primary-100)] transition-all"
                                        >
                                          <span>استعراض ملف المعاملة</span>
                                          <ArrowLeft className="w-3 h-3 stroke-[2.5]" />
                                        </Link>
                                      )}

                                      {n.type === 'transfer_request' && (
                                        <Link
                                          to="/transfers"
                                          onClick={() => handleNotificationClick(n)}
                                          className="text-xs font-bold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 transition-all shadow-sm"
                                        >
                                          <span>اتخاذ إجراء الإحالة</span>
                                          <span>📨</span>
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {isUnread && (
                                    <div className="flex-shrink-0 self-center">
                                      {isMarkingThis ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-[var(--color-primary-500)]" />
                                      ) : (
                                        <span className="w-2.5 h-2.5 bg-[var(--color-primary-500)] rounded-full block animate-pulse" />
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              )
                  })}
                  
                </div>
              )}

            </div>
          )
        }}
      </PaginationProvider>
      
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    </div>
  )
}