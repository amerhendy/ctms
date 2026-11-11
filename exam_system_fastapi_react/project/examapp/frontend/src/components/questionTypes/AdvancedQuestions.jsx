import {theme} from '../../constants/theme'
import clsx from 'clsx'
// 1. سؤال الترتيب
import { useEffect, useState } from 'react'

export function OrderingQuestion({ question, value = [], onChange }) {
  const initialItems = value.length ? value : question.question_data?.items || []
  const [items, setItems] = useState(initialItems)

  // مزامنة الحالة عند تغيير السؤال أو الإجابة المحفوظة
  useEffect(() => {
    if (value && value.length > 0) {
      setItems(value)
    } else if (question.question_data?.items) {
      setItems(question.question_data.items)
    }
  }, [value, question])

  function moveItem(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= items.length) return
    const updated = [...items]
    const [movedItem] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, movedItem)
    setItems(updated)
    onChange(updated)
  }

  return (
    <div className="space-y-3 my-4">
      <p className="text-xs font-medium text-slate-500">
        قم بترتيب العناصر التالية بالتسلسل الصحيح باستخدام الأسهم:
      </p>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl transition-all hover:bg-white hover:shadow-xs"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-700 font-bold text-xs">
                {idx + 1}
              </span>
              <span className="text-sm font-medium text-slate-800">{item}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => moveItem(idx, idx - 1)}
                disabled={idx === 0}
                title="تحريك لأعلى"
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => moveItem(idx, idx + 1)}
                disabled={idx === items.length - 1}
                title="تحريك لأسفل"
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 2. سؤال المطابقة والربط
export function MatchingQuestion({ question, value = {}, onChange }) {
  const { pairs = [] } = question.question_data || {}

  function handleSelect(leftItem, rightChoice) {
    const updated = { ...value, [leftItem]: rightChoice }
    onChange(updated)
  }

  return (
    <div className="space-y-3 my-4">
      {pairs.map((pair, idx) => (
        <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-slate-50 border rounded-lg">
          <span className="text-sm font-semibold text-gray-700 flex-1">{pair.left}</span>
          <span className="text-gray-400">←</span>
          <select
            value={value[pair.left] || ''}
            onChange={(e) => handleSelect(pair.left, e.target.value)}
            className="input-field flex-1 !mb-0"
          >
            <option value="">اختر العنصر المناسب...</option>
            {pairs.map((p, i) => (
              <option key={i} value={p.right}>{p.right}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

// 3. سؤال المواقف والمحاكاة (SJT)
export function SjtQuestion({ question, value = {}, onChange }) {
  const { options = [] } = question.question_data || {}

  function handleChoice(type, optionIndex) {
    onChange({ ...value, [type]: optionIndex })
  }

  return (
    <div className="space-y-3 my-4">
      <div className="grid grid-cols-1 gap-2">
        {options.map((opt, idx) => (
          <div key={idx} className="p-3 bg-slate-50 border rounded-lg flex items-center justify-between gap-3">
            <span className="text-sm text-gray-800 flex-1">{opt}</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleChoice('best', idx)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  value.best === idx ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600'
                }`}
              >
                أفضل تصرف
              </button>
              <button
                type="button"
                onClick={() => handleChoice('worst', idx)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  value.worst === idx ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-600'
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

// 4. سؤال صواب / خطأ مع التعليل
export function TrueFalseJustifyQuestion({ value = { choice: null, justification: '' }, onChange }) {
  return (
    <div className="space-y-3 my-4">
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="tf"
            checked={value.choice === true}
            onChange={() => onChange({ ...value, choice: true })}
          />
          <span className="text-sm font-medium">صواب ✓</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="tf"
            checked={value.choice === false}
            onChange={() => onChange({ ...value, choice: false })}
          />
          <span className="text-sm font-medium">خطأ ✗</span>
        </label>
      </div>

      <textarea
        rows={3}
        placeholder="اذكر سبب اختيارك والتعليل المناسب..."
        value={value.justification || ''}
        onChange={(e) => onChange({ ...value, justification: e.target.value })}
        className={clsx(theme.textarea.base)}
      />
    </div>
  )
}
// 5. سؤال القائمة المنسدلة داخل النص (Inline Dropdown / Cloze)
export function InlineDropdownQuestion({ question, value = {}, onChange }) {
  const { template_text = '', dropdowns = [] } = question.question_data || {}

  // تقسيم النص عند الكلمة المفتاحية [drop]
  const parts = template_text.split('[drop]')

  function handleSelectChange(dropIndex, selectedVal) {
    onChange({
      ...value,
      [dropIndex]: selectedVal,
    })
  }

  return (
    <div className="my-4 p-4 bg-slate-50 border rounded-lg leading-loose text-base text-gray-800">
      {parts.map((part, idx) => (
        <span key={idx}>
          {part}
          {idx < parts.length - 1 && (
            <select
              value={value[idx] || ''}
              onChange={(e) => handleSelectChange(idx, e.target.value)}
              className="inline-block mx-1.5 px-2 py-1 bg-white border border-primary/40 rounded text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="">-- اختر --</option>
              {dropdowns[idx]?.options?.map((opt, optIdx) => (
                <option key={optIdx} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )}
        </span>
      ))}
    </div>
  )
}

// 6. سؤال التصحيح والمراجعة (Proofreading / Data Audit)
export function ProofreadingQuestion({ question, value = '', onChange }) {
  const { raw_text = '' } = question.question_data || {}

  return (
    <div className="space-y-4 my-4 dir-rtl">
      {/* صندوق عرض النص المراد إعادة كتابته */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-sm shadow-xs">
        <div className="flex items-center gap-1.5 font-bold mb-2 text-amber-800">
          <span className="text-base">⚠️</span>
          <span>النص المطلوب كتابته:</span>
        </div>
        
        <div className="whitespace-pre-wrap font-mono text-xs bg-white p-3 rounded-lg border border-amber-200/80 text-slate-800 leading-relaxed overflow-x-auto shadow-inner">
          {raw_text}
        </div>
      </div>

      {/* منطقة الإدخال */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          أعد كتابة النص أو البيانات هنا:
        </label>
        
        <textarea
          rows={5}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="قم بكتابة الإجابة هنا..."
          className={clsx(
            theme?.textarea?.base,theme.textarea.fixed
          )}
        />
      </div>
    </div>
  )
}