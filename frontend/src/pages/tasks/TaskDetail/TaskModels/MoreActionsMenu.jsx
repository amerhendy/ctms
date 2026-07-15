// src/pages/tasks/TaskDetail/TaskModels/MoreActionsMenu.jsx

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { theme } from '@/constants/theme';
import {
  Check,
  GitBranch,
  PlusCircle,
  Pencil,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import {Step_STATUS_CONFIG} from '@/utils/helpers'
/**
 * قائمة النقاط الثلاث (More Actions) للبطاقة
 * تحتوي على: تغيير الحالة، إضافة خطوة فرعية، تعديل، حذف
 */
export default function MoreActionsMenu({
  step,
  onClose,
  onChangeStatus,   // دالة تغيير الحالة (تستقبل newStatus)
  onAddSubStep,     // دالة إضافة خطوة فرعية (تستقبل parentStepId)
  onEdit,           // دالة فتح التعديل
  onDelete,         // دالة حذف الخطوة
  isLockedFromCompletion,
}) {
  const [showStatusSubmenu, setShowStatusSubmenu] = useState(false);
  const menuRef = useRef(null);

  // ── إغلاق القائمة عند النقر خارجها ──
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // ── الحالات المتاحة ──
  const statuses = Step_STATUS_CONFIG;
  
  // ── التعامل مع اختيار حالة جديدة ──
  const handleStatusChange = (newStatus) => {
    if (newStatus !== step.status) {
      onChangeStatus(newStatus);
    }
    setShowStatusSubmenu(false);
    onClose();
  };

  // ── التعامل مع بقية الأوامر ──
  const handleAddSubStep = () => {
    onAddSubStep(step.id);
    onClose();
  };

  const handleEdit = () => {
    onEdit();
    onClose();
  };

  const handleDelete = () => {
    onDelete();
    onClose();
  };

  // ── عرض القائمة ──
  return (
    <div
      ref={menuRef}
      className={clsx(
        'absolute left-0 top-full mt-1 z-50 w-56 rounded-lg shadow-xl border',
        'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        'py-1.5 overflow-hidden'
      )}
      style={{ minWidth: '200px' }}
    >
      {/* ─── تغيير الحالة (مع قائمة فرعية) ─── */}
      <div className="relative">
        <button
          onClick={() => setShowStatusSubmenu(!showStatusSubmenu)}
          className={clsx(
            'flex items-center justify-between w-full px-4 py-2 text-sm',
            'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700',
            'transition-colors duration-150'
          )}
        >
          <span className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-slate-400" />
            تغيير الحالة
          </span>
          <ChevronRight className={clsx(
            'w-4 h-4 text-slate-400 transition-transform duration-200',
            showStatusSubmenu && 'rotate-90'
          )} />
        </button>

        {/* القائمة الفرعية للحالات */}
        {showStatusSubmenu && (
          <div
            className={clsx(
              'absolute left-0 top-0 mt-0 w-48 rounded-lg shadow-xl border',
              'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
              'py-1.5 overflow-hidden z-10'
            )}
          >
            {Object.keys(statuses).map((key) => {
              const isActive = step.status === key;
              const config = statuses[key];
              const locked=isLockedFromCompletion
              return (
                <button
                  key={key}
                  onClick={() => handleStatusChange(key)}
                  className={clsx(
                    'flex items-center justify-between w-full px-4 py-2 text-sm',
                    'hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150',
                    isActive && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  )}
                  disabled={isLockedFromCompletion}
                >
                  <span>{config.label}</span>
                  {isActive && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── فاصل ─── */}
      <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

      {/* ─── إضافة خطوة فرعية ─── */}
      <button
        onClick={handleAddSubStep}
        className={clsx(
          'flex items-center gap-2 w-full px-4 py-2 text-sm',
          'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700',
          'transition-colors duration-150'
        )}
      >
        <PlusCircle className="w-4 h-4 text-slate-400" />
        إضافة خطوة فرعية
      </button>

      {/* ─── تعديل ─── */}
      <button
        onClick={handleEdit}
        className={clsx(
          'flex items-center gap-2 w-full px-4 py-2 text-sm',
          'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700',
          'transition-colors duration-150'
        )}
      >
        <Pencil className="w-4 h-4 text-slate-400" />
        تعديل
      </button>

      {/* ─── حذف ─── */}
      <button
        onClick={handleDelete}
        className={clsx(
          'flex items-center gap-2 w-full px-4 py-2 text-sm',
          'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20',
          'transition-colors duration-150'
        )}
      >
        <Trash2 className="w-4 h-4" />
        حذف
      </button>
    </div>
  );
}