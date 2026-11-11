import { useEffect, useState } from 'react'

// 🟢 دالة لخلط مصفوفة بشكل عشوائي (Fisher-Yates Shuffle)
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function OrderingQuestion({ question, value, onChange }) {
  // 🟢 دالة لاستخراج البيانات: إن كانت توجد إجابة سابقة نأخذها كما هي، وإلا نخلط العناصر الأساسية
  const getInitialItems = () => {
    // 1. إذا كان المستخدم أجاب سابقاً وخزّن الترتيب في value
    if (value) {
      if (Array.isArray(value)) return value
      if (value.ordered_items) return value.ordered_items
      if (value.items) return value.items
      if (value.order) return value.order
    }
    
    // 2. إذا لم تكن هناك إجابة سابقة، نأخذ العناصر الأصلية ونخلطها عشوائياً
    const defaultItems = question?.question_data?.items || []
    return shuffleArray(defaultItems)
  }

  const [items, setItems] = useState(getInitialItems)

  // 🟢 مزامنة الحالة عند تغيير السؤال أو القيمة القادمة من الخارج
  useEffect(() => {
    setItems(getInitialItems())
  }, [question?.id, value])

  function moveItem(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= items.length) return
    const updated = [...items]
    const [movedItem] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, movedItem)

    setItems(updated)

    // إرسال الترتيب الجديد
    onChange({ ordered_items: updated })
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
              <span className="text-blue-500 font-medium">{item}</span>
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