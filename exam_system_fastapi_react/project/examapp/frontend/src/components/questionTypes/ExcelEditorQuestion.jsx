import { useRef, useEffect } from 'react'
import { HotTable } from '@handsontable/react'
import ReactMarkdown from 'react-markdown' // 1. استيراد المكتبة
import 'handsontable/styles/handsontable.min.css'
import 'handsontable/styles/ht-theme-main.min.css'
import { registerAllModules } from 'handsontable/registry'

registerAllModules()

export default function ExcelEditorQuestion({ question, value, onChange }) {
  const { rows = 6, cols = 6, instructions } = question?.question_data || {}
  const hotRef = useRef(null)

  // تجهيز البيانات الأولية في حال كانت فارغة
  const initialData = value?.gridData || Array.from({ length: rows }, () => Array(cols).fill(''))

  function handleAfterChange(changes, source) {
    if (source === 'loadData' || !changes) return

    if (hotRef.current?.hotInstance) {
      const currentData = hotRef.current.hotInstance.getData()
      onChange({ gridData: currentData })
    }
  }
  function QuestionHtmlViewer({ htmlContent }) {
  if (!htmlContent) return null

  return (
    <div
      className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}
  return (
    <div className="my-4 space-y-3">
      {/* 2. عرض تعليمات الـ Markdown إذا كانت متوفرة */}
      {instructions && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700 dir-rtl">
          <h4 className="font-semibold text-slate-900 mb-2">التعليمات المطلوبة:</h4>
          <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed">
            <QuestionHtmlViewer htmlContent={instructions} />
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mb-2">
        قم بإدخال وتنسيق البيانات في جدول الإكسل المرفق أدناه:
      </p>

      <div className="border border-gray-300 rounded-lg overflow-hidden dir-ltr">
        <HotTable
          ref={hotRef}
          data={initialData}
          rowHeaders={true}
          colHeaders={true}
          height="auto"
          licenseKey="non-commercial-and-evaluation"
          afterChange={handleAfterChange}
          contextMenu={true}
          stretchH="all"
        />
      </div>
    </div>
  )
}