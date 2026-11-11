import { FormField, IconButton } from '../common/index'
import clsx from 'clsx'
import { Copy, Trash2, ArrowLeftRight, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ProofreadingForm({ rawText, setRawText, correctedModelText, setCorrectedModelText, theme }) {
  // حساب عدد الكلمات للحقول
  const getWordCount = (text) => (text ? text.trim().split(/\s+/).filter(Boolean).length : 0)

  // نسخ النص الأصلي إلى النص النموذجي للبدء بالتصحيح منه
  function copyRawToCorrected() {
    setCorrectedModelText(rawText)
  }

  return (
    <div className="space-y-4">
      {/* شبكة من عمودين للشاشات المتوسطة وما فوق */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* العمود الأول: النص المحتوي على أخطاء */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormField 
              label={
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  النص المحتوي على أخطاء (المعروض للمتقدم):
                </span>
              } 
              required 
            />
            {rawText && (
              <IconButton
                icon={Trash2}
                label="مسح النص"
                variant="ghost"
                size="sm"
                onClick={() => setRawText('')}
                className="text-slate-400 hover:text-red-500"
              />
            )}
          </div>

          <textarea
            rows={6}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className={clsx(
              theme?.textarea?.base || 'w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500',
              'resize-none leading-relaxed'
            )}
            placeholder="أدخل النص الأصلي الذي يحتوي على الأخطاء اللغوية أو الإملائية..."
          />

          {/* تفاصيل عدد الكلمات */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>عدد الكلمات: {getWordCount(rawText)}</span>
            <span>عدد الأحرف: {rawText.length}</span>
          </div>
        </div>

        {/* العمود الثاني: النص النموذجي الصحيح */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <FormField 
              label={
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  النص النموذجي الصحيح (للتصحيح):
                </span>
              } 
            />
            
            {/* زر النسخ السريع لسهولة التصحيح */}
            {rawText && (
              <button
                type="button"
                onClick={copyRawToCorrected}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-1 rounded-md transition-colors"
                title="نسخ النص المكتوب أعلاه للبدء بتعديله"
              >
                <Copy className="w-3.5 h-3.5" /> نسخ النص لبدء التصحيح
              </button>
            )}
          </div>

          <textarea
            rows={6}
            value={correctedModelText}
            onChange={(e) => setCorrectedModelText(e.target.value)}
            className={clsx(
              theme?.textarea?.base || 'w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
              'resize-none leading-relaxed'
            )}
            placeholder="أدخل النص الصحيح المعتمد لتسهيل التقييم التلقائي أو اليدوي..."
          />

          {/* تفاصيل النص الصحيح */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>عدد الكلمات: {getWordCount(correctedModelText)}</span>
            {correctedModelText && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                جاهز للمقارنة
              </span>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}