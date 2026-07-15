// src/components/tasks/TaskCommentsSection.jsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, Trash2, Edit2, Check, X, Send, Loader2, ArrowDownCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { commentsApi } from '@/api'
import { Avatar } from '@/components/common'
import { formatDateTime } from '@/utils/helpers'
import useAuthStore from '@/stores/authStore'
import UserContactPopover from '@/components/shared/UserContactPopover'
import clsx from 'clsx'
import { theme, resolveFieldState } from '@/constants/theme';
export default function TaskCommentsSection({ taskId, taskPermissions, task }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  // 🌟 إدارة حالة الترقيم والـ Pagination محلياً للتعليقات
  const [commentsPage, setCommentsPage] = useState(1)
  const [allComments, setAllComments] = useState([]) // المصفوفة التجميعية للتعليقات

  // استخراج وتدقيق صلاحيات التعليقات الإدارية من الخادم مباشرة
  const canAdd = taskPermissions?.can_add_comment ?? false
  const canEditAny = taskPermissions?.can_edit_any_comment ?? false
  const canEditOwn = taskPermissions?.can_edit_own_comment ?? false
  const canDeleteAny = taskPermissions?.can_delete_any_comment ?? false
  const canDeleteOwn = taskPermissions?.can_delete_own_comment ?? false

  // دوال التحقق من الصلاحيات الوظيفية لكل تعليق على حدة
  const canEditComment = (commentUserId) => {
    if (canEditAny) return true
    if (canEditOwn && commentUserId === user?.id) return true
    return false
  }

  const canDeleteComment = (commentUserId) => {
    if (canDeleteAny) return true
    if (canDeleteOwn && commentUserId === user?.id) return true
    return false
  }

  // 🌟 جلب سجل المناقشات والتعليقات بنظام الترقيم الموحد (طلب 20 عنصر)
  const { data: commentsPaginationData, isLoading } = useQuery({
    queryKey: ['task-comments', taskId, { commentsPage }],
    queryFn: () => commentsApi.listComments(taskId, { page: commentsPage, limit: 20 }).then(r => r.data),
    enabled: !!taskId,
    placeholderData: (keepPreviousData) => keepPreviousData,
  })

  // استخراج مؤشرات الترقيم الفنية من الاستجابة الديناميكية للباك إند
  const totalComments = commentsPaginationData?.total || 0
  const hasMoreComments = commentsPaginationData?.has_more ?? false

  // 🌟 تنفيذ شرطك بالملّي: الصفحة 1 تمسح القديم، والصفحات التالية تدمج بدون تكرار
  useEffect(() => {
    if (commentsPaginationData?.items) {
      if (commentsPage === 1) {
        // أول طلب (الصفحة 1): امسح القديم تماماً ونزل الـ 20 تعليق الجداد على نظافة
        setAllComments(commentsPaginationData.items)
      } else {
        // الطلبات التالية (صفحة 2 فما فوق): ضيف الجديد على القديم بدون مسح مع منع التكرار
        setAllComments(prev => {
          const existingIds = new Set(prev.map(item => item.id))
          const newItems = commentsPaginationData.items.filter(item => !existingIds.has(item.id))
          return [...prev, ...newItems]
        })
      }
    }
  }, [commentsPaginationData, commentsPage])

  // إضافة تعليق أو توجيه جديد للمهمة
  const addMutation = useMutation({
    mutationFn: (text) => commentsApi.addComment(taskId, text),
    onSuccess: () => {
      setNewComment('')
      setCommentsPage(1) // 🌟 تصفير الترقيم فوراً ليمسح المكون البيانات ويجلب الصفحة الأولى محدثة
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
      toast.success('تم إضافة التعليق بنجاح')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'فشلت عملية إضافة التعليق'),
  })

  // اعتماد وحفظ تعديل التعليق
  const updateMutation = useMutation({
    mutationFn: ({ commentId, text }) => commentsApi.updateComment(taskId, commentId, text),
    onSuccess: () => {
      setEditingId(null)
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
      toast.success('تم تحديث وتعديل التعليق')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'فشل تعديل التعليق الإداري'),
  })

  // حذف وإزالة التعليق نهائياً من سجلات القسم
  const deleteMutation = useMutation({
    mutationFn: (commentId) => commentsApi.deleteComment(taskId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] })
      // حذف العنصر محلياً فوراً لتحسين سرعة واجهة الاستخدام (UX)
      setAllComments(prev => prev.filter(item => item.id !== deleteMutation.variables))
      toast.success('تم حذف التعليق من السجل')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'فشلت عملية إزالة التعليق'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newComment.trim() || addMutation.isPending) return
    addMutation.mutate(newComment.trim())
  }

  const handleStartEdit = (comment) => {
    setEditingId(comment.id)
    setEditText(comment.comment_text)
  }

  const handleSaveEdit = (commentId) => {
    if (!editText.trim() || updateMutation.isPending) return
    updateMutation.mutate({ commentId, text: editText.trim() })
  }

  // 🌟 دالة معالجة زر عرض المزيد للتعليقات
  const handleLoadMore = () => {
    if (isLoading || !hasMoreComments) return
    setCommentsPage(prev => prev + 1)
  }

  return (
    <div className="p-4 sm:p-5 space-y-4" dir="rtl">
      {/* عنوان وترويسة قسم المناقشات */}
      <h3 className="text-xs sm:text-sm font-bold text-gray-950 flex items-center gap-1.5 border-b border-gray-50 pb-3">
        <span className="w-1.5 h-3 bg-[var(--color-primary-600)] rounded-sm inline-block" />
        <MessageSquare className="w-4 h-4 text-gray-400" />
        <span>المناقشات والتعليقات الإدارية ({totalComments})</span>
      </h3>

      {/* لوحة عرض وسرد التعليقات والمناقشات المتبادلة */}
      {isLoading && allComments.length === 0 ? (
        <div className="text-center py-6 text-xs font-medium text-gray-400">جاري تحميل سجل المداولات...</div>
      ) : allComments.length === 0 ? (
        <div className="text-center py-8 text-xs font-medium text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          لا توجد أي مناقشات مدرجة على هذه المهمة حالياً.
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          {/* حاوية الـ Scroll للتعليقات */}
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
                  <UserContactPopover user={comment.user} taskId={taskId} taskTitle={task.title}>
                    <Avatar 
                      name={comment.user.full_name || ''} 
                      src={comment.avatar_url || comment.user?.avatar_url} 
                      size="sm" 
                      className="flex-shrink-0 object-cover rounded-full" 
                    />
                  </UserContactPopover>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 block truncate" title={comment.user.full_name}>
                          {comment.user.full_name}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium block">
                          {formatDateTime(comment.created_at)}
                        </span>
                      </div>

                      {/* أزرار الإجراءات الفنية */}
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
                              onClick={() => {
                                if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا التعليق نهائياً؟')) {
                                  deleteMutation.mutate(comment.id)
                                }
                              }}
                              disabled={isCurrentCommentDeleting || isCurrentCommentUpdating}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-40"
                              title="حذف التعليق"
                            >
                              {isCurrentCommentDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* وضعية تعديل النص الحالي أو قراءته المباشرة */}
                    {isEditing ? (
                      <div className="flex gap-1.5 mt-2">
                        <input
                          className={clsx(theme.input.base)}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          disabled={isCurrentCommentUpdating}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(comment.id)}
                          disabled={!editText.trim() || isCurrentCommentUpdating}
                          className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 h-9 w-9 flex items-center justify-center flex-shrink-0"
                          title="حفظ التعديلات"
                        >
                          {isCurrentCommentUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          disabled={isCurrentCommentUpdating}
                          className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors h-9 w-9 flex items-center justify-center flex-shrink-0"
                          title="إلغاء الأمر"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-line leading-relaxed break-words pt-1 text-right">
                        {comment.comment_text}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
            {/* 🌟 مكان زر "عرض المزيد" الخاص بالتعليقات مدمج في نهاية الحاوية */}
            {hasMoreComments && (
              <div className="pt-2 flex justify-center border-t border-gray-100 bg-white">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[var(--color-primary-600)] bg-white border border-gray-200 px-5 py-2.5 rounded-xl shadow-sm hover:border-primary-200 hover:bg-gray-50/50 transition-all group disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-primary-500)]" />
                  ) : (
                    <ArrowDownCircle className="w-3.5 h-3.5 text-gray-400 group-hover:text-[var(--color-primary-500)] transition-colors" />
                  )}
                  <span>عرض المزيد من التعليقات</span>
                </button>
              </div>
            )}
          </div>

          
        </div>
      )}

      {/* المحرك والمربع الإنشائي */}
      {canAdd && (
        <form onSubmit={handleSubmit} className="flex items-center gap-3 pt-3 border-t border-gray-100">
          <Avatar 
            name={user?.full_name || ''} 
            src={user?.avatar_url} 
            size="sm" 
            className="flex-shrink-0 object-cover rounded-full border border-gray-200 shadow-xs" 
          />
          
          <input
            className={clsx(theme.input.base)}
            placeholder="اكتب تعليقاً، استفساراً أو ملحوظة فنية داخل المهمة..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={addMutation.isPending}
            maxLength={1000}
          />
          <button
            type="submit"
            className="p-2.5 bg-[var(--color-primary-600)] text-white rounded-xl hover:bg-[var(--color-primary-700)] disabled:opacity-40 transition-colors h-10 w-10 flex items-center justify-center flex-shrink-0 shadow-sm"
            disabled={!newComment.trim() || addMutation.isPending}
            title="إرسال"
          >
            {addMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 transform rotate-180" />
            )}
          </button>
        </form>
      )}
    </div>
  )
}