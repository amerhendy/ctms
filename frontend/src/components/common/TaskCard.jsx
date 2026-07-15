// src/components/tasks/TaskCard.jsx
import { Link } from 'react-router-dom'
import { Star, Zap, Eye, Building2, User, Calendar, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { PriorityBadge, StatusBadge, ProgressBar, UrgencyBadge } from '@/components/common'
import { formatDate, daysUntilDue, dueDateColor } from '@/utils/helpers'
import clsx from 'clsx'

export default function TaskCard({ 
  task, 
  onFavorite, 
  onUrgency, 
  onView, 
  isFavPending = false, 
  isUrgencyPending = false 
}) {
  const days = daysUntilDue(task.due_date)
  const isOverdue = days !== null && days < 0
  const isUrgentApproved = task.urgency_request_status === 'approved'
  const progress = task.progress_percentage || 0

  const handleFavorite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onFavorite?.(task.id)
  }

  const handleUrgency = (e) => {
    e.preventDefault()
    e.stopPropagation()
    onUrgency?.(task.id)
  }

  const handleView = () => {
    onView?.(task.id)
  }

  return (
    <div
      className={clsx(
        "group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 text-right",
        isUrgentApproved && "border-r-4 border-r-red-500 bg-red-50/10 dark:bg-red-950/20",
        isOverdue && !isUrgentApproved && "border-r-4 border-r-amber-500 dark:bg-amber-950/10"
      )}
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          
          {/* دائرة ومؤشر نسبة الإنجاز المتجاوبة */}
          <div className="relative w-12 h-12 flex-shrink-0 self-center sm:self-auto">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" className="dark:stroke-gray-700" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none"
                stroke={progress === 100 ? '#22c55e' : '#3b82f6'}
                strokeWidth="3"
                strokeDasharray={`${progress} ${100 - progress}`}
                strokeLinecap="round"
                className="transition-all duration-300"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold text-gray-700 dark:text-gray-200">
              {progress}%
            </span>
          </div>

          {/* محتوى بيانات المهمة الأساسي */}
          <div className="flex-1 min-w-0">
            
            {/* عنوان المهمة المعاملة وأزرار التحكم السريع */}
            <div className="flex items-start justify-between gap-3">
              <Link
                to={`/tasks/${task.id}`}
                className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2"
                onClick={handleView}
              >
                {task.title}
              </Link>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* زر المفضلة */}
                <button
                  onClick={handleFavorite}
                  disabled={isFavPending}
                  className={clsx(
                    "p-1.5 rounded-xl transition-all disabled:opacity-50",
                    task.is_favorite
                      ? "text-amber-500 bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/50 dark:hover:bg-amber-900/50"
                      : "text-gray-300 hover:text-amber-500 hover:bg-gray-50 dark:text-gray-600 dark:hover:text-amber-500 dark:hover:bg-gray-700"
                  )}
                  title={task.is_favorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                >
                  {isFavPending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  ) : (
                    <Star className={clsx("w-4 h-4", task.is_favorite && "fill-current")} />
                  )}
                </button>
                
                {/* زر طلب الاستعجال العاجل */}
                {task.urgency_request_status !== 'approved' && task.urgency_request_status !== 'pending' && (
                  <button
                    onClick={handleUrgency}
                    disabled={isUrgencyPending}
                    className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 disabled:opacity-50 transition-all"
                    title="إرسال طلب استعجال الإجراء"
                  >
                    {isUrgencyPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                  </button>
                )}
                
                {/* زر الانتقال المباشر للتفاصيل */}
                <Link
                  to={`/tasks/${task.id}`}
                  onClick={handleView}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-[var(--color-primary-600)] hover:bg-gray-50 transition-all"
                  title="عرض تفاصيل ومتابعة المهمة"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* شارات التعريف وبطاقات الحالة */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              {isUrgentApproved && <UrgencyBadge status="approved" />}
              {task.urgency_request_status === 'pending' && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                  <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                  طلب استعجال معلق بالانتظار
                </span>
              )}
            </div>

            {/* تفاصيل القسم، منشئ المعاملة ورقم الملف */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-[11px] sm:text-xs text-gray-400 font-medium">
              {task.department_name && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  <span>الإدارة: {task.department_name}</span>
                </span>
              )}
              {task.creator_name && (
                <span className="inline-flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>بواسطة: {task.creator_name}</span>
                </span>
              )}
              {task.file_number && (
                <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200/60 font-bold">
                  رقم الملف: {task.file_number}
                </span>
              )}
            </div>

            {/* التاريخ المستهدف (Due Date) */}
            {task.due_date && (
              <div className="mt-2 flex items-center gap-1 text-[11px] sm:text-xs font-medium">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span className={clsx("font-semibold", dueDateColor(days))}>
                  تاريخ الاستحقاق: {formatDate(task.due_date)}
                  {isOverdue && ' (متأخرة عن الموعد)'}
                </span>
              </div>
            )}

            {/* مؤشر الإنجاز الأفقي المساعد (يظهر في حالة التقدم التدريجي) */}
            {progress > 0 && progress < 100 && (
              <div className="mt-3">
                <ProgressBar value={progress} height="h-1" />
              </div>
            )}
            {progress === 100 && (
              <div className="mt-2.5 text-xs text-green-600 font-bold inline-flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                <CheckCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>اكتملت المعاملة بنجاح</span>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}