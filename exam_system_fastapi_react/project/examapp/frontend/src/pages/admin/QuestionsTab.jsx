import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import { Plus, Trash2, HelpCircle, Edit3, Printer } from 'lucide-react'
import { pdf } from '@react-pdf/renderer'

import { questionsApi } from '../../api/adminApi'
import { extractErrorMessage } from '../../api/axiosClient'
import { Spinner, Select, IconButton, FormField } from '../../components/common/index'
import AddQuestionModal from '../../modals/AddQuestionModal'
import { QuestionPdfDocument } from '../../components/pdf/QuestionPdfDocument'
import { 
  QUESTION_TYPE_LABELS, 
  QUESTION_TYPE_ICONS, 
  QUESTION_TYPE_COLORS 
} from '../../constants/index'
import { theme } from '../../constants/theme'

function QuestionCard({ question, onEdit, onDelete, onPrint, isExporting }) {
  const qType = question?.q_type
  const typeLabel = QUESTION_TYPE_LABELS[qType] || qType
  const typeIcon = QUESTION_TYPE_ICONS[qType] || '❓'
  const typeColors = QUESTION_TYPE_COLORS[qType] || {
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    border: 'border-gray-200/80',
  }

  return (
    <div className={clsx(
      'group bg-white border rounded-xl p-4 transition-all duration-200 hover:shadow-sm',
      typeColors.border || 'border-gray-200/80'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <strong className="text-sm font-bold text-slate-800 leading-snug">
              {question.question_text}
            </strong>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              الدرجة: <strong className="text-slate-700">{question.points}</strong>
            </span>
            <span className="text-gray-300">•</span>
            <span>
              الترتيب: <strong className="text-slate-700">{question.order_index}</strong>
            </span>
          </div>
        </div>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={clsx(
              'text-[11px] font-semibold px-2.5 py-0.5 rounded-md whitespace-nowrap flex items-center gap-1.5',
              typeColors.badge
            )}>
              <span>{typeIcon}</span>
              <span>{typeLabel}</span>
            </span>

          {/* زر طباعة هذا السؤال فقط */}
          <IconButton 
            icon={Printer} 
            label="طباعة السؤال PDF" 
            variant="solid" 
            size="md" 
            disabled={isExporting}
            onClick={() => onPrint(question)}
            className={clsx(
                theme?.button?.base || 'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                'text-slate-600 hover:bg-slate-100',
                'flex items-center gap-1'
              )}
          />

          <IconButton 
            icon={Edit3} 
            label="تعديل السؤال" 
            variant="solid" 
            size="md" 
            onClick={() => onEdit(question)}
            className={clsx(
                theme?.button?.base || 'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                theme?.button?.primary || 'text-primary hover:bg-primary/10',
                'flex items-center gap-1'
              )}
          />

          <IconButton 
            icon={Trash2} 
            label="حذف السؤال" 
            variant="solid" 
            size="md" 
            onClick={() => onDelete(question.id)}
            className={clsx(
                theme?.button?.base || 'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                theme?.button?.danger || 'text-red-600 hover:bg-red-50',
                'flex items-center gap-1'
              )}
          />
        </div>
      </div>
    </div>
  )
}

export default function QuestionsTab({ jobModels = [] }) {
  const [jobModelId, setJobModelId] = useState('')
  const [questions, setQuestions] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')

  // الحصول على اسم النموذج الحالي لاستخدامه في عنوان الـ PDF
  const currentJobModelName = jobModels.find((jm) => String(jm.id) === String(jobModelId))?.name || 'نموذج الوظيفة'

  const loadQuestions = useCallback(async (id) => {
    if (!id) {
      setQuestions([])
      return
    }

    setLoading(true)
    setError('')
    try {
      const { data } = await questionsApi.list(id)
      setQuestions(data || [])
    } catch (err) {
      setError(extractErrorMessage(err, 'تعذر تحميل قائمة الأسئلة'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadQuestions(jobModelId)
  }, [jobModelId, loadQuestions])

  // دالة التعامل مع التصدير إلى PDF
  const handleExportPdf = async (questionsToExport, customFileName) => {
    if (!questionsToExport || questionsToExport.length === 0) return

    try {
      setIsExporting(true)
      const blob = await pdf(
        <QuestionPdfDocument 
          questions={questionsToExport} 
          jobTitle={currentJobModelName} 
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url;
      link.download = customFileName || `إجابات_${currentJobModelName}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('PDF Export Error:', err)
      setError('حدث خطأ أثناء تصدير ملف الـ PDF')
    } finally {
      setIsExporting(false)
    }
  }

  function handleOpenCreate() {
    setSelectedQuestion(null)
    setModalOpen(true)
  }

  function handleOpenEdit(question) {
    setSelectedQuestion(question)
    setModalOpen(true)
  }

  async function handleDelete(id) {
    if (!window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) return
    try {
      await questionsApi.remove(id)
      loadQuestions(jobModelId)
    } catch (err) {
      setError(extractErrorMessage(err, 'تعذر حذف السؤال'))
    }
  }

  return (
    <div className={clsx(theme.card.base)}>
      <div className={clsx(theme.card.header, 'flex items-center justify-between gap-3')}>
        
        <div className="w-full sm:w-72">
          <FormField>
            <Select
              value={jobModelId}
              onChange={(e) => setJobModelId(e.target.value)}
              className="input-field w-full"
              placeholder="اختر نموذج الوظيفة..."
              options={jobModels.map((jm) => ({
                value: jm.id,
                label: jm.name,
              }))}
            />
          </FormField>
        </div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div className="flex items-center gap-2">
          {/* زر طباعة وتنزيل كل الأسئلة للنموذج المختار */}
          {questions.length > 0 && (
            <IconButton 
              icon={Printer} 
              label={isExporting ? "جاري التصدير..." : "طباعة كل الأسئلة (PDF)"} 
              variant="solid" 
              size="md" 
              onClick={() => handleExportPdf(questions, `أسئلة_وإجابات_${currentJobModelName}.pdf`)}
              disabled={isExporting || loading}
              className="flex items-center gap-1.5 shadow-sm bg-emerald-600 hover:bg-emerald-700 text-white"
            />
          )}

          <IconButton 
            icon={Plus} 
            label="إضافة" 
            variant="solid" 
            size="md" 
            onClick={handleOpenCreate}
            disabled={!jobModelId}
            className="flex items-center gap-1.5 shadow-sm"
          />
        </div>
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}
      </div>

      {/* قائمة الأسئلة */}
      <div className={clsx(theme.card.body, 'overflow-x-auto')}>
        {loading && (
          <p className="text-sm text-gray-400 text-center py-8">
            <Spinner className="w-5 h-5 mx-auto mb-2 animate-spin text-blue-600" />
            جاري تحميل الأسئلة...</p>
        )}
        {!loading && jobModelId && questions.length === 0 && (
          <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl bg-slate-50/50">
            <HelpCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-500">لا توجد أسئلة لهذا النموذج بعد.</p>
          </div>
        )}
        {!jobModelId && (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-slate-50/30">
            <p className="text-sm text-gray-400">اختر نموذج وظيفة من القائمة أعلاه لعرض أسئلته.</p>
          </div>
        )}
        {questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            onEdit={handleOpenEdit}
            onDelete={handleDelete}
            onPrint={(questionToPrint) => handleExportPdf([questionToPrint], `سؤال_${questionToPrint.id}.pdf`)}
            isExporting={isExporting}
          />
        ))}
      </div>

      {/* مودال إضافة/تعديل السؤال الموحد */}
      <AddQuestionModal
        open={modalOpen}
        initialData={selectedQuestion}
        jobModelId={jobModelId}
        jobModels={jobModels}
        onClose={() => {
          setModalOpen(false)
          setSelectedQuestion(null)
        }}
        onCreated={() => loadQuestions(jobModelId)}
        onSuccess={() => loadQuestions(jobModelId)}
      />
    </div>
  )
}