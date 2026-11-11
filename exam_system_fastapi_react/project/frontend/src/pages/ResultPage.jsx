import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useExamStore } from '../stores/examStore'

export default function ResultPage() {
  const navigate = useNavigate()
  const finished = useExamStore((s) => s.finished)
  const reset = useExamStore((s) => s.reset)

  useEffect(() => {
    if (!finished) {
      navigate('/')
    }
  }, [finished, navigate])

  if (!finished) return null

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="card max-w-md w-full text-center">
        <h1 className="text-xl font-bold text-accent mb-3">تم تسليم الاختبار بنجاح</h1>
        <p className="text-sm text-gray-600 mb-6">
          شكراً لك على إتمام الاختبار. سيتم مراجعة النتائج والتواصل معك لاحقاً من قبل إدارة الموارد البشرية.
        </p>
        <button
          onClick={() => {
            reset()
            navigate('/')
          }}
          className="btn-secondary"
        >
          العودة للصفحة الرئيسية
        </button>
      </div>
    </div>
  )
}
