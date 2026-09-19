// TasksListPage.jsx (نسخة UI/UX احترافية وموحدة)
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Filter, Star, Zap, Eye, Calendar, Building2, User, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'
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

export default function TasksListPage({ defaultFavorites = false }) {
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: '',
    is_urgent: searchParams.get('is_urgent') || '',
    favorites_only: defaultFavorites,
    q: '',
    page: 1,
  })

  // جلب قائمة المهام الفنية بناءً على خيارات الفرز الحالية
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
  // ميوتيشن إضافة/إزالة المهمة من المفضلة الإدارية
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100/40 dark:from-gray-950 dark:to-gray-900 pb-12 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* قسم العنوان العلوي وزر إضافة مهمة جديدة */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-950 dark:text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-5 bg-primary-600 dark:bg-primary-500 rounded-md inline-block" />
              قائمة المهام والمعاملات
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
              {total > 0 ? `إجمالي المهام المدرجة: ${total} مهمة` : 'لا توجد مهام مسجلة بالنظام بعد'}
            </p>
          </div>
          <Link
            to="/tasks/new"
            className={clsx(
              "flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex-shrink-0 self-start sm:self-auto",
              // الألوان للوضع النهاري والوضع الليلي
              "bg-primary-600 hover:bg-primary-700 text-white",
              "dark:bg-primary-500 dark:hover:bg-primary-400"
            )}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>مهمة إدارية جديدة</span>
          </Link>
        </div>

        {/* لوحة ومصفاة فلاتر البحث والفرز المتقدم */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-colors duration-300">
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            
            <div className="flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="بحث سريع في المهام..."
                className="input w-full dark:bg-gray-900 dark:border-gray-700 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                value={filters.q}
                onChange={e => setFilter('q', e.target.value)}
              />
            </div>
            
            {/* نمرر كلاسات مخصصة للـ Select لتتوافق مع الوضع الليلي */}
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
            {Object.values(filters).some(v => v && v !== '' && v !== defaultFavorites) && (
              <button
                onClick={() => setFilters({ status: '', priority: '', is_urgent: '', favorites_only: defaultFavorites, q: '', page: 1 })}
                className="text-xs font-bold text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                مسح الفلاتر
              </button>
            )}
          </div>
        </div>

        {/* شبكة عرض بطاقات المهام الحالية */}
        {isLoading ? (
          <PageLoader />
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={Plus}
            title="لا توجد نتائج مطابقة"
            description="لم نجد أي مهام مسجلة تطابق خيارات الفرز الحالية، ابدأ بإنشاء مهمة جديدة أو تعديل الفلاتر."
            action={<Link to="/tasks/new" className="btn-primary bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] font-bold text-xs sm:text-sm">إنشاء مهمة جديدة</Link>}
          />
        ) : (
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

        {/* شريط ترقيم الصفحات المتجاوب (Pagination) */}
        {total > 20 && (
          <div className="flex justify-center items-center gap-3 pt-4">
            <button
              disabled={filters.page === 1}
              onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              السابق
            </button>
            <span className="px-4 py-2 text-xs sm:text-sm text-gray-500 bg-white rounded-xl border border-gray-100 font-bold shadow-sm">
              صفحة {filters.page} من {Math.ceil(total / 20)}
            </span>
            <button
              disabled={filters.page * 20 >= total}
              onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

