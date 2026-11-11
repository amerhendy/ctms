// 1. التعريفات الأساسية للـ Types (Values المستخدمة في الـ Database / API)
import React from 'react'

// 1. أنواع الأسئلة
export const QUESTION_TYPES = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  SELECT_ALL: 'select_all',
  INLINE_DROPDOWN: 'inline_dropdown',
  PROOFREADING: 'proofreading',
  ORDERING: 'ordering',
  MATCHING: 'matching',
  SJT: 'sjt',
  TRUE_FALSE_JUSTIFY: 'true_false_justify',
  FILE_UPLOAD: 'file_upload',
  EXCEL_GRID: 'excel_grid',
  IMAGE_TO_EXCEL: 'image_to_excel',
  IMAGE_TO_WORD: 'image_to_word',
  SUMMARIZE_WORD: 'summarize_word',
  MATH_FORMULA: 'math_formula',
}

// 2. النصوص الخاصة بكل نوع (Labels)
export const QUESTION_TYPE_LABELS = {
  [QUESTION_TYPES.SINGLE_CHOICE]: 'اختيار عنصر واحد',
  [QUESTION_TYPES.MULTIPLE_CHOICE]: 'اختيار أكثر من عنصر',
  [QUESTION_TYPES.SELECT_ALL]: 'اختيار الكل',
  [QUESTION_TYPES.INLINE_DROPDOWN]: 'قائمة منسدلة داخل النص (Cloze)',
  [QUESTION_TYPES.PROOFREADING]: 'تدقيق وتصحيح الأخطاء (Proofreading)',
  [QUESTION_TYPES.ORDERING]: 'ترتيب العناصر',
  [QUESTION_TYPES.MATCHING]: 'المطابقة والربط',
  [QUESTION_TYPES.SJT]: 'مواقف ومحاكاة إدارية (SJT)',
  [QUESTION_TYPES.TRUE_FALSE_JUSTIFY]: 'صواب / خطأ مع التعليل',
  [QUESTION_TYPES.FILE_UPLOAD]: 'رفع ملف',
  [QUESTION_TYPES.EXCEL_GRID]: 'جدول محاكاة إكسل',
  [QUESTION_TYPES.IMAGE_TO_EXCEL]: 'تفريغ صورة إلى إكسل',
  [QUESTION_TYPES.IMAGE_TO_WORD]: 'تفريغ صورة إلى وورد',
  [QUESTION_TYPES.SUMMARIZE_WORD]: 'تلخيص فقرة بـ وورد',
  [QUESTION_TYPES.MATH_FORMULA]: 'معادلة حسابية / ناتج',
}

// 3. الأيقونات لكل نوع (Unicode Emojis / React Icons Meta)
export const QUESTION_TYPE_ICONS = {
  [QUESTION_TYPES.SINGLE_CHOICE]: '🔘',
  [QUESTION_TYPES.MULTIPLE_CHOICE]: '☑️',
  [QUESTION_TYPES.SELECT_ALL]: '✅',
  [QUESTION_TYPES.INLINE_DROPDOWN]: '🔽',
  [QUESTION_TYPES.PROOFREADING]: '🔍',
  [QUESTION_TYPES.ORDERING]: '🔢',
  [QUESTION_TYPES.MATCHING]: '🔗',
  [QUESTION_TYPES.SJT]: '👔',
  [QUESTION_TYPES.TRUE_FALSE_JUSTIFY]: '⚖️',
  [QUESTION_TYPES.FILE_UPLOAD]: '📁',
  [QUESTION_TYPES.EXCEL_GRID]: '📊',
  [QUESTION_TYPES.IMAGE_TO_EXCEL]: '🖼️➡️📊',
  [QUESTION_TYPES.IMAGE_TO_WORD]: '🖼️➡️📝',
  [QUESTION_TYPES.SUMMARIZE_WORD]: '📄',
  [QUESTION_TYPES.MATH_FORMULA]: '🧮',
}

// 4. الألوان المميزة لكل نوع (Tailwind CSS Classes)
export const QUESTION_TYPE_COLORS = {
  [QUESTION_TYPES.SINGLE_CHOICE]: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300',
  },
  [QUESTION_TYPES.MULTIPLE_CHOICE]: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300',
  },
  [QUESTION_TYPES.SELECT_ALL]: {
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300',
  },
  [QUESTION_TYPES.INLINE_DROPDOWN]: {
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    text: 'text-sky-600 dark:text-sky-400',
    border: 'border-sky-200 dark:border-sky-800',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/60 dark:text-sky-300',
  },
  [QUESTION_TYPES.PROOFREADING]: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300',
  },
  [QUESTION_TYPES.ORDERING]: {
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300',
  },
  [QUESTION_TYPES.MATCHING]: {
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
    badge: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300',
  },
  [QUESTION_TYPES.SJT]: {
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300',
  },
  [QUESTION_TYPES.TRUE_FALSE_JUSTIFY]: {
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300',
  },
  [QUESTION_TYPES.FILE_UPLOAD]: {
    bg: 'bg-slate-50 dark:bg-slate-800/60',
    text: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
    badge: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  },
  [QUESTION_TYPES.EXCEL_GRID]: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
  },
  [QUESTION_TYPES.IMAGE_TO_EXCEL]: {
    bg: 'bg-green-50 dark:bg-green-950/40',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300',
  },
  [QUESTION_TYPES.IMAGE_TO_WORD]: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/40',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800',
    badge: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300',
  },
  [QUESTION_TYPES.SUMMARIZE_WORD]: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    badge: 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-100',
  },
  [QUESTION_TYPES.MATH_FORMULA]: {
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40',
    text: 'text-fuchsia-600 dark:text-fuchsia-400',
    border: 'border-fuchsia-200 dark:border-fuchsia-800',
    badge: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/60 dark:text-fuchsia-300',
  },
}

// 5. خيارات القوائم المنسدلة المحدثة بالأيقونات والألوان
export const QUESTION_TYPE_OPTIONS = Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
  icon: QUESTION_TYPE_ICONS[value],
  colors: QUESTION_TYPE_COLORS[value],
}))
export const APPLICANT_STATUS_LABELS = {
  pending: 'لم يبدأ',
  in_progress: 'جاري الاختبار',
  finished: 'منتهي',
}

export const SYNC_INTERVAL_MS = 15000

export const APPLICANT_STORAGE_KEY = 'exam_system_applicant_state_v1'
export const EXAM_STORAGE_KEY='exam_system_v1_'
export const TABS = [
  { key: 'results', label: 'النتائج' },
  { key: 'applicants', label: 'إضافة متقدم' },
  { key: 'questions', label: 'إدارة الأسئلة' },
  { key: 'job-models', label: 'نماذج الوظائف' },
]
export const SYNC_LABELS = {
  idle: { text: 'متصل', className: 'bg-white/15 text-white' },
  ok: { text: 'متصل', className: 'bg-white/15 text-white' },
  syncing: { text: 'جاري الحفظ...', className: 'bg-amber-400 text-slate-900 font-semibold' },
  offline: { text: 'غير متصل - سيتم الحفظ عند عودة الاتصال', className: 'bg-red-500 text-white' },
  error: { text: 'تعذر حفظ بعض الإجابات، سيُعاد المحاولة', className: 'bg-red-500 text-white' },
}