// src/components/tasks/TaskTimerControl.jsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Play, Square, Clock, Users, User as UserIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { taskTimeLogApi } from '@/api' 
import useAuthStore from '@/stores/authStore'

import { theme, resolveFieldState } from '@/constants/theme';
export default function TaskTimerControl({ taskId, canChangeStatus }) {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  
  // أبقينا فقط على الـ State الفردية للعداد الحي
  const [seconds, setSeconds] = useState(0)

  // 1. جلب سجل الأوقات بالكامل لهذه المهمة
  const { data: response, isLoading } = useQuery({
    queryKey: ['task-time-logs-timer', taskId],
    queryFn: () => taskTimeLogApi.getTimeLogs(taskId),
    enabled: !!taskId,
  })

  // تأمين استخراج المصفوفة من Axios
  const logsList = Array.isArray(response) 
    ? response 
    : (Array.isArray(response?.data) ? response.data : [])

  // 2. استخراج السجل النشط للمستخدم الحالي
  const activeLog = logsList.find(log => log.stopped_at === null && log.user_id === user?.id)
  const isRunning = !!activeLog

  // دالة مساعدة لتأمين صيغة التوقيت للمتصفحات
  const parseServerDate = (dateString) => {
    if (!dateString) return 0
    let secureString = dateString
    if (!secureString.endsWith('Z') && !secureString.includes('+')) {
      secureString = `${secureString}Z`
    }
    return new Date(secureString).getTime()
  }

  // ==========================================
  // [الحل السحري] اشتقاق الحسابات مباشرة أثناء الرندر بدلاً من الـ State
  // ==========================================
  const userMap = {}
  let totalStaticSeconds = 0

  logsList.forEach(log => {
    let logDuration = 0
    if (log.started_at && log.stopped_at) {
      logDuration = Math.floor((parseServerDate(log.stopped_at) - parseServerDate(log.started_at)) / 1000)
    } else if (log.started_at && log.stopped_at === null && log.user_id !== user?.id) {
      // وقت الزميل الذي يعمل حالياً حتى هذه اللحظة
      logDuration = Math.floor((new Date().getTime() - parseServerDate(log.started_at)) / 1000)
    }

    if (!userMap[log.user_id]) {
      userMap[log.user_id] = {
        userName: log.user_name || "مستخدم غير معروف",
        totalSeconds: 0,
        isCurrentlyActive: log.stopped_at === null
      }
    }
    userMap[log.user_id].totalSeconds += Math.max(0, logDuration)

    // تجميع الوقت الثابت للفريق (باستثناء الفترات الحية للمستخدم الحالي)
    if (log.stopped_at !== null || log.user_id !== user?.id) {
      totalStaticSeconds += Math.max(0, logDuration)
    }
  })

  const teamSummary = Object.values(userMap)
  // ==========================================

  // 3. الـ useEffect هنا مسؤولة "فقط" عن تحديث العداد الحي بكل ثانية وثباته عند الريفرش
  useEffect(() => {
    let interval = null

    if (isRunning && activeLog?.started_at) {
      const calculateElapsed = () => {
        const start = parseServerDate(activeLog.started_at)
        const now = new Date().getTime()
        const diffInSeconds = Math.floor((now - start) / 1000)
        setSeconds(Math.max(0, diffInSeconds))
      }

      calculateElapsed()
      interval = setInterval(calculateElapsed, 1000)
    } 
    else if (!isRunning && logsList.length > 0) {
      const lastClosedLog = logsList.find(log => log.stopped_at !== null && log.user_id === user?.id)
      if (lastClosedLog) {
        const start = parseServerDate(lastClosedLog.started_at)
        const stop = parseServerDate(lastClosedLog.stopped_at)
        setSeconds(Math.max(0, Math.floor((stop - start) / 1000)))
      } else {
        setSeconds(0)
      }
    }

    return () => clearInterval(interval)
  }, [isRunning, activeLog, logsList, user?.id])

  // 4. Mutations التحكم بالعداد
  const startTimer = useMutation({
    mutationFn: (note) => taskTimeLogApi.startTimeLog(taskId, note),
    onSuccess: () => {
      toast.success('تم تشغيل عداد الوقت بنجاح، بالتوفيق!')
      setSeconds(0) 
      qc.invalidateQueries(['task-time-logs-timer', taskId])
      qc.invalidateQueries(['task-time-logs', taskId])
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'فشل تشغيل العداد'),
  })

  const stopTimer = useMutation({
    mutationFn: () => taskTimeLogApi.stopTimeLog(taskId),
    onSuccess: () => {
      toast.success('تم إيقاف العداد وحفظ وقت العمل الفعلي')
      qc.invalidateQueries(['task-time-logs-timer', taskId])
      qc.invalidateQueries(['task-time-logs', taskId])
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'فشل إيقاف العداد'),
  })

  const formatTime = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, '0')
    const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0')
    const secs = (totalSecs % 60).toString().padStart(2, '0')
    return `${hrs}:${mins}:${secs}`
  }

  if (isLoading) return <div className="text-center py-2 text-xs text-gray-400">جاري تحميل المؤقت...</div>
  if (!canChangeStatus) return null 

  return (
    <div className={clsx("flex flex-col gap-4 text-right p-5 rounded-xl border", theme.card.base)}>
      
      <div className="grid grid-cols-2 gap-3">
        {/* مؤقت المستخدم الحالي */}
        <div className="flex flex-col gap-1.5">
          <span className={clsx("text-xs font-bold flex items-center gap-1.5 justify-end", theme.text.muted)}>
            {isRunning && <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
            مؤقتك الفعلي
            <UserIcon className="w-3.5 h-3.5 text-gray-400" />
          </span>
          <div className={clsx(
            "text-xl font-mono font-bold text-center py-2.5 rounded-lg border transition-colors",
            isRunning 
              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
              : clsx(theme.card.subtle, theme.text.muted)
          )}>
            {formatTime(seconds)}
          </div>
        </div>

        {/* الإجمالي العام للمهمة (متزامن بعبقرية) */}
        <div className="flex flex-col gap-1.5">
          <span className={clsx("text-xs font-bold flex items-center gap-1.5 justify-end", theme.text.muted)}>
            إجمالي عمل الفريق
            <Clock className="w-3.5 h-3.5 text-gray-400" />
          </span>
          <div className={clsx(
              "text-xl font-mono font-bold text-center py-2.5 rounded-lg border transition-colors",
              isRunning 
                ? "bg-blue-50 text-blue-700 border-blue-100" 
                : clsx(theme.card.subtle, theme.text.secondary)
            )}>
            {formatTime(totalStaticSeconds + (isRunning ? seconds : 0))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={() => {
              const userNote = prompt("أدخل ملاحظة للعمل (اختياري):")
              startTimer.mutate(userNote || null)
            }} 
            disabled={startTimer.isPending}
            className={clsx(theme.button.base, "bg-emerald-600 text-white hover:bg-emerald-700 w-full justify-center")}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{startTimer.isPending ? 'جاري البدء...' : 'بدء عداد الوقت'}</span>
          </button>
        ) : (
          <button
            onClick={() => stopTimer.mutate()}
            disabled={stopTimer.isPending}
            className={clsx(theme.button.base, "bg-rose-600 text-white hover:bg-rose-700 w-full justify-center")}
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>{stopTimer.isPending ? 'جاري الإيقاف...' : 'إيقاف وحفظ الوقت'}</span>
          </button>
        )}
      </div>

      {/* لوحة تفاصيل الموظفين في الأسفل */}
      {teamSummary.length > 0 && (
        <div className="mt-2 border-t border-gray-200/60 pt-3">
          <span className={clsx("text-xs font-bold flex items-center gap-1.5 justify-end mb-2", theme.text.muted)}>
            تفاصيل ساعات الشركاء
            <Users className="w-3.5 h-3.5" />
          </span>
          <div className={clsx("rounded-lg overflow-hidden border divide-y", theme.card.subtle)}>
            {teamSummary.map((member) => (
              <div key={member.userName} className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-1.5">
                  <span className={clsx("font-mono font-semibold", theme.text.secondary)}>
                    {formatTime(member.totalSeconds + (member.isCurrentlyActive && member.userName === user?.full_name ? seconds : 0))}
                  </span>
                  {member.isCurrentlyActive && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-md animate-pulse">يعمل الآن</span>
                  )}
                </div>
                <span className={clsx("font-medium", theme.text.primary)}>
                  {member.userName} {member.userName === user?.full_name && "(أنت)"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}