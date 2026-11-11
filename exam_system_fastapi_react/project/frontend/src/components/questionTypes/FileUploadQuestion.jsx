import { useState } from 'react'

export default function FileUploadQuestion({ value, onChange }) {
  const [fileName, setFileName] = useState(value?.name || '')

  function handleFileChange(e) {
      const file = e.target.files[0]
      if (file) {
        setFileName(file.name)
        // 🟢 التعديل: إرسال Object متوافق مع Dict
        onChange({
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          // إذا كان يتم رفعه مسبقاً وسحب رابط: file_url: "..."
        })
      }
    }

  return (
    <div className="my-4 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100/80 transition-colors">
      <input
        type="file"
        id="file-upload"
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg"
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center">
        <span className="text-3xl mb-2">📁</span>
        <span className="text-sm font-medium text-gray-700">اضغط هنا لرفع الملف المطلوب</span>
        <span className="text-xs text-gray-400 mt-1">المستندات المدعومة: PDF, Word, Excel, أو صور</span>
      </label>

      {fileName && (
        <div className="mt-4 p-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold inline-flex items-center gap-2">
          <span>✓ تم اختيار: {fileName}</span>
        </div>
      )}
    </div>
  )
}