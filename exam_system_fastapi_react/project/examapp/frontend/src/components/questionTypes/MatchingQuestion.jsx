import { useEffect, useState, useId } from 'react'
import clsx from 'clsx'
import { theme } from '../../constants/theme'

export function MatchingQuestion({ question, value = {}, onChange }) {
  const { pairs = [] } = question?.question_data || {}

  function handleSelect(leftItem, rightChoice) {
    const updated = { ...value, [leftItem]: rightChoice }
    onChange(updated)
  }

  return (
    <div className="space-y-3 my-4">
      {pairs.map((pair, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <span className=" border border-slate-300 rounded-md p-2 font-semibold text-blue-700 flex-1">{pair.left}</span>
          <span className="text-slate-400">←</span>
          <select
            value={value[pair.left] || ''}
            onChange={(e) => handleSelect(pair.left, e.target.value)}
            className="flex-1 p-2 bg-white border border-slate-300 rounded-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">اختر العنصر المناسب...</option>
            {pairs.map((p, i) => (
              <option key={i} value={p.right}>
                {p.right}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}
