import {InlineDropdownQuestion} from './questionTypes/InlineDropdownQuestion'
import {ProofreadingQuestion} from './questionTypes/ProofreadingQuestion'
import {TrueFalseJustifyQuestion} from './questionTypes/TrueFalseJustifyQuestion'
import {SjtQuestion} from './questionTypes/SjtQuestion'
import {MatchingQuestion} from './questionTypes/MatchingQuestion'
import {OrderingQuestion} from './questionTypes/OrderingQuestion'

import ExcelEditorQuestion from './questionTypes/ExcelEditorQuestion'
import FileUploadQuestion from './questionTypes/FileUploadQuestion'
import McqQuestion from './questionTypes/McqQuestion'
import WordEditorQuestion from './questionTypes/WordEditorQuestion'
import MathFormula from './questionTypes/MathFormula'
export default function ExamQuestion({ question, index, savedAnswer, onAnswer }) {
  if (!question) return null

  // توحيد مسميات الـ props لضمان التوافق مع مكون الصفحة الرئيسي
  const value = savedAnswer
  const onChange = onAnswer

  const { q_type, question_text, image_path } = question

  function renderQuestionInput() {
    
    switch (q_type) {
      case 'single_choice':
      case 'multiple_choice':
      case 'select_all':
        return <McqQuestion question={question} value={value} onChange={onChange} />

      case 'inline_dropdown':
        return <InlineDropdownQuestion question={question} value={value} onChange={onChange} />

      case 'proofreading':
        return <ProofreadingQuestion question={question} value={value} onChange={onChange} />

      case 'ordering':
        return <OrderingQuestion question={question} value={value} onChange={onChange} />

      case 'matching':
        return <MatchingQuestion question={question} value={value} onChange={onChange} />

      case 'sjt':
        return <SjtQuestion question={question} value={value} onChange={onChange} />

      case 'true_false_justify':
        return <TrueFalseJustifyQuestion value={value} onChange={onChange} />

      case 'file_upload':
        return <FileUploadQuestion value={value} onChange={onChange} />

      case 'word_editor':
      case 'summarize_word':
      case 'image_to_word':
        return <WordEditorQuestion question={question} value={value} onChange={onChange} />

      case 'excel_grid':
      case 'image_to_excel':
        return <ExcelEditorQuestion question={question} value={value} onChange={onChange} />

      case 'math_formula':
        return <MathFormula question={question} value={value} onChange={onChange} />
      default:
        return (
          <textarea
            rows={4}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="أدخل إجابتك هنا..."
            className="w-full my-3 p-3.5 text-sm rounded-xl border border-slate-300 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white transition-all duration-150 resize-y"
          />
        )
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* رأس السؤال مع الشارة */}
      <div className="flex items-start gap-3 mb-4">
        {typeof index === 'number' && (
          <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
            {index + 1}
          </span>
        )}
        <h3 className="text-base font-bold text-slate-800 leading-relaxed flex-1">
          {question_text}
        </h3>
      </div>

      {/* صورة السؤال إن وجدت */}
      {image_path && (
        <div className="my-3 max-w-lg mx-auto overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-inner">
          <img 
            src={image_path} 
            alt="سؤال مصور" 
            className="w-full h-auto max-h-80 object-contain rounded-lg" 
          />
        </div>
      )}

      {/* منطقة الإدخال الخاصة بنوع السؤال */}
      <div className="flex-1 mt-2">
        {renderQuestionInput()}
      </div>
    </div>
  )
}