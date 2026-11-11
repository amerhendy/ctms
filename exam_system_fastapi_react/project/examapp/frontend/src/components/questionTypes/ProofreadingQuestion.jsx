import { useEffect, useState, useId } from 'react'
import clsx from 'clsx'
import { theme } from '../../constants/theme'

// 6. سؤال التصحيح والمراجعة (Proofreading / Data Audit)
export function ProofreadingQuestion({ question, value = '', onChange }) {
  const { raw_text = '' } = question?.question_data || {}

  return (
    <div className="space-y-4 my-4 dir-rtl">
      {/* صندوق عرض النص المراد إعادة كتابته */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-sm shadow-xs">
        <div className="flex items-center gap-1.5 font-bold mb-2 text-amber-800">
          <span className="text-base">⚠️</span>
          <span>النص المطلوب كتابته أو تصحيحه:</span>
        </div>

        <div className="whitespace-pre-wrap font-mono text-xs bg-white p-3 rounded-lg border border-amber-200/80 text-slate-800 leading-relaxed overflow-x-auto shadow-inner">
          {raw_text}
        </div>
      </div>

      {/* منطقة الإدخال */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          أعد كتابة النص أو البيانات هنا بعد التصحيح (ان يحتاج تصحيح الأخطاء الإملائية أو التنسيق):
        </label>

        <textarea
          rows={5}
          value={typeof value === 'object' ? value?.text || '' : value || ''}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="قم بكتابة الإجابة هنا..."
          className={clsx(
            theme?.textarea?.base || 'w-full p-2.5 border rounded-lg text-sm',
            theme?.textarea?.fixed
          )}
        />
      </div>
    </div>
  )
}