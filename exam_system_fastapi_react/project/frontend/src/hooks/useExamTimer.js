import { useEffect, useRef, useState } from 'react'

/**
 * هوك عداد تنازلي لوقت الاختبار، يعتمد على وقت بدء الاختبار الفعلي القادم
 * من الخادم (وليس عداداً محلياً بحتاً) لتفادي التلاعب بالوقت من المتصفح.
 */
export function useExamTimer(startedAt, durationMinutes, onExpire) {
  const [remainingSeconds, setRemainingSeconds] = useState(null)
  const expiredRef = useRef(false)

  useEffect(() => {
    if (!startedAt) return undefined

    const startTime = new Date(startedAt.endsWith('Z') ? startedAt : `${startedAt}Z`).getTime()
    const endTime = startTime + durationMinutes * 60 * 1000

    function tick() {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
      setRemainingSeconds(remaining)
      if (remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true
        onExpire?.()
      }
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [startedAt, durationMinutes, onExpire])

  const minutes = remainingSeconds !== null ? Math.floor(remainingSeconds / 60) : 0
  const seconds = remainingSeconds !== null ? remainingSeconds % 60 : 0
  const display = remainingSeconds !== null
    ? `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : '--:--'

  return { remainingSeconds, display, isWarning: remainingSeconds !== null && remainingSeconds <= 60 }
}
