/**
 * ============================================================================
 *  theme.js — Enterprise Dashboard Design System
 * ============================================================================
 *  نظام تصميم موحّد لمشروع React + Tailwind CSS
 *  يدعم: الوضع الداكن (Dark Mode) عبر كلاس "dark" على <html>
 *  يعتمد على: clsx لدمج الكلاسات بشكل نظيف وآمن
 *
 *  طريقة الاستخدام:
 *    import { theme } from './utils/theme';
 *    import clsx from 'clsx';
 *    <input className={clsx(theme.input.base, errors.title && theme.input.error)} />
 * ============================================================================
 */

import clsx from 'clsx';

/* ============================================================================
 * 1) TOKENS — الألوان / التايبوجرافي / المسافات / الظلال / الحدود
 * ============================================================================
 * هذه القيم الخام (Design Tokens) المستخدمة في بناء بقية الكائنات بالأسفل.
 * عدّل هنا فقط إذا أردت تغيير هوية الموقع البصرية بالكامل.
 */

export const tokens = {
  // ألوان العلامة الأساسية (Brand / Primary)
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    // ألوان الحالة (Success / Warning / Danger / Info)
    success: { light: '#22c55e', dark: '#4ade80' },
    warning: { light: '#f59e0b', dark: '#fbbf24' },
    danger: { light: '#ef4444', dark: '#f87171' },
    info: { light: '#06b6d4', dark: '#22d3ee' },
  },

  // التايبوجرافي (الخطوط والأحجام)
  typography: {
    fontFamily: 'font-sans', // اربطها بخط عربي مثل "Tajawal" أو "Cairo" في tailwind.config.js
    sizes: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
    },
    weights: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },

  // المسافات الموحدة (Spacing Scale)
  spacing: {
    fieldGap: 'space-y-1.5', // المسافة بين label و input ورسالة الخطأ
    sectionGap: 'space-y-6', // المسافة بين أقسام النموذج
    cardPadding: 'p-5 md:p-6',
    inputPaddingY: 'py-2.5',
    inputPaddingX: 'px-3.5',
  },

  // نصف القطر والظلال (Radius / Shadow)
  radius: {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  },
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md dark:shadow-black/30',
    lg: 'shadow-lg dark:shadow-black/40',
  },

  // مدة الانتقالات (Transitions)
  transition: 'transition-all duration-150 ease-in-out',
};

/* ============================================================================
 * 2) HELPERS — أنماط مشتركة تُستخدم داخل عدة مكونات لتجنب التكرار
 * ============================================================================
 */

// الحلقة الموحّدة عند التركيز (Focus Ring) لكل عناصر الإدخال
const focusRing =
  'focus:outline-none focus:border-primary-500 dark:focus:ring-primary-400/40 dark:focus:border-primary-400';

// الخلفية والحدود الأساسية المشتركة لحقول الإدخال في الوضعين
const fieldSurface =clsx(
  "w-full px-3.5 py-2.5 text-sm",
  "bg-white dark:bg-slate-900",
  "border-b-2 border-slate-300",
  "transition-colors duration-200",
  "text-slate-900 dark:text-slate-100",
  "placeholder:text-slate-400 dark:placeholder:text-slate-500",
  "appearance-none cursor-pointer"
  )

/* ============================================================================
 * 3) THEME OBJECT — الكائن الرئيسي المُصدَّر
 * ============================================================================
 */

export const theme = {
  
  
  /* ---------------------------------------------------------------------
   * 3.1) النصوص العامة (Typography helpers جاهزة للاستخدام في الصفحات)
   * --------------------------------------------------------------------- */
  text: {
    pageTitle: clsx('text-2xl font-bold text-slate-900 dark:text-white'),
    sectionTitle: clsx('text-lg font-semibold text-slate-800 dark:text-slate-100'),
    label: clsx('block text-sm font-medium text-slate-700 dark:text-slate-300'),
    helper: clsx('text-xs text-slate-500 dark:text-slate-400'),
    error: clsx('text-xs font-medium text-red-600 dark:text-red-400'),
    muted: clsx('text-sm text-slate-500 dark:text-slate-400'),
  },
  field: {
    wrapper: clsx('w-full flex flex-col', tokens.spacing.fieldGap),
    label: clsx('block text-sm font-medium text-slate-700 dark:text-slate-300'),
    error: clsx('text-xs font-medium text-red-600 dark:text-red-400'),
  },
  /* ---------------------------------------------------------------------
   * 3.2) Input — حقول نصية / أرقام / إيميل / تاريخ
   * --------------------------------------------------------------------- */
  input: {
    // التنسيق الأساسي (Default state) يُستخدم كقاعدة لكل الحقول
    base: clsx(
      'w-full',
      tokens.spacing.inputPaddingX,
      tokens.spacing.inputPaddingY,
      tokens.radius.sm,
      'text-sm',
      fieldSurface,
      tokens.transition,
      focusRing
    ),
    time: clsx(
      "w-full border rounded-lg p-2 text-sm transition-all focus:outline-none",
      "bg-white border-slate-200 text-slate-900 focus:border-primary-600",
      "dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:border-primary-500 dark:[color-scheme:dark]"
    ),
    // حالة الخطأ — تُدمج فوق base عند وجود error
    error: clsx(
      'border-red-500 dark:border-red-500',
      'focus:ring-red-500/40 focus:border-red-500',
      'dark:focus:ring-red-500/30'
    ),
    // حالة التعطيل
    disabled: clsx(
      'opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800',
      'text-slate-400 dark:text-slate-500'
    ),
    // حالة القراءة فقط (مختلفة عن disabled بصرياً: بلا تعتيم كامل)
    readOnly: clsx(
      'bg-slate-50 dark:bg-slate-800/60 cursor-default',
      'text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
    ),
    // تنسيق مخصص لحقول التاريخ والوقت (date / datetime-local)
    // لإصلاح لون أيقونة التقويم في الوضع الداكن
    dateTime: clsx('[color-scheme:light] dark:[color-scheme:dark]'),
    // حاوية الحقل مع أيقونة (مثال: أيقونة بحث أو عملة داخل الحقل)
    withIconWrapper: clsx('relative'),
    withIcon: "w-full ps-10 pe-4 py-2 border rounded-lg transition-all text-sm focus:outline-none bg-white border-slate-200 text-slate-900 focus:border-primary-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:placeholder-slate-600 dark:focus:border-primary-500",
    icon: clsx(
      'absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3',
      'text-slate-400 dark:text-slate-500 pointer-events-none'
    ),
    iconPaddingStart: clsx('ps-10'), // استخدمها مع base عند وجود أيقونة بداية الحقل
  },
  form: {
    footer: "flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700 pt-4 mt-6"
  },
  /* ---------------------------------------------------------------------
   * 3.3) Select — قائمة منسدلة عادية + Multi-select مع badges
   * --------------------------------------------------------------------- */
  select: {
    base: clsx(
      'w-full appearance-none',
      tokens.spacing.inputPaddingX,
      tokens.spacing.inputPaddingY,
      'pe-9', // مساحة لسهم القائمة
      tokens.radius.sm,
      'text-sm cursor-pointer',
      fieldSurface,
      tokens.transition,
      focusRing
    ),
    error: clsx('border-red-500 dark:border-red-500 focus:ring-red-500/40'),
    disabled: clsx('opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800'),
    // أيقونة السهم (توضع داخل wrapper مع position: relative)
    chevron: clsx(
      'absolute top-1/2 -translate-y-1/2 end-3 pointer-events-none',
      'text-slate-400 dark:text-slate-500'
    ),
    wrapper: clsx('relative'),

    // ----- Multi-select مع badges (يُستخدم غالباً مع مكتبة مثل react-select أو حل مخصص) -----
    multi: {
      // الحاوية الخارجية التي تحتضن البادجات + input البحث
      container: clsx(
        'w-full min-h-[42px] flex flex-wrap items-center gap-1.5',
        tokens.spacing.inputPaddingX,
        'py-1.5',
        tokens.radius.sm,
        fieldSurface,
        tokens.transition,
        'focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500',
        'dark:focus-within:ring-primary-400/40'
      ),
      // شكل البادج الواحد (العنصر المختار)
      badge: clsx(
        'inline-flex items-center gap-1 ps-2.5 pe-1.5 py-1 text-xs font-medium',
        tokens.radius.full,
        'bg-primary-50 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300'
      ),
      badgeRemoveBtn: clsx(
        'hover:bg-primary-100 dark:hover:bg-primary-500/25 rounded-full p-0.5',
        tokens.transition
      ),
      // حقل البحث الداخلي الصغير داخل الحاوية
      searchInput: clsx(
        'flex-1 min-w-[80px] bg-transparent border-none outline-none text-sm',
        'text-slate-900 dark:text-slate-100 placeholder:text-slate-400'
      ),
      // قائمة الخيارات المنسدلة (Dropdown panel)
      panel: clsx(
        'absolute z-20 mt-1 w-full max-h-60 overflow-auto',
        tokens.radius.sm,
        tokens.shadow.lg,
        'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
      ),
      option: clsx(
        'px-3.5 py-2 text-sm cursor-pointer text-slate-700 dark:text-slate-200',
        'hover:bg-slate-50 dark:hover:bg-slate-800'
      ),
      optionSelected: clsx('bg-primary-50 dark:bg-primary-500/10 font-medium'),
    },
  },

  /* ---------------------------------------------------------------------
   * 3.4) Textarea — قابلة للتمدد أو ثابتة الحجم
   * --------------------------------------------------------------------- */
  textarea: {
    base: clsx(
      'w-full',
      tokens.spacing.inputPaddingX,
      tokens.spacing.inputPaddingY,
      tokens.radius.sm,
      'text-sm leading-relaxed',
      fieldSurface,
      tokens.transition,
      focusRing
    ),
    resizable: clsx('resize-y min-h-[100px]'),
    fixed: clsx('resize-none h-32'),
    error: clsx('border-red-500 dark:border-red-500 focus:ring-red-500/40'),
    disabled: clsx('opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-800'),
    // عداد الأحرف الاختياري أسفل الحقل
    counter: clsx('text-xs text-slate-400 dark:text-slate-500 text-end mt-1'),
  },

  /* ---------------------------------------------------------------------
   * 3.5) Checkbox & Radio — تنسيقات مخصصة بديلة عن الافتراضي
   * --------------------------------------------------------------------- */
  checkboxCard: {
    base: "flex items-center gap-3 p-3 rounded-xl border select-none cursor-pointer transition-all bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700 dark:hover:bg-slate-800",
    title: "font-semibold text-slate-900 dark:text-slate-100",
    description: "text-slate-500 dark:text-slate-400"
  },
  checkbox: {
    base: "w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 transition-all dark:border-slate-600 dark:bg-slate-900",
    wrapper: clsx('flex items-center gap-2 cursor-pointer select-none'),
    input: clsx(
      'h-4 w-4 rounded border-slate-300 dark:border-slate-600',
      'text-primary-600 dark:text-primary-500',
      'bg-white dark:bg-slate-800',
      'focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-0',
      'dark:focus:ring-primary-400/30',
      'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
    ),
    label: clsx('text-sm text-slate-700 dark:text-slate-300'),
    error: clsx('border-red-500 dark:border-red-500'),
  },

  radio: {
    wrapper: clsx('flex items-center gap-2 cursor-pointer select-none'),
    input: clsx(
      'h-4 w-4 border-slate-300 dark:border-slate-600',
      'text-primary-600 dark:text-primary-500',
      'bg-white dark:bg-slate-800',
      'focus:ring-2 focus:ring-primary-500/40',
      'dark:focus:ring-primary-400/30',
      'cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
      // ملاحظة: shape دائري يأتي تلقائياً من type="radio" في Tailwind forms plugin
    ),
    label: clsx('text-sm text-slate-700 dark:text-slate-300'),
  },

  /* ---------------------------------------------------------------------
   * 3.6) Toggle Switch — مفتاح التبديل (On / Off)
   * --------------------------------------------------------------------- */
  toggle: {
      base: "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none overflow-hidden",
      active: "bg-primary-600 dark:bg-primary-500",
      inactive: "bg-slate-200 dark:bg-slate-700",
      disabled: "opacity-50 cursor-not-allowed",
      thumb: "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
    },
  switch: {
    // الحاوية الخارجية (label) — استخدم state عبر aria أو data attribute في الكومبوننت
    wrapper: clsx('inline-flex items-center gap-2.5 cursor-pointer select-none'),
    // المسار (Track) — مرر شرط checked/unchecked من الكومبوننت عبر clsx خارجياً
    track: {
      base: clsx(
        'relative inline-flex h-6 w-11 items-center rounded-full',
        tokens.transition,
        'focus-within:ring-2 focus-within:ring-primary-500/40'
      ),
      on: clsx('bg-primary-600 dark:bg-primary-500'),
      off: clsx('bg-slate-300 dark:bg-slate-700'),
      disabled: clsx('opacity-50 cursor-not-allowed'),
    },
    // الدائرة المتحركة (Thumb)
    thumb: {
      base: clsx(
        'inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow',
        tokens.transition
      ),
      on: clsx('translate-x-6 rtl:-translate-x-6'),
      off: clsx('translate-x-1 rtl:-translate-x-1'),
    },
    label: clsx('text-sm text-slate-700 dark:text-slate-300'),
  },

  /* ---------------------------------------------------------------------
   * 3.7) File Dropzone — حاوية رفع الملفات بحدود متقطعة
   * --------------------------------------------------------------------- */
  dropzone: {
    base: clsx(
      'flex flex-col items-center justify-center text-center',
      'border-2 border-dashed rounded-lg',
      'border-slate-300 dark:border-slate-700',
      'bg-slate-50/50 dark:bg-slate-900/40',
      'px-6 py-10',
      tokens.transition,
      'cursor-pointer'
    ),
    // حالة السحب فوق المنطقة (Drag-over)
    active: clsx('border-primary-500 bg-primary-50 dark:bg-primary-500/10'),
    error: clsx('border-red-400 bg-red-50/50 dark:bg-red-500/10'),
    disabled: clsx('opacity-50 cursor-not-allowed'),
    icon: clsx('h-9 w-9 text-slate-400 dark:text-slate-500 mb-2'),
    title: clsx('text-sm font-medium text-slate-700 dark:text-slate-300'),
    subtitle: clsx('text-xs text-slate-400 dark:text-slate-500 mt-1'),
    // قائمة الملفات المرفوعة (preview list)
    fileItem: clsx(
      'flex items-center justify-between gap-3 px-3 py-2 mt-2 rounded-md',
      'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm'
    ),
    fileRemoveBtn: clsx(
      'text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400',
      tokens.transition
    ),
  },

  /* ---------------------------------------------------------------------
   * 3.8) Rich Text Wrapper — حاوية محرر نصوص غني (مثل Tiptap / Quill)
   * --------------------------------------------------------------------- */
  richText: {
    wrapper: clsx(
      tokens.radius.sm,
      'border border-slate-300 dark:border-slate-700 overflow-hidden',
      'focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500',
      tokens.transition
    ),
    toolbar: clsx(
      'flex flex-wrap items-center gap-1 px-2 py-1.5',
      'bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700'
    ),
    toolbarBtn: clsx(
      'h-8 w-8 inline-flex items-center justify-center rounded',
      'text-slate-600 dark:text-slate-300',
      'hover:bg-slate-200 dark:hover:bg-slate-700',
      tokens.transition
    ),
    toolbarBtnActive: clsx('bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300'),
    editor: clsx(
      'min-h-[160px] px-4 py-3 text-sm leading-relaxed',
      'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100',
      'prose prose-sm dark:prose-invert max-w-none focus:outline-none'
    ),
    error: clsx('border-red-500 dark:border-red-500'),
  },
kanban: {
  column: {
    container: "flex flex-col border-t-4 rounded-xl bg-slate-100 dark:bg-slate-800 p-4 h-full overflow-hidden",
    containerBorder:{
      "pending":"border-amber-500",
      "in_progress":"border-sky-500",
      "completed":"border-emerald-500",
      "skipped":"border-rose-500",
    },
    header: "font-bold p-2 capitalize flex items-center justify-between rounded-xl",
    headerText:{
      "pending":"bg-amber-500 text-slate-700 dark:text-slate-200",
      "in_progress":"bg-sky-500 text-slate-700 dark:text-slate-200",
      "completed":"bg-emerald-500 text-slate-700 dark:text-slate-200",
      "skipped":"bg-rose-500 text-slate-700 dark:text-slate-200",
    },
    list: "flex-1 overflow-auto space-y-3 pt-2 scrollbar-thin",
    backlog: { border: "border-t-slate-400", bg: "bg-slate-50" },
    
    review: { border: "border-t-purple-500", bg: "bg-purple-50/50" },
    done: { border: "border-t-emerald-500", bg: "bg-emerald-50/50" },
    pending:      { border: "border border-l-4 border-t-1 border-l-amber-500 border-t-amber-500", bg: "bg-pink-500", hover:"hover:bg-rose-500 hover:border-l-4 hover: border-l-pink-900" },
    in_progress:  { border: "border border-l-4 border-l-sky-500 border-t-sky-500", bg: "bg-teal-500", hover:"hover:bg-cyan-500" },
    completed:    { border: "border border-l-4 border-l-emerald-500 border-t-emerald-500", bg: "bg-emerald-500", hover:"hover:bg-emerald-900" },
    skipped:      { border: "border border-l-4 border-l-rose-500 border-t-rose-500", bg: "bg-amber-500", hover:"hover:bg-amber-900" },

  }
},
  /* ---------------------------------------------------------------------
   * 3.9) Button — موحّد لكل الأزرار (مفيد لتطابق التصميم مع النماذج)
   * --------------------------------------------------------------------- */
  
  button: {
    base: clsx(
      'inline-flex items-center justify-center gap-2',
      'px-4 py-2.5 text-sm font-medium',
      tokens.radius.sm,
      tokens.transition,
      'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
      'disabled:opacity-50 disabled:cursor-not-allowed'
    ),
    primary: clsx(
      'bg-primary-600 text-white hover:bg-primary-700',
      'focus:ring-primary-500 dark:bg-primary-500 dark:hover:bg-primary-600'
    ),
    secondary: clsx(
      'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
      'dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-700',
      'focus:ring-slate-400'
    ),
    danger: clsx(
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      'dark:bg-red-500 dark:hover:bg-red-600'
    ),
    ghost: clsx(
      'bg-transparent text-slate-600 hover:bg-slate-100',
      'dark:text-slate-300 dark:hover:bg-slate-800 focus:ring-slate-400'
    ),
    icon: "w-3.5 h-3.5",
    iconAction: "p-2 rounded-lg transition-all duration-200 text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40",
    iconAbsolute: "absolute start-auto end-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-primary-600 transition-colors",
    iconHint: "text-slate-400 hover:text-primary-600 transition-colors",
    selectTrigger: "w-full ps-10 pe-3 py-2 border rounded-lg shadow-sm flex items-center justify-between text-sm transition-all bg-white border-slate-300 hover:bg-slate-50 text-slate-900 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-white",
    ghostAction: "text-[10px] text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 underline mt-1 block w-fit ms-auto",
    variants: {
      primary: "text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-950/40",
      blue: "text-blue-500 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40",
      danger: "text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
    },
  },

  /* ---------------------------------------------------------------------
   * 3.10) Card — حاوية المحتوى الأساسية في لوحة التحكم
   * --------------------------------------------------------------------- */
  card: {
    base: clsx(
      'bg-white dark:bg-slate-900',
      'border border-slate-200 dark:border-slate-800',
      tokens.radius.md,
      tokens.shadow.sm,
      tokens.spacing.cardPadding
    ),
    header: clsx(
      'flex items-center justify-between pb-4 mb-4',
      'border-b border-slate-100 dark:border-slate-800'
    ),
  },

  /* ---------------------------------------------------------------------
   * 3.11) Badge — وسوم الحالة (مفيدة لعرض حالة المهام/الأدوار الوظيفية)
   * --------------------------------------------------------------------- */
  badge: {
    base: clsx(
      'inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium',
      tokens.radius.full
    ),
    success: clsx('bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400'),
    warning: clsx('bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'),
    danger: clsx('bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400'),
    info: clsx('bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400'),
    neutral: clsx('bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'),
    action: "text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 ms-1 border text-primary-600 bg-primary-50 border-primary-100 dark:text-primary-400 dark:bg-primary-950/50 dark:border-primary-900/50"
  },
  status: {
    toggle: {
      base: "flex items-center gap-1.5 text-xs font-semibold transition-colors",
      active: "text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300",
      inactive: "text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
    },
    variants: {
      completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400",
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400",
      overdue: "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-400",
      active: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400",
      default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
    },
  },
  pagination: {
    container: "flex items-center justify-between p-4 bg-slate-50 border-t border-slate-100 text-xs sm:text-sm dark:bg-slate-900 dark:border-slate-800",
    button: "flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 text-slate-700 font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700",
    info: "text-slate-500 font-semibold dark:text-slate-400"
  },
  modal: {
    footer: "mt-5 pt-3 border-t border-slate-100 dark:border-slate-800"
  },
  tabs: {
    filter: {
      base: "px-3.5 py-1.5 text-xs font-semibold rounded-lg border whitespace-nowrap transition-all duration-150",
      inactive: "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800",
      active: "bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-900 shadow-sm"
    },
    base: "px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2 border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200",
    active: "border-primary-600 text-primary-600 dark:border-primary-500 dark:text-primary-500",
  },
  alert: {
    // الحالة المعلوماتية (إرشادات وقواعد)
    info: "p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300",
    
    // حالة النجاح (تأكيد إجراء)
    success: "p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300",
    
    // حالة التحذير (تنبيهات مهمة)
    warning: "p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300",
    
    // حالة الخطأ (رسائل الفشل)
    danger: "p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300",
    bonus: "p-3 bg-violet-50 border border-violet-200 rounded-xl text-sm text-violet-700 dark:bg-violet-900/20 dark:border-violet-800 dark:text-violet-300",
  },
  emptyState: {
    base: "flex flex-col items-center justify-center py-8 text-center space-y-2",
    icon: "p-3 bg-slate-50 rounded-full dark:bg-slate-800",
    text: "text-sm text-slate-400 font-medium"
  },
  list: {
    item: {
      base: "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
      idle: "border-slate-100 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700",
      selected: "border-primary-300 bg-primary-50/60 dark:bg-primary-900/20 dark:border-primary-800"
    },
    draggableItem: "flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white dark:bg-slate-800 cursor-grab active:cursor-grabbing hover:shadow-sm transition-all"
  }
};

/* ============================================================================
 * 4) FIELD STATE RESOLVER — دالة مساعدة لتحديد التنسيق النهائي حسب الحالة
 * ============================================================================
 * تستخدم لتفادي تكرار شروط if/else داخل كل مكون. مثال الاستخدام:
 *
 *   const cls = resolveFieldState(theme.input, { error, disabled, readOnly });
 *   <input className={cls} />
 */
export function resolveFieldState(fieldTheme, { error, disabled, readOnly } = {}) {
  return clsx(
    fieldTheme.base,
    error && fieldTheme.error,
    disabled && fieldTheme.disabled,
    readOnly && fieldTheme.readOnly
  );
}

/**
 * تقوم بدمج التنسيق الأساسي مع حالة التفعيل للتبويبات.
 * @param {string} baseStyle - التنسيق الأساسي للتبويب (من الثيم).
 * @param {boolean} isActive - حالة التفعيل.
 * @param {string} activeStyle - التنسيق الخاص بالتبويب النشط.
 * @returns {string} - الكلاسات النهائية المدمجة.
 */
export function resolveTabState (baseStyle, isActive, activeStyle) {
  return isActive 
    ? `${baseStyle} ${activeStyle}` 
    : baseStyle;
};

/**
 * تقوم بإرجاع الكلاسات الخاصة بالحالة بناءً على نظام الثيم الموحد.
 * @param {string} status - الحالة (مثلاً: 'completed', 'pending', 'overdue').
 * @param {object} theme - كائن الثيم الخاص بك.
 * @returns {string} - الكلاسات النهائية.
 */
export function resolveStatusState(status, theme) {
  const base = "px-2 py-1 text-[10px] font-bold uppercase rounded-full flex items-center justify-center w-fit";
  const variants = theme.status.variants; // سنعرفها في الأسفل

  return `${base} ${variants[status] || variants.default}`;
};

/**
 * ترجع التنسيق الخاص بالتنبيه بناءً على النوع.
 * @param {'info'|'success'|'warning'|'danger'} type 
 * @param {object} theme 
 */
export const resolveAlertState = (type, theme) => {
  return theme.alert[type] || theme.alert.info;
};
export const resolveListItemState = (itemTheme, { isSelected }) => {
  return `${itemTheme.base} ${isSelected ? itemTheme.selected : itemTheme.idle}`;
};
export default theme;
