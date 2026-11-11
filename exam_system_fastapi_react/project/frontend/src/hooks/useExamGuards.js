import { useEffect } from 'react'

import { SYNC_INTERVAL_MS } from '../constants'
import { useExamStore } from '../stores/examStore'

/** مزامنة دورية كل 15 ثانية + عند عودة الاتصال بالشبكة (تتوقف فور انتهاء الاختبار). */
export function useSyncLoop() {
  const syncNow = useExamStore((s) => s.syncNow)
  const token = useExamStore((s) => s.token)
  const finished = useExamStore((s) => s.finished)

  useEffect(() => {
    // لا داعي لتشغيل الحلقة إذا لم يكن الطالب مسجلاً الدخول أو إذا انتهى الامتحان
    if (!token || finished) return

    const interval = setInterval(() => {
      syncNow()
    }, SYNC_INTERVAL_MS)

    const handleOnline = () => syncNow()

    window.addEventListener('online', handleOnline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
    }
  }, [syncNow, token, finished])
}

/** كشف مخالفات أثناء أداء الاختبار مع حماية من التكرار المزدوج. */
export function useViolationDetectors() {
  const logViolation = useExamStore((s) => s.logViolation)
  const finished = useExamStore((s) => s.finished)
  const token = useExamStore((s) => s.token)

  useEffect(() => {
    if (!token || finished) return

    let lastViolationTime = 0

    // لمنع تسجيل أكثر من مخالفة في نفس الثانية (مثل blur مع visibilitychange)
    const safeLog = (type, message) => {
      const now = Date.now()
      if (now - lastViolationTime > 1000) {
        lastViolationTime = now
        logViolation(type, message)
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        safeLog('tab_switch', 'تم تبديل النافذة أو التبويب')
      }
    }

    function onBlur() {
      const activeEl = document.activeElement
      const tagName = activeEl?.tagName?.toUpperCase()
      const inputType = activeEl?.type?.toLowerCase()

      // 🟢 تجنب احتساب المخالفة إذا كان فقدان التركيز بسب:
      // 1. فتح نافذة اختيار ملف (Input File)
      if (tagName === 'INPUT' && inputType === 'file') return

      // 2. التفاعل مع قائمة منسدلة (Select)
      if (tagName === 'SELECT') return

      // 3. إذا كانت الصفحة مخفية بالفعل (تعتبر tab_switch لعدم التكرار)
      if (!document.hidden) {
        safeLog('window_blur', 'فقد التركيز عن نافذة الاختبار')
      }
    }

    function onCopy(e) {
      e.preventDefault()
      safeLog('copy_paste', 'محاولة نسخ محتوى')
    }

    function onPaste(e) {
      e.preventDefault()
      safeLog('copy_paste', 'محاولة لصق محتوى')
    }

    function onContextMenu(e) {
      e.preventDefault()
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('blur', onBlur)
    document.addEventListener('copy', onCopy)
    document.addEventListener('paste', onPaste)
    document.addEventListener('contextmenu', onContextMenu)

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [logViolation, token, finished])
}