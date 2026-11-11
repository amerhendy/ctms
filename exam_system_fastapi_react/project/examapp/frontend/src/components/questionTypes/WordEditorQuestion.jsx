import { Color } from '@tiptap/extension-color'
import { TextAlign } from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
} from 'lucide-react'
import { useEffect } from 'react'

export default function WordEditorQuestion({ question, value, onChange }) {
  const { min_words, max_words, reference_text } = question.question_data || {}

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value?.html || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText().trim()
      const wordCount = text ? text.split(/\s+/).length : 0

      onChange({ text, html, wordCount })
    },
  })

  const currentText = editor?.getText().trim() || ''
  const wordCount = currentText ? currentText.split(/\s+/).length : 0

  if (!editor) return null
function QuestionHtmlViewer({ htmlContent }) {
  if (!htmlContent) return null

  return (
    <div
      className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-sm leading-relaxed"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}
  return (
    <div className="my-4 space-y-3">
      {reference_text && (
        <div className="bg-slate-100 p-4 rounded-lg border border-gray-200 text-sm text-gray-800 mb-3 leading-relaxed">
          <strong className="block text-xs text-gray-500 mb-1">الفقرة الأصلية للتلخيص / القراءة:</strong>
          <QuestionHtmlViewer htmlContent={reference_text} />
        </div>
      )}

      {/* شريط أدوات محاكي Word */}
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="bg-slate-50 border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-300' : ''}`}
            title="خط عريض"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-300' : ''}`}
            title="خط مائل"
          >
            <Italic className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''}`}
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''}`}
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''}`}
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-gray-300 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-300' : ''}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-300' : ''}`}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* محرر الكتابة ورقة العمل */}
        <div className="p-4 min-h-[180px] prose max-w-none focus:outline-none">
          <EditorContent editor={editor} />
        </div>

        {/* الشريط السفلي - عداد الكلمات */}
        <div className="bg-slate-50 border-t border-gray-200 px-3 py-1.5 text-xs text-gray-500 flex justify-between items-center">
          <span>عدد الكلمات: <strong>{wordCount}</strong></span>
          {(min_words || max_words) && (
            <span>
              النطاق المطلوب: {min_words || 0} - {max_words || 'غير محدد'} كلمة
            </span>
          )}
        </div>
      </div>
    </div>
  )
}