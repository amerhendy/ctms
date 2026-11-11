import { useState } from 'react'

import Button from '../components/Button'

export default function AccessCodeModal({ open, applicantData, onClose }) {
  const [copied, setCopied] = useState(false)

  if (!open || !applicantData) return null

  function handleCopy() {
    if (applicantData.access_code) {
      navigator.clipboard.writeText(applicantData.access_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/55 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-7 max-w-sm w-full text-center">
        <div className="w-12 h-12 bg-emerald-100 text-accent rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
          ✓
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-1">كود الدخول للاختبار</h3>
        <p className="text-sm text-gray-500 mb-4">
          للمتقدم: <span className="font-semibold text-gray-700">{applicantData.full_name}</span>
        </p>

        <div className="bg-slate-50 border border-dashed border-gray-300 rounded-lg p-4 mb-4">
          <span className="text-3xl font-extrabold text-primary tracking-widest font-mono">
            {applicantData.access_code}
          </span>
        </div>

        <div className="flex gap-2 mb-3">
          <Button
            variant="primary"
            className="flex-1 bg-accent hover:bg-emerald-700"
            onClick={handleCopy}
          >
            {copied ? 'تم النسخ!' : 'نسخ الكود'}
          </Button>
        </div>

        <Button variant="secondary" className="w-full" onClick={onClose}>
          إغلاق
        </Button>
      </div>
    </div>
  )
}