import { useEffect, useState, useId } from 'react'
import clsx from 'clsx'
import { theme } from '../../constants/theme'


export function SjtQuestion({ question, value = {}, onChange }) {
  const { options = [] } = question?.question_data || {}

  function handleChoice(type, optionIndex) {
    onChange({ ...value, [type]: optionIndex })
  }

  return (
    <div className="space-y-3 my-4">
      <div className="grid grid-cols-1 gap-2">
        {options.map((opt, idx) => (
          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3">
            <span className="text-sm text-slate-800 flex-1">{opt}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleChoice('best', idx)}
                className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                  value?.best === idx ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                أفضل تصرف
              </button>
              <button
                type="button"
                onClick={() => handleChoice('worst', idx)}
                className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                  value?.worst === idx ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                أسوأ تصرف
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
