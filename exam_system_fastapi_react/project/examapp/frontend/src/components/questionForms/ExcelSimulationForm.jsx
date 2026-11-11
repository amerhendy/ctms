import RichTextEditor from '../common/RichTextEditor'
import { FormField } from '../common/index'
import clsx from 'clsx'
import { FileSpreadsheet, HardDrive, FileCode } from 'lucide-react'

export default function ExcelSimulationForm({
  instructions,
  setInstructions,
  allowedExtensions,
  setAllowedExtensions,
  maxFileSizeMB,
  setMaxFileSizeMB,
  theme,
}) {
  const presetExtensions = ['.xlsx', '.xls', '.csv', '.pdf']
  console.log(instructions);
  
  function toggleExtension(ext) {
    const currentExts = allowedExtensions
      ? allowedExtensions.split(',').map((e) => e.trim()).filter(Boolean)
      : []

    let updated
    if (currentExts.includes(ext)) {
      updated = currentExts.filter((e) => e !== ext)
    } else {
      updated = [...currentExts, ext]
    }
    setAllowedExtensions(updated.join(', '))
  }

  return (
    <div className="space-y-4">
      {/* محرّر Markdown لتفاصيل المهمة والجداول */}
      <FormField label="تفاصيل المهمة المطلوب تنفيذها:" required>
        <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80 shadow-sm relative z-0">
          <div className="rtl" data-color-mode="light" translate="no">
            <RichTextEditor
                value={instructions || ''}
                onChange={(val) => setInstructions(val || '')}
                placeholder="أدخل نص السؤال، ويمكنك إضافة جدول أو ألوان..."
              />
            
          </div>
        </div>
      </FormField>

      {/* شروط وأحكام رفع الملف من قبل المتقدم */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-4">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold text-xs border-b border-slate-200 dark:border-slate-700/50 pb-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>إعدادات الملفات المرفوعة من المتقدم</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. الصيغ المسموح بها */}
          <FormField label="الصيغ المسموح بها للمتقدم:">
            <div className="space-y-2">
              <input
                type="text"
                value={allowedExtensions}
                onChange={(e) => setAllowedExtensions(e.target.value)}
                className={clsx(
                  theme?.input?.base || 'w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500'
                )}
                placeholder=".xlsx, .xls, .csv"
              />

              {/* أزرار اختيار سريعة للصيغ */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {presetExtensions.map((ext) => {
                  const isSelected = allowedExtensions.includes(ext)
                  return (
                    <button
                      key={ext}
                      type="button"
                      onClick={() => toggleExtension(ext)}
                      className={clsx(
                        'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 border',
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      )}
                    >
                      <FileCode className="w-3 h-3 opacity-60" />
                      {ext}
                    </button>
                  )
                })}
              </div>
            </div>
          </FormField>

          {/* 2. الحد الأقصى لحجم الملف */}
          <FormField label="الحد الأقصى لحجم الملف (ميجابايت):">
            <div className="relative flex items-center">
              <input
                type="number"
                min={1}
                max={50}
                value={maxFileSizeMB}
                onChange={(e) => setMaxFileSizeMB(e.target.value)}
                className={clsx(
                  theme?.input?.base || 'w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'pl-12',
                )}
              />
              <span className="absolute left-3 text-xs text-slate-400 dark:text-slate-500 pointer-events-none flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5" /> MB
              </span>
            </div>
          </FormField>
        </div>
      </div>
    </div>
  )
}