import { FormField, IconButton, Select } from '../common/index'
import Input from '../Input'
import clsx from 'clsx'
import { Plus, Trash2 } from 'lucide-react'

export default function InlineDropdownForm({ clozeTemplate, setClozeTemplate, clozeDropdowns, setClozeDropdowns, theme }) {
  // تغيير قيمة خيار محدد داخل قائمة
  function handleClozeOptionChange(dropIdx, optIdx, val) {
    const updated = [...clozeDropdowns]
    const oldVal = updated[dropIdx].options[optIdx]
    
    // 1. تحديث قيمة الخيار
    updated[dropIdx].options[optIdx] = val

    // 2. إذا كانت الإجابة الصحيحة هي القيمة القديمة التي تم تعديلها، نحدثها بالجديدة
    if (updated[dropIdx].correct === oldVal) {
      updated[dropIdx].correct = val
    }
    
    // 3. حماية إضافية: إذا كانت الإجابة الصحيحة غير موجودة ضمن الخيارات الجديدة نهائياً
    // نحدد الخيار الأول كإجابة صحيحة تلقائياً لضمان عدم إرسال بيانات قديمة
    if (!updated[dropIdx].options.includes(updated[dropIdx].correct)) {
      updated[dropIdx].correct = updated[dropIdx].options[0] || ''
    }

    setClozeDropdowns(updated)
  }

  // إضافة قائمة drop جديدة
  function addDropdown() {
    setClozeTemplate((prev) => (prev ? `${prev} [drop]` : '[drop]'))
    setClozeDropdowns([...clozeDropdowns, { options: ['', '', ''], correct: '' }])
  }

  // حذف قائمة drop بالكامل
  function removeDropdown(dropIdx) {
    const updated = clozeDropdowns.filter((_, idx) => idx !== dropIdx)
    setClozeDropdowns(updated)
  }

  // إضافة خيار جديد داخل قائمة محددة
  function addOptionToDrop(dropIdx) {
    const updated = [...clozeDropdowns]
    updated[dropIdx].options.push('')
    setClozeDropdowns(updated)
  }

  // حذف خيار من قائمة محددة
  function removeOptionFromDrop(dropIdx, optIdx) {
    const updated = [...clozeDropdowns]
    if (updated[dropIdx].options.length <= 1) return // الحد الأدنى خيار واحد
    
    const removedVal = updated[dropIdx].options[optIdx]
    updated[dropIdx].options = updated[dropIdx].options.filter((_, idx) => idx !== optIdx)
    
    // إعادة ضبط الإجابة الصحيحة إذا تم حذف الخيار المحدد كإجابة صحيحة
    if (updated[dropIdx].correct === removedVal) {
      updated[dropIdx].correct = ''
    }
    
    setClozeDropdowns(updated)
  }

  // تحديد الإجابة الصحيحة
  function handleCorrectChange(dropIdx, correctVal) {
    const updated = [...clozeDropdowns]
    updated[dropIdx].correct = correctVal
    setClozeDropdowns(updated)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
      {/* 1. العمود الأيمن: النص المصحوب بالقوائم */}
      <div className="w-full">
        <FormField label="النص المصحوب بقوائم منسدلة (ضع [drop] مكان كل قائمة):">
          <textarea
            rows={8}
            value={clozeTemplate}
            onChange={(e) => setClozeTemplate(e.target.value)}
            className={clsx(
              theme?.textarea?.base || 'w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
              theme?.textarea?.resizable,theme?.textarea?.fixed,
              'resize-none'
            )}
            placeholder="أدخل النص هنا واستخدم الكلمة المفتاحية [drop] مكان القائمة..."
          />
        </FormField>
      </div>

      {/* 2. العمود الأيسر: إعدادات القوائم المنسدلة وخياراتها */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            إعداد الخيارات لكل قائمة [drop]:
          </span>
          <button
            type="button"
            onClick={addDropdown}
            className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> إضافة قائمة [drop] جديدة
          </button>
        </div>

        {clozeDropdowns.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-slate-300 rounded-xl text-xs text-slate-500">
            اضغط على "إضافة قائمة" لتحديد الخيارات والإجابات الصحيحة.
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {clozeDropdowns.map((drop, dropIdx) => (
              <div 
                key={dropIdx} 
                className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl space-y-3"
              >
                {/* رأس القائمة */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-400">
                    خيارات القائمة رقم ({dropIdx + 1}):
                  </span>
                  <IconButton
                    icon={Trash2}
                    label="حذف القائمة"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDropdown(dropIdx)}
                    className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  />
                </div>

                {/* قائمة المدخلات للخيارات */}
                <div className="space-y-2">
                  {drop.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <Input
                          placeholder={`خيار ${optIdx + 1}`}
                          value={opt}
                          onChange={(e) => handleClozeOptionChange(dropIdx, optIdx, e.target.value)}
                          className={clsx(theme?.input?.base, 'w-full text-xs')}
                        />
                      </div>

                      {/* زر حذف خيار منفرد */}
                      {drop.options.length > 1 && (
                        <div className="shrink-0">
                          <IconButton
                            icon={Trash2}
                            label="حذف الخيار"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOptionFromDrop(dropIdx, optIdx)}
                            className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* التحكم بالإجابة الصحيحة وإضافة خيار */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/50 gap-2">
                  <button
                    type="button"
                    onClick={() => addOptionToDrop(dropIdx)}
                    className="text-xs font-medium text-blue-600 hover:underline shrink-0"
                  >
                    + إضافة خيار
                  </button>

                  {/* تحديد الخيار الصحيح */}
                  <div className="flex items-center gap-1 min-w-[140px]">
                    <Select
                      value={drop.correct}
                      onChange={(e) => handleCorrectChange(dropIdx, e.target.value)}
                      placeholder="الإجابة الصحيحة"
                      className="text-xs py-1"
                      options={drop.options.filter(Boolean).map((o) => ({ value: o, label: o }))}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}