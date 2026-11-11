import { useEffect, useState, useId } from 'react'
import clsx from 'clsx'
import { theme } from '../../constants/theme'

export function TrueFalseJustifyQuestion({ question, value = { choice: null, justification: '' }, onChange }) {
  const uniqueName = useId()
  const val = value || { choice: null, justification: '' }

  return (
    <div className="space-y-3 my-4">
      <div className="gap-6">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="radio"
            name={`tf-${question?.id || uniqueName}`}
            checked={val.choice === true}
            onChange={() => onChange({ ...val, choice: true })}
            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
          />
          <span className="text-sm font-semibold text-slate-700">صواب ✓</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="radio"
            name={`tf-${question?.id || uniqueName}`}
            checked={val.choice === false}
            onChange={() => onChange({ ...val, choice: false })}
            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
          />
          <span className="text-sm font-semibold text-slate-700">خطأ ✗</span>
        </label>
      </div>

      <textarea
        placeholder="اذكر سبب اختيارك والتعليل المناسب..."
        value={val.justification || ''}
        onChange={(e) => onChange({ ...val, justification: e.target.value })}
        className={clsx(theme?.textarea?.base, theme?.textarea?.resizable, theme?.textarea?.fixed)}
      />
    </div>
  )
}
