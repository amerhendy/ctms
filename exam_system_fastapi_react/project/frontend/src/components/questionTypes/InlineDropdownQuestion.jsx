import { useEffect, useState, useId } from 'react'
import clsx from 'clsx'
import { theme } from '../../constants/theme'
import { Select } from '../common' // استيراد مكون Select الخاص بك

// 5. سؤال القائمة المنسدلة داخل النص (Inline Dropdown / Cloze)
export function InlineDropdownQuestion({ question, value = {}, onChange }) {
  const { template_text = '', dropdowns = [] } = question?.question_data || {}
  const parts = template_text.split('[drop]')
  const val = value || {}

  function handleSelectChange(dropIndex, selectedVal) {
    onChange({
      ...val,
      [dropIndex]: selectedVal,
    })
  }

  return (
    <div className="my-4 p-4 bg-slate-50 border border-slate-200 rounded-xl leading-loose text-base text-slate-800 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200">
      {parts.map((part, idx) => {
        // تحويل خيارات النص المباشرة إلى كائنات { label, value } لتناسب مكون Select الخاص بك
        const formattedOptions = (dropdowns[idx]?.options || []).map((opt) => ({
          label: opt,
          value: opt,
        }))

        return (
          <span key={idx}>
            {part}
            {idx < parts.length - 1 && (
              <Select
                value={val[idx] || ''}
                onChange={(e) => handleSelectChange(idx, e.target.value)}
                options={formattedOptions}
                placeholder="-- اختر --"
                className="!w-auto inline-block mx-1.5 px-2 py-1 text-sm font-medium border-blue-400 focus:ring-2 focus:ring-blue-500/20"
              />
            )}
          </span>
        )
      })}
    </div>
  )
}