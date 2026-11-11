import { FormField, Select } from '../common/index'
import Input from '../Input'
import clsx from 'clsx'
import { Calculator, Code2, HelpCircle, Table } from 'lucide-react'

export default function MathEquationForm({
  equationPrompt,
  setEquationPrompt,
  expectedAnswer,
  setExpectedAnswer,
  allowedFormats,
  setAllowedFormats,
  theme,
}) {
  // اختيارات نوع صيغة الإجابة المتوقعة من المتقدم
  const formatOptions = [
    { value: 'excel_formula', label: 'صيغة إكسل (Excel Formula - مثال: =SUM(A1:A20))' },
    { value: 'latex', label: 'صيغة رياضية (LaTeX)' },
    { value: 'plain_text', label: 'صيغة نصية مجردة (مثال: x^2 + 2x + 1)' },
    { value: 'numeric_only', label: 'نتيجة رقمية نهائية فقط' },
  ]

  // رموز ودوال سريعة للإدخال (إكسل + رياضي)
  const excelSymbols = ['=SUM()', '=AVERAGE()', '=IF()', '=VLOOKUP()', '=COUNT()', 'A1:A20']
  const mathSymbols = ['√x', 'x²', '∫', '∑', 'π', '±', '÷']

  function insertSymbol(symbol) {
    setExpectedAnswer((prev) => (prev ? `${prev}${symbol}` : symbol))
  }

  return (
    <div className="space-y-4">
      {/* 1. نموذج أو صيغة السؤال المطلوب */}
      <FormField label="الصيغة / السؤال المطلوب حسابه أو إدخاله:" required>
        <div className="space-y-2">
          <Input
            value={equationPrompt}
            onChange={(e) => setEquationPrompt(e.target.value)}
            className={clsx(theme?.input?.base, 'w-full text-right')}
            placeholder="مثال: اكتب صيغة إكسل المناسبة لجمع الخلايا من A1 إلى A20"
          />

          {/* اختصارات إدخال السريعة بناءً على النوع */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Table className="w-3 h-3 text-emerald-600" /> اختصارات إكسل:
            </span>
            {excelSymbols.map((sym, i) => (
              <button
                key={`excel-${i}`}
                type="button"
                onClick={() => insertSymbol(sym)}
                className="px-2 py-0.5 text-xs bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-700 dark:text-emerald-300 transition-colors dir-ltr font-mono"
              >
                {sym}
              </button>
            ))}

            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-2">
              <Calculator className="w-3 h-3" /> رموز رياضية:
            </span>
            {mathSymbols.map((sym, i) => (
              <button
                key={`math-${i}`}
                type="button"
                onClick={() => insertSymbol(sym)}
                className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 transition-colors dir-ltr font-mono"
              >
                {sym}
              </button>
            ))}
          </div>
        </div>
      </FormField>

      {/* 2. إعدادات الإجابة المتوقعة وطريقة التقييم */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-xs border-b border-slate-200 dark:border-slate-700/50 pb-2">
          <Code2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <span>ضوابط وإجابة السؤال النموذجية</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* نوع الصيغة المطلوبة من الطالب */}
          <FormField label="تنسيق الإجابة المتوقع:">
            <Select
              value={allowedFormats}
              onChange={(e) => setAllowedFormats(e.target.value)}
              options={formatOptions}
              className="text-xs"
            />
          </FormField>

          {/* الإجابة النموذجية للتقييم التلقائي */}
          <FormField label="الإجابة/الصيغة النموذجية (للتقييم):">
            <Input
              value={expectedAnswer}
              onChange={(e) => setExpectedAnswer(e.target.value)}
              className={clsx(theme?.input?.base, 'w-full text-left ltr font-mono')}
              placeholder={allowedFormats === 'excel_formula' ? 'مثال: =SUM(A1:A20)' : 'مثال: x = 2'}
            />
          </FormField>
        </div>

        {/* معاينة سريعة للإجابة */}
        {expectedAnswer && (
          <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> المعاينة النصية للإجابة:
            </span>
            <code className="font-mono text-purple-600 dark:text-purple-400 font-bold dir-ltr">
              {expectedAnswer}
            </code>
          </div>
        )}
      </div>
    </div>
  )
}