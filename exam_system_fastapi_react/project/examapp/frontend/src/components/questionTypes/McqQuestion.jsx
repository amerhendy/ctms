import React from 'react'
import { ToggleSwitch } from '../common'

export default function McqQuestion({ question, value, onChange }) {
  const { question_data = {}, q_type } = question || {}
  const options = question_data?.options || []
 
  
  const rawValue = typeof value === 'object' && value !== null && 'selected_index' in value
    ? value.selected_index
    : value

  const selectedIndices = Array.isArray(rawValue)
    ? rawValue.map((v) => (typeof v === 'object' && v !== null ? v.selected_index : v))
    : rawValue !== undefined && rawValue !== null
    ? [typeof rawValue === 'object' ? rawValue.selected_index : rawValue]
    : []

  const isMultiple = q_type === 'multiple_choice' || q_type === 'select_all'

  // التعديل 1: فحص هل تم اختيار جميع الخيارات بالفعل أم لا
  const isAllSelected = options.length > 0 && selectedIndices.length === options.length

  function handleToggle(index) {
    if (!isMultiple) {
      // 🟢 التعديل: إرسال Object يحتوي selected_index للباك إند
      onChange({ selected_index: index })
      return
    }

    const updated = selectedIndices.includes(index)
      ? selectedIndices.filter((i) => i !== index)
      : [...selectedIndices, index].sort((a, b) => a - b)

    onChange({ selected_index: updated })
  }

  // التعديل 2: دالة التبديل لخيار "تحديد الكل / إلغاء تحديد الكل"
  function handleSelectAll() {
    if (isAllSelected) {
      onChange({ selected_index: [] })
    } else {
      const allIndices = options.map((_, idx) => idx)
      onChange({ selected_index: allIndices })
    }
  }

  const handleKeyDown = (e, action) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      action()
    }
  }

  if (options.length === 0) {
    return <div className="text-slate-400 text-sm py-4">لا توجد خيارات متاحة لهذا السؤال.</div>
  }

  
  return (
    <div className="space-y-2.5 my-4" role={isMultiple ? 'group' : 'radiogroup'}>
      {/* الخيارات الأساسية */}
      {options.map((option, idx) => {
        const isChecked = selectedIndices.includes(idx)

        return (
          <div
            key={idx}
            role={isMultiple ? 'checkbox' : 'radio'}
            aria-checked={isChecked}
            tabIndex={0}
            onClick={() => handleToggle(idx)}
            onKeyDown={(e) => handleKeyDown(e, () => handleToggle(idx))}
            className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
              isChecked
                ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-md'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="pointer-events-none flex-shrink-0">
              <ToggleSwitch checked={isChecked} onChange={() => {}} />
            </div>

            <span className="text-sm leading-relaxed">{option}</span>
          </div>
        )
      })}

      {/* التعديل 3: إضافة خيار "تحديد الكل" في نهاية القائمة للخيارات المتعددة فقط */}
      {isMultiple && (
        <div
          role="checkbox"
          aria-checked={isAllSelected}
          tabIndex={0}
          onClick={handleSelectAll}
          onKeyDown={(e) => handleKeyDown(e, handleSelectAll)}
          className={`flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition-all duration-150 select-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
            isAllSelected
              ? 'bg-blue-600 border-blue-600 text-white font-medium shadow-md'
              : 'bg-slate-100 border-slate-300 hover:bg-slate-200 text-slate-800 font-semibold'
          }`}
        >
          <div className="pointer-events-none flex-shrink-0">
            <ToggleSwitch checked={isAllSelected} onChange={() => {}} />
          </div>

          <span className="text-sm leading-relaxed">تحديد الكل</span>
        </div>
      )}
    </div>
  )
}