//components\common\index.jsx
import clsx from 'clsx'
import { useState, useEffect, useRef } from 'react'
import { Loader2, X, HelpCircle } from 'lucide-react'
import { PRIORITY_CONFIG, STATUS_CONFIG, URGENCY_CONFIG } from '@/utils/helpers'
import { theme } from '@/constants/theme';
// ── Spinner ──────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size]
  
  return (
    <Loader2 
      className={clsx(
        'animate-spin text-primary-600 dark:text-primary-400', 
        s, 
        className
      )} 
    />
  )
}

// ── Page loading ─────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64 bg-transparent transition-colors duration-300">
      <Spinner size="lg" />
    </div>
  )
}

// ── Empty state ──────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && (
        <Icon className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
      )}
      <h3 className="text-gray-900 dark:text-gray-200 font-medium mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {description}
        </p>
      )}
      {action}
    </div>
  )
}

// ── Priority badge ───────────────────────────────────────────────
export function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority];
  if (!cfg) return null;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      cfg.color,
      cfg.darkColor // إضافة الكلاسات الداكنة هنا
    )}>
      <span className={clsx('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── Status badge ─────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;

  return (
    <span className={clsx(
      'px-2 py-0.5 rounded-full text-xs font-medium',
      cfg.color,        // كلاسات الوضع النهاري
      cfg.darkColor     // كلاسات الوضع الليلي
    )}>
      {cfg.label}
    </span>
  );
}

// ── Urgency badge ────────────────────────────────────────────────
export function UrgencyBadge({ status }) {
  const cfg = URGENCY_CONFIG[status];
  if (!cfg) return null;

  return (
    <span className={clsx(
      'px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1',
      cfg.color,      // كلاسات الوضع النهاري
      cfg.darkColor   // كلاسات الوضع الليلي
    )}>
      <span>🚨</span>
      {cfg.label}
    </span>
  );
}

// ── Progress bar ─────────────────────────────────────────────────
export function ProgressBar({ value = 0, className = '' }) {
  const color =
    value === 100 ? 'bg-green-500' :
    value >= 60   ? 'bg-blue-500'  :
    value >= 30   ? 'bg-orange-400': 'bg-gray-400' // تحسين لون الحالة الدنيا

  return (
    // إضافة dark:bg-gray-700 للخلفية لضمان التباين
    <div className={clsx('w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden', className)}>
      <div
        className={clsx('h-full rounded-full transition-all duration-500', color)}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', mxw: 'max-w-full' }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* الـ Overlay (الخلفية المعتمة) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* حاوية الـ Modal */}
      <div className={clsx(
        'relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full slide-in border border-gray-200 dark:border-gray-800',
        widths[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4 max-h-[80vh] overflow-y-auto text-gray-700 dark:text-gray-300">
          {children}
        </div>
      </div>
    </div>
  )
}
// ── Confirm dialog ───────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
        {message}
      </p>
      <div className="flex gap-2 justify-end">
        <button 
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200" 
          onClick={onClose}
        >
          إلغاء
        </button>
        <button
          className={clsx(
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white',
            danger 
              ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600' 
              : 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600'
          )}
          onClick={() => { onConfirm(); onClose() }}
        >
          تأكيد
        </button>
      </div>
    </Modal>
  )
}

// ── Form field wrapper ───────────────────────────────────────────
export function FormField({ label, error, children, required, hint }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);

  // إغلاق الـ Tooltip عند الضغط في أي مكان خارج الحاوية
  useEffect(() => {
    function handleClickOutside(event) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setShowTooltip(false);
      }
    }
    if (showTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTooltip]);

  return (
    <div className="space-y-1.5 relative">
      {label && (
        <div className="flex items-center gap-1.5 select-none">
          <label className={`block text-sm font-medium ${theme.text.primary}`}>
            {label}
            {required && <span className="text-red-500 mr-1">*</span>}
          </label>
          
          {/* أيقونة علامة الاستفهام والتلميح */}
          {hint && (
            <div className="relative inline-block" ref={tooltipRef}>
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none flex items-center"
              >
                <HelpCircle className="w-4 h-4 cursor-pointer" />
              </button>

              {/* صندوق الـ Tooltip المتجاوب مع الـ RTL */}
              {showTooltip && (
                <div className="absolute z-30 bottom-full right-0 mb-2 w-64 p-3 bg-slate-800 dark:bg-slate-700 text-white text-xs rounded-lg shadow-xl border border-slate-700 dark:border-slate-600 animate-in fade-in zoom-in-95 duration-150">
                  <p className="leading-relaxed">{hint}</p>
                  {/* السهم السفلي الصغير */}
                  <div className="absolute top-full right-1.5 -mt-1 border-4 border-transparent border-t-slate-800 dark:border-t-slate-700" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {children}
      
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
// ── Select ───────────────────────────────────────────────────────
export function Select({ options = [], placeholder = 'اختر...', className = '', ...props }) {
  return (
    <select 
      className={clsx(
        'input w-full transition-colors duration-200',
        'bg-white text-gray-900 border-gray-200',
        'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700',
        className
      )} 
      {...props}
    >
      {/* قمنا بإزالة 'selected' تماماً. 
         إذا كان props.value غير موجود، سيتم اختيار هذا الخيار تلقائياً 
         إذا كان props.value يساوي "" 
      */}
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((opt,key) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
// ── Avatar ───────────────────────────────────────────────────────
export function Avatar({ name = '', src = '', size = 'md', className = '' }) {
  const s = { 
    sm: 'w-7 h-7 text-xs', 
    md: 'w-9 h-9 text-sm', 
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16' 
  }[size]

  const initials = name.trim().split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  
  // دمج ألوان الـ Dark Mode مع الألوان الأصلية
  const colors = [
    'bg-blue-500 dark:bg-blue-600', 
    'bg-purple-500 dark:bg-purple-600', 
    'bg-green-500 dark:bg-green-600', 
    'bg-orange-500 dark:bg-orange-600', 
    'bg-pink-500 dark:bg-pink-600'
  ]
  const color = name ? colors[name.charCodeAt(0) % colors.length] : 'bg-gray-400 dark:bg-gray-600'

  return (
    <div className={clsx(
      'rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden ring-1 ring-white/10 dark:ring-gray-900', 
      s, 
      !src && color, 
      className
    )}>
      {src ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer" 
          onError={(e) => {
            e.target.style.display = 'none'
          }}
        />
      ) : (
        initials || '?'
      )}
    </div>
  )
}

// ── Tabs ─────────────────────────────────────────────────────────
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 w-full transition-colors">
      <nav 
        className="flex gap-2 overflow-x-auto whitespace-nowrap pb-px -mb-px custom-scrollbar-horizontal select-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={clsx(
                "px-3 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 focus:outline-none",
                isActive
                  ? "border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50/30 dark:bg-primary-900/20 rounded-t-lg"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export function ToggleSwitch({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={clsx(
        theme.toggle.base,
        checked ? theme.toggle.active : theme.toggle.inactive,
        disabled && theme.toggle.disabled
      )}
    >
      <span
        className={clsx(
          theme.toggle.thumb,
          checked ? "translate-x-5 rtl:-translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}