// src/pages/tasks/TaskDetail/TaskModels/AddStepModal.jsx

import { useState, useEffect } from 'react';
import { Modal, FormField, ToggleSwitch, Select } from '@/components/common';
import clsx from 'clsx';
import { theme } from '@/constants/theme';
import SidebarTree from '../SidebarTree';
// حذف الاستيراد غير المستخدم: formatForInput

/**
 * مودال إضافة / تعديل خطوة
 * يدعم الآن إضافة خطوات فرعية عبر استقبال parent_id
 */
export default function AddStepModal({
  open,
  onClose,
  taskId,
  onSave,
  stepData = null,        // بيانات الخطوة في حالة التعديل
  parent_id = null,  // معرف الخطوة الأب (لإضافة خطوة فرعية)
  isSubmitting = false,
  steps = {}
}) {
  
  const isEditing = !!stepData;
  const isSubStepMode = !!parent_id;
  const [loading, setLoading] = useState(false);
  const [showPickerModal, setShowPickerModal] = useState(false);

  // حالة المسؤول (موحد)
  const [assignedTo, setAssignedTo] = useState({ type: null, id: null, name: '' });

  // بيانات النموذج
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    is_parallel: false,
    started_at: '',
    status: 'pending',      // تستخدم داخلياً، ولا تظهر في الواجهة
    parent_id: parent_id || null,         // 💡 التفرع الهيكلي (مفرد)
    dependency_ids: []// 💡 الاعتمادية الزمنية (مصفوفة)
  });

  // ── دالة مساعدة لجمع معرفات الأحفاد (لتجنب الدورات) ──
  const getDescendantIds = (stepId, stepsMap) => {
    const ids = [];
    const stack = [stepId];
    while (stack.length) {
      const current = stack.pop();
      // البحث عن كل الخطوات التي parent_id === current
      const children = Object.values(stepsMap).filter(s => s.parent_id === current);
      children.forEach(child => {
        ids.push(child.id);
        stack.push(child.id);
      });
    }
    return ids;
  };

  // ── ترجمة الحالات للعرض (لخيارات الأب) ──
  const statusLabels = {
    pending: 'قيد الانتظار',
    in_progress: 'قيد التنفيذ',
    completed: 'مكتملة',
    cancelled: 'ملغاة',
  };

  // ── تجميع الخطوات حسب الحالة مع استبعاد الخطوة نفسها وأحفادها (في وضع التعديل) ──
  const getParentOptions = () => {
    // تحديد المعرفات المستبعدة
    let excludedIds = [];
    if (isEditing && stepData) {
      excludedIds = [stepData.id, ...getDescendantIds(stepData.id, steps)];
    }

    // فلترة الخطوات لاستبعاد المستبعدين
    const filteredSteps = Object.values(steps).filter(step => !excludedIds.includes(step.id));

    // تجميع حسب الحالة
    const grouped = filteredSteps.reduce((acc, step) => {
      const key = step.status;
      if (!acc[key]) acc[key] = [];
      acc[key].push(step);
      return acc;
    }, {});

    // تحويل إلى مصفوفة optgroups
    return Object.entries(grouped).map(([status, items]) => ({
      label: statusLabels[status] || status,
      options: items.map(step => ({
        value: step.id,
        label: step.title
      }))
    }));
  };

  const parentStepsOptions = getParentOptions();

  // ── تأثير عند تغيير stepData أو parent_id ──
  useEffect(() => {
    if (stepData) {
      // وضع التعديل: تعبئة البيانات من stepData
      const rawDate = stepData.started_at ? stepData.started_at.substring(0, 16) : '';
      
      // تعيين المسؤول
      if (stepData.assigned_department_id !== null && stepData.assigned_department_id !== undefined) {
        setAssignedTo({
          type: 'department',
          id: stepData.assigned_department_id,
          name: stepData.department?.name || '',
        });
      } else if (stepData.assigned_user_id) {
        setAssignedTo({
          type: 'employee',
          id: stepData.assigned_user_id,
          name: stepData.assignee?.full_name || '',
        });
      } else {
        setAssignedTo({ type: null, id: null, name: '' });
      }

      setFormData({
        id: stepData.id || '',
        task_id: stepData.task_id || '',
        title: stepData.title || '',
        description: stepData.description || '',
        started_at: rawDate,
        status: stepData.status || 'pending',   // نأخذ الحالة من البيانات ولكن لا نعرضها
        is_parallel: stepData.is_parallel !== undefined ? stepData.is_parallel : false,
        parent_id: stepData.parent_id || parent_id || null,
        dependency_ids: stepData.dependency_ids || []
      });
    } else {
      // وضع الإضافة: تنظيف الحقول مع الاحتفاظ بـ parent_id
      setFormData({
        title: '',
        description: '',
        started_at: '',
        status: 'pending',          // دائماً pending
        is_parallel: false,
        parent_id: parent_id || null,
        dependency_ids: []
      });
      setAssignedTo({ type: null, id: null, name: '' });
    }
  }, [stepData, parent_id]);

  // ── إعادة تعيين النموذج عند إغلاق المودال (لتفادي بقاء بيانات قديمة) ──
  useEffect(() => {
    if (!open) {
      // إذا كان المودال مغلقاً وليس في وضع التعديل، نعيد التعيين للقيم الافتراضية
      // لكننا لا نريد مسح البيانات إذا كان هناك تعديل pending؟ الأفضل إعادة التعيين فقط
      // عند الإغلاق الكامل (بعد الحفظ أو الإلغاء)، لكن onClose يتم استدعاؤها في كلتا الحالتين.
      // سنقوم بإعادة التعيين إذا لم يكن هناك stepData (أي في وضع الإضافة)
      if (!stepData) {
        setFormData({
          title: '',
          description: '',
          started_at: '',
          status: 'pending',
          is_parallel: false,
          parent_id: parent_id || null,
        });
        setAssignedTo({ type: null, id: null, name: '' });
      }
      // في حالة التعديل، قد نرغب في الاحتفاظ بالبيانات إذا فتح المودال مرة أخرى، ولكننا سنعتمد على useEffect أعلاه.
    }
  }, [open, stepData, parent_id]);

  // ── معالج الإرسال ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من صحة البيانات
    if (!formData.title.trim()) {
      // يمكن إضافة رسالة خطأ
      return;
    }
    if (!assignedTo.id) {
      // المسؤول مطلوب
      return;
    }

    setLoading(true);

    // تجهيز الـ payload
    const payload = {
      title: formData.title,
      description: formData.description || '',
      is_parallel: formData.is_parallel ?? false,
      started_at: formData.started_at || null,
      status: isEditing ? formData.status : 'pending',
      dependency_ids: formData.dependency_ids ? formData.dependency_ids.map(Number) : []
    };
      console.log(formData);
      
    if (formData.parent_id) {
       payload.parent_id = Number(formData.parent_id);
    } else {
       payload.parent_id = null;
    }

    // إضافة المعرفات في حالة التعديل
    if (formData.id) payload.id = formData.id;
    if (formData.task_id) payload.task_id = formData.task_id;
    
    // معالجة المسؤول
    if (assignedTo.type === 'employee' || assignedTo.type === 'user') {
      payload.assigned_user_id = assignedTo.id;
    } else if (assignedTo.type === 'department') {
      payload.assigned_department_id = assignedTo.id;
    }
    try {
      await onSave(taskId, payload);
      onClose();
      // لا نحتاج إلى إعادة تعيين هنا لأن useEffect سيتولى ذلك عند تغير open
    } catch (error) {
      console.error('Failed to save step:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── اختيار المسؤول من SidebarTree ──
  const handleAssigneeSelect = (node) => {
    
      
    const type = node.type ?? null;
    setAssignedTo({
      type: type,
      id: node.id,
      name: node.full_name || node.name,
    });
    setShowPickerModal(false);
  };

  // ── عنوان المودال ──
  const modalTitle = isEditing
    ? 'تعديل الخطوة'
    : parent_id
    ? 'إضافة خطوة فرعية'
    : 'إضافة خطوة جديدة';

  // ── عرض المودال ──
  return (
    <Modal open={open} onClose={onClose} title={modalTitle} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ─── إشعار الخطوة الفرعية ─── */}
        {!isEditing && parent_id && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
            <span className="font-medium">📎 خطوة فرعية</span>
            <span className="mr-2">لـ الخطوة رقم #{parent_id}</span>
          </div>
        )}

        {/* ─── العنوان ─── */}
        <FormField label="العنوان" required>
          <input
            type="text"
            className={theme.input.base}
            placeholder="أدخل عنوان الخطوة..."
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </FormField>

        {/* ─── الوصف ─── */}
        <FormField label="الوصف">
          <textarea
            className={clsx(theme.input.base, 'min-h-[80px] resize-none')}
            placeholder="شرح تفصيلي للخطوة (اختياري)..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </FormField>

        {/* ─── اختيار المسؤول ─── */}
        <FormField label="المسؤول عن التنفيذ" required>
          <div className="flex gap-2">
            <div
              className={clsx(
                'cursor-pointer ',
                'flex-1 h-10 flex items-center px-3 text-sm rounded-lg border',
                'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700',
                assignedTo.id
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-400'
              )}
              onClick={() => setShowPickerModal(true)}
            >
              
              {assignedTo.id ? assignedTo.name : 'لم يتم تحديد مسؤول بعد...'}
            </div>
          </div>
        </FormField>

        {/* ─── مودال اختيار المسؤول ─── */}
        {showPickerModal && (
          <Modal
            open={showPickerModal}
            onClose={() => setShowPickerModal(false)}
            title="اختر المسؤول عن هذه الخطوة"
            size="md"
          >
            <div className="h-[400px] overflow-y-auto">
              <SidebarTree onSelectNode={handleAssigneeSelect} />
            </div>
          </Modal>
        )}

        {/* ─── تاريخ البدء ─── */}
        <FormField label="تاريخ البدء">
          <input
            type="datetime-local"
            className={theme.input.base}
            value={formData.started_at}
            onChange={(e) => setFormData({ ...formData, started_at: e.target.value })}
          />
        </FormField>

        {/* ─── خانة الخطوة الأب الهيكلية ─── */}
        <FormField 
          label="الخطوة الرئيسية (المرحلة)" 
          hint="اختر إذا كنت تريد تنظيم هذه الخطوة كجزء فرعي (Checklist) داخل خطوة أكبر."
        >
          <select
            className="w-full px-3 py-2 rounded-md text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
            value={formData.parent_id ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setFormData({ ...formData, parent_id: val ? Number(val) : null });
            }}
          >
            <option value="">خطوة أساسية مستقلة</option>
            {parentStepsOptions.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </FormField>

        {/* ─── خانة الاعتمادية الزمنية (Multi-Select) ─── */}
        <FormField 
          label="متطلبات سابقة للبدء (الاعتمادية)"
          hint="⏳ حدد الخطوات التي يلتزم النظام بانتهاء تنفيذها تماماً قبل السماح ببدء هذه الخطوة."
        >
          {/* هنا يفضل استخدام مكون Select متعدد الاختيارات يدعم المصفوفات، كمثال مبسط: */}
          <select
            multiple
            className="w-full px-3 py-2 rounded-md text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 min-h-[80px] focus:ring-2 focus:ring-primary-500"
            value={formData.dependency_ids}
            onChange={(e) => {
              const options = e.target.options;
              const selectedValues = [];
              for (let i = 0; i < options.length; i++) {
                if (options[i].selected) selectedValues.push(Number(options[i].value));
              }
              setFormData({ ...formData, dependency_ids: selectedValues });
            }}
          >
            {Object.values(steps)
              .filter(s => s.id !== formData.id) // استبعاد الخطوة نفسها من اعتمادية نفسها
              .map(step => (
                <option key={step.id} value={step.id}>
                  {step.title} ({statusLabels[step.status] || step.status})
                </option>
              ))}
          </select>
        </FormField>

        {/* ─── التوازي ─── */}
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
            onChange={() =>
              setFormData({ ...formData, is_parallel: !formData.is_parallel })
            }
          />
        </div>

        {/* ─── أزرار التحكم ─── */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className={clsx(theme.button.ghost, 'px-4 py-2')}
            disabled={loading || isSubmitting}
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className={clsx(theme.button.primary, 'px-5 py-2 flex items-center gap-2')}
          >
            {(loading || isSubmitting) && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isEditing ? 'حفظ التعديلات' : 'إضافة الخطوة'}
          </button>
        </div>
      </form>
    </Modal>
  );
}