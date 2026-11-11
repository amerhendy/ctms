import { useEffect, useState } from 'react'
import { BookOpenCheck,Trash,Pencil,AlarmClockCheck,BookCheck } from 'lucide-react'
import { jobModelsApi } from '../../api/adminApi'
import { extractErrorMessage } from '../../api/axiosClient'
import Button from '../../components/Button'
import JobModelModal from '../../modals/JobModelModal'
import { theme } from '../../constants/theme'
import clsx from 'clsx'

function JobCard({ model, onEdit, onDelete }) {
  return (
    <div className={clsx(
      'group ',
      'bg-white dark:bg-slate-800/80',
      'border border-blue-200/80 dark:border-blue-700/60 rounded-xl',
      'hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm',
      'p-4 flex items-center justify-between gap-4 transition-all duration-200 '
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap">
          <strong className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
            {model.name}
          </strong>

          
        </div>
        
        {model.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {model.description}
          </p>
        )}
      </div>
      

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-1.5 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
          {/* شارة المدة */}
          <span className={clsx(theme.badge.base,theme.badge.info)}>
            <AlarmClockCheck color="#ff9100" className="w-3.5 h-3.5" /> {model.duration_minutes} دقيقة
          </span>

          {/* شارة عدد الأسئلة (إن وجدت) */}
          {model.count_questions !== undefined && (
            <span className={clsx(theme.badge.base,theme.badge.info)}>
              <BookCheck color="#ff9100" className="w-3.5 h-3.5" /> {model.count_questions} أسئلة
            </span>
          )}
          <span className={clsx(theme.badge.base,theme.badge.success)}>
            <BookOpenCheck color="#ff9100" strokeWidth={1} className="w-3.5 h-3.5" /> {model.target_score} درجة
            </span>
          <button
            onClick={() => onEdit(model)}
            className={clsx(theme.button.base, theme.button.primary, 'flex items-center gap-1.5')}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(model.id)}
            className={clsx(theme.button.base, theme.button.danger, 'flex items-center gap-1.5')}
          >
            <Trash className="w-3.5 h-3.5" />
          </button>
        </div>
    </div>
  )
}

export default function JobModelsTab({ jobModels, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    onRefresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleOpenCreate() {
    setSelectedModel(null)
    setModalOpen(true)
  }

  function handleOpenEdit(model) {
    setSelectedModel(model)
    setModalOpen(true)
  }

  async function handleDelete(id) {
    if (!window.confirm('هل أنت متأكد من حذف هذا النموذج؟ قد يترتب على ذلك حذف الأسئلة المرتبطة به.')) return
    setError('')
    try {
      await jobModelsApi.remove(id)
      onRefresh()
    } catch (err) {
      setError(extractErrorMessage(err, 'تعذر حذف نموذج الوظيفة'))
    }
  }

  return (
    <div className={clsx(theme.card.base)}>
  {/* الشريط العلوي */}
  <div className={clsx(theme.card.header, 'flex items-center justify-between gap-3')}>
    <div>
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
        نماذج الوظائف
      </h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
        إدارة نماذج الاختبارات والأوقات المحددة لكل وظيفة
      </p> 
    </div>
    <Button onClick={handleOpenCreate} className="shadow-sm">
      + إضافة نموذج جديد
    </Button>
  </div>

    {error && (
      <div className="p-3 mb-4 text-xs rounded-xl bg-red-50 border border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-800/50 dark:text-red-400">
        {error}
      </div>
    )}

  {/* قائمة الكروت */}
  <div className="space-y-3">
    {jobModels.map((jm) => (
      <JobCard model={jm} key={jm.id} onEdit={handleOpenEdit} onDelete={handleDelete} />
    ))}

    {jobModels.length === 0 && (
      <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
        <span className="text-2xl block mb-2">📋</span>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          لا توجد نماذج وظائف متوفرة
        </p>
      </div>
    )}
  </div>

  <JobModelModal
    open={modalOpen}
    initialData={selectedModel}
    onClose={() => setModalOpen(false)}
    onSuccess={onRefresh}
  />
</div>
  )
}