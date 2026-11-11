import { useEffect, useState } from 'react'
import clsx from 'clsx'

import { questionsApi } from '../api/adminApi'
import { extractErrorMessage } from '../api/axiosClient'
import Button from '../components/Button'
import Input from '../components/Input'
import { Modal, FormField, Select } from '../components/common/index'
import { theme } from '../constants/theme'
import { QUESTION_TYPE_OPTIONS } from '../constants/index'

// استيراد الحقول الفرعية
import McqForm from '../components/questionForms/McqForm'
import InlineDropdownForm from '../components/questionForms/InlineDropdownForm'
import ProofreadingForm from '../components/questionForms/ProofreadingForm'
import OrderingForm from '../components/questionForms/OrderingForm'
import MatchingForm from '../components/questionForms/MatchingForm'
import TrueFalseForm from '../components/questionForms/TrueFalseForm'
import SummarizeForm from '../components/questionForms/SummarizeForm'
import ExcelSimulationForm from '../components/questionForms/ExcelSimulationForm'
import WordSimulationForm from '../components/questionForms/WordSimulationForm'
import MathEquationForm from '../components/questionForms/MathEquationForm'

export default function AddQuestionModal({
  open,
  initialData = null,
  jobModelId: defaultJobModelId = '',
  jobModels: initialJobModels = [],
  onClose,
  onSuccess,
}) {
  const isEditMode = Boolean(initialData && initialData.id)

  const [jobModelId, setJobModelId] = useState('')
  const [qType, setQType] = useState('single_choice')
  const [questionText, setQuestionText] = useState('')
  const [questionPoints, setQuestionPoints] = useState('')
  const [imageFile, setImageFile] = useState(null)

  // الحالات الفرعية للأنواع المختلفة
  const [options, setOptions] = useState(['', '', '', ''])
  const [correctIndices, setCorrectIndices] = useState([0])
  const [sjtRatings, setSjtRatings] = useState({})
  
  const [clozeTemplate, setClozeTemplate] = useState('')
  const [clozeDropdowns, setClozeDropdowns] = useState([])
  const [rawText, setRawText] = useState('')
  const [correctedModelText, setCorrectedModelText] = useState('')
  const [referenceText, setReferenceText] = useState('')
  const [minWords, setMinWords] = useState(30)
  const [maxWords, setMaxWords] = useState(150)
  const [orderItems, setOrderItems] = useState(['الخطوة الأولى', 'الخطوة الثانية', 'الخطوة الثالثة'])
  const [pairs, setPairs] = useState([{ left: '', right: '' }, { left: '', right: '' }])
  const [tfCorrect, setTfCorrect] = useState(true)
  const [modelJustification, setModelJustification] = useState('')

  // حالة نوع السؤال math_formula
  const [equationPrompt, setEquationPrompt] = useState('')
  const [expectedAnswer, setExpectedAnswer] = useState('')
  const [allowedFormats, setAllowedFormats] = useState('latex')

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [excelInstructions, setExcelInstructions] = useState('')
  const [wordInstructions, setWordInstructions] = useState('')
  const [allowedExtensions, setAllowedExtensions] = useState('.xlsx, .xls')
  const [maxFileSizeMB, setMaxFileSizeMB] = useState(10)

  useEffect(() => {
    if (!open) return
    setError('')
    setSubmitting(false)

    if (initialData) {
      setJobModelId(initialData.job_model_id || defaultJobModelId || '')
      setQType(initialData.q_type || 'single_choice')
      setQuestionText(initialData.question_text || '')
      setQuestionPoints(initialData.points || 10)
      setImageFile(null)

      let parsedData = initialData.question_data || {}
      if (typeof parsedData === 'string') {
        try { parsedData = JSON.parse(parsedData) } catch { parsedData = {} }
      }

      setOptions(parsedData.options || ['', '', '', ''])
      setCorrectIndices(parsedData.correct_indices || [0])
      setSjtRatings(parsedData.sjt_ratings || {})
      if (parsedData.template_text) setClozeTemplate(parsedData.template_text)
      if (parsedData.dropdowns) setClozeDropdowns(parsedData.dropdowns)
      setRawText(parsedData.raw_text || '')
      setCorrectedModelText(parsedData.corrected_text || '')
      setReferenceText(parsedData.reference_text || '')
      setMinWords(parsedData.min_words || 30)
      setMaxWords(parsedData.max_words || 150)
      setOrderItems(parsedData.items || ['الخطوة الأولى', 'الخطوة الثانية', 'الخطوة الثالثة'])
      setPairs(parsedData.pairs || [{ left: '', right: '' }, { left: '', right: '' }])
      setTfCorrect(parsedData.correct_choice !== undefined ? parsedData.correct_choice : true)
      setModelJustification(parsedData.model_justification || '')
      setEquationPrompt(parsedData.equation_prompt || '')
      setExpectedAnswer(parsedData.expected_answer || '')
      setAllowedFormats(parsedData.allowed_formats || 'latex')
      setExcelInstructions(parsedData.instructions || '')
      setWordInstructions(parsedData.instructions || '')
      setAllowedExtensions(parsedData.allowed_extensions || '.xlsx, .xls')
      setMaxFileSizeMB(parsedData.max_file_size_mb || 10)
      console.log(parsedData)
    } else {
      setJobModelId(defaultJobModelId || '')
      setQType('single_choice')
      setQuestionText('')
      setQuestionPoints(10)
      setImageFile(null)
      setOptions(['', '', '', ''])
      setCorrectIndices([0])
      setSjtRatings({})
      setClozeTemplate('')
      setClozeDropdowns([])
      setRawText('')
      setCorrectedModelText('')
      setReferenceText('')
      setMinWords(30)
      setMaxWords(150)
      setOrderItems(['الخطوة الأولى', 'الخطوة الثانية', 'الخطوة الثالثة'])
      setPairs([{ left: '', right: '' }, { left: '', right: '' }])
      setTfCorrect(true)
      setModelJustification('')
      setEquationPrompt('')
      setExpectedAnswer('')
      setAllowedFormats('latex')
      setExcelInstructions('')
      setWordInstructions('')
      setAllowedExtensions('.xlsx, .xls')
      setMaxFileSizeMB(10)
    }
  }, [open, initialData, defaultJobModelId])

  if (!open) return null

  // التجميع والحفظ
  async function handleSubmit() {
    setError('')
    if (!jobModelId || !questionText.trim()) {
      setError('يرجى اختيار الوظيفة وكتابة نص السؤال / الموقف')
      return
    }

    const requiresImage = ['image_to_excel', 'image_to_word'].includes(qType)
    if (requiresImage && !imageFile && !isEditMode) {
      setError('يرجى اختيار الصورة المطلوب تفريغها')
      return
    }

    const questionData = {}

    if (['single_choice', 'multiple_choice', 'select_all', 'sjt'].includes(qType)) {
      const validOptions = options.filter((o) => o.trim() !== '')
      if (validOptions.length < 2) {
        setError('يرجى كتابة خيارين على الأقل')
        return
      }
      questionData.options = validOptions
      if (qType === 'sjt') {
        questionData.sjt_ratings = sjtRatings
      } else {
        questionData.correct_indices = correctIndices
      }
    }

    if (qType === 'math_formula') {
      questionData.equation_prompt = equationPrompt
      questionData.expected_answer = expectedAnswer
      questionData.allowed_formats = allowedFormats
    }

    if (qType === 'inline_dropdown') {
      if (!clozeTemplate.includes('[drop]')) {
        setError('يرجى كتابة الكلمة [drop] في المكان المراد وضع القائمة المنسدلة فيه')
        return
      }
      questionData.template_text = clozeTemplate
      questionData.dropdowns = clozeDropdowns
    }

    if (qType === 'proofreading') {
      if (!rawText.trim()) {
        setError('يرجى إدخال النص الذي يحتوي على أخطاء')
        return
      }
      questionData.raw_text = rawText
      questionData.corrected_text = correctedModelText
    }

    if (qType === 'ordering') {
      const validItems = orderItems.filter((item) => item.trim() !== '')
      if (validItems.length < 2) {
        setError('يرجى إضافة عنصرين على الأقل للترتيب')
        return
      }
      questionData.items = validItems
    }

    if (qType === 'matching') {
      const validPairs = pairs.filter((p) => p.left.trim() !== '' && p.right.trim() !== '')
      if (validPairs.length < 1) {
        setError('يرجى إدخال زوج واحد مطابقة على الأقل')
        return
      }
      questionData.pairs = validPairs
    }

    if (qType === 'true_false_justify') {
      questionData.correct_choice = tfCorrect
      questionData.model_justification = modelJustification
    }

    if (['summarize_word'].includes(qType)) {
      questionData.reference_text = referenceText
      questionData.min_words = Number(minWords)
      questionData.max_words = Number(maxWords)
    }

    if (['excel_simulation', 'image_to_excel', 'excel_grid'].includes(qType)) {
      questionData.instructions = excelInstructions
      questionData.allowed_extensions = allowedExtensions
      questionData.max_file_size_mb = Number(maxFileSizeMB)
    }

    if (['image_to_word'].includes(qType)) {
      questionData.instructions = wordInstructions
      questionData.allowed_extensions = allowedExtensions
      questionData.max_file_size_mb = Number(maxFileSizeMB)
    }

    const formData = new FormData()
    formData.append('job_model_id', jobModelId)
    formData.append('q_type', qType)
    formData.append('question_text', questionText.trim())
    formData.append('points', questionPoints)
    formData.append('question_data', JSON.stringify(questionData))
    if (imageFile) formData.append('image', imageFile)

    setSubmitting(true)
    try {
      if (isEditMode) {
        await questionsApi.update(initialData.id, formData)
      } else {
        await questionsApi.create(formData)
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err, `حدث خطأ أثناء ${isEditMode ? 'تعديل' : 'حفظ'} السؤال`))
    } finally {
      setSubmitting(false)
    }
  }

  const isImageRequired = ['image_to_excel', 'image_to_word'].includes(qType)

  return (
    <Modal open={open} onClose={onClose} title={isEditMode ? 'تعديل السؤال' : 'إضافة سؤال جديد'} size="mxw">
      <div className="space-y-4">
        {/* اختيار الوظيفة ونوع السؤال */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="الوظيفة" required>
            <Select
              options={initialJobModels.map((job) => ({ value: job.id, label: job.name }))}
              value={jobModelId}
              onChange={(e) => setJobModelId(e.target.value)}
              placeholder="اختر الوظيفة..."
            />
          </FormField>

          <FormField label="نوع السؤال" required>
            <Select
              options={QUESTION_TYPE_OPTIONS}
              value={qType}
              onChange={(e) => setQType(e.target.value)}
              placeholder="اختر نوع السؤال..."
            />
          </FormField>

          {/* نص السؤال */}
          {qType === 'sjt' ? (
            <FormField label="نص الموقف الإداري / السيناريو" required>
              <textarea
                rows={8}
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                className={clsx(
                  theme?.textarea?.base || 'w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'resize-none'
                )}
                placeholder="مثال: دخل عليك عميل غاضب يشتكي..."
              />
            </FormField>
          ) : (
            <FormField label="نص السؤال / التعليمات" required>
              <Input
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder={qType === 'math_formula' ? 'مثال: اكتب معادلة حساب متوسط التكاليف ثم أوجد الناتج:' : 'أدخل نص السؤال هنا...'}
                className={clsx(theme?.input?.base)}
              />
            </FormField>
          )}

          
            <FormField label="درجة السؤال" required>
              <input
                type="number"
                min="1"
                value={questionPoints}
                onChange={(e) => setQuestionPoints(e.target.value)}
                className={clsx(
                  theme?.input?.base
                )}
              />
            </FormField>

          {/* رفع الصورة */}
          <FormField
            label={"صورة السؤال " + (isImageRequired && !isEditMode ? '' : '(اختياري)')}
            required={isImageRequired && !isEditMode}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className={clsx(theme?.input?.base)}
            />
            {imageFile && <p className="text-xs text-emerald-600 mt-1 font-medium">✓ تم اختيار: {imageFile.name}</p>}
          </FormField>
        </div>

        {/* عرض المكون المناسب بحسب نوع السؤال */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
          {['single_choice', 'multiple_choice', 'select_all', 'sjt'].includes(qType) && (
            <McqForm
              qType={qType}
              options={options}
              setOptions={setOptions}
              correctIndices={correctIndices}
              setCorrectIndices={setCorrectIndices}
              sjtRatings={sjtRatings}
              setSjtRatings={setSjtRatings}
              theme={theme}
            />
          )}

          {qType === 'math_formula' && (
            <MathEquationForm
              equationPrompt={equationPrompt}
              setEquationPrompt={setEquationPrompt}
              expectedAnswer={expectedAnswer}
              setExpectedAnswer={setExpectedAnswer}
              allowedFormats={allowedFormats}
              setAllowedFormats={setAllowedFormats}
              theme={theme}
            />
          )}

          {qType === 'inline_dropdown' && (
            <InlineDropdownForm
              clozeTemplate={clozeTemplate}
              setClozeTemplate={setClozeTemplate}
              clozeDropdowns={clozeDropdowns}
              setClozeDropdowns={setClozeDropdowns}
              theme={theme}
            />
          )}

          {qType === 'proofreading' && (
            <ProofreadingForm
              rawText={rawText}
              setRawText={setRawText}
              correctedModelText={correctedModelText}
              setCorrectedModelText={setCorrectedModelText}
              theme={theme}
            />
          )}

          {qType === 'ordering' && (
            <OrderingForm
              orderItems={orderItems}
              setOrderItems={setOrderItems}
              theme={theme}
            />
          )}

          {qType === 'matching' && (
            <MatchingForm
              pairs={pairs}
              setPairs={setPairs}
              theme={theme}
            />
          )}

          {qType === 'true_false_justify' && (
            <TrueFalseForm
              tfCorrect={tfCorrect}
              setTfCorrect={setTfCorrect}
              modelJustification={modelJustification}
              setModelJustification={setModelJustification}
              theme={theme}
            />
          )}

          {['excel_simulation', 'image_to_excel', 'excel_grid'].includes(qType) && (
            <ExcelSimulationForm
              instructions={excelInstructions}
              setInstructions={setExcelInstructions}
              allowedExtensions={allowedExtensions}
              setAllowedExtensions={setAllowedExtensions}
              maxFileSizeMB={maxFileSizeMB}
              setMaxFileSizeMB={setMaxFileSizeMB}
              theme={theme}
            />
          )}

          {['image_to_word'].includes(qType) && (
            <WordSimulationForm
              instructions={wordInstructions}
              setInstructions={setWordInstructions}
              allowedExtensions={allowedExtensions}
              setAllowedExtensions={setAllowedExtensions}
              maxFileSizeMB={maxFileSizeMB}
              setMaxFileSizeMB={setMaxFileSizeMB}
              theme={theme}
            />
          )}

          {['summarize_word'].includes(qType) && (
            <SummarizeForm
              referenceText={referenceText}
              setReferenceText={setReferenceText}
              minWords={minWords}
              setMinWords={setMinWords}
              maxWords={maxWords}
              setMaxWords={setMaxWords}
              theme={theme}
            />
          )}
        </div>

        {error && <p className="text-red-500 text-sm font-medium mt-2">{error}</p>}

        {/* الأزرار */}
        <div className="flex gap-3 mt-5 border-t border-slate-100 dark:border-slate-800 pt-4">
          <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'جاري الحفظ...' : isEditMode ? 'تعديل السؤال' : 'حفظ السؤال'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      </div>
    </Modal>
  )
}