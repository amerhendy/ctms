// TaskDetailPage.jsx (نسخة UI/UX احترافية معدلة ومحصنة برمجياً)
import clsx from 'clsx'
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight, Edit, Trash2, Star, StarOff, Zap, ArrowLeftRight,
  Share2, FileText, CheckCircle, Building2, User, Calendar, Bell, Clock, ListTodo, Users, MessageSquare, Paperclip, History,
  Inbox
} from 'lucide-react'
import toast from 'react-hot-toast'
import { tasksApi } from '@/api'
import {
  PriorityBadge, StatusBadge, ProgressBar, PageLoader,
  ConfirmDialog, UrgencyBadge
} from '@/components/common'
import {
  formatDate, formatDateTime, daysUntilDue, dueDateColor,
  EISENHOWER_CONFIG, getApiError
} from '@/utils/helpers'
import { theme, resolveFieldState } from '@/constants/theme';
import useAuthStore from '@/stores/authStore'
import TaskFormModal from '../TaskFormModal'
import TransferModal from '../TransferModal'
import ShareModal from '../ShareModal'
import TaskCommentsSection from './TaskCommentsSection'
import TaskAttachmentsSection from './TaskAttachmentsSection'
import TaskAssignmentsSection from './TaskAssignmentsSection'
import TaskStepsSection from './TaskStepsSection'
import TaskSharesSection from './TaskSharesSection'
import TaskLogsSection from './TaskLogsSection'
import UrgencyResponseModal from './TaskModels/UrgencyResponseModal'
import TaskTimerControl from '@/components/common/TaskTimerControl'
import TransferRespondModal from './TaskModels/TransferRespondModal'
import KanbanBoard from './TaskModels/KanbanBoard'
import { Avatar } from '@/components/common'
import UserContactPopover from '@/components/shared/UserContactPopover'
import WorkflowSection from './WorkflowSection'
import { GitBranch } from 'lucide-react'

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('steps')
  const [showEditModal, setShowEditModal] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showUrgencyModal, setShowUrgencyModal] = useState(false)
  const [transferModalOpen, setTransferModalOpen] = useState(false)

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', parseInt(id)],
    queryFn: () => tasksApi.get(id).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(id),
    onSuccess: () => {
      toast.success('تم حذف المهمة بنجاح')
      navigate('/tasks')
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const favMutation = useMutation({
    mutationFn: () => tasksApi.toggleFavorite(id),
    onSuccess: (res) => {
      toast.success(res.data.message)
      queryClient.invalidateQueries(['task', parseInt(id)])
    },
  })

  const requestUrgencyMutation = useMutation({
    mutationFn: () => tasksApi.requestUrgency(id, {}),
    onSuccess: () => {
      toast.success('تم إرسال طلب استعجال المهمة بنجاح')
      queryClient.invalidateQueries(['task', parseInt(id)])
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const currentUserId = user?.id
  
  // حماية وتحليل طلب التحويل الوارد للمستخدم الحالي من كائن الترقيم
  const userPendingTransfer = (Array.isArray(task?.transfers?.items) 
    ? task.transfers.items.find((t) => t.to_user_id === currentUserId && t.status === 'pending')
    : null) || {};

  if (isLoading) return <PageLoader />
  if (!task) return <div className="text-center py-16 text-gray-400 text-sm">المهمة غير موجودة</div>

  const perms = task.permissions || {}
  const canEditTask = perms.can_edit_task ?? false
  const canDelete = perms.can_delete_task ?? false
  const canRequestUrgency = perms.can_request_urgency ?? false
  const canRespondUrgency = perms.can_respond_urgency ?? false
  const canTransfare = perms.can_transfer_task ?? false; // تصحيح التسمية لتتطابق مع الـ Permissions الموحدة
  const canShare = perms.can_share_add ?? false;
  const canChangeStatus = perms.can_change_status ?? false;

  const days = daysUntilDue(task.due_date)
  const eisConfig = EISENHOWER_CONFIG[task.eisenhower_quadrant]
  
  // الحسابات الذكية بعد التحويل لكائنات الترقيم (Micro-Pagination)
  const completedSteps = task.steps?.items?.filter(s => s.is_completed).length || 0;
  const totalSteps = task.steps.length || 0; // 🌟 تم تعديلها لتجلب الإجمالي الكلي من قاعدة البيانات مباشرة
  

  // تبويبات احترافية مع أيقونات
  const tabs = [
    //{ key: 'workflow',     label: 'Workflow',    icon: <GitBranch className="w-4 h-4" /> ,badge: task.workflow?.steps?.length || null},
    { key: 'steps', label: 'الخطوات', icon: <ListTodo className="w-4 h-4" /> ,badge: totalSteps || null },
    { key: 'assignments', label: 'المنفذون', icon: <Users className="w-4 h-4" /> },
    { key: 'shares', label: 'المشاركون', icon: <Share2 className="w-4 h-4" /> },
    { key: 'comments', label: 'التعليقات', icon: <MessageSquare className="w-4 h-4" /> },
    { key: 'attachments', label: 'المرفقات', icon: <Paperclip className="w-4 h-4" /> },
    { key: 'history', label: 'السجل', icon: <History className="w-4 h-4" /> },
  ]
task.creator = task?.creator ?? task?.created_by_user ?? null;

  return (
    <div className={clsx(
        "min-h-screen transition-colors duration-300",
        "bg-slate-50 dark:bg-slate-950 pb-12"
      )}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Breadcrumb عصري */}
        <nav className={clsx("flex items-center gap-1", theme.text.muted)}>
          <Link 
            to="/tasks" 
            className={clsx(
              "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all",
              "hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-primary-600 dark:hover:text-primary-400"
            )}
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>المهام</span>
          </Link>
          
          {/* الفاصل */}
          <span className="text-slate-300 dark:text-slate-600">/</span>
          
          {/* العنوان الحالي */}
          <span 
            className={clsx(
              "font-medium truncate max-w-[250px] sm:max-w-md",
              "text-slate-800 dark:text-slate-200"
            )} 
            title={task.title}
          >
            {task.title}
          </span>
        </nav>

        {/* البطاقة الرئيسية للمهمة */}
        <div className={clsx(
          theme.card.base, // يستبدل bg-white, border, shadow-sm, rounded-2xl
          "overflow-hidden transition-all",
          task.urgency_request_status === 'approved' && "border-r-4 border-r-red-500"
        )}>
          {/* الرأس: الشارات + العنوان + الأزرار الإدارية */}
          <div className={clsx("p-5 sm:p-6", theme.card.border)}>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1 space-y-4">
                {/* قسم الوسوم */}
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityBadge priority={task.priority} />
                  <StatusBadge status={task.status} />
                  {task.urgency_request_status === 'approved' && <UrgencyBadge status="approved" />}
                  {task.urgency_request_status === 'pending' && (
                    <span className={clsx(theme.badge.base, theme.badge.warning, "animate-pulse")}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      استعجال قيد الانتظار
                    </span>
                  )}
                  {eisConfig && (
                    <span className={clsx('text-xs font-medium px-2.5 py-1 rounded-full', eisConfig.color, eisConfig.text)}>
                      {eisConfig.label}
                    </span>
                  )}
                </div>
                {/* العنوان ومعلومات المبدع */}

                <div>
                  <h1 className={clsx("text-2xl sm:text-3xl font-bold tracking-tight", theme.text.primary)}>
                    {task.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                  
                  {task.creator && (
                    <div className={clsx("inline-flex items-center px-3 py-1 rounded-full border", theme.card.subtle)}>
                      <UserContactPopover user={task.creator} taskId={task.id} taskTitle={task.title}>
                        <Avatar 
                          name={task.creator.full_name || ''} 
                          src={task.creator.avatar_url || task.creator.user?.avatar_url} 
                          size="sm" 
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                        />
                      </UserContactPopover>
                      <div className="mr-2">
                        <p className={clsx("text-xs sm:text-sm font-bold", theme.text.primary)}>{task.creator?.full_name}</p>
                        <p className={clsx("text-[11px] font-medium mt-0.5", theme.text.muted)}>{task.creator?.job_title}</p>  
                      </div>
                      
                    </div>
                  )}
                  {task.file_number && (
                    <div className={clsx("inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full border", theme.card.subtle)}>
                      <FileText className={clsx("w-3.5 h-3.5", theme.text.muted)} />
                      <span className={theme.text.muted}>رقم الملف:</span>
                      <span className={clsx("font-mono font-semibold", theme.text.primary)}>{task.file_number}</span>
                    </div>
                  )}
                  </div>
                </div>

                {/* الوصف */}
                {task.description && (
                  <div className={clsx("prose prose-sm max-w-none rounded-xl p-4 border", theme.card.subtle)}>
                    <p className={clsx("whitespace-pre-line leading-relaxed", theme.text.secondary)}>{task.description}</p>
                  </div>
                )}
              </div>

              {/* أزرار التحكم الرأسية والمفضلة */}
              <div className={clsx("flex items-center gap-2 self-start lg:self-center p-1.5 rounded-xl", theme.card.subtle)}>
                <button
                  onClick={() => favMutation.mutate()}
                  className={clsx(
                        "p-2 rounded-lg transition-all duration-200",
                        task.is_favorite 
                          ? "text-amber-500 bg-amber-500/10" 
                          : "text-slate-400 hover:text-amber-500 hover:bg-slate-200/50"
                      )}
                  title={task.is_favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                >
                  {task.is_favorite ? <Star className="w-5 h-5 fill-current" /> : <StarOff className="w-5 h-5" />}
                </button>

                {/* صندوق طلبات التحويل الواردة المعلق والذكي */}
                {Object.keys(userPendingTransfer).length > 0 ? (
                  <button
                    onClick={() => setTransferModalOpen(true)}
                    className="p-2 rounded-lg text-blue-600 bg-blue-500/10 border border-blue-500/20 animate-bounce"
                    title="اتخاذ إجراء بشأن طلب التحويل الوارد"
                  >
                    <Inbox className="w-5 h-5" />
                  </button>
                ) : (
                  <span className={clsx("text-xs font-medium italic px-2 py-1 rounded-md select-none", theme.text.muted)}>
                    التحويل: لا يوجد
                  </span>
                )}

                {(canEditTask || canDelete) && <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />}

                {canEditTask && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className={clsx(theme.button.base, theme.button.primary, "px-3 py-1.5")}
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">تعديل</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className={clsx(theme.button.ghost, "text-red-500 hover:text-red-600")}
                    title="حذف المهمة"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* قسم مؤشر التقدم وعداد الخطوات */}
          <div className={clsx("p-5 sm:p-6 border-b", theme.card.border, theme.card.subtle)}>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className={clsx("font-medium flex items-center gap-1.5", theme.text.primary)}>
                  <span className="w-2 h-2 rounded-full bg-primary-500" />
                  نسبة الإنجاز الإجمالية
                </span>
                <span className={clsx("font-bold px-2.5 py-0.5 rounded-full text-xs border", theme.card.base, theme.text.primary)}>
                  {task.progress_percentage}%
                </span>
              </div>
              <ProgressBar value={task.progress_percentage} />
              {totalSteps > 0 && (
                <div className={clsx(
                  "flex flex-col sm:flex-row justify-between sm:items-center gap-2 pt-2 text-xs border-t transition-colors",
                  theme.card.border
                )}>
                  {/* الخطوات المنجزة */}
                  <span className={clsx("flex items-center gap-1.5 font-medium", theme.text.muted)}>
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      تم إنجاز <strong className={clsx("font-semibold text-emerald-600 dark:text-emerald-400")}>{completedSteps}</strong> من <strong className={clsx("font-semibold", theme.text.primary)}>{totalSteps}</strong> {totalSteps === 1 ? 'خطوة' : 'خطوات'}
                    </span>
                  </span>
                  
                  {/* الخطوات المتبقية كـ Badge أنيق */}
                  {task.progress_percentage < 100 && (
                    <span className={clsx(
                      "inline-flex items-center gap-1 self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border transition-all",
                      "bg-primary-50/60 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 border-primary-100/50 dark:border-primary-900/30"
                    )}>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                      متبقي {totalSteps - completedSteps} {totalSteps - completedSteps === 1 ? 'خطوة' : 'خطوات'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* شبكة المعلومات والبيانات الوصفية (Metadata) */}
          <div className={clsx("p-5 sm:p-6 border-b", theme.card.border)}>
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                  <InfoItem 
                    icon={<Building2 className={clsx("w-4 h-4", theme.text.muted)} />} 
                    label="الإدارة المستلمة" 
                    value={task.department_name || task?.department?.name || '—'} 
                    iconColor="text-amber-500" 
                    labelColor="text-amber-600"
                  />
                  <InfoItem 
                    icon={<User className={clsx("w-4 h-4", theme.text.muted)} />} 
                    label="منشئ المهمة" 
                    value={task.creator?.full_name || '—'} 
                    iconColor="text-purple-500" 
                    labelColor="text-purple-600"
                  />
                  {task.start_date && (
                    <InfoItem 
                      icon={<Calendar className={clsx("w-4 h-4", theme.text.muted)} />} 
                      label="تاريخ البدء" 
                      value={formatDate(task.start_date)} 
                      iconColor="text-blue-500" 
                      labelColor="text-blue-600"
                    />
                  )}
                  {task.due_date && (
                    <InfoItem
                      icon={<Calendar className={clsx("w-4 h-4", theme.text.muted)} />}
                      label="تاريخ الاستحقاق"
                      iconColor={days < 0 ? "text-red-500" : "text-blue-500"}
                      labelColor={days < 0 ? "text-red-600" : "text-slate-500"}
                      value={
                        <div className="flex items-center gap-1">
                          <span className={clsx("font-semibold", dueDateColor(days))}>
                            {formatDate(task.due_date)}
                          </span>
                          {days !== null && days < 0 && (
                            <span className="text-red-500 text-xs animate-pulse" title="المهمة متأخرة عن موعدها!">
                              &#9888;
                            </span>
                          )}
                        </div>
                      }
                    />
                  )}
                  {task.reminder_datetime && (
                    <InfoItem 
                      icon={<Bell className={clsx("w-4 h-4", theme.text.muted)} />} 
                      label="موعد التذكير" 
                      value={formatDateTime(task.reminder_datetime)} 
                      iconColor="text-sky-500"
                      labelColor="text-sky-600"
                    />
                  )}
                </div>
              </div>

          {/* قسم التحكم بالوقت والـ Time Tracking الفعلي */}
          {canChangeStatus && (
            <div className={clsx(
              "px-5 sm:px-6 py-5 border-b transition-all duration-300",
              theme.card.border,  // توحيد الحدود مع باقي البطاقات
              "rounded-xl bg-gradient-to-l from-gray-500/50 to-transparent dark:from-gray-905/10 dark:to-transparent" // تدرج خفيف يعطي عمقاً بصرياً
            )}>
              <div className="space-y-3">
                {/* عنوان جانبي لطيف يشير لطبيعة القسم */}
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-100">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>مراقب وقت العمل الفعلي</span>
                </div>

                {/* متحكم المؤقت الفعلي */}
                <div className={clsx(
                  "p-1 rounded-xl transition-all duration-200",
                  "bg-white/80 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/60 shadow-sm"
                )}>
                  <TaskTimerControl 
                    taskId={task.id} 
                    canChangeStatus={canChangeStatus} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* أزرار العمليات الإدارية السريعة */}
          <div className={clsx(
            "p-5 sm:p-6 flex flex-wrap gap-2 border-b",
            theme.card.subtle, // الخلفية الموحدة المتوافقة مع Dark Mode
            theme.card.border
          )}>
            {canTransfare && (
              <ActionButton 
                icon={<ArrowLeftRight className="w-4 h-4" />} 
                onClick={() => setShowTransfer(true)}
              >
                تحويل المهمة لإدارة أخرى
              </ActionButton>
            )}
            {canShare && (
              <ActionButton 
                icon={<Share2 className="w-4 h-4" />} 
                onClick={() => setShowShare(true)}
              >
                مشاركة الصلاحيات
              </ActionButton>
            )}
            {task.urgency_request_status !== 'pending' && canRespondUrgency && (
              <ActionButton 
                icon={<Zap className="w-4 h-4" />} 
                onClick={() => requestUrgencyMutation.mutate()} 
                variant="urgent"
              >
                طلب استعجال فوري
              </ActionButton>
            )}
            {task.urgency_request_status === 'pending' && canRequestUrgency && (
              <ActionButton 
                icon={<Clock className="w-4 h-4" />} 
                onClick={() => setShowUrgencyModal(true)} 
                variant="warning"
              >
                الرد على طلب الاستعجال
              </ActionButton>
            )}
          </div>
        </div>

        {/* شاشة التبويبات السفلية الذكية وعرض القوائم الرقمية */}
        <div className={clsx(
            "rounded-2xl border overflow-hidden",
            theme.card.base // يستبدل shadow-sm, bg-white, border
          )}>
            <div className={clsx("border-b px-4 sm:px-6", theme.card.border)}>
              <div className="flex gap-1 overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap",
                      activeTab === tab.key
                        ? "border-primary-500 text-primary-600 dark:text-primary-400"
                        : clsx("border-transparent", theme.text.muted, "hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300")
                    )}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600">
                          {tab.badge}
                        </span>
                      )}
                  </button>
                ))}
              </div>
            </div>

            {/* عرض محتويات الأقسام */}
            <div className={clsx("p-5 sm:p-6", theme.card.subtle)}>
              {/*{activeTab === 'workflow'    && <WorkflowSection taskId={task.id} taskPermissions={perms} />} */}
              {activeTab === 'steps' && <KanbanBoard taskId={task.id} taskPermissions={perms} task={task} />}
              {activeTab === 'assignments' && <TaskAssignmentsSection taskId={task.id} taskPermissions={perms} task={task} />}
              {activeTab === 'shares' && <TaskSharesSection taskId={task.id} taskPermissions={perms} task={task} />}
              {activeTab === 'comments' && <TaskCommentsSection taskId={task.id} taskPermissions={perms} task={task} />}
              {activeTab === 'attachments' && <TaskAttachmentsSection taskId={task.id} taskPermissions={perms} task={task} />}
              {activeTab === 'history' && <TaskLogsSection taskId={task.id} taskPermissions={perms} task={task} />}
            </div>
          </div>
      </div>

      {/* نوافذ التأكيد والمودالات المنبثقة */}
      {showEditModal && (
        <TaskFormModal
          task={task}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            queryClient.invalidateQueries(['task', parseInt(id)])
          }}
        />
      )}
      {showTransfer && (
        <TransferModal
          taskId={task.id}
          currentDeptId={task.department_id}
          onClose={() => setShowTransfer(false)}
          onSuccess={() => {
            setShowTransfer(false)
            queryClient.invalidateQueries(['task', parseInt(id)])
          }}
        />
      )}
      {showShare && (
        <ShareModal
          taskId={task.id}
          onClose={() => setShowShare(false)}
          onSuccess={() => {
            setShowShare(false)
            queryClient.invalidateQueries(['task-shares', id])
          }}
        />
      )}
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="حذف المهمة نهائياً"
        message={`هل أنت متأكد من رغبتك في حذف "${task.title}"؟ لا يمكن التراجع عن هذا الإجراء الإداري الرقابي بعد التنفيذ.`}
        danger
      />
      {showUrgencyModal && (
        <UrgencyResponseModal
          task={task}
          onClose={() => setShowUrgencyModal(false)}
        />
      )}
      {transferModalOpen && (
        <TransferRespondModal
          isOpen={transferModalOpen}
          onClose={() => setTransferModalOpen(false)}
          transferData={userPendingTransfer}
          taskTitle={task.title}
        />
      )}
    </div>
  )
}

// مكونات مساعدة داخلية لعرض البيانات الهيكلية
function InfoItem({ icon, label, value, iconColor = "text-slate-400", labelColor = "text-slate-500" }) {
  return (
    <div className={clsx(
      "flex flex-col gap-1.5 p-3 rounded-xl border transition-all duration-200",
      theme.card.subtle // الخلفية الموحدة من الثيم
    )}>
      {/* الجزء العلوي: أيقونة + عنوان */}
      <div className={clsx("flex items-center gap-1.5 text-xs font-semibold", labelColor)}>
        <span className={iconColor}>{icon}</span>
        <span>{label}</span>
      </div>
      
      {/* الجزء السفلي: القيمة */}
      <div className={clsx("text-sm font-bold truncate", theme.text.primary)}>
        {value}
      </div>
    </div>
  )
}


function ActionButton({ icon, onClick, children, variant = 'default' }) {
  // تعريف الأنماط باستخدام توكنز الثيم
  const variants = {
    default: clsx(theme.button.ghost, "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"),
    urgent: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40",
    warning: "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
  };

  return (
    <button 
      onClick={onClick} 
      className={clsx(
        "inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl transition-all duration-200",
        variants[variant] || variants.default
      )}
    >
      {icon}
      {children}
    </button>
  );
}