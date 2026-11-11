import React from 'react'
import { Calculator, Code2, Table, HelpCircle } from 'lucide-react'

export default function MathFormula({ question, value, onChange }) {
  const {
    equation_prompt,
    allowed_formats = 'excel_formula',
  } = question?.question_data || {}

  // 🟢 1. استخراج النص سواء كانت القيمة Object { text: "..." } أو String مباشرة
  const currentText = typeof value === 'object' && value !== null ? value?.text || '' : value || ''

  // 🟢 2. تعديل إضافة الرمز ليعتمد على النص المباشر
  const insertSymbol = (symbol) => {
    const newText = `${currentText}${symbol}`
    onChange({ text: newText })
  }

  const formatLabels = {
    excel_formula: 'صيغة إكسل (Excel Formula)',
    latex: 'صيغة رياضية (LaTeX)',
    plain_text: 'صيغة نصية مجردة',
    numeric_only: 'نتيجة رقمية نهائية فقط',
  }

  const excelSymbols = ['=SUM()', '=AVERAGE()', '=IF()', '=VLOOKUP()', '=COUNT()', 'A1:A20']
  const mathSymbols = ['√x', 'x²', '∫', '∑', 'π', '±', '÷', '^', '(', ')']

  return (
    <div className="my-4 space-y-4">
      {equation_prompt && (
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm leading-relaxed">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1.5">
            <HelpCircle className="w-4 h-4" />
            <span>السؤال / الصيغة المطلوبة:</span>
          </div>
          <p className="text-slate-800 dark:text-slate-200 font-medium">
            {equation_prompt}
          </p>
          {allowed_formats && (
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              التنسيق المطلوب للإجابة: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatLabels[allowed_formats] || allowed_formats}</span>
            </div>
          )}
        </div>
      )}

      <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm space-y-0">
        <div className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 p-2.5 flex items-center gap-2 flex-wrap">
          {(allowed_formats === 'excel_formula' || allowed_formats === 'plain_text') && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Table className="w-3.5 h-3.5 text-emerald-600" /> اختصارات إكسل:
              </span>
              {excelSymbols.map((sym, i) => (
                <button
                  key={`excel-${i}`}
                  type="button"
                  onClick={() => insertSymbol(sym)}
                  className="px-2 py-1 text-xs bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800 rounded text-emerald-700 dark:text-emerald-300 transition-colors dir-ltr font-mono"
                >
                  {sym}
                </button>
              ))}
            </div>
          )}

          {(allowed_formats === 'latex' || allowed_formats === 'plain_text' || allowed_formats === 'numeric_only') && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                <Calculator className="w-3.5 h-3.5 text-purple-600" /> رموز رياضية:
              </span>
              {mathSymbols.map((sym, i) => (
                <button
                  key={`math-${i}`}
                  type="button"
                  onClick={() => insertSymbol(sym)}
                  className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 transition-colors dir-ltr font-mono"
                >
                  {sym}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3">
          <input
            type="text"
            value={currentText}
            onChange={(e) => onChange({ text: e.target.value })}
            dir="ltr"
            placeholder={
              allowed_formats === 'excel_formula'
                ? 'اكتب الإجابة هنا، مثال: =SUM(A1:A20)'
                : 'اكتب إجابتك أو المعادلة هنا...'
            }
            className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-left transition-all"
          />
        </div>

        {/* 🟢 3. إظهار النص المباشر currentText هنا لتجنب خطأ عرض الكائنات */}
        <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 px-3 py-2 text-xs text-slate-500 flex justify-between items-center">
          <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
            <Code2 className="w-3.5 h-3.5 text-purple-600" />
            المعاينة:
          </span>
          <code className="font-mono text-purple-600 dark:text-purple-400 font-bold dir-ltr">
            {currentText || 'لم يتم إدخال إجابة بعد'}
          </code>
        </div>
      </div>
    </div>
  )
}