// src/components/workflow/templateCard.jsx
import { useState } from 'react'
import {
  LayoutTemplate, ChevronRight, ChevronDown, Edit,
  ToggleRight, ToggleLeft, Trash2, Footprints, GitBranch, Building2, Users
} from 'lucide-react'
import clsx from 'clsx'

export default function TemplateCard({ template, onEdit, onOpenBuilder, onToggle, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  const statusColors = {
    true:  'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
    false: 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700',
  }

  return (
    <div className={clsx(
      'border rounded-2xl transition-all duration-200 overflow-hidden',
      template.is_active
        ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50'
        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 opacity-70'
    )}>
      {/* رأس البطاقة */}
      <div className="p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
          <LayoutTemplate className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
              {template.name}
            </h3>
            <span className={clsx('text-[10px] font-medium px-2 py-0.5 rounded-full border', statusColors[template.is_active])}>
              {template.is_active ? 'نشط' : 'معطل'}
            </span>
          </div>
          {template.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{template.description}</p>
          )}
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {template.steps?.length || 0} خطوة
          </p>
        </div>

        {/* الأزرار */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded(p => !p)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="عرض الخطوات"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onEdit(template)}
            className="p-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            title="تعديل النموذج"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenBuilder(template)}
            className="p-2 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            title="محرر المخطط"
          >
            <Footprints className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggle(template)}
            className={clsx(
              'p-2 rounded-lg transition-colors',
              template.is_active
                ? 'text-green-500 hover:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                : 'text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
            )}
            title={template.is_active ? 'تعطيل' : 'تفعيل'}
          >
            {template.is_active
              ? <ToggleRight className="w-4 h-4" />
              : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDelete(template)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="حذف"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* خطوات القالب (قابلة للطي) */}
      {expanded && template.steps?.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3 space-y-2">
          {template.steps.map((step, idx) => (
            <div key={step.id || idx} className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                  step.is_parallel
                    ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                )}>
                  {step.step_order}
                </div>
                {idx < template.steps.length - 1 && (
                  <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                )}
              </div>
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{step.title}</span>
                  {step.is_parallel && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-500 flex items-center gap-1">
                      <GitBranch className="w-2.5 h-2.5" /> متوازي
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mt-0.5">
                  {step.assigned_department_id && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> إدارة #{step.assigned_department_id}
                    </span>
                  )}
                  {step.assigned_user_id && (
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Users className="w-3 h-3" /> موظف #{step.assigned_user_id}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}