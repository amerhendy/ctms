// TasksListPage.jsx (نسخة UI/UX احترافية وموحدة مع دعم كانبان، جدول، تقويم، وقائمة)
import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Kanban, Table, Calendar as CalendarIcon, LayoutList,
  Plus, Filter, Star, Zap, Eye, CalendarDays, Building2, User,
  CheckCircle2, AlertTriangle, Clock
} from 'lucide-react'
import toast from 'react-hot-toast'
import { tasksApi } from '@/api'
import {
  PriorityBadge, StatusBadge, ProgressBar, PageLoader,
  EmptyState, Select, UrgencyBadge
} from '@/components/common'
import TaskCard from '@/components/common/TaskCard'
import { formatDate, daysUntilDue, dueDateColor, getApiError } from '@/utils/helpers'
import clsx from 'clsx'

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'لم تبدأ' },
  { value: 'in_progress', label: 'جارية' },
  { value: 'completed',   label: 'مكتملة' },
  { value: 'cancelled',   label: 'ملغاة' },
]

const PRIORITY_OPTIONS = [
  { value: 'low',      label: 'منخفضة' },
  { value: 'medium',   label: 'متوسطة' },
  { value: 'high',     label: 'عالية' },
  { value: 'critical', label: 'حرجة' },
]

// تعريف أعمدة الكانبان المتوافقة مع حالات النظام لديك
const KANBAN_COLUMNS = [
  { id: 'not_started', label: 'لم تبدأ', border: 'border-slate-500', dot: 'bg-slate-500' },
  { id: 'in_progress', label: 'جارية (قيد التنفيذ)', border: 'border-blue-500', dot: 'bg-blue-500' },
  { id: 'completed',   label: 'مكتملة', border: 'border-emerald-500', dot: 'bg-emerald-500' },
  { id: 'cancelled',   label: 'ملغاة', border: 'border-red-500', dot: 'bg-red-500' },
]

export default function TasksListPage({ defaultFavorites = false }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: '',
    is_urgent: searchParams.get('is_urgent') || '',
    favorites_only: defaultFavorites,
    q: '',
    page: 1,
  })

  // أوضاع العرض: 'kanban' | 'table' | 'calendar' | 'list'
  const [viewMode, setViewMode] = useState('kanban')
  const [draggedTaskId, setDraggedTaskId] = useState(null)

  // جلب قائمة المهام بناءً على خيارات الفرز الحالية
  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksApi.list({
      ...filters,
      is_urgent: filters.is_urgent === '' ? undefined : filters.is_urgent === 'true',
      status: filters.status || undefined,
      priority: filters.priority || undefined,
      favorites_only: filters.favorites_only || undefined,
      q: filters.q || undefined,
    }).then(r => r.data),
    keepPreviousData: true,
  })

  // ميوتيشن تحديث حالة المهمة (للسحب والإفلات في الكانبان أو النقل السريع)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, progress }) =>
      tasksApi.update(id, {
        status,
        ...(progress !== undefined ? { progress } : {}),
      }),
    onSuccess: () => {
      toast.success('تم تحديث حالة المهمة بنجاح')
      queryClient.invalidateQueries(['tasks'])
    },
    onError: (err) => toast.error(getApiError(err) || 'تعذر تحديث حالة المهمة'),
  })

  // ميوتيشن إضافة/إزالة المهمة من المفضلة
  const favMutation = useMutation({
    mutationFn: (id) => tasksApi.toggleFavorite(id),
    onSuccess: () => queryClient.invalidateQueries(['tasks']),
    onError: (err) => toast.error(getApiError(err) || 'حدث خطأ أثناء تحديث المفضلة'),
  })

  // ميوتيشن إرسال طلب استعجال فوري للمهمة
  const urgencyMutation = useMutation({
    mutationFn: ({ id }) => tasksApi.requestUrgency(id, {}),
    onSuccess: () => {
      toast.success('تم إرسال طلب الاستعجال بنجاح للمراجعة الإدارية')
      queryClient.invalidateQueries(['tasks'])
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }))

  const tasks = data?.items || []
  const total = data?.total || 0

  // دوال السحب والإفلات (Drag & Drop) للكانبان
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', String(taskId))
    setDraggedTaskId(taskId)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetStatus) => {
    e.preventDefault()
    const rawId = e.dataTransfer.getData('text/plain') || draggedTaskId
    if (!rawId) return

    const task = tasks.find(t => String(t.id) === String(rawId))
    if (!task || task.status === targetStatus) {
      setDraggedTaskId(null)
      return
    }

    const newProgress =
      targetStatus === 'completed'
        ? 100
        : task.progress === 100
        ? 50
        : task.progress

    updateStatusMutation.mutate({
      id: task.id,
      status: targetStatus,
      progress: newProgress,
    })
    setDraggedTaskId(null)
  }

  // ترتيب المهام حسب موعد التسليم لعرض التقويم
  const calendarSortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.due_date || a.deadline || '9999-12-31'
    const dateB = b.due_date || b.deadline || '9999-12-31'
    return String(dateA).localeCompare(String(dateB))
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/40 dark:from-gray-950 dark:to-gray-900 pb-12 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* قسم العنوان العلوي وأزرار تبديل العرض وإضافة مهمة */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-950 dark:text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-5 bg-primary-600 dark:bg-primary-500 rounded-md inline-block" />
              قائمة المهام والمعاملات
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
              {total > 0 ? `إجمالي المهام المدرجة: ${total} مهمة` : 'لا توجد مهام مسجلة بالنظام بعد'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl shadow-sm">
            {/* أزرار التبديل بين طرق العرض */}
            <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
                  viewMode === 'kanban'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Kanban className="w-3.5 h-3.5" />
                <span>كانبان</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <Table className="w-3.5 h-3.5" />
                <span>جدول</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
                  viewMode === 'calendar'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>تقويم</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer',
                  viewMode === 'list'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>بطاقات</span>
              </button>
            </div>

            {/* زر مهمة جديدة */}
            <Link
              to="/tasks/new"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer flex-shrink-0"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>مهمة جديدة</span>
            </Link>
          </div>
        </div>

        {/* لوحة ومصفاة فلاتر البحث والفرز المتقدم */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-colors duration-300">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />

            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث سريع في المهام..."
                className="input w-full pr-9 dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                value={filters.q}
                onChange={e => setFilter('q', e.target.value)}
              />
            </div>

            <Select
              options={STATUS_OPTIONS}
              placeholder="تصفية بالحالة"
              value={filters.status}
              onChange={e => setFilter('status', e.target.value)}
              className="w-full sm:w-36 text-xs font-bold dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            />

            <Select
              options={PRIORITY_OPTIONS}
              placeholder="تصفية بالأولوية"
              value={filters.priority}
              onChange={e => setFilter('priority', e.target.value)}
              className="w-full sm:w-36 text-xs font-bold dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            />

            <Select
              options={[{ value: 'true', label: 'مستعجلة' }, { value: 'false', label: 'غير مستعجلة' }]}
              placeholder="حالة الاستعجال"
              value={filters.is_urgent}
              onChange={e => setFilter('is_urgent', e.target.value)}
              className="w-full sm:w-36 text-xs font-bold dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200"
            />

            {/* زر مسح الفلاتر */}
            {Object.entries(filters).some(([k, v]) => k !== 'page' && v && v !== '' && v !== defaultFavorites) && (
              <button
                type="button"
                onClick={() => setFilters({ status: '', priority: '', is_urgent: '', favorites_only: defaultFavorites, q: '', page: 1 })}
                className="text-xs font-bold text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* محتوى العرض حسب الوضع المختار */}
        {isLoading ? (
          <PageLoader />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="لا توجد نتائج مطابقة"
            description="لم نجد أي مهام مسجلة تطابق خيارات الفرز الحالية، ابدأ بإنشاء مهمة جديدة أو تعديل الفلاتر."
            action={
              <Link
                to="/tasks/new"
                className="btn-primary bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] font-bold text-xs sm:text-sm"
              >
                إنشاء مهمة جديدة
              </Link>
            }
          />
        ) : (
          <>
            {/* 1. عرض كانبان (KANBAN BOARD VIEW) */}
            {viewMode === 'kanban' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
                {KANBAN_COLUMNS.map((col) => {
                  const columnTasks = tasks.filter(t => t.status === col.id)

                  return (
                    <div
                      key={col.id}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, col.id)}
                      className="rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 p-3.5 flex flex-col min-h-[520px] transition-colors shadow-sm"
                    >
                      {/* رأس العمود */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className={clsx('w-2.5 h-2.5 rounded-full', col.dot)} />
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                            {col.label}
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                          {columnTasks.length}
                        </span>
                      </div>

                      {/* بطاقات المهام داخل العمود */}
                      <div className="flex-1 space-y-3 overflow-y-auto">
                        {columnTasks.length === 0 ? (
                          <div className="h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                            اسحب المهمة إلى هنا
                          </div>
                        ) : (
                          columnTasks.map((task) => {
                            const dueDate = task.due_date || task.deadline
                            const progress = task.progress ?? 0

                            return (
                              <div
                                key={task.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task.id)}
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 p-3.5 shadow-sm hover:shadow-md hover:border-amber-500/60 transition cursor-grab active:cursor-grabbing group"
                              >
                                {/* الرقم المرجعي + الأولوية + الاستعجال */}
                                <div className="flex items-center justify-between gap-1.5 flex-wrap">
                                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-700/80 px-2 py-0.5 rounded">
                                    {task.reference_number || task.serial_number || `#${task.id}`}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {task.is_urgent && <UrgencyBadge isUrgent={task.is_urgent} />}
                                    <PriorityBadge priority={task.priority} />
                                  </div>
                                </div>

                                {/* عنوان المهمة */}
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-2.5 line-clamp-2 leading-relaxed group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                  {task.title}
                                </h4>

                                {/* المسؤول أو الجهة + تاريخ الاستحقاق */}
                                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2">
                                  <span className="truncate flex items-center gap-1">
                                    <User className="w-3 h-3 shrink-0 text-slate-400" />
                                    {task.assignee?.full_name || task.assignee_name || task.department?.name || 'غير محدد'}
                                  </span>
                                  {dueDate && (
                                    <span className={clsx('font-mono text-[10px] font-bold shrink-0', dueDateColor(dueDate))}>
                                      {formatDate(dueDate)}
                                    </span>
                                  )}
                                </div>

                                {/* شريط الإنجاز */}
                                <div className="mt-2.5">
                                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                    <span>الإنجاز</span>
                                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{progress}%</span>
                                  </div>
                                  <ProgressBar value={progress} />
                                </div>

                                {/* أزرار النقل السريع والمفضلة */}
                                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-1 text-[10px]">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-slate-400">نقل:</span>
                                    {KANBAN_COLUMNS.filter(c => c.id !== task.status)
                                      .slice(0, 2)
                                      .map(nextCol => (
                                        <button
                                          key={nextCol.id}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            updateStatusMutation.mutate({
                                              id: task.id,
                                              status: nextCol.id,
                                              progress: nextCol.id === 'completed' ? 100 : progress,
                                            })
                                          }}
                                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition cursor-pointer"
                                        >
                                          {nextCol.label}
                                        </button>
                                      ))}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      favMutation.mutate(task.id)
                                    }}
                                    className={clsx(
                                      'p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer',
                                      task.is_favorite ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                                    )}
                                    title="إضافة للمفضلة"
                                  >
                                    <Star className={clsx('w-3.5 h-3.5', task.is_favorite && 'fill-amber-500')} />
                                  </button>
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 2. عرض الجدول (TABLE VIEW) */}
            {viewMode === 'table' && (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                      <tr>
                        <th className="py-3.5 px-4">المرجع</th>
                        <th className="py-3.5 px-4">عنوان المهمة</th>
                        <th className="py-3.5 px-4">الأولوية</th>
                        <th className="py-3.5 px-4">المسؤول / الجهة</th>
                        <th className="py-3.5 px-4">موعد التسليم</th>
                        <th className="py-3.5 px-4">الحالة</th>
                        <th className="py-3.5 px-4">نسبة الإنجاز</th>
                        <th className="py-3.5 px-4 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {tasks.map((task) => {
                        const dueDate = task.due_date || task.deadline
                        const progress = task.progress ?? 0

                        return (
                          <tr
                            key={task.id}
                            onClick={() => navigate(`/tasks/${task.id}`)}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer"
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {task.reference_number || task.serial_number || `#${task.id}`}
                            </td>

                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 max-w-xs">
                              <div className="flex items-center gap-2">
                                <span className="truncate">{task.title}</span>
                                {task.is_urgent && <UrgencyBadge isUrgent={task.is_urgent} />}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <PriorityBadge priority={task.priority} />
                            </td>

                            <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {task.assignee?.full_name || task.assignee_name || task.department?.name || '—'}
                            </td>

                            <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                              {dueDate ? (
                                <span className={clsx('font-bold', dueDateColor(dueDate))}>
                                  {formatDate(dueDate)}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <StatusBadge status={task.status} />
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2 min-w-[90px]">
                                <span className="w-8 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                  {progress}%
                                </span>
                                <div className="flex-1">
                                  <ProgressBar value={progress} />
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1">
                                <Link
                                  to={`/tasks/${task.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                  title="عرض التفاصيل"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>

                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    favMutation.mutate(task.id)
                                  }}
                                  className={clsx(
                                    'p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer',
                                    task.is_favorite ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                                  )}
                                  title="المفضلة"
                                >
                                  <Star className={clsx('w-4 h-4', task.is_favorite && 'fill-amber-500')} />
                                </button>

                                {!task.is_urgent && task.status !== 'completed' && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      urgencyMutation.mutate({ id: task.id })
                                    }}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    title="طلب استعجال"
                                  >
                                    <Zap className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. عرض التقويم / الجدول الزمني (CALENDAR VIEW) */}
            {viewMode === 'calendar' && (
              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-amber-500" />
                    توزيع مواعيد تسليم المهام (الجدول الزمني المرتب)
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    مرتبة تصاعدياً حسب أقرب موعد تسليم
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                  {calendarSortedTasks.map((task) => {
                    const dueDate = task.due_date || task.deadline
                    const remainingDays = dueDate ? daysUntilDue(dueDate) : null
                    const progress = task.progress ?? 0

                    return (
                      <div
                        key={task.id}
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 transition cursor-pointer bg-slate-50/70 dark:bg-slate-800/40 flex flex-col justify-between gap-3 group"
                      >
                        <div>
                          {/* التاريخ والمرجع */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {dueDate ? formatDate(dueDate) : 'بدون موعد محدد'}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 font-semibold">
                              {task.reference_number || task.serial_number || `#${task.id}`}
                            </span>
                          </div>

                          {/* شارات الحالة والأولوية */}
                          <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                            <StatusBadge status={task.status} />
                            <PriorityBadge priority={task.priority} />
                            {task.is_urgent && <UrgencyBadge isUrgent={task.is_urgent} />}
                          </div>

                          {/* عنوان المهمة */}
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-2.5 line-clamp-2 group-hover:text-amber-500 transition-colors">
                            {task.title}
                          </h4>
                        </div>

                        {/* المسؤول ونسبة الإنجاز */}
                        <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                            <span className="truncate max-w-[160px]">
                              المسؤول: <strong className="text-slate-700 dark:text-slate-200">{task.assignee?.full_name || task.assignee_name || 'غير محدد'}</strong>
                            </span>
                            {remainingDays !== null && task.status !== 'completed' && (
                              <span className={clsx('font-bold', dueDateColor(dueDate))}>
                                {remainingDays < 0
                                  ? `متأخرة (${Math.abs(remainingDays)} يوم)`
                                  : remainingDays === 0
                                  ? 'تنتهي اليوم'
                                  : `متبقي ${remainingDays} يوم`}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <ProgressBar value={progress} />
                            <span className="font-mono text-[11px] font-bold text-amber-500">
                              {progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 4. عرض البطاقات الأصلي (LIST VIEW) */}
            {viewMode === 'list' && (
              <div className="grid grid-cols-1 gap-3">
                {tasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onFavorite={(taskId) => favMutation.mutate(taskId)}
                    onUrgency={(taskId) => urgencyMutation.mutate({ id: taskId })}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* شريط ترقيم الصفحات المتجاوب (Pagination) */}
        {total > 20 && (
          <div className="flex justify-center items-center gap-3 pt-4">
            <button
              type="button"
              disabled={filters.page === 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
            >
              السابق
            </button>
            <span className="px-4 py-2 text-xs sm:text-sm text-gray-500 dark:text-gray-300 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 font-bold shadow-sm">
              صفحة {filters.page} من {Math.ceil(total / 20)}
            </span>
            <button
              type="button"
              disabled={filters.page * 20 >= total}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  )
}