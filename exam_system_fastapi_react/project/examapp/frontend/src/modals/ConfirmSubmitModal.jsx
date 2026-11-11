import { useEffect } from 'react'

export default function ConfirmSubmitModal({ open, onConfirm, onCancel }) {
  // إغلاق المودال عند الضغط على زر Esc من الكيبورد
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        onCancel()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      {/* خلفية شفافة قابلة للنقر للإغلاق */}
      <div 
        className="fixed inset-0" 
        onClick={onCancel}
        aria-hidden="true" 
      />

      {/* نافذة المودال */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="relative w-full max-w-sm p-6 overflow-hidden text-center transition-all transform bg-white shadow-2xl rounded-2xl border border-slate-100 animate-scaleUp z-10"
      >
        {/* أيقونة تحذير بصرية */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 mb-4">
          <svg 
            className="h-7 w-7 text-amber-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth="2" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" 
            />
          </svg>
        </div>

        {/* العنوان والوصف */}
        <h3 id="modal-title" className="text-lg font-bold text-slate-800 mb-2">
          تأكيد تسليم الاختبار
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed mb-6">
          هل أنت متأكد من رغبتك في إنهاء وتسليم الاختبار؟ لن تتمكن من التعديل على إجاباتك بعد التأكيد.
        </p>

        {/* الأزرار */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-sm"
          >
            نعم، تسليم
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  )
}