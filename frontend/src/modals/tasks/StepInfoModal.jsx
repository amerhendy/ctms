import React from 'react';
import {Modal} from '@/components/common'

// قاموس لترجمة الحالات لـ UX أفضل باللغة العربية
const STATUS_LABELS = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60' },
  in_progress: { label: 'جاري العمل', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60' },
  completed: { label: 'مكتملة', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60' }
};

export function StepInfoModal({ step, onClose }) {
  if (!step) return null;

  const currentStatus = STATUS_LABELS[step.status] || { label: step.status, color: 'bg-gray-50 text-gray-700 border-gray-200' };

  return (
    // جعلنا الـ open ديناميكياً بناءً على وجود الكائن لتفادي الـ مشاكل العرض
    <Modal open={!!step} onClose={onClose} title={step.title} size="xl">
      <div className="p-2 space-y-5">
        
        {/* قسم الوصف */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">الوصف</h4>
          <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-md border border-slate-100 dark:border-slate-700/80 whitespace-pre-line">
            {step.description || 'لا يوجد وصف مضاف لهذه الخطوة.'}
          </p>
        </div>
        
        {/* الميتا داتا (الحالة والترتيب) */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50/50 dark:bg-slate-800/30 p-3 rounded-md border border-slate-100 dark:border-slate-800">
          <div className="flex items-center">
            <span className="text-slate-400 dark:text-slate-500 ml-2">الحالة:</span>
            <span className={`px-2 py-0.5 rounded border font-medium ${currentStatus.color}`}>
              {currentStatus.label}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-slate-400 dark:text-slate-500 ml-2">الترتيب في العمود:</span>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">#{step.step_order}</span>
          </div>
        </div>

        {/* قسم الخطوات الفرعية (Sub-steps) */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            الخطوات الفرعية ({step.children?.length || 0})
          </h4>
          
          {step.children && step.children.length > 0 ? (
            <div className="border border-slate-100 dark:border-slate-800 rounded-md divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              {step.children.map((child) => {
                const childStatus = STATUS_LABELS[child.status] || { label: child.status, color: 'text-gray-500' };
                return (
                  <div key={child.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{child.title}</span>
                      {child.description && (
                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-md">{child.description}</span>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded border ${childStatus.color}`}>
                      {childStatus.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-800/10 p-4 rounded-md border border-dashed border-slate-200 dark:border-slate-800 text-center">
              لا توجد خطوات فرعية تابعة لهذه الخطوة.
            </p>
          )}
        </div>

      </div>
    </Modal>
  );
}