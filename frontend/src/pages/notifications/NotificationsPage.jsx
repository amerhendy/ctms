import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck, Loader2, ArrowLeft, Trash2, Eraser } from 'lucide-react'
import { notificationsApi } from '@/api'
import { PageLoader, EmptyState } from '@/components/common'
import PaginationProvider from '@/components/common/PaginationProvider' // <--- استيراد النظام المشترك الجديد
import { formatDateTime, getApiError } from '@/utils/helpers'
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

  const notificationsList = responseData?.items || []
  const meta = responseData?.meta || { total_items: 0, total_pages: 0, current_page: 1 }
  const totalUnread = unreadData?.count || 0
  
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
          {hasReadNotifications && (
            <button
              onClick={() => {
                if(confirm('هل أنت متأكد من حذف كافة الإشعارات المقروءة نهائياً لتنظيف اللوحة؟')) {
                  clearReadMutation.mutate()
                }
              }}
              disabled={clearReadMutation.isPending}
              className="text-xs font-bold px-3 py-2 border border-red-100 bg-red-50/50 hover:bg-red-50 text-red-600 flex items-center gap-1.5 rounded-xl transition-all disabled:opacity-50"
              title="تنظيف اللوحة وحذف المقروء نهائياً"
            >
              {clearReadMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Eraser className="w-3.5 h-3.5 stroke-[2]" />
              )}
              <span>تنظيف المقروء</span>
            </button>
          )}

          {totalUnread > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              disabled={markAllMutation.isPending}
              className="text-xs font-bold px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50 flex items-center gap-1.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {markAllMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5 text-green-600 stroke-[2.5]" />
              )}
              <span>تعليم الكل كمقروء</span>
            </button>
          )}
        </div>
      </div>

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
      
    </div>
  )
}