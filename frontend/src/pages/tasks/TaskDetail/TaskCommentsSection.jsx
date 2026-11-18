// src/components/tasks/TaskCommentsSection.jsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  MessageSquare, Trash2, Edit2, Check, X, Send, Loader2,
  ArrowDownCircle, SlidersHorizontal, Search,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { commentsApi } from '@/api'
import { Avatar, ConfirmDialog } from '@/components/common'
import { formatDateTime } from '@/utils/helpers'
import useAuthStore from '@/stores/authStore'
import UserContactPopover from '@/components/shared/UserContactPopover'
import clsx from 'clsx'
import { theme } from '@/constants/theme'
import CommentText from '@/components/common/taskCommentText'

export default function TaskCommentsSection({ taskId, taskPermissions, task }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // 🌟 Pagination
  const [commentsPage, setCommentsPage] = useState(1)
  const [allComments, setAllComments] = useState([])

  // 🌟 Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState('')      // raw input
  const [debouncedSearch, setDebouncedSearch] = useState('') // after 300ms
  const [dateFrom, setDateFrom] = useState('')            // "YYYY-MM-DDTHH:mm"
  const [dateTo, setDateTo] = useState('')

  const hasActiveFilter = !!(debouncedSearch || dateFrom || dateTo)

  // 🌟 Debounce للبحث (300ms) مع تصفير الصفحة في نفس التحديث
  useEffect(() => {
    const t = setTimeout(() => {
      const trimmed = searchInput.trim()
      setDebouncedSearch(trimmed)
      setCommentsPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput])

  // 🌟 تغيير التاريخ: تصفير فوري (بدون debounce)
  const handleDateFromChange = (v) => { setDateFrom(v); setCommentsPage(1) }
  const handleDateToChange   = (v) => { setDateTo(v);   setCommentsPage(1) }

  const handleClearFilters = () => {
    setSearchInput('')
    setDebouncedSearch('')
    setDateFrom('')
    setDateTo('')
    setCommentsPage(1)
  }

  // استخراج الصلاحيات
  const canAdd = taskPermissions?.can_add_comment ?? false
  const canEditAny = taskPermissions?.can_edit_any_comment ?? false
  const canEditOwn = taskPermissions?.can_edit_own_comment ?? false
  const canDeleteAny = taskPermissions?.can_delete_any_comment ?? false
  const canDeleteOwn = taskPermissions?.can_delete_own_comment ?? false

  const canEditComment = (uid) => canEditAny || (canEditOwn && uid === user?.id)
  const canDeleteComment = (uid) => canDeleteAny || (canDeleteOwn && uid === user?.id)

  // 🌟 بناء الـ params للفلترة (يستخدمها الـ queryFn)
  const buildFilterParams = () => {
    const p = {}
    if (debouncedSearch) p.search = debouncedSearch
    if (dateFrom) p.from_date = dateFrom
    if (dateTo) p.to_date = dateTo
    return p
  }

  // 🌟 Query
  const {
    data: commentsPaginationData,
    isLoading,
    isFetching,
    isError,
    isPlaceholderData,
  } = useQuery({
    queryKey: [
      'task-comments', taskId,
      {
        page: commentsPage,
        search: debouncedSearch,
        from: dateFrom,
        to: dateTo,
      },
    ],
    queryFn: () => commentsApi
      .listComments(taskId, {
        page: commentsPage,
        limit: 20,
        ...buildFilterParams(),
      })
      .then(r => r.data),
    enabled: !!taskId,
    placeholderData: keepPreviousData,
  })

  const totalComments = commentsPaginationData?.total || 0
  const hasMoreComments = commentsPaginationData?.has_more ?? false

  // 🌟 merge effect (الصفحة 1 تمسح، والباقي يدمج بدون تكرار)
  useEffect(() => {
    if (isPlaceholderData) return
    if (commentsPaginationData?.items) {
      if (commentsPage === 1) {
        setAllComments(commentsPaginationData.items)
      } else {
        setAllComments(prev => {
          const ids = new Set(prev.map(i => i.id))
          return [...prev, ...commentsPaginationData.items.filter(i => !ids.has(i.id))]
        })
      }
    }
  }, [commentsPaginationData, commentsPage, isPlaceholderData])

  // Mutations
  const addMutation = useMutation({
    mutationFn: (text) => commentsApi.addComment(taskId, text),
    onSuccess: () => {
      setNewComment('')
      setCommentsPage(1)
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
      if (hasActiveFilter) {
        toast.success('تمت الإضافة — لكن التعليق الجديد قد لا يطابق الفلاتر الحالية', { duration: 4500 })
      } else {
        toast.success('تم إضافة التعليق بنجاح')
      }
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'فشلت عملية إضافة التعليق'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ commentId, text }) => commentsApi.updateComment(taskId, commentId, text),
    onSuccess: () => {
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
      toast.success('تم تحديث وتعديل التعليق')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'فشل تعديل التعليق'),
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId) => commentsApi.deleteComment(taskId, commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
      setAllComments(prev => prev.filter(i => i.id !== variables))
      toast.success('تم حذف التعليق من السجل')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'فشلت عملية إزالة التعليق'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newComment.trim() || addMutation.isPending) return
    addMutation.mutate(newComment.trim())
  }

  const handleStartEdit = (c) => { setEditingId(c.id); setEditText(c.comment_text) }
  const handleSaveEdit = (id) => {
    if (!editText.trim() || updateMutation.isPending) return
    updateMutation.mutate({ commentId: id, text: editText.trim() })
  }
  const handleLoadMore = () => {
    if (isFetching || !hasMoreComments) return
    setCommentsPage(p => p + 1)
  }

  return (
    <div className="p-4 sm:p-5 space-y-4" dir="rtl">
      {/* Header + زر الفلاتر */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-50 pb-3">
        <h3 className="text-xs sm:text-sm font-bold text-gray-950 flex items-center gap-1.5">
          <span className="w-1.5 h-3 bg-[var(--color-primary-600)] rounded-sm inline-block" />
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <span>
            المناقشات والتعليقات ({totalComments}
            {hasActiveFilter && <span className="text-[10px] text-amber-600 font-bold mx-1">• مفلتر</span>})
          </span>
        </h3>

        <button
          type="button"
          onClick={() => setShowFilters(v => !v)}
          className={clsx(
            'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors',
            hasActiveFilter || showFilters
              ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)] border-[var(--color-primary-200)]'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50',
          )}
          title="فلترة التعليقات"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>فلترة</span>
          {hasActiveFilter && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
          )}
        </button>
      </div>

      {/* لوحة الفلاتر */}
      {showFilters && (
        <div className="bg-gray-50/70 border border-gray-100 rounded-xl p-3 space-y-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute top-1/2 right-2.5 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="بحث بالاسم أو نص التعليق..."
              className={clsx(theme.input.base, 'w-full pr-8 text-xs py-2')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold text-gray-500 block">من تاريخ/وقت</label>
              <input
                type="datetime-local"
                value={dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className={clsx(theme.input.base, 'w-full text-xs py-2')}
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[10px] font-bold text-gray-500 block">إلى تاريخ/وقت</label>
              <input
                type="datetime-local"
                value={dateTo}
                onChange={(e) => handleDateToChange(e.target.value)}
                className={clsx(theme.input.base, 'w-full text-xs py-2')}
              />
            </div>
          </div>

          {hasActiveFilter && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 px-2.5 py-1 rounded-md hover:bg-red-50 transition-colors"
              >
                مسح الفلاتر
              </button>
            </div>
          )}
        </div>
      )}

      {/* مؤشر تحميل خفيف أثناء الفلترة (placeholder) */}
      {isFetching && !isLoading && allComments.length > 0 && (
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>جاري تحديث النتائج...</span>
        </div>
      )}

      {/* قائمة التعليقات */}
      {isError ? (
        <div className="text-center py-6 text-xs font-medium text-red-500 bg-red-50/50 rounded-xl border border-red-100">
          تعذّر تحميل التعليقات. حاول تحديث الصفحة.
        </div>
      ) : isLoading && allComments.length === 0 ? (
        <div className="text-center py-6 text-xs font-medium text-gray-400">جاري تحميل سجل المداولات...</div>
      ) : allComments.length === 0 ? (
        <div className="text-center py-8 text-xs font-medium text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200 space-y-2">
          {hasActiveFilter ? (
            <>
              <p>لا توجد تعليقات مطابقة للفلاتر الحالية.</p>
              <button
                onClick={handleClearFilters}
                className="text-[11px] font-bold text-[var(--color-primary-600)] hover:underline"
              >
                مسح الفلاتر وعرض كل التعليقات
              </button>
            </>
          ) : (
            <p>لا توجد أي مناقشات مدرجة على هذه المهمة حالياً.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          <div className="space-y-3 max-h-96 overflow-y-auto pl-1 custom-scrollbar">
            {allComments.map((comment) => {
              const isEditing = editingId === comment.id
              const canEdit = canEditComment(comment.user_id)
              const canDelete = canDeleteComment(comment.user_id)
              const isCurrentCommentUpdating = updateMutation.isPending && updateMutation.variables?.commentId === comment.id
              const isCurrentCommentDeleting = deleteMutation.isPending && deleteMutation.variables === comment.id

              return (
                <div
                  key={comment.id}
                  className="flex gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100 group transition-all hover:bg-white hover:border-gray-200 hover:shadow-sm"
                >
                  <UserContactPopover user={comment.user} taskId={taskId} taskTitle={task?.title}>
                    <Avatar
                      name={comment.user?.full_name || ''}
                      src={comment.avatar_url || comment.user?.avatar_url}
                      size="sm"
                      className="flex-shrink-0 object-cover rounded-full"
                    />
                  </UserContactPopover>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 block truncate" title={comment.user?.full_name || ''}>
                          {comment.user?.full_name || 'مستخدم محذوف'}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium block">
                          {formatDateTime(comment.created_at)}
                        </span>
                      </div>

                      {(canEdit || canDelete) && !isEditing && (
                        <div className="flex items-center gap-1 bg-white sm:bg-transparent p-0.5 sm:p-0 rounded-md border border-gray-100 sm:border-0 shadow-sm sm:shadow-none sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {canEdit && (
                            <button
                              onClick={() => handleStartEdit(comment)}
                              disabled={isCurrentCommentDeleting || isCurrentCommentUpdating}
                              className="p-1 text-gray-400 hover:text-[var(--color-primary-600)] hover:bg-gray-50 rounded-md transition-colors disabled:opacity-40"
                              title="تعديل التعليق"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => setConfirmDeleteId(comment.id)}
                              disabled={isCurrentCommentDeleting || isCurrentCommentUpdating}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40"
                              title="حذف التعليق"
                            >
                              {isCurrentCommentDeleting
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-1.5 mt-2">
                        <textarea
                          rows={1}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          disabled={isCurrentCommentUpdating}
                          placeholder="اكتب تعليقك هنا..."
                          maxLength={1000}
                          className={clsx(
                            theme.input.base,
                            'w-full sm:flex-1 resize-none overflow-hidden min-h-[38px] max-h-40 leading-relaxed py-2 [field-sizing:content]',
                          )}
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1.5 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={!editText.trim() || isCurrentCommentUpdating}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 h-9 px-3 sm:px-0 sm:w-9 flex items-center justify-center gap-1.5"
                            title="حفظ التعديلات"
                          >
                            {isCurrentCommentUpdating
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Check className="w-4 h-4" />}
                            <span className="text-xs font-bold sm:hidden">حفظ</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            disabled={isCurrentCommentUpdating}
                            className="p-2 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-200 rounded-lg hover:bg-gray-300 dark:hover:bg-slate-600 transition-colors h-9 px-3 sm:px-0 sm:w-9 flex items-center justify-center gap-1.5"
                            title="إلغاء"
                          >
                            <X className="w-4 h-4" />
                            <span className="text-xs font-bold sm:hidden">إلغاء</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <CommentText text={comment.comment_text} />
                    )}
                  </div>
                </div>
              )
            })}

            {hasMoreComments && (
              <div className="pt-2 flex justify-center border-t border-gray-100 bg-white">
                <button
                  onClick={handleLoadMore}
                  disabled={isFetching}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[var(--color-primary-600)] bg-white border border-gray-200 px-5 py-2.5 rounded-xl shadow-sm hover:border-primary-200 hover:bg-gray-50/50 transition-all group disabled:opacity-60"
                >
                  {isFetching
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-primary-500)]" />
                    : <ArrowDownCircle className="w-3.5 h-3.5 text-gray-400 group-hover:text-[var(--color-primary-500)] transition-colors" />}
                  <span>عرض المزيد من التعليقات</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* مربع الإضافة */}
      {canAdd && (
        <form onSubmit={handleSubmit} className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <Avatar
            name={user?.full_name || ''}
            src={user?.avatar_url}
            size="sm"
            className="flex-shrink-0 object-cover rounded-full border border-gray-200 shadow-xs"
          />
          <textarea
            rows={1}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={addMutation.isPending}
            placeholder="اكتب تعليقاً، استفساراً أو ملحوظة فنية داخل المهمة..."
            className={clsx(
              theme.input.base,
              'w-full sm:flex-1 resize-none overflow-hidden min-h-[38px] max-h-40 leading-relaxed py-2 [field-sizing:content]',
            )}
            maxLength={1000}
          />
          <button
            type="submit"
            className="p-2.5 bg-[var(--color-primary-600)] text-white rounded-xl hover:bg-[var(--color-primary-700)] disabled:opacity-40 transition-colors h-10 w-10 flex items-center justify-center flex-shrink-0 shadow-sm"
            disabled={!newComment.trim() || addMutation.isPending}
            title="إرسال"
          >
            {addMutation.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Send className="w-4 h-4 transform rotate-180" />}
          </button>
        </form>
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => { if (confirmDeleteId) deleteMutation.mutate(confirmDeleteId) }}
        title="حذف التعليق"
        message="هل أنت متأكد من رغبتك في حذف هذا التعليق نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        danger
      />
    </div>
  )
}