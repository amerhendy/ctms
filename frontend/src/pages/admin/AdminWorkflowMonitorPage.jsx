// src/pages/admin/AdminWorkflowMonitorPage.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  GitBranch, Search, CheckCircle2, Zap, CircleDot,
  XCircle, ChevronDown, ChevronRight, Building2, Users,
  Clock, ExternalLink, Filter, Loader2
} from 'lucide-react'
import clsx from 'clsx'
import { workflowApi } from '@/api/workflow'
import { tasksApi } from '@/api'
import { getApiError, formatDate } from '@/utils/helpers'
import { PageLoader } from '@/components/common'
import PageHeader from '@/components/common/pageheader'
import { theme } from '@/constants/theme'
import WorkflowDiagram from '@/components/workflow/WorkflowDiagram'
// ── إعدادات حالة الـ Workflow ────────────────────────────────────
const WF_STATUS = {
  pending:     { label: 'في الانتظار', color: 'text-slate-500',  bg: 'bg-slate-100 dark:bg-slate-800',    icon: CircleDot,    dot: 'bg-slate-400' },
  in_progress: { label: 'جارٍ',        color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/30',    icon: Zap,          dot: 'bg-blue-500 animate-pulse' },
  completed:   { label: 'مكتمل',       color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/30',  icon: CheckCircle2, dot: 'bg-green-500' },
  cancelled:   { label: 'ملغي',        color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',      icon: XCircle,      dot: 'bg-red-500' },
}

const STEP_STATUS = {
  pending:     { label: 'انتظار',  color: 'text-slate-400',  bg: 'bg-slate-100 dark:bg-slate-800' },
  in_progress: { label: 'جارٍ',   color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/30' },
  completed:   { label: 'مكتملة', color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/30' },
  skipped:     { label: 'متخطاة', color: 'text-slate-400',  bg: 'bg-slate-50 dark:bg-slate-700' },
}

// ── بطاقة مهمة مع الـ Workflow ──────────────────────────────────
function WorkflowMonitorCard({ task }) {
  const [expanded, setExpanded] = useState(false)
  const wf = task.workflow
  if (!wf) return null

  const cfg      = WF_STATUS[wf.status] || WF_STATUS.pending
  const StatusIcon = cfg.icon
  const steps    = wf.steps || []
  const total    = steps.length
  const done     = steps.filter(s => s.status === 'completed').length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0
  const activeStep = steps.find(s => s.status === 'in_progress')

  return (
    <div className={clsx(
      'border rounded-2xl transition-all duration-200 overflow-hidden',
      'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
    )}>
      {/* رأس البطاقة */}
      <div className="p-4 flex items-start gap-3">
        {/* حالة الـ Workflow */}
        <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
          <StatusIcon className={clsx('w-4 h-4', cfg.color)} />
        </div>

        <div className="flex-1 min-w-0">
          {/* عنوان المهمة */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/tasks/${task.id}`}
              className="text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1 truncate"
            >
              {task.title}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </Link>
            <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1', cfg.bg, cfg.color)}>
              <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
              {cfg.label}
            </span>
          </div>

          {/* تفاصيل سريعة */}
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            {task.department?.name && (
              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {task.department.name}
              </span>
            )}
            {wf.template_id && (
              <span className="text-xs text-violet-500 dark:text-violet-400 flex items-center gap-1">
                <GitBranch className="w-3 h-3" /> من قالب
              </span>
            )}
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {done}/{total} خطوة
            </span>
          </div>

          {/* شريط التقدم */}
          {total > 0 && (
            <div className="mt-2 space-y-1">
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={clsx(
                    'h-full rounded-full transition-all duration-500',
                    wf.status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-gradient-to-l from-primary-500 to-primary-600'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{activeStep ? `الخطوة الحالية: ${activeStep.title}` : ''}</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}
        </div>

        {/* زر التوسيع */}
        <button
          onClick={() => setExpanded(p => !p)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
      <WorkflowDiagram
        nodes={wf.nodes}
        edges={wf.edges}
        onAutoLayout={true} // 🆕 تفعيل الترتيب التلقائي في صفحة المراقبة أيضاً
        className="min-h-[300px]"
      />


      {/* تفاصيل الخطوات */}
      {expanded && steps.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">الخطوات التفصيلية</p>
          <div className="space-y-2">
            {steps.map((step, idx) => {
              const sCfg = STEP_STATUS[step.status] || STEP_STATUS.pending
              return (
                <div key={step.id} className="flex items-center gap-3">
                  {/* رقم */}
                  <span className={clsx(
                    'w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0',
                    sCfg.bg, sCfg.color
                  )}>
                    {step.step_order}
                  </span>

                  {/* عنوان */}
                  <span className={clsx(
                    'text-xs flex-1 truncate',
                    step.status === 'completed'
                      ? 'line-through text-slate-400'
                      : 'text-slate-700 dark:text-slate-300'
                  )}>
                    {step.title}
                    {step.is_parallel && (
                      <span className="mr-1.5 text-[9px] text-violet-500">(متوازي)</span>
                    )}
                  </span>

                  {/* مسؤول */}
                  <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                    {step.assigned_department_id && <Building2 className="w-2.5 h-2.5" />}
                    {step.assigned_user_id && <Users className="w-2.5 h-2.5" />}
                  </span>

                  {/* حالة */}
                  <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0', sCfg.bg, sCfg.color)}>
                    {sCfg.label}
                  </span>

                  {/* تاريخ الإنهاء */}
                  {step.completed_at && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      {formatDate(step.completed_at)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ══════════════════════════════════════════════════════════════════
export default function AdminWorkflowMonitorPage() {
  const [search, setSearch]           = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage]               = useState(1)

  // جلب المهام التي عندها workflow
  const { data, isLoading } = useQuery({
    queryKey: ['tasks-with-workflow', search, filterStatus, page],
    queryFn: () => tasksApi.list({
      q:            search || undefined,
      has_workflow: true,
      page,
      page_size:    20,
    }).then(r => r.data),
    keepPreviousData: true,
  })

  const tasks      = data?.items || []
  const totalPages = data?.pages || 1

  // فلترة محلية بحالة الـ workflow
  const filtered = filterStatus === 'all'
    ? tasks
    : tasks.filter(t => t.workflow?.status === filterStatus)

  // إحصائيات
  const stats = tasks.reduce((acc, t) => {
    const s = t.workflow?.status
    if (s) acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-5 text-right" dir="rtl">
      {/* الترويسة */}
      <PageHeader title="مراقبة الـ Workflows" icon={GitBranch} />

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'all',        label: 'إجمالي',      value: tasks.length,            ...WF_STATUS.pending    },
          { key: 'in_progress',label: 'جارٍ التنفيذ', value: stats.in_progress || 0,  ...WF_STATUS.in_progress },
          { key: 'completed',  label: 'مكتملة',       value: stats.completed || 0,    ...WF_STATUS.completed  },
          { key: 'pending',    label: 'في الانتظار',  value: stats.pending || 0,      ...WF_STATUS.pending    },
        ].map(stat => (
          <button
            key={stat.key}
            onClick={() => setFilterStatus(stat.key)}
            className={clsx(
              'rounded-xl p-3 text-center transition-all border',
              filterStatus === stat.key
                ? clsx(stat.bg, 'border-current', stat.color, 'shadow-sm ring-1 ring-current/20')
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
            )}
          >
            <div className={clsx('text-2xl font-bold', filterStatus === stat.key ? stat.color : 'text-slate-700 dark:text-slate-300')}>
              {stat.value}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</div>
          </button>
        ))}
      </div>

      {/* البحث */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            className="input pr-9 text-sm bg-gray-50/50 dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
            placeholder="ابحث بعنوان المهمة..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {/* القائمة */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">جاري التحميل...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <GitBranch className="w-7 h-7 text-slate-400" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            لا توجد مهام بـ Workflow {filterStatus !== 'all' ? `بحالة "${WF_STATUS[filterStatus]?.label}"` : ''}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <div  key={task.id}>
              <WorkflowMonitorCard key={task.id} task={task} />
            </div>
            
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            السابق
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  )
}
