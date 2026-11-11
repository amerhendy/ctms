import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import ExamQuestion from '../components/ExamQuestion'
import QuestionNav from '../components/QuestionNav'
import { useExamTimer } from '../hooks/useExamTimer'
import { useSyncLoop, useViolationDetectors } from '../hooks/useExamGuards'
import ConfirmSubmitModal from '../modals/ConfirmSubmitModal'
import { useExamStore } from '../stores/examStore'

import { SYNC_LABELS } from '../constants/index'
import {Toast} from '../components/common'
export default function ExamPage() {
  const navigate = useNavigate()
  const user = useExamStore((s) => s.user)
  const questions = useExamStore((s) => s.questions)
  const currentIndex = useExamStore((s) => s.currentIndex)
  const answers = useExamStore((s) => s.answers)
  const syncStatus = useExamStore((s) => s.syncStatus)
  const setAnswer = useExamStore((s) => s.setAnswer)
  const goToQuestion = useExamStore((s) => s.goToQuestion)
  const finishExam = useExamStore((s) => s.finishExam)

  const toastMessage = useExamStore((s) => s.toastMessage)
  const clearToast = useExamStore((s) => s.clearToast)

  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  const mainRef = useRef(null)
  const navRef = useRef(null)

  // 🟢 عند تغيير السؤال: نرجّع منطقة السؤال لأولها
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [currentIndex])

  // 1. التوجيه الآمن في حال عدم وجود بيانات
  useEffect(() => {
    if (!user || !questions || questions.length === 0) {
      navigate('/', { replace: true })
    }
  }, [user, questions, navigate])

  // 2. تفعيل معالجات المزامنة والمراقبة
  useSyncLoop()
  useViolationDetectors()

  // 3. منع إغلاق الصفحة أو إعادة التحميل العرضية أثناء الاختبار
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!submitting) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [submitting])

  // 4. تسليم الاختبار
  const handleFinish = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await finishExam()
      navigate('/result', { replace: true })
    } catch (err) {
      console.error('Failed to submit exam:', err)
    } finally {
      setSubmitting(false)
    }
  }, [finishExam, navigate, submitting])

  const handleExpire = useCallback(() => {
    handleFinish()
  }, [handleFinish])

  // 5. العداد الزمني
  const timer = useExamTimer(user?.exam_started_at, user?.duration_minutes || 60, handleExpire)

  // 6. دعم التنقل بأسهم الكيبورد (Right/Left)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // تجنب التنقل إذا كان التركيز داخل مدخل نصي أو textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return

      if (e.key === 'ArrowLeft' && currentIndex < questions.length - 1) {
        goToQuestion(currentIndex + 1)
      } else if (e.key === 'ArrowRight' && currentIndex > 0) {
        goToQuestion(currentIndex - 1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, questions.length, goToQuestion])

  if (!user || !questions || questions.length === 0) {
    return null
  }

  const currentQuestion = questions[currentIndex]
  const syncLabel = SYNC_LABELS[syncStatus] || SYNC_LABELS.idle
  const answeredCount = Object.keys(answers).length

  return (
    <div className="h-screen flex flex-col bg-slate-100 text-slate-800 dir-rtl overflow-hidden">
      <Toast
        isOpen={Boolean(toastMessage)}
        message={toastMessage || ''}
        title="تنبيه مخالفة!"
        type="warning"
        duration={4000}
        onClose={clearToast}
      />

      {/* ── Header ───────────────────────────── */}
      <header className="shrink-0 bg-blue-800 text-white px-5 py-3 flex items-center justify-between flex-wrap gap-2 shadow-md z-20">
        <div className="flex flex-col">
          <h2 className="text-sm sm:text-base font-semibold leading-tight">
            {user.full_name}
          </h2>
          <span className="text-[11px] text-blue-200 mt-0.5">{user.job_model_name}</span>
        </div>

        <div
          className={`px-3 py-1 rounded-lg bg-black/25 text-xl sm:text-2xl font-bold tabular-nums tracking-wider transition-colors ${
            timer?.isWarning ? 'text-red-300 animate-pulse bg-red-900/50' : 'text-white'
          }`}
        >
          {timer?.display}
        </div>

        <span
          className={`inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full transition-colors ${syncLabel.className}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              syncStatus === 'syncing' ? 'bg-amber-900 animate-ping' : 'bg-current'
            }`}
          />
          {syncLabel.text}
        </span>
      </header>

      {/* ── شريط الأرقام الأفقي ─────────────────── */}
      <div className="shrink-0 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                السؤال {currentIndex + 1} من {questions.length}
              </span>
              <span className="text-[11px] text-slate-400">•</span>
              <span className="text-[11px] text-slate-500">
                تم الإجابة على {answeredCount} سؤال
              </span>
            </div>

            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> الحالي
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> مُجاب
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300" /> لم يُجب
              </span>
            </div>
          </div>

          <QuestionNav
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            onSelect={goToQuestion}
          />
        </div>
      </div>

      {/* ── منطقة السؤال (flex-1 + scroll داخلي) ── */}
      <main
        ref={mainRef}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-thin"
      >
        <div className="max-w-screen mx-auto w-full p-4 sm:p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-7">
            {currentQuestion && (
              <ExamQuestion
                question={currentQuestion}
                index={currentIndex}
                savedAnswer={answers[String(currentQuestion.id)]}
                onAnswer={(answerData) =>
                  setAnswer(String(currentQuestion.id), answerData)
                }
              />
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ثابت ────────────────────────── */}
      <footer className="shrink-0 bg-white border-t border-slate-200 px-5 py-3 shadow-lg z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goToQuestion(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            >
              ← السابق
            </button>

            <span className="text-sm font-medium text-slate-500 px-3 tabular-nums">
              {currentIndex + 1} / {questions.length}
            </span>

            <button
              type="button"
              onClick={() => goToQuestion(currentIndex + 1)}
              disabled={currentIndex === questions.length - 1}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
            >
              التالي →
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors duration-150 shadow-sm"
          >
            إنهاء وتسليم الاختبار
          </button>
        </div>
      </footer>

      <ConfirmSubmitModal
        open={showConfirm}
        submitting={submitting}
        onConfirm={() => {
          setShowConfirm(false)
          handleFinish()
        }}
        onCancel={() => setShowConfirm(false)}
      />

      {submitting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl flex items-center gap-3">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-slate-800 font-semibold text-sm">جاري تسليم الاختبار...</p>
          </div>
        </div>
      )}
    </div>
  )
}