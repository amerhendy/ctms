// src/modals/tasks/SelectWorkFlowModal.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { workflowTemplatesApi } from '@/api/workflow';
import { TaskStepsApi } from '@/api';
import { Modal, FormField, Select, ToggleSwitch, Spinner } from '@/components/common';
import SidebarTree from '@/components/DepartmentTrees/SidebarTree';
import { theme } from '@/constants/theme';
import toast from 'react-hot-toast';
import { getApiError } from '@/utils/helpers';
import clsx from 'clsx';
import { 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Calendar, 
  GitFork, 
  Clock 
} from 'lucide-react';

export default function SelectWorkFlowModal({ open, onClose, taskId, onSuccess }) {
  // ── 1. حالات التحكم والتدفق (Flow Control) ──
  const [step, setStep] = useState(1); // 1: اختيار القالب، 2: المعاينة بـ Accordion
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [importedSteps, setImportedSteps] = useState([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // حالة التحكم بالـ Accordion (مصفوفة الـ indices المفتوحة)
  const [expandedIndices, setExpandedIndices] = useState([0]);

  // حالة شجرة اختيار المسؤول (SidebarTree)
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [activeStepIndexForAssignee, setActiveStepIndexForAssignee] = useState(null);

  // ── 2. جلب قائمة القوالب المتاحة ──
  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['workflow-templates-list'],
    queryFn: () => workflowTemplatesApi.list().then((r) => r.data),
    enabled: open,
  });

  // إعادة ضبط الحالة عند الفتح/الإغلاق
  useEffect(() => {
    if (!open) {
      setStep(1);
      setSelectedTemplateId('');
      setImportedSteps([]);
      setExpandedIndices([0]);
      setShowPickerModal(false);
      setActiveStepIndexForAssignee(null);
    }
  }, [open]);

  // ── 3. تحويل وتجهيز الخيارات المنسدلة بدون تحذيرات React ──
  const templateOptions = templates?.map((t) => ({
    key: `tpl_${t.id}`,
    value: t.id,
    label: t.name,
  })) || [];

  // ── 4. تحميل القالب وتحويله لهيكل بيانات مكتمل ──
  const handleLoadSteps = async () => {
  if (!selectedTemplateId) {
    toast.error('يرجى اختيار الـ WorkFlow أولاً');
    return;
  }

  setIsLoadingSteps(true);
  try {
    const response = await workflowTemplatesApi.getTemplateAsSteps(selectedTemplateId);
    const rawSteps = response.data || [];

    // تهيئة البيانات واستخراج بيانات المسؤول كاملة
    const formattedSteps = rawSteps.map((item, index) => {
      let assigneeType = null;
      let assigneeId = null;
      let assigneeName = '';

      if (item.assigned_department_id) {
        assigneeType = 'department';
        assigneeId = item.assigned_department_id;
        assigneeName = item.department_name || '';
      } else if (item.assigned_user_id) {
        assigneeType = 'employee';
        assigneeId = item.assigned_user_id;
        assigneeName = item.assignee_name || '';
      }

      return {
        temp_id: item.temp_id || `step_tpl_${index}`,
        title: item.title || '',
        description: item.description || '',
        started_at: item.started_at ? item.started_at.substring(0, 16) : '',
        is_parallel: item.is_parallel ?? false,
        parent_temp_id: item.parent_temp_id || '',
        dependency_temp_ids: item.dependency_temp_ids || [],
        assignedTo: {
          type: assigneeType,
          id: assigneeId,
          name: assigneeName,
        },
      };
    });

    setImportedSteps(formattedSteps);
    setExpandedIndices([0]);
    setStep(2);
  } catch (err) {
    toast.error(getApiError(err) || 'فشل تحميل خطوات القالب');
  } finally {
    setIsLoadingSteps(false);
  }
};

  // ── 5. دوال التعديل المحلي للخطوات داخل الـ Accordion ──
  const updateStepField = (index, field, value) => {
    setImportedSteps((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleAccordion = (index) => {
    setExpandedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleRemoveStep = (index, e) => {
    e.stopPropagation();
    const targetTempId = importedSteps[index]?.temp_id;
    
    setImportedSteps((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((stepItem) => ({
          ...stepItem,
          // تنظيف العلاقات عند حذف خطوة
          parent_temp_id: stepItem.parent_temp_id === targetTempId ? '' : stepItem.parent_temp_id,
          dependency_temp_ids: stepItem.dependency_temp_ids.filter((id) => id !== targetTempId),
        }))
    );
  };

  // ── 6. معالجة اختيار المسؤول عبر SidebarTree ──
  const openAssigneePicker = (index) => {
    setActiveStepIndexForAssignee(index);
    setShowPickerModal(true);
  };

  const handleAssigneeSelect = (node) => {
    if (activeStepIndexForAssignee !== null) {
      const type = node.type ?? null;
      updateStepField(activeStepIndexForAssignee, 'assignedTo', {
        type: type,
        id: node.id,
        name: node.full_name || node.name,
      });
    }
    setShowPickerModal(false);
    setActiveStepIndexForAssignee(null);
  };

  // ── 7. الإرسال والحفظ النهائي (Bulk Save) ──
  const handleSubmitBulk = async () => {
    // Validation: التأكد من الشروط الأساسية لكل خطوة
    for (let i = 0; i < importedSteps.length; i++) {
      const s = importedSteps[i];
      if (!s.title.trim()) {
        toast.error(`يرجى كتابة عنوان للخطوة رقم ${i + 1}`);
        return;
      }
      if (!s.assignedTo.id) {
        toast.error(`يرجى تحديد المسؤول عن الخطوة رقم ${i + 1} (${s.title})`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        steps: importedSteps.map((item, idx) => ({
          temp_id: item.temp_id,
          parent_temp_id: item.parent_temp_id || null,
          title: item.title,
          description: item.description || '',
          started_at: item.started_at || null,
          step_order: idx + 1,
          status: 'pending',
          is_parallel: item.is_parallel,
          dependency_temp_ids: item.dependency_temp_ids || [],
          assigned_user_id:
            item.assignedTo.type === 'employee' || item.assignedTo.type === 'user'
              ? item.assignedTo.id
              : null,
          assigned_department_id:
            item.assignedTo.type === 'department' ? item.assignedTo.id : null,
        })),
      };

      await TaskStepsApi.addBulkSteps(taskId, payload);
      toast.success('تم إضافة جميع الخطوات بنجاح من الـ WorkFlow');
      if (onSuccess) await onSuccess();
      onClose();
    } catch (err) {
      toast.error(getApiError(err) || 'فشل حفظ الخطوات');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="إضافة خطوات من WorkFlow" size="lg">
      {step === 1 ? (
        /* ── المرحلة الأولى: اختيار القالب ── */
        <div className="space-y-4 py-2">
          {isLoadingTemplates ? (
            <div className="flex justify-center items-center py-8 gap-2">
              <Spinner />
              <span className="text-sm text-slate-500">جاري تحميل القوالب...</span>
            </div>
          ) : (
            <FormField label="اختر الـ WorkFlow المناسب" required>
              <Select
                options={templateOptions}
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                placeholder="-- اختر من القائمة --"
              />
            </FormField>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className={theme.button.ghost}>
              إلغاء
            </button>
            <button
              type="button"
              disabled={!selectedTemplateId || isLoadingSteps}
              onClick={handleLoadSteps}
              className={clsx(theme.button.primary, 'flex items-center gap-2')}
            >
              {isLoadingSteps && <Spinner />}
              التالي (عرض وتعديل الخطوات)
            </button>
          </div>
        </div>
      ) : (
        /* ── المرحلة الثانية: معاينة وتعديل البيانات عبر Accordion ── */
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                خطوات القالب ({importedSteps.length})
              </span>
              <p className="text-xs text-slate-500">
                اضغط على أي خطوة لتوسيعها وتعديل تفاصيلها كاملة قبل الحفظ.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-primary-600 hover:underline flex items-center gap-1 font-medium"
            >
              <ArrowRight className="w-3.5 h-3.5" /> تغيير القالب
            </button>
          </div>

          {/* قائمة الـ Accordion */}
          <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1">
            {importedSteps.map((stepItem, index) => {
              const isExpanded = expandedIndices.includes(index);

              return (
                <div
                  key={stepItem.temp_id || index}
                  className="border rounded-xl bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm transition-all"
                >
                  {/* رأس الـ Accordion */}
                  <div
                    onClick={() => toggleAccordion(index)}
                    className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/80 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <div className="truncate flex-1">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                          {stepItem.title || 'خطوة بدون عنوان'}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {stepItem.assignedTo.name || 'غير محدد'}
                          </span>
                          {stepItem.started_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {stepItem.started_at}
                            </span>
                          )}
                          {stepItem.is_parallel && (
                            <span className="text-amber-600 font-medium">توازي</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleRemoveStep(index, e)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="حذف الخطوة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="text-slate-400 p-1">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* جسم الـ Accordion القابل للطي */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 space-y-4 bg-white dark:bg-slate-800">
                      {/* 1. العنوان */}
                      <FormField label="العنوان" required>
                        <input
                          type="text"
                          value={stepItem.title}
                          onChange={(e) => updateStepField(index, 'title', e.target.value)}
                          className={theme.input.base}
                          placeholder="أدخل عنوان الخطوة..."
                        />
                      </FormField>

                      {/* 2. الوصف */}
                      <FormField label="الوصف">
                        <textarea
                          value={stepItem.description}
                          onChange={(e) => updateStepField(index, 'description', e.target.value)}
                          className={clsx(theme.input.base, 'min-h-[70px] resize-none')}
                          placeholder="شرح تفصيلي للخطوة (اختياري)..."
                        />
                      </FormField>

                      {/* 3. المسؤول عن التنفيذ (مع SidebarTree) */}
                      <FormField label="المسؤول عن التنفيذ" required>
                        <div
                          onClick={() => openAssigneePicker(index)}
                          className={clsx(
                            'cursor-pointer flex h-10 items-center px-3 text-sm rounded-lg border',
                            'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700',
                            stepItem.assignedTo.id
                              ? 'text-slate-900 dark:text-white font-medium'
                              : 'text-slate-400'
                          )}
                        >
                          {stepItem.assignedTo.id
                            ? stepItem.assignedTo.name
                            : 'لم يتم تحديد مسؤول بعد...'}
                        </div>
                      </FormField>

                      {/* 4. تاريخ البدء والتوازي */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="تاريخ البدء">
                          <input
                            type="datetime-local"
                            value={stepItem.started_at}
                            onChange={(e) => updateStepField(index, 'started_at', e.target.value)}
                            className={theme.input.base}
                          />
                        </FormField>

                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 h-10 self-end">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            تنفيذ متوازي
                          </span>
                          <ToggleSwitch
                            checked={stepItem.is_parallel}
                            onChange={() =>
                              updateStepField(index, 'is_parallel', !stepItem.is_parallel)
                            }
                          />
                        </div>
                      </div>

                      {/* 5. الخطوة الرئيسية (الأب الهيكلي) */}
                      <FormField label="الخطوة الرئيسية (المرحلة)">
                        <select
                          className="w-full px-3 py-2 rounded-md text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                          value={stepItem.parent_temp_id}
                          onChange={(e) => updateStepField(index, 'parent_temp_id', e.target.value)}
                        >
                          <option value="">خطوة أساسية مستقلة</option>
                          {importedSteps
                            .filter((_, i) => i !== index) // استبعاد الخطوة نفسها
                            .map((otherStep) => (
                              <option key={otherStep.temp_id} value={otherStep.temp_id}>
                                {otherStep.title || `خطوة #${otherStep.temp_id}`}
                              </option>
                            ))}
                        </select>
                      </FormField>

                      {/* 6. الاعتمادية الزمنية */}
                      <FormField label="متطلبات سابقة للبدء (الاعتمادية)">
                        <select
                          multiple
                          className="w-full px-3 py-2 rounded-md text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 min-h-[70px]"
                          value={stepItem.dependency_temp_ids}
                          onChange={(e) => {
                            const options = e.target.options;
                            const selectedValues = [];
                            for (let i = 0; i < options.length; i++) {
                              if (options[i].selected) selectedValues.push(options[i].value);
                            }
                            updateStepField(index, 'dependency_temp_ids', selectedValues);
                          }}
                        >
                          {importedSteps
                            .filter((_, i) => i !== index)
                            .map((otherStep) => (
                              <option key={otherStep.temp_id} value={otherStep.temp_id}>
                                {otherStep.title || `خطوة #${otherStep.temp_id}`}
                              </option>
                            ))}
                        </select>
                      </FormField>
                    </div>
                  )}
                </div>
              );
            })}

            {importedSteps.length === 0 && (
              <div className="text-center py-8 text-sm text-slate-500">
                لا توجد خطوات في هذا القالب.
              </div>
            )}
          </div>

          {/* أزرار التحكم والإنهاء */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className={theme.button.ghost}>
              إلغاء
            </button>
            <button
              type="button"
              disabled={isSubmitting || importedSteps.length === 0}
              onClick={handleSubmitBulk}
              className={clsx(theme.button.primary, 'flex items-center gap-2')}
            >
              {isSubmitting ? <Spinner /> : <CheckCircle2 className="w-4 h-4" />}
              حفظ الخطوات في المهمة
            </button>
          </div>
        </div>
      )}

      {/* ── مودال شجرة اختيار المسؤول الفرعي ── */}
      {showPickerModal && (
        <Modal
            open={showPickerModal}
            onClose={() => setShowPickerModal(false)}
            title="اختر المسؤول عن هذه الخطوة"
            size="md"
        >
            <div className="h-[400px] overflow-y-auto">
            <SidebarTree
                onSelectNode={handleAssigneeSelect}
                selectedId={activeStepIndexForAssignee !== null ? importedSteps[activeStepIndexForAssignee]?.assignedTo?.id : null}
                selectedType={activeStepIndexForAssignee !== null ? importedSteps[activeStepIndexForAssignee]?.assignedTo?.type : null}
            />
            </div>
        </Modal>
        )}
    </Modal>
  );
}