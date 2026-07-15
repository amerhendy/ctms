//utils/helpers.js
// Priority config
export const PRIORITY_CONFIG = {
  low:      { label: 'منخفضة',  color: 'bg-gray-100 text-gray-600',   dot: 'bg-gray-400'   },
  medium:   { label: 'متوسطة',  color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  high:     { label: 'عالية',   color: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  critical: { label: 'حرجة',    color: 'bg-red-100 text-red-700',      dot: 'bg-red-500'    },
}

// Status config 
export const STATUS_CONFIG = {
  not_started: { label: 'لم تبدأ',      color: 'bg-gray-100 text-gray-600'   },
  in_progress:  { label: 'جارية',        color: 'bg-blue-100 text-blue-700'   },
  completed:    { label: 'مكتملة',       color: 'bg-green-100 text-green-700' },
  cancelled:    { label: 'ملغاة',        color: 'bg-red-100 text-red-600'     },
}

export const Step_STATUS_CONFIG={
  pending: { label: 'قيد الانتظار',      color: 'border-slate-300 dark:border-slate-600'   },
  in_progress:  { label: 'قيد التنفيذ',        color: 'border-blue-400 dark:border-blue-500'   },
  completed:    { label: 'مكتملة',       color: 'border-green-400 dark:border-green-500' },
  cancelled:    { label: 'متخطاه',        color: 'border-gray-400 dark:border-gray-500'     },
}
// Eisenhower quadrant config
export const EISENHOWER_CONFIG = {
  Q1_DO_FIRST:  { label: 'عاجل ومهم – افعله الآن',         color: 'bg-red-50 border-red-300',    text: 'text-red-700'   },
  Q2_SCHEDULE:  { label: 'مهم غير عاجل – خطط له',         color: 'bg-blue-50 border-blue-300',   text: 'text-blue-700'  },
  Q3_DELEGATE:  { label: 'عاجل غير مهم – فوّضه',          color: 'bg-amber-50 border-amber-300', text: 'text-amber-700' },
  Q4_ELIMINATE: { label: 'غير عاجل وغير مهم – تجنبه',     color: 'bg-gray-50 border-gray-300',   text: 'text-gray-600'  },
}

// Urgency status
export const URGENCY_CONFIG = {
  pending:  { label: 'في الانتظار', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'موافق عليه',  color: 'bg-red-100 text-red-700'       },
  rejected: { label: 'مرفوض',      color: 'bg-gray-100 text-gray-600'     },
}

// Role labels
export const ROLE_LABELS = {
  global_admin:    'مدير النظام',
  program_manager: 'مدير البرنامج',
  user:            'موظف',
}

// Format date to Arabic locale
export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// Format datetime
export function formatDateTime(dtStr) {

  if (!dtStr) return '—'
  return new Date(dtStr).toLocaleString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
export const formatForInput = (isoString) => {
  if (!isoString) return "";
  // تحويل "2026-06-28T10:39:48.182Z" إلى "2026-06-28T10:39"
  return isoString.slice(0, 16);
};
// Days until due date
export function daysUntilDue(dueDateStr) {
  if (!dueDateStr) return null
  const due = new Date(dueDateStr)
  const now = new Date()
  const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24))
  return diff
}

export const formatTaskDate = (dateString) => {
  if (!dateString) return "غير محدد";

  const options = {
    year: 'numeric',
    month: 'short', // مثل "يونيو"
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true, // نظام 12 ساعة مع ص/م
  };

  return new Date(dateString).toLocaleDateString('ar-EG', options);
};
export function dueDateColor(days) {
  if (days === null) return 'text-gray-400'
  if (days < 0) return 'text-red-600 font-bold'
  if (days <= 2) return 'text-red-500'
  if (days <= 7) return 'text-orange-500'
  return 'text-gray-500'
}

// Transfer permission labels
export const SHARE_PERMISSION_LABELS = {
  view:   'عرض فقط',
  edit:   'تعديل الخطوات',
  manage: 'إدارة',
  admin:  'مشرف',
}

// Delegation permission labels
export const DELEGATION_PERMISSION_LABELS = {
  approve: 'قبول المهام',
  reject:  'رفض المهام',
  assign:  'تعيين المنفذين',
  modify:  'تعديل المهام',
}

// Progress bar color
export function progressColor(pct) {
  if (pct === 100) return 'bg-green-500'
  if (pct >= 60)   return 'bg-blue-500'
  if (pct >= 30)   return 'bg-orange-400'
  return 'bg-gray-300'
}

// Action type labels for logs
export const ACTION_LABELS = {
  created:            '➕ إنشاء المهمة',
  edited:             '✏️ تعديل',
  deleted:            '🗑️ حذف',
  status_changed:     '🔄 تغيير الحالة',
  progress_updated:   '📊 تحديث التقدم',
  step_added:         '➕ إضافة خطوة',
  step_completed:     '✅ إتمام خطوة',
  step_deleted:       '🗑️ حذف خطوة',
  assigned:           '👤 تعيين منفذ',
  unassigned:         '👤 إلغاء تعيين',
  transferred:        '📤 تحويل',
  transfer_accepted:  '✅ قبول التحويل',
  transfer_rejected:  '❌ رفض التحويل',
  share_granted:      '🔗 مشاركة',
  share_revoked:      '🔗 إلغاء مشاركة',
  urgent_requested:   '🚨 طلب استعجال',
  urgent_approved:    '⚡ قبول الاستعجال',
  urgent_rejected:    '🚫 رفض الاستعجال',
  favorite_added:     '⭐ إضافة للمفضلة',
  favorite_removed:   '☆ حذف من المفضلة',
}

// API error message extractor
export function getApiError(error) {
  const serverError = error?.response?.data;
  
  // إذا كان الخطأ عبارة عن مصفوفة تفاصيل الفاليديشين القادمة من السيرفر
  if (Array.isArray(serverError?.detail)) {
    return serverError.detail[0]?.msg || 'بيانات المدخلات غير صالحة';
  }
  
  if (serverError?.detail && typeof serverError.detail === 'string') {
    return serverError.detail;
  }
  
  return error?.message || 'حدث خطأ غير متوقع';
}