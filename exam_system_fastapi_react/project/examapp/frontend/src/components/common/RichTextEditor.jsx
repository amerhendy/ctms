import React, { useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {TextStyle} from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import TiptapUnderline from '@tiptap/extension-underline'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import Image from '@tiptap/extension-image'
import {Table} from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TextAlign from '@tiptap/extension-text-align'
import FontFamily from '@tiptap/extension-font-family'

import { 
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, 
  Subscript as SubIcon, Superscript as SuperIcon,
  RemoveFormatting, AlignRight, AlignCenter, AlignLeft,
  List, ListOrdered, Table as TableIcon, Image as ImageIcon,
  Calculator, EyeOff, Clock, Trash2, Undo, Redo, Type
} from 'lucide-react'

const MenuBar = ({ editor, estimatedTime }) => {
  if (!editor) return null

  // إضافة صورة
  const addImage = () => {
    const url = window.prompt('أدخل رابط الصورة (URL):')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  // إضافة رمز رياضي/معادلة بسيط
  const addSymbol = (symbol) => {
    editor.chain().focus().insertContent(symbol).run()
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 p-2 flex flex-wrap items-center gap-1.5 rounded-t-xl text-xs select-none">
      
      {/* التراجع واللواد */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded border">
        <button type="button" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30" title="تراجع"><Undo className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="p-1 hover:bg-slate-100 rounded disabled:opacity-30" title="إعادة"><Redo className="w-3.5 h-3.5" /></button>
      </div>

      {/* نوع الخط وحجمه */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded border">
        <select 
          onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
          className="text-xs bg-transparent border-0 focus:outline-none cursor-pointer"
        >
          <option value="Arial">Arial</option>
          <option value="Cairo">Cairo</option>
          <option value="Tahoma">Tahoma</option>
          <option value="Times New Roman">Times New Roman</option>
        </select>
      </div>

      {/* التنسيقات الأساسية */}
      <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 p-1 rounded border">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1 rounded ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : ''}`} title="Bold"><Bold className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1 rounded ${editor.isActive('underline') ? 'bg-blue-100 text-blue-600' : ''}`} title="Underline"><UnderlineIcon className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1 rounded ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : ''}`} title="Italic"><Italic className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1 rounded ${editor.isActive('strike') ? 'bg-blue-100 text-blue-600' : ''}`} title="ThrowLine"><Strikethrough className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleSubscript().run()} className={`p-1 rounded ${editor.isActive('subscript') ? 'bg-blue-100 text-blue-600' : ''}`} title="Subscript"><SubIcon className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleSuperscript().run()} className={`p-1 rounded ${editor.isActive('superscript') ? 'bg-blue-100 text-blue-600' : ''}`} title="Superscript"><SuperIcon className="w-3.5 h-3.5" /></button>
      </div>

      {/* مسح التنسيقات */}
      <button type="button" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} className="p-1.5 bg-white dark:bg-slate-900 rounded border hover:bg-red-50 text-red-600" title="Clear all format">
        <RemoveFormatting className="w-3.5 h-3.5" />
      </button>

      {/* الألوان والمحاذاة */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded border">
        <input type="color" onInput={(e) => editor.chain().focus().setColor(e.target.value).run()} className="w-4 h-4 p-0 border-0 cursor-pointer bg-transparent" title="Font Color" />
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} className="p-1 hover:bg-slate-100 rounded" title="Align Right"><AlignRight className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className="p-1 hover:bg-slate-100 rounded" title="Align Center"><AlignCenter className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className="p-1 hover:bg-slate-100 rounded" title="Align Left"><AlignLeft className="w-3.5 h-3.5" /></button>
      </div>

      {/* القوائم والصور والجداول */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded border">
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className="p-1 hover:bg-slate-100 rounded" title="List"><List className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className="p-1 hover:bg-slate-100 rounded" title="Numbered List"><ListOrdered className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="p-1 hover:bg-slate-100 rounded text-blue-600" title="Insert Table"><TableIcon className="w-3.5 h-3.5" /></button>
        <button type="button" onClick={addImage} className="p-1 hover:bg-slate-100 rounded text-green-600" title="Insert Image"><ImageIcon className="w-3.5 h-3.5" /></button>
      </div>

      {/* الرموز والملاحظات المخفية */}
      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded border">
        <button type="button" onClick={() => addSymbol('∑')} className="px-1 py-0.5 hover:bg-slate-100 rounded font-bold" title="Insert Symbol">∑</button>
        <button type="button" onClick={() => addSymbol('√')} className="px-1 py-0.5 hover:bg-slate-100 rounded font-bold" title="Insert Symbol">√</button>
        <button type="button" onClick={() => addSymbol('≠')} className="px-1 py-0.5 hover:bg-slate-100 rounded font-bold" title="Insert Symbol">≠</button>
        
        {/* ملاحظات للمعلم فقط */}
        <button 
          type="button" 
          onClick={() => editor.chain().focus().insertContent('<div class="trainer-note" style="background-color: #fef3c7; border-right: 4px solid #f59e0b; padding: 8px; margin: 8px 0;"><strong>🔒 ملاحظة للمعلم فقط:</strong> أدخل إجابتك النموذجية هنا...</div>').run()}
          className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200 hover:bg-amber-100"
          title="Hidden Hints / Solution Notes"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span className="text-[10px] font-semibold">ملاحظة مدرب</span>
        </button>
      </div>

      {/* مؤشر زمن القراءة للحل */}
      <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded border border-blue-200 mr-auto">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-[10px] font-bold">وقت القراءة المقدر: {estimatedTime} ثانية</span>
      </div>

    </div>
  )
}

export default function RichTextEditor({ value, onChange, placeholder = 'اكتب النص هنا...' }) {
  const [estimatedTime, setEstimatedTime] = useState(0)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      TiptapUnderline,
      Subscript,
      Superscript,
      Image,
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()
      
      // حساب زمن القراءة المقدر (متوسط سرعة القراءة باللغة العربية = 150 كلمة في الدقيقة)
      const wordsCount = text.trim().split(/\s+/).filter(Boolean).length
      const calculatedSeconds = Math.ceil((wordsCount / 150) * 60)
      setEstimatedTime(calculatedSeconds)

      onChange(html)
    },
  })

  return (
    <div className="border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm bg-slate-200 dark:bg-slate-950">
      <MenuBar editor={editor} estimatedTime={estimatedTime} />
      <div className="p-4 flex justify-center overflow-y-auto max-h-[450px]">
        <div className="w-full bg-white text-slate-900 shadow-md rounded-sm min-h-[250px] p-6 border border-slate-200">
          <EditorContent 
            editor={editor} 
            className="prose max-w-none focus:outline-none min-h-[200px]"
            placeholder={placeholder}
          />
        </div>
      </div>
    </div>
  )
}