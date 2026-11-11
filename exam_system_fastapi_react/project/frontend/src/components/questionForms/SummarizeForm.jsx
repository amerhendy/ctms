import { FormField } from '../common/index'
import Input from '../Input'
import clsx from 'clsx'
import { FileText, AlignLeft, Hash } from 'lucide-react'
import RichTextEditor from '../common/RichTextEditor'

export default function SummarizeForm({
  referenceText,
  setReferenceText,
  minWords,
  setMinWords,
  maxWords,
  setMaxWords,
  theme,
}) {
  // حساب عدد كلمات النص الأصلي تلقائياً
  const wordCount = referenceText
    ? referenceText.trim().split(/\s+/).filter(Boolean).length
    : 0

  return (
    <div className="space-y-4">
      {/* 1. النص الأصلي للتلخيص */}
      <FormField label="النص الأصلي للتلخيص:" required>
        <div className="space-y-1.5">
          <RichTextEditor
              value={referenceText || ''}
              onChange={(val) => setReferenceText(val || '')}
              placeholder="أدخل نص السؤال، ويمكنك إضافة جدول أو ألوان..."
            />  
          {/* شريط معلومات النص */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 opacity-70" />
              إجمالي كلمات النص الأصلي: <strong className="text-slate-700 dark:text-slate-200">{wordCount}</strong> كلمة
            </span>
          </div>
        </div>
      </FormField>

      {/* 2. شروط وحدود التلخيص */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-xs border-b border-slate-200 dark:border-slate-700/50 pb-2">
          <AlignLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>قيود حجم التلخيص المطلوبة</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="أقل عدد كلمات مقبول:">
            <div className="relative flex items-center">
              <Input
                type="number"
                min={1}
                value={minWords}
                onChange={(e) => setMinWords(e.target.value)}
                className={clsx(theme?.input?.base, 'w-full pl-9')}
                placeholder="مثال: 30"
              />
              <Hash className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            </div>
          </FormField>

          <FormField label="أقصى عدد كلمات مسموح:">
            <div className="relative flex items-center">
              <Input
                type="number"
                min={1}
                value={maxWords}
                onChange={(e) => setMaxWords(e.target.value)}
                className={clsx(theme?.input?.base, 'w-full pl-9')}
                placeholder="مثال: 100"
              />
              <Hash className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            </div>
          </FormField>
        </div>
      </div>
    </div>
  )
}