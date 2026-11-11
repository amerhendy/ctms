import { FormField, RadioButton } from '../common/index'
import clsx from 'clsx'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function TrueFalseForm({ tfCorrect, setTfCorrect, modelJustification, setModelJustification, theme }) {
  return (
    <div className="w-full">
      {/* شبكة من عمودين للشاشات المتوسطة وما فوق */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
        
        {/* العمود الأول: تحديد الإجابة الصحيحة */}
        <FormField label="الإجابة الصحيحة:" required>
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* خيار صواب */}
            <label
              onClick={() => setTfCorrect(true)}
              className={clsx(
                'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                tfCorrect === true
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-bold shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <div className="flex items-center gap-2">
                <RadioButton
                  label=""
                  checked={tfCorrect === true}
                  onChange={() => setTfCorrect(true)}
                />
                <span className="text-sm">صواب</span>
              </div>
              <CheckCircle2 className={clsx("w-4 h-4", tfCorrect === true ? "text-emerald-600 dark:text-emerald-400" : "opacity-40")} />
            </label>

            {/* خيار خطأ */}
            <label
              onClick={() => setTfCorrect(false)}
              className={clsx(
                'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all',
                tfCorrect === false
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-700 dark:text-rose-400 font-bold shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              )}
            >
              <div className="flex items-center gap-2">
                <RadioButton
                  label=""
                  checked={tfCorrect === false}
                  onChange={() => setTfCorrect(false)}
                />
                <span className="text-sm">خطأ</span>
              </div>
              <XCircle className={clsx("w-4 h-4", tfCorrect === false ? "text-rose-600 dark:text-rose-400" : "opacity-40")} />
            </label>
          </div>
        </FormField>

        {/* العمود الثاني: التعليل النموذجي */}
        <FormField label="التعليل النموذجي (اختياري للتقييم):">
          <textarea
            rows={3}
            value={modelJustification}
            onChange={(e) => setModelJustification(e.target.value)}
            className={clsx(
              theme?.textarea?.base || 'w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
              'resize-none leading-relaxed'
            )}
            placeholder="أدخل نموذج التعليل الصحيح للاسترشاد به أثناء التقييم..."
          />
        </FormField>

      </div>
    </div>
  )
}