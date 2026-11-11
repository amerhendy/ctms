import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, Layers, CheckSquare, Square, FileText, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react'
import { workflowTemplatesApi } from '@/api/workflow'
import clsx from 'clsx'

export default function RecurringTaskStepsManager({ steps = [], onChange }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedStepIndices, setSelectedStepIndices] = useState([])
  const [showHint, setShowHint] = useState(false)

  // 1. جلب قائمة قوالب الـ Workflow
  const { data: templatesList } = useQuery({
    queryKey: ['workflow-templates-list'],
    queryFn: () => workflowTemplatesApi.list().then(res => res.data?.items || res.data || []),
  })

  // 2. جلب خطوات القالب المحدد في المعاينة
  const { data: templateStepsData, isLoading: isLoadingTemplateSteps } = useQuery({
    queryKey: ['workflow-template-steps', selectedTemplateId],
    queryFn: () => workflowTemplatesApi.getTemplateAsSteps(selectedTemplateId).then(res => res.data?.items || res.data || []),
    enabled: !!selectedTemplateId && isPreviewOpen,
  })

  // دالة تحديث مصفوفة الخطوات مع إعادة ترقيم step_order
  const updateStepsWithOrder = (newSteps) => {
    const reordered = newSteps.map((step, idx) => ({
      ...step,
      step_order: idx + 1,
    }))
    onChange(reordered)
  }

  // إضافة خطوة يدوية فارغة
  const handleAddManualStep = () => {
    const newStep = {
      temp_id: Date.now(),
      title: '',
      description: '',
      is_parallel: false,
      assigned_department_id: null,
      assigned_user_id: null,
      step_order: steps.length + 1,
    }
    updateStepsWithOrder([...steps, newStep])
  }

  // تعديل خطوة
  const handleStepChange = (index, field, value) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  // حذف خطوة
  const handleRemoveStep = (index) => {
    const filtered = steps.filter((_, idx) => idx !== index)
    updateStepsWithOrder(filtered)
  }

  // نقل خطوة للأعلى أو الأسفل
  const handleMoveStep = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= steps.length) return

    const updated = [...steps]
    const temp = updated[index]
    updated[index] = updated[targetIndex]
    updated[targetIndex] = temp

    updateStepsWithOrder(updated)
  }

  // معالجة اختيار/إلغاء اختيار خطوة من قالب المعاينة
  const toggleSelectTemplateStep = (idx) => {
    setSelectedStepIndices(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  // اختيار الجميع في المعاينة
  const toggleSelectAllTemplateSteps = () => {
    if (!templateStepsData) return
    if (selectedStepIndices.length === templateStepsData.length) {
      setSelectedStepIndices([])
    } else {
      setSelectedStepIndices(templateStepsData.map((_, idx) => idx))
    }
  }

  // عند اختيار قالب من القائمة المنسدلة بداخل المعاينة
  const handleTemplateSelectChange = (e) => {
    const tId = e.target.value
    setSelectedTemplateId(tId)
    setSelectedStepIndices([])
  }

  // دمج الخطوات المحددة من القالب القائم إلى القائمة الرئيسية
  const handleImportSelectedSteps = () => {
    if (!templateStepsData || selectedStepIndices.length === 0) return

    const imported = selectedStepIndices.map(idx => {
      const st = templateStepsData[idx]
      return {
        temp_id: Date.now() + Math.random(),
        title: st.title || st.name || '',
        description: st.description || '',
        is_parallel: !!st.is_parallel,
        assigned_department_id: st.assigned_department_id || null,
        assigned_user_id: st.assigned_user_id || null,
        step_order: 0,
      }
    })

    updateStepsWithOrder([...steps, ...imported])
    setIsPreviewOpen(false)
    setSelectedTemplateId('')
    setSelectedStepIndices([])
  }

  return (
    <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      {/* الشريط العلوي للتحكم بالخطوات */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
            خطوات تنفيذ المهمة ({steps.length})
          </span>
          <button
            type="button"
            onClick={() => setShowHint(!showHint)}
            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border border-indigo-200/50 dark:border-indigo-800/50"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>استيراد من قالب مسار</span>
          </button>

          <button
            type="button"
            onClick={handleAddManualStep}
            className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة خطوة</span>
          </button>
        </div>
      </div>

      {showHint && (
        <div className="p-2.5 bg-indigo-50/70 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 rounded-lg text-[11px] text-indigo-900 dark:text-indigo-300 leading-relaxed">
          يمكنك بناء مسار تنفيذ المهمة خطوة بخطوة، أو استيراد خطوات مجهزة مسبقاً من قوالب المسارات ومعاينتها واختيار ما يناسبك منها.
        </div>
      )}

      {/* قائمة الخطوات الحالية */}
      {steps.length === 0 ? (
        <div className="p-4 border border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-center text-xs text-gray-400 dark:text-gray-500">
          لا توجد خطوات مضافة بعد. اضغط على "إضافة خطوة" أو استورد من قالب جاهز.
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.temp_id || step.id || index}
              className="p-3 bg-gray-50/60 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/60 rounded-lg space-y-2 text-right transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="w-5 h-5 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold rounded text-[11px]">
                    {step.step_order || index + 1}
                  </span>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => handleStepChange(index, 'title', e.target.value)}
                    placeholder="عنوان الخطوة..."
                    className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1.5 text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>

                {/* أزرار الترتيب والحذف */}
                <div className="flex items-center gap-1 text-gray-400">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveStep(index, 'up')}
                    className="p-1 hover:text-indigo-600 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={index === steps.length - 1}
                    onClick={() => handleMoveStep(index, 'down')}
                    className="p-1 hover:text-indigo-600 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(index)}
                    className="p-1 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* وصف الخطوة + خيار التوازي */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={step.description || ''}
                  onChange={(e) => handleStepChange(index, 'description', e.target.value)}
                  placeholder="وصف أو تعليمات إضافية للخطوة (اختياري)..."
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1.5 text-[11px] text-gray-700 dark:text-gray-300 outline-none focus:border-indigo-500"
                />

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-600 dark:text-gray-400 select-none">
                  <input
                    type="checkbox"
                    checked={!!step.is_parallel}
                    onChange={(e) => handleStepChange(index, 'is_parallel', e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>تنفيذ بالتوازي</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal المعاينة والاختيار الانتقائي من القوالب */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl shadow-xl p-5 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                معاينة واختيار خطوات القالب
              </h4>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                إغلاق
              </button>
            </div>

            {/* قائمة الاختيار القوالب المتاحة */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                اختر قالب مسار العمل
              </label>
              <select
                value={selectedTemplateId}
                onChange={handleTemplateSelectChange}
                className="w-full border rounded-lg p-2 text-xs bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none focus:border-indigo-500"
              >
                <option value="">-- اختر قالب للبدء --</option>
                {templatesList?.map(t => (
                  <option key={t.id || t.template_id} value={t.id || t.template_id}>
                    {t.name || t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* عرض خطوات القالب المختار مع Checkboxes */}
            {selectedTemplateId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    الخطوات المتاحة بالقالب
                  </span>
                  {templateStepsData && templateStepsData.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleSelectAllTemplateSteps}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {selectedStepIndices.length === templateStepsData.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-100 dark:border-gray-800 rounded-lg p-2 bg-gray-50/50 dark:bg-gray-800/30">
                  {isLoadingTemplateSteps ? (
                    <div className="text-center py-4 text-xs text-gray-400">جاري جلب الخطوات...</div>
                  ) : templateStepsData && templateStepsData.length > 0 ? (
                    templateStepsData.map((st, idx) => {
                      const isChecked = selectedStepIndices.includes(idx)
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleSelectTemplateStep(idx)}
                          className={clsx(
                            "flex items-start gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors border",
                            isChecked
                              ? "bg-indigo-50/60 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200"
                              : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/50 text-gray-700 dark:text-gray-300"
                          )}
                        >
                          <button type="button" className="mt-0.5 text-indigo-600 dark:text-indigo-400">
                            {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-gray-400" />}
                          </button>
                          <div className="flex-1">
                            <div className="font-semibold">{st.title || st.name}</div>
                            {st.description && (
                              <div className="text-[10px] text-gray-500 dark:text-gray-400">{st.description}</div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-4 text-xs text-gray-400">لا توجد خطوات لهذا القالب.</div>
                  )}
                </div>
              </div>
            )}

            {/* أزرار التحكم بالمعاينة */}
            <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800 pt-3">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={selectedStepIndices.length === 0}
                onClick={handleImportSelectedSteps}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                دمج الخطوات المختارة ({selectedStepIndices.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}