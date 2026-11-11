// src/pages/tasks/TaskDetail/TaskModels/StepBadge.jsx

import clsx from 'clsx';
import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';
/**
 * مكون عرض حالة التأخير للخطوة
 * يعرض شريطاً جانبياً ونصاً إذا كانت الخطوة متأخرة
 */
export default function StepBadge({ step, nextStep }) {
  // حساب التأخير: الخطوة متأخرة إذا:
  // 1. لها تاريخ بدء (started_at)
  // 2. تاريخ البدء أقل من اليوم الحالي (أي فات موعدها)
  // 3. الخطوة التالية لها بدأت بالفعل (nextStep.started_at !== null)
  const isOverdue = useMemo(() => {
    if (!step.started_at) return false;
    const startedDate = new Date(step.started_at);
    
    const today = new Date();
    const hasNextStarted = nextStep?.started_at !== null && nextStep?.started_at !== undefined;
    return startedDate < today && hasNextStarted;
  }, [step.started_at, nextStep]);

  if (!isOverdue) return null;

  return (
    <div
      className={clsx(
        'absolute -left-0.1 top-0 bottom-0 flex items-center',
        'pointer-events-none' // يسمح بالنقر من خلاله
      )}
    >
      {/* الشريط الجانبي الأحمر */}
      <div className="w-1 h-3/4 bg-red-500 rounded-r-full shadow-[0_0_8px_rgba(239,68,68,0.4)]" />

      {/* النص الصغير "متأخرة" في الزاوية العليا */}
      <div
        className={clsx(
          'absolute -top-1 -right-1 flex items-center gap-1',
          'bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full',
          'shadow-[0_2px_8px_rgba(239,68,68,0.3)]'
        )}
      >
        <AlertCircle className="w-3 h-3" />ddd
        <span className='text-red-500'>متأخرة</span>
      </div>
    </div>
  );
}