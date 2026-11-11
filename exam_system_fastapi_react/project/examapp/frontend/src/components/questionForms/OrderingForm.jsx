import { FormField, IconButton } from '../common/index'
import Input from '../Input'
import clsx from 'clsx'
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react'

export default function OrderingForm({ orderItems, setOrderItems, theme }) {
  function handleOrderItemChange(idx, val) {
    const updated = [...orderItems]
    updated[idx] = val
    setOrderItems(updated)
  }

  function addOrderItem() {
    setOrderItems([...orderItems, ''])
  }

  function removeOrderItem(idx) {
    if (orderItems.length <= 2) return
    setOrderItems(orderItems.filter((_, i) => i !== idx))
  }

  // تغيير الترتيب لأعلى أو لأسفل
  function moveItem(idx, direction) {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= orderItems.length) return
    
    const updated = [...orderItems]
    const temp = updated[idx]
    updated[idx] = updated[targetIdx]
    updated[targetIdx] = temp
    setOrderItems(updated)
  }

  return (
    <div className="w-full">
      <FormField label="أدخل العناصر بالترتيب الصحيح (ستظهر للمتقدم بعشوائية):" required>
        <div className="space-y-3">
          
          {/* شبكة العناصر: عمود واحد للموبايل وعمودين للشاشات المتوسطة وما فوق */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {orderItems.map((item, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700/50"
              >
                {/* 1. الرقم والمؤشر على اليمين */}
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-6 shrink-0 text-center">
                  {idx + 1}.
                </span>

                {/* 2. مدخل النص يملأ الوسط */}
                <div className="flex-1 min-w-0">
                  <Input
                    value={item}
                    onChange={(e) => handleOrderItemChange(idx, e.target.value)}
                    placeholder={`العنصر ${idx + 1}`}
                    className={clsx(theme?.input?.base, 'w-full text-xs')}
                  />
                </div>

                {/* 3. أدوات التحكم على اليسار (أزرار الترتيب والحذف) */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* زر رفع الترتيب */}
                  <IconButton
                    icon={ArrowUp}
                    label="تحريك لأعلى"
                    variant="ghost"
                    size="sm"
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, 'up')}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30"
                  />

                  {/* زر خفض الترتيب */}
                  <IconButton
                    icon={ArrowDown}
                    label="تحريك لأسفل"
                    variant="ghost"
                    size="sm"
                    disabled={idx === orderItems.length - 1}
                    onClick={() => moveItem(idx, 'down')}
                    className="text-slate-500 hover:text-slate-800 dark:hover:text-white disabled:opacity-30"
                  />

                  {/* زر الحذف */}
                  {orderItems.length > 2 && (
                    <IconButton
                      icon={Trash2}
                      label="إزالة"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOrderItem(idx)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* زر إضافة عنصر جديد */}

          <IconButton
              icon={Plus}
              label="إضافة عنصر جديد"
              variant="solid"
              size="sm"
              onClick={addOrderItem}
            />
        </div>
      </FormField>
    </div>
  )
}