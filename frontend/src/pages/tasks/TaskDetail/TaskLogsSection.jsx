// src/components/tasks/TaskLogsSection.jsx
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { History, User, FileText, CheckCircle, XCircle, Edit, Trash2, Share2, UserPlus, UserMinus, AlertTriangle, Clock, Download, Loader2, ArrowDownCircle } from 'lucide-react'
import { tasksApi } from '@/api'
import { formatDateTime, ACTION_LABELS } from '@/utils/helpers'

const actionIcons = {
  created: <FileText className="w-3.5 h-3.5" />,
  edited: <Edit className="w-3.5 h-3.5" />,
  deleted: <Trash2 className="w-3.5 h-3.5" />,
  assigned: <UserPlus className="w-3.5 h-3.5" />,
  unassigned: <UserMinus className="w-3.5 h-3.5" />,
  share_granted: <Share2 className="w-3.5 h-3.5" />,
  share_revoked: <Share2 className="w-3.5 h-3.5" />,
  step_added: <CheckCircle className="w-3.5 h-3.5" />,
  step_completed: <CheckCircle className="w-3.5 h-3.5" />,
  step_deleted: <Trash2 className="w-3.5 h-3.5" />,
  urgent_requested: <AlertTriangle className="w-3.5 h-3.5" />,
  urgent_approved: <CheckCircle className="w-3.5 h-3.5" />,
  urgent_rejected: <XCircle className="w-3.5 h-3.5" />,
  transferred: <Clock className="w-3.5 h-3.5" />,
  task_transferred: <Clock className="w-3.5 h-3.5" />,
  attachment_added: <Download className="w-3.5 h-3.5" />,
  attachment_deleted: <Trash2 className="w-3.5 h-3.5" />,
  comment_added: <FileText className="w-3.5 h-3.5" />,
  comment_updated: <Edit className="w-3.5 h-3.5" />,
  comment_deleted: <Trash2 className="w-3.5 h-3.5" />,
  time_log_started: <Clock className="w-3.5 h-3.5" />,
  time_log_stopped: <Clock className="w-3.5 h-3.5" />,
  default: <History className="w-3.5 h-3.5" />,
}

export default function TaskLogsSection({ taskId, taskPermissions }) {
  const [logsPage, setLogsPage] = useState(1)
  const [allLogs, setAllLogs] = useState([])

  const { data: logsPaginationData, isLoading } = useQuery({
    queryKey: ['task-logs', taskId, { logsPage }],
    queryFn: () => tasksApi.getLogs(taskId, { page: logsPage, limit: 20 }).then(r => r.data),
    enabled: !!taskId,
    placeholderData: (keepPreviousData) => keepPreviousData,
  })

  const totalLogs = logsPaginationData?.total || 0
  const hasMoreLogs = logsPaginationData?.has_more ?? false

  useEffect(() => {
    if (logsPaginationData?.items) {
      if (logsPage === 1) {
        setAllLogs(logsPaginationData.items)
      } else {
        setAllLogs(prev => {
          const existingIds = new Set(prev.map(item => item.id))
          const newItems = logsPaginationData.items.filter(item => !existingIds.has(item.id))
          return [...prev, ...newItems]
        })
      }
    }
  }, [logsPaginationData, logsPage])

  const getActionLabel = (actionType) => {
    return ACTION_LABELS?.[actionType] || actionType?.replace(/_/g, ' ') || 'تحديث للنظام'
  }

  const getActionIcon = (actionType) => {
    return actionIcons[actionType] || actionIcons.default
  }

  const getLogStyle = (actionType) => {
    if (['deleted', 'unassigned', 'urgent_rejected', 'step_deleted', 'attachment_deleted', 'comment_deleted'].includes(actionType)) {
      return { border: 'border-r-red-500', text: 'text-red-600', dot: 'bg-red-500 ring-red-100' }
    }
    if (['created', 'urgent_approved', 'step_completed'].includes(actionType)) {
      return { border: 'border-r-green-500', text: 'text-green-600', dot: 'bg-green-600 ring-green-100' }
    }
    if (['urgent_requested', 'transferred', 'task_transferred'].includes(actionType)) {
      return { border: 'border-r-amber-500', text: 'text-amber-600', dot: 'bg-amber-500 ring-amber-100' }
    }
    return { border: 'border-r-[var(--color-primary-500)]', text: 'text-[var(--color-primary-600)]', dot: 'bg-[var(--color-primary-600)] ring-primary-100' }
  }

  const formatChange = (log) => {
    if (log.new_value) return log.new_value
    if (log.old_value) return log.old_value
    return null
  }

  const handleLoadMore = () => {
    if (isLoading || !hasMoreLogs) return
    setLogsPage(prev => prev + 1)
  }

  return (
    <div className="p-4 sm:p-5" dir="rtl">
      <h3 className="text-xs sm:text-sm font-bold text-gray-950 flex items-center justify-between border-b border-gray-50 pb-3 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-3 bg-[var(--color-primary-600)] rounded-sm inline-block" />
          <History className="w-4 h-4 text-gray-400" />
          <span>سجل التدقيق والتغييرات الإدارية ({totalLogs})</span>
        </div>
      </h3>

      {isLoading && allLogs.length === 0 ? (
        <div className="text-center py-6 text-xs font-medium text-gray-400">جاري فحص وجلب سجلات المتابعة الزمنية...</div>
      ) : allLogs.length === 0 ? (
        <div className="text-center py-8 text-xs font-medium text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          لا يوجد سجل تغييرات أو تعديلات مدرجة لهذه المهمة حتى الآن.
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <div className="max-h-[500px] overflow-y-auto pl-1 pr-1 custom-scrollbar relative">
            <div className="absolute right-2 top-2 bottom-2 w-0.5 bg-gray-100 lg:hidden" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
              {allLogs.map((log, idx) => {
                const changeText = formatChange(log)
                const styles = getLogStyle(log.action_type)
                
                {/* 🌟 الحسبة التصاعدية الجديدة (ASC): الأقدم يبدأ بـ #1 ويتصاعد تتابعياً */}
                const logSerialNumber = idx + 1

                return (
                  <div key={log.id || idx} className="flex gap-3 pr-2 lg:pr-0 relative group h-full">
                    <div className={`absolute right-[-8px] top-3.5 w-2 h-2 rounded-full ${styles.dot} ring-4 transition-all group-hover:scale-110 lg:hidden`} />
                    
                    <div className={`flex-1 w-full p-3 bg-gray-50/80 hover:bg-white rounded-xl border border-gray-100 border-r-4 ${styles.border} transition-all hover:shadow-sm flex flex-col justify-between relative`}>
                      
                      <div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            {/* 🌟 شارة الترقيم التصاعدي المتناسق مع الـ ASC */}
                            <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-bold bg-primary-50 text-[var(--color-primary-700)] rounded-md border border-primary-100">
                              #{logSerialNumber}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`${styles.text} flex items-center justify-center`}>
                                {getActionIcon(log.action_type)}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-gray-800">
                                {getActionLabel(log.action_type)}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
                            {formatDateTime(log.timestamp)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 mt-1.5 text-[11px] text-gray-400 font-medium justify-start">
                          <User className="w-3 h-3 text-gray-300" />
                          <span>بواسطة:</span>
                          <span className="text-gray-500 font-semibold">{log.user_name || 'النظام التلقائي'}</span>
                        </div>
                        
                        {changeText && (
                          <div className="mt-2 text-xs text-gray-600 bg-white rounded-lg p-2 border border-gray-100/70 break-words leading-relaxed font-medium text-right">
                            {changeText}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {hasMoreLogs && (
            <div className="pt-2 flex justify-center border-t border-gray-100 bg-white">
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[var(--color-primary-600)] bg-white border border-gray-200 px-5 py-2.5 rounded-xl shadow-sm hover:border-primary-200 hover:bg-gray-50/50 transition-all group disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-primary-500)]" />
                ) : (
                  <ArrowDownCircle className="w-3.5 h-3.5 text-gray-400 group-hover:text-[var(--color-primary-500)] transition-colors" />
                )}
                <span>عرض المزيد من السجلات التاريخية</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}