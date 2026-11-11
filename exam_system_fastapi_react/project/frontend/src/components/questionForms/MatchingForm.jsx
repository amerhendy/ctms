import { FormField, IconButton } from '../common/index'
import Input from '../Input'
import clsx from 'clsx'
import { Plus, Trash2, ArrowLeftRight } from 'lucide-react'

export default function MatchingForm({ pairs, setPairs, theme }) {
  function handlePairChange(idx, field, val) {
    const updated = [...pairs]
    updated[idx][field] = val
    setPairs(updated)
  }

  function addPair() {
    setPairs([...pairs, { left: '', right: '' }])
  }

  function removePair(idx) {
    if (pairs.length <= 1) return
    setPairs(pairs.filter((_, i) => i !== idx))
  }

  return (
    <div className="w-full">
      <FormField label="أدخل عناصر العمود الأول وما يطابقها في العمود الثاني:" required>
        <div className="space-y-3">
          
          {/* قائمة الأزواج المتطابقة */}
          <div className="space-y-3">
            {pairs.map((pair, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50"
              >
                {/* 1. الرقم التسلسلي للزوج */}
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-5 text-center shrink-0">
                  {idx + 1}.
                </span>

                {/* 2. حقول الإدخال مقسمة لعمودين متساويين */}
                <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                  <div className="w-full">
                    <Input
                      value={pair.left}
                      onChange={(e) => handlePairChange(idx, 'left', e.target.value)}
                      placeholder={`العنصر الأصلي ${idx + 1}`}
                      className={clsx(theme?.input?.base, 'w-full text-xs')}
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full">
                    <ArrowLeftRight className="w-4 h-4 text-slate-400 shrink-0 hidden md:block" />
                    <div className="flex-1 min-w-0">
                      <Input
                        value={pair.right}
                        onChange={(e) => handlePairChange(idx, 'right', e.target.value)}
                        placeholder={`المطابق له ${idx + 1}`}
                        className={clsx(theme?.input?.base, 'w-full text-xs')}
                      />
                    </div>
                  </div>
                </div>

                {/* 3. زر الحذف على اليسار */}
                {pairs.length > 1 && (
                  <div className="shrink-0">
                    <IconButton
                      icon={Trash2}
                      label="إزالة"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePair(idx)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* زر إضافة زوج جديد */}
          <IconButton
              icon={Plus}
              label="إزالة"
              variant="solid"
              size="sm"
              onClick={addPair}
              className="text-blue-500 hover:bg-red-50 dark:hover:bg-red-950/30"
            />
        </div>
      </FormField>
    </div>
  )
}