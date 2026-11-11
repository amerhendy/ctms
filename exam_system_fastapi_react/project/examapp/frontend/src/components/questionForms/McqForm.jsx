import { FormField, ToggleSwitch, IconButton, Select } from '../common/index'
import Input from '../Input'
import clsx from 'clsx'
import { Plus, Trash2 } from 'lucide-react'

export default function McqForm({ 
  qType, 
  options, 
  setOptions, 
  correctIndices, 
  setCorrectIndices, 
  sjtRatings, // حالة جديدة اختيارية لتقييم درجات التصرف في أسئلة SJT
  setSjtRatings, 
  theme 
}) {
  function handleOptionChange(idx, val) {
    const updated = [...options]
    updated[idx] = val
    setOptions(updated)
  }

  function handleToggleCorrectIndex(idx) {
    if (qType === 'single_choice') {
      setCorrectIndices([idx])
    } else {
      if (correctIndices.includes(idx)) {
        setCorrectIndices(correctIndices.filter((i) => i !== idx))
      } else {
        setCorrectIndices([...correctIndices, idx])
      }
    }
  }

  function handleSjtRatingChange(idx, rating) {
    if (!setSjtRatings) return
    const updated = { ...sjtRatings, [idx]: rating }
    setSjtRatings(updated)
  }

  function addOption() {
    setOptions([...options, ''])
  }

  function removeOption(idx) {
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== idx))
    if (setCorrectIndices) {
      setCorrectIndices(correctIndices.filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i)))
    }
  }

  // خيارات التقييم لأسئلة المواقف العملية SJT
  const sjtRatingOptions = [
    { value: 'very_effective', label: 'فعّال جداً' },
    { value: 'effective', label: 'فعّال' },
    { value: 'slightly_effective', label: 'فعّال قاطبة' },
    { value: 'ineffective', label: 'غير فعّال' },
    { value: 'counterproductive', label: 'نتيجة عكسية' },
  ]

  return (
    <div className="w-full">
      <FormField label={qType === 'sjt' ? 'خيارات التصرف المتاحة وتقييم كل تصرف:' : 'الخيارات والإجابة الصحيحة:'} required>
        <div className="space-y-3">
          {/* شبكة الخيارات */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((opt, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700/50"
              >
                {/* 1. في الأسئلة العادية: تحديد الإجابة الصحيحة */}
                {qType !== 'sjt' && (
                  <div className="shrink-0" title="تحديد كإجابة صحيحة">
                    <ToggleSwitch
                      checked={correctIndices.includes(i)}
                      onChange={() => handleToggleCorrectIndex(i)}
                    />
                  </div>
                )}

                {/* 2. حقل إدخال النص */}
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder={`الخيار / التصرف ${i + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className={clsx(theme?.input?.base, 'w-full text-xs')}
                  />
                </div>

                {/* 3. في أسئلة SJT: قائمة تقييم مستوى التصرف بدلاً من صح/خطأ */}
                {qType === 'sjt' && setSjtRatings && (
                  <div className="w-28 shrink-0">
                    <Select
                      value={sjtRatings?.[i] || ''}
                      onChange={(e) => handleSjtRatingChange(i, e.target.value)}
                      placeholder="التقييم..."
                      options={sjtRatingOptions}
                      className="text-xs py-1"
                    />
                  </div>
                )}

                {/* 4. زر الحذف */}
                {options.length > 2 && (
                  <div className="shrink-0">
                    <IconButton 
                      icon={Trash2} 
                      label="حذف" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeOption(i)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* زر إضافة خيار جديد */}
          <button
            type="button"
            onClick={addOption}
            className="text-xs font-semibold text-blue-600 hover:underline pt-1 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> إضافة خيار جديد
          </button>
        </div>
      </FormField>
    </div>
  )
}