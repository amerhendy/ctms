// src/components/workflow/CustomNode.jsx
import React, { useState } from 'react'
import { Handle, Position } from 'reactflow'
import {
  Circle,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  Building2,
  GitBranch,
  User,
  Zap,
  ToggleLeft,
  ToggleRight,
  Trash2,Pencil,Plus,X
} from 'lucide-react'
import clsx from 'clsx'

// ── إعدادات الحالة (Status Config) ──────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: 'في الانتظار',
    color: 'text-slate-500 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-300 dark:border-slate-600',
    icon: Circle,
    dot: 'bg-slate-400 dark:bg-slate-500',
  },
  in_progress: {
    label: 'جارٍ التنفيذ',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-400 dark:border-blue-500',
    icon: Zap,
    dot: 'bg-blue-500 animate-pulse',
  },
  completed: {
    label: 'مكتملة',
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-400 dark:border-green-500',
    icon: CheckCircle2,
    dot: 'bg-green-500',
  },
  skipped: {
    label: 'متخطاة',
    color: 'text-slate-400 dark:text-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-300 dark:border-slate-600',
    icon: XCircle,
    dot: 'bg-slate-400 dark:bg-slate-500',
  },
  cancelled: {
    label: 'ملغية',
    color: 'text-red-500 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-400 dark:border-red-500',
    icon: XCircle,
    dot: 'bg-red-500',
  },
}

// ── 🆕 إعدادات ألوان العقدة (Node Colors) ──────────────────────
const NODE_STYLE_CONFIG = {
  pending: {
    bg: 'bg-slate-50 dark:bg-slate-900/80',
    border: 'border-slate-300 dark:border-slate-700',
    shadow: 'shadow-md shadow-slate-200/50 dark:shadow-slate-800/30',
    ring: 'ring-slate-300/30 dark:ring-slate-700/30',
    accent: 'bg-slate-400 dark:bg-slate-600',
    text: 'text-slate-700 dark:text-slate-300',
    headerBg: 'bg-slate-100/50 dark:bg-slate-800/50',
  },
  in_progress: {
    bg: 'bg-blue-50/80 dark:bg-blue-950/40',
    border: 'border-blue-400 dark:border-blue-600',
    shadow: 'shadow-md shadow-blue-200/50 dark:shadow-blue-900/30',
    ring: 'ring-blue-300/30 dark:ring-blue-700/30',
    accent: 'bg-blue-500 dark:bg-blue-400',
    text: 'text-blue-700 dark:text-blue-300',
    headerBg: 'bg-blue-100/50 dark:bg-blue-900/40',
  },
  completed: {
    bg: 'bg-green-50/80 dark:bg-green-950/40',
    border: 'border-green-400 dark:border-green-600',
    shadow: 'shadow-md shadow-green-200/50 dark:shadow-green-900/30',
    ring: 'ring-green-300/30 dark:ring-green-700/30',
    accent: 'bg-green-500 dark:bg-green-400',
    text: 'text-green-700 dark:text-green-300',
    headerBg: 'bg-green-100/50 dark:bg-green-900/40',
  },
  skipped: {
    bg: 'bg-slate-50/60 dark:bg-slate-900/50',
    border: 'border-slate-300 dark:border-slate-700',
    shadow: 'shadow-sm shadow-slate-200/30 dark:shadow-slate-800/20',
    ring: 'ring-slate-300/20 dark:ring-slate-700/20',
    accent: 'bg-slate-400 dark:bg-slate-600',
    text: 'text-slate-400 dark:text-slate-500',
    headerBg: 'bg-slate-100/30 dark:bg-slate-800/30',
  },
  cancelled: {
    bg: 'bg-red-50/80 dark:bg-red-950/40',
    border: 'border-red-400 dark:border-red-600',
    shadow: 'shadow-md shadow-red-200/50 dark:shadow-red-900/30',
    ring: 'ring-red-300/30 dark:ring-red-700/30',
    accent: 'bg-red-500 dark:bg-red-400',
    text: 'text-red-700 dark:text-red-300',
    headerBg: 'bg-red-100/50 dark:bg-red-900/40',
  },
}

// ── المكوّن الرئيسي ──────────────────────────────────────────────
export default function CustomNode({ 
  data, 
  selected, 
  onToggleParallel,
  onEdit,     // ← تأكد من وجودها هنا
  onDelete,   // ← تأكد من وجودها هنا
  onAdd,      // ← تأكد من وجودها هنا
}) {
  const {
    label,
    description,
    status = 'pending',
    step_order,
    is_parallel = false,
    assigned_user_name,
    assigned_department_name,
    assigned_user_id,
    assigned_department_id,
    is_completable = false,
    is_editable = false,
  } = data

  // جلب إعدادات الحالة واللون
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const StatusIcon = cfg.icon
  const style = NODE_STYLE_CONFIG[status] || NODE_STYLE_CONFIG.pending

  // تحديد المسؤول المعروض
  const assigneeName = assigned_user_name || assigned_department_name || null
  const assigneeType = assigned_user_id ? 'user' : assigned_department_id ? 'department' : null

  // حالة التمرير
  const [isHovered, setIsHovered] = useState(false)

  const handleToggleParallel = (e) => {
    e.stopPropagation()
    if (onToggleParallel) {
      onToggleParallel(data.id || data.nodeId)
    }
  }

  // تحديد شريط التوازي
  const parallelBarClass = is_parallel
    ? 'border-t-4 border-t-violet-500 dark:border-t-violet-400'
    : ''

  return (
    <>
      {/* ── مقابض الربط (Handles) ── */}
      <Handle
        type="target"
        position={Position.Top}
        className={clsx(
          'w-3 h-3 border-2 transition-colors duration-200',
          status === 'completed' && '!bg-green-500 border-white dark:border-slate-900',
          status === 'in_progress' && '!bg-blue-500 border-white dark:border-slate-900',
          status === 'pending' && '!bg-slate-400 border-white dark:border-slate-900',
          status === 'cancelled' && '!bg-red-500 border-white dark:border-slate-900',
        )}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className={clsx(
          'w-3 h-3 border-2 transition-colors duration-200',
          status === 'completed' && '!bg-green-500 border-white dark:border-slate-900',
          status === 'in_progress' && '!bg-blue-500 border-white dark:border-slate-900',
          status === 'pending' && '!bg-slate-400 border-white dark:border-slate-900',
          status === 'cancelled' && '!bg-red-500 border-white dark:border-slate-900',
        )}
      />

      {/* ── بطاقة العقدة ── */}
      <div
        className={clsx(
          'relative min-w-[200px] max-w-[280px] rounded-2xl border-2 transition-all duration-300',
          'shadow-lg hover:shadow-xl',
          style.bg,
          style.border,
          style.shadow,
          selected
            ? `ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-950 ${style.ring} scale-[1.02]`
            : 'hover:scale-[1.01]',
          parallelBarClass,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* ── الشريط الجانبي الملون (Accent) ── */}
        <div
          className={clsx(
            'absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl transition-colors duration-300',
            style.accent,
            // تأثير نبض للخطوات قيد التنفيذ
            status === 'in_progress' && 'animate-pulse',
          )}
        />

        {/* ── خلفية رأس العقدة (Header) ── */}
        <div
          className={clsx(
            'rounded-t-2xl px-3 pt-2.5 pb-1.5 -mx-[2px] -mt-[2px] mx-[2px] mt-[2px]',
            'border-b border-slate-200/50 dark:border-slate-700/50',
            style.headerBg,
          )}
        >
          <div className="flex items-center justify-between gap-2">
            {/* الصف الأول: الرقم + شارة التوازي */}
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  'w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0',
                  'bg-white/80 dark:bg-slate-800/80',
                  style.text,
                )}
              >
                {step_order || '?'}
              </span>

              {/* زر تبديل التوازي */}
              {is_editable && (
                <button
                  onClick={handleToggleParallel}
                  className={clsx(
                    'p-0.5 rounded transition-all duration-150',
                    is_parallel
                      ? 'text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300'
                      : 'text-slate-400 dark:text-slate-500 hover:text-violet-500 dark:hover:text-violet-400',
                    isHovered || is_parallel ? 'opacity-100' : 'opacity-40',
                  )}
                  title={is_parallel ? 'إلغاء التوازي' : 'تفعيل التوازي'}
                >
                  {is_parallel ? (
                    <ToggleRight className="w-4 h-4" />
                  ) : (
                    <ToggleLeft className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* شارة التوازي (للقراءة فقط) */}
              {!is_editable && is_parallel && (
                <span
                  className="inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded-full
                    bg-violet-100/80 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400
                    border border-violet-200 dark:border-violet-800"
                >
                  <GitBranch className="w-2.5 h-2.5" />
                  متوازي
                </span>
              )}
            </div>

            {/* حالة الخطوة */}
            <div
              className={clsx(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
                cfg.bg,
                cfg.color,
              )}
            >
              <StatusIcon className="w-3 h-3" />
              {cfg.label}
            </div>
          </div>
        </div>

        {/* ── المحتوى الداخلي ── */}
        <div className="p-3 pt-2 space-y-2">
          {/* العنوان */}
          <div className={clsx('text-sm font-semibold leading-tight line-clamp-2', style.text)}>
            {label || 'خطوة بدون عنوان'}
          </div>

          {/* الوصف */}
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}

          {/* المسؤول */}
          {assigneeName && (
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 mt-1">
              {assigneeType === 'user' ? (
                <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              ) : assigneeType === 'department' ? (
                <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              ) : (
                <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              )}
              <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                {assigneeName}
              </span>
              <span
                className={clsx(
                  'w-1.5 h-1.5 rounded-full flex-shrink-0',
                  status === 'in_progress' && 'bg-blue-500 animate-pulse',
                  status === 'completed' && 'bg-green-500',
                  status === 'pending' && 'bg-slate-400 dark:bg-slate-500',
                  (status === 'skipped' || status === 'cancelled') && 'bg-slate-300 dark:bg-slate-600',
                )}
              />
            </div>
          )}

          {/* لو مفيش مسؤول */}
          {!assigneeName && (
            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 mt-1 text-slate-400 dark:text-slate-500">
              <User className="w-3.5 h-3.5" />
              <span className="text-[10px]">لم يُحدد مسؤول</span>
            </div>
          )}
        </div>

        {/* ─── حدود تفاعلية ────────────────────────────────────────── */}
        {is_editable && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 dark:bg-yellow-500 
              border-2 border-white dark:border-slate-900 shadow-sm animate-pulse"
            title="قابلة للتعديل"
          />
        )}
        {is_completable && (
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-400 dark:bg-green-500 
              border-2 border-white dark:border-slate-900 shadow-sm animate-pulse"
            title="قابلة للإنهاء"
          />
        )}

        {/* ─── تأثير إضاءة للخطوات قيد التنفيذ ────────────────────── */}
        {status === 'in_progress' && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none animate-pulse">
            <div className="absolute inset-0 rounded-2xl bg-blue-500/5 dark:bg-blue-400/5" />
          </div>
        )}

        {/* ─── تأثير إكمال للخطوات المكتملة ──────────────────────── */}
        {status === 'completed' && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none">
            <div className="absolute inset-0 rounded-2xl bg-green-500/5 dark:bg-green-400/5" />
          </div>
        )}
        {isHovered && (
            <div className="absolute -top-3 -right-3 flex gap-1 bg-white dark:bg-slate-800 rounded-full shadow-lg border border-slate-200 dark:border-slate-700 p-1">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit?.(data.id); }}
                className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(data.id); }}
                className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAdd?.(data.id); }}
                className="p-1 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

      </div>
    </>
  )
}