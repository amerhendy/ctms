// src/pages/tasks/TaskDetail/TaskModels/InlineEditForm.jsx

import { useState, useRef  } from 'react';
import clsx from 'clsx';
import { theme } from '@/constants/theme';
import { ToggleSwitch, Modal } from '@/components/common';
import SidebarTree from '../SidebarTree';

/**
 * فورم التعديل/الإضافة المضمنة (Inline Edit/Add Form)
 * يستخدم في بطاقة الخطوة وفي أسفل العمود للإضافة السريعة
 */
export default function InlineEditForm({
  initialData = {},
  onSave,
  onCancel,
  taskId,
  isSubmitting = false,
  isAdding = false, // إذا كانت true، نعرض "إضافة" بدلاً من "حفظ التعديلات"
}) {
    const [showAssigneePopover, setShowAssigneePopover] = useState(false);
    const assigneeButtonRef = useRef(null);

  // ── الحالات الداخلية ──
  const [formData, setFormData] = useState({
    title: initialData.title || '',
    description: initialData.description || '',
    started_at: initialData.started_at || '',
    is_parallel: initialData.is_parallel || false,
  });

  // المسؤول: كائن موحد { id, type: 'employee' | 'department', name }
  const [assignee, setAssignee] = useState(
    initialData.assignee || { id: null, type: null, name: '' }
  );
  const [showAssigneePicker, setShowAssigneePicker] = useState(false);
  const [errors, setErrors] = useState({});

  // ── معالج اختيار المسؤول من SidebarTree ──
  const handleAssigneeSelect = (node) => {
    // SidebarTree يمرر كائن { id, type, name } حسب الكود الموجود
    const type = node.full_name ? 'employee' : 'department';
    setAssignee({
      id: node.id,
      type: type,
      name: node.full_name || node.name,
    });
    setShowAssigneePicker(false);
    // مسح خطأ المسؤول إن وجد
    setErrors((prev) => ({ ...prev, assignee: undefined }));
  };

  // ── معالج الإرسال ──
  const handleSubmit = (e) => {
    e.preventDefault();

    // التحقق من صحة الحقول
    const newErrors = {};
    if (!formData.title.trim()) {
      newErrors.title = 'العنوان مطلوب';
    }
    if (!assignee.id) {
      newErrors.assignee = 'المسؤول عن التنفيذ مطلوب';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // تجهيز البيانات للإرسال
    const payload = {
      ...formData,
      assignee: assignee, // سيتم فكه في الأب (KanbanBoard) إلى assigned_user_id أو assigned_department_id
    };

    onSave(payload);
  };

  // ── تغيير الحقول ──
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // مسح الخطأ الخاص بالحقل إن وجد
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── عرض الفورم ──
  return (
    <form onSubmit={handleSubmit} className="space-y-3">
       <div className="w-full max-w-2xl border border-gray-300 dark:border-slate-800 rounded-lg bg-gray-50 dark:bg-slate-800 overflow-hidden">
        {/* ─── حقل العنوان ─── */}
        <input type='text'
          rows={2}
          className={clsx(
            "w-full px-4 py-3 text-sm resize-none min-h-[60px] outline-none focus:ring-0 ",
            "bg-transparent dark:bg-slate-800",
            "border-0 border-b-2 border-transparent transition-colors duration-200",
            "focus:border-blue-500 focus:ring-0",
            "text-gray-700 dark:text-gray-200 placeholder-gray-400")}
          placeholder="يمكنك كتابة عنوان الخطوة هنا"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          autoFocus
        />
        {errors.title && (
          <p className="text-xs text-red-500 mt-1">{errors.title}</p>
        )}

        {/* شريط الأيقونات (بدون border-top وبنفس الخلفية) */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-300 bg-gray-50 dark:bg-slate-800">
        {/* أيقونات التنسيق (مثال) */}
          <button className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 4h12M6 20h12M4 12h16" />
            </svg>
          </button>
          <button className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
          <button className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
          <span className="w-px h-6 bg-gray-300 mx-1"></span>
          <button className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <button className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          {/* زر Create (إذا أردت إضافته) */}
          <button className="mr-auto bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-1.5 rounded-full transition-colors">
            Create
          </button>
      </div>
    </div>

      {/* ─── حقل الوصف ─── */}
      <div className={theme.field.wrapper}>
        <label className={theme.field.label}>الوصف</label>
        <textarea
          className={clsx(
            "w-full px-4 py-3 text-sm resize-none min-h-[60px] outline-none focus:ring-0 ",
            "bg-transparent dark:bg-slate-800",
            "border-0 border-b-2 border-transparent transition-colors duration-200",
            "focus:border-blue-500 focus:ring-0",
            "text-gray-700 dark:text-gray-200 placeholder-gray-400")}
          placeholder="شرح تفصيلي للخطوة (اختياري)..."
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
        />
      </div>

      {/* ─── حقل المسؤول ─── */}
      <div className={theme.field.wrapper}>
        <label className={clsx(theme.field.label, 'flex items-center gap-1')}>
          المسؤول عن التنفيذ <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div
            className={clsx(
              'flex-1 h-10 flex items-center px-3 text-sm rounded-lg border transition-colors',
              errors.assignee
                ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700',
              assignee.id
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-400'
            )}
          >
            {assignee.id ? assignee.name : 'لم يتم تحديد مسؤول بعد...'}
          </div>
          <button
            ref={assigneeButtonRef}
            type="button"
            onClick={() => setShowAssigneePopover(true)}
            >
            اختيار
            </button>
        </div>
        {errors.assignee && (
          <p className="text-xs text-red-500 mt-1">{errors.assignee}</p>
        )}
      </div>

      {/* ─── حقل تاريخ البدء ─── */}
      <div className={theme.field.wrapper}>
        <label className={theme.field.label}>تاريخ البدء</label>
        <input
          type="datetime-local"
          className={theme.input.base}
          value={formData.started_at}
          onChange={(e) => handleChange('started_at', e.target.value)}
        />
      </div>

      {/* ─── حقل التوازي ─── */}
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            تنفيذ متوازي
          </span>
          <span className="text-[11px] text-slate-400">
            تفعيل التنفيذ المتوازي مع الخطوات الأخرى
          </span>
        </div>
        <ToggleSwitch
          checked={formData.is_parallel}
          onChange={() => handleChange('is_parallel', !formData.is_parallel)}
        />
      </div>

      {/* ─── أزرار التحكم ─── */}
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className={clsx(theme.button.ghost, 'px-4 py-2 text-sm')}
          disabled={isSubmitting}
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={clsx(
            theme.button.primary,
            'px-5 py-2 text-sm flex items-center gap-2'
          )}
        >
          {isSubmitting && (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {isAdding ? 'إضافة خطوة' : 'حفظ التعديلات'}
        </button>
      </div>
      {showAssigneePopover && (
        <SidebarTree
            isPopover={true}
            onSelectNode={handleAssigneeSelect}
            onClose={() => setShowAssigneePopover(false)}
            triggerRef={assigneeButtonRef}
        />
        )}

      {/* ─── مودال اختيار المسؤول ─── */}
      {showAssigneePicker && (
        <Popover
            open={showAssigneePicker}
            onClose={() => setShowAssigneePicker(false)}
            >
            <SidebarTree
                variant="popover"
                title="اختر المسؤول"
                onSelectNode={handleAssigneeSelect}
                onClose={() => setShowAssigneePicker(false)}
            />
            </Popover>
      )}
    </form>
  );
}