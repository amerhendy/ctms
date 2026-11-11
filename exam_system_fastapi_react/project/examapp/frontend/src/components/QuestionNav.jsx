import { useEffect, useRef } from 'react'

export default function QuestionNav({ questions, currentIndex, answers, onSelect }) {
  const activeRef = useRef(null)

  // 🟢 كل ما السؤال النشط يتغير → نرولّه على الشاشة
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    }
  }, [currentIndex])

  const checkIsAnswered = (questionId) => {
    const val = answers[questionId]
    if (val === undefined || val === null) return false
    if (typeof val === 'string' && val.trim() === '') return false
    if (Array.isArray(val) && val.length === 0) return false
    if (typeof val === 'object' && !Array.isArray(val)) {
      // لأي object (زي { selected_index: ... }) نعتبره إجابة
      return Object.keys(val).length > 0
    }
    return true
  }

  return (
    <nav className="flex flex-row items-center gap-2 overflow-x-auto scrollbar-thin px-1 py-1">
      {questions.map((q, idx) => {
        const isCurrent = idx === currentIndex
        const isAnswered = checkIsAnswered(q.id)

        // 🎨 ألوان الحالة: نشط | مُجاب | فاضي
        const stateClasses = isCurrent
          ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-110 font-bold'
          : isAnswered
          ? 'border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
          : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:border-slate-300'

        return (
          <button
            key={q.id}
            ref={isCurrent ? activeRef : null}
            onClick={() => onSelect(idx)}
            aria-label={`السؤال رقم ${idx + 1}`}
            aria-current={isCurrent ? 'page' : undefined}
            className={`shrink-0 w-9 h-9 rounded-full text-sm font-semibold border-2 transition-all duration-150 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${stateClasses}`}
          >
            {idx + 1}
          </button>
        )
      })}
    </nav>
  )
}