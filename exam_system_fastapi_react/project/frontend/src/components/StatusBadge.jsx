import React from 'react'
import { Clock, Play, CheckCircle2 } from 'lucide-react' // 👈 استيراد الأيقونات المناسبة للحالات
import { APPLICANT_STATUS_LABELS } from '../constants'

// 1. ربط كل حالة بالأيقونة الخاصة بها
const STATUS_ICONS = {
  pending: Clock,         // ساعة للإشارة إلى الانتظار
  in_progress: Play,      // سهم تشغيل للإشارة إلى العمل الجاري
  finished: CheckCircle2, // علامة صح للإشارة إلى الاكتمال
}

// 2. تحديث التنسيقات لتشمل ألوان متناسقة للوضع العادي والداكن (Dark Mode)
const STATUS_CLASSES = {
  pending: 'bg-gray-100 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400 border-gray-200 dark:border-gray-800',
  in_progress: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-900/50',
  finished: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50',
}

export default function StatusBadge({ status }) {
  // جلب الأيقونة المناسبة بناءً على الحالة الحالية
  const IconComponent = STATUS_ICONS[status]

  return (
    <span 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border select-none transition-colors ${STATUS_CLASSES[status] || ''}`}
    >
      {/* 🟢 عرض الأيقونة ديناميكياً فقط إذا كانت الحالة معرفة في القائمة */}
      {IconComponent && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      
      <span>
        {APPLICANT_STATUS_LABELS[status] || status}
      </span>
    </span>
  )
}
