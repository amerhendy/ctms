// src/components/tasks/TaskAttachmentsSection.jsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Paperclip, Trash2, Download, Loader2, ArrowDownCircle } from 'lucide-react'
import { FileImage, FileText, FileSpreadsheet, FileArchive, FileCode } from 'lucide-react'
import toast from 'react-hot-toast'
import { attachmentsApi } from '@/api'
import useAuthStore from '@/stores/authStore'
import { saveAs } from 'file-saver'

export default function TaskAttachmentsSection({ taskId, taskPermissions }) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [isUploading, setIsUploading] = useState(false)
  const [downloadingFileId, setDownloadingFileId] = useState(null)

  // 🌟 إدارة حالة الترقيم والـ Pagination محلياً للمرفقات
  const [attachmentsPage, setAttachmentsPage] = useState(1)
  const [allAttachments, setAllAttachments] = useState([]) // المصفوفة التجميعية للمرفقات

  // جلب المرفقات والوثائق الرسمية للمهمة بنظام الترقيم (طلب 20 عنصر)
  const { data: attachmentsPaginationData, isLoading } = useQuery({
    queryKey: ['task-attachments', taskId, { attachmentsPage }],
    queryFn: () => attachmentsApi.listAttachments(taskId, { page: attachmentsPage, limit: 20 }).then(r => r.data),
    enabled: !!taskId,
    placeholderData: (keepPreviousData) => keepPreviousData,
  })

  // استخراج مؤشرات الترقيم الفنية من استجابة الباك إند
  const totalAttachments = attachmentsPaginationData?.total || 0
  const hasMoreAttachments = attachmentsPaginationData?.has_more ?? false
  

  // 🌟 تنفيذ شرطك الفني بالملّي: الصفحة 1 تمسح القديم، والصفحات التالية تدمج بدون تكرار
  useEffect(() => {
    if (attachmentsPaginationData?.items) {
      if (attachmentsPage === 1) {
        // أول طلب (الصفحة 1): امسح القديم تماماً ونزل أول 20 ملف على نظافة
        setAllAttachments(attachmentsPaginationData.items)
      } else {
        // الطلبات التالية (صفحة 2 فما فوق): ضيف الجديد على القديم بدون مسح مع منع التكرار
        setAllAttachments(prev => {
          const existingIds = new Set(prev.map(item => item.id))
          const newItems = attachmentsPaginationData.items.filter(item => !existingIds.has(item.id))
          return [...prev, ...newItems]
        })
      }
    }
  }, [attachmentsPaginationData, attachmentsPage])

  // رفع مستند أو ملف جديد
  const uploadMutation = useMutation({
    mutationFn: (file) => attachmentsApi.addAttachment(taskId, file),
    onMutate: () => setIsUploading(true),
    onSuccess: () => {
      setAttachmentsPage(1) // 🌟 التصفير الفوري للصفحة الأولى لعرض الملف الجديد بأعلى القائمة ونظافة الـ State
      queryClient.invalidateQueries({ queryKey: ['task-attachments', taskId] })
      toast.success('تم رفع الملف بنجاح وإدراجه في المهمة')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'فشلت عملية رفع الملف'),
    onSettled: () => setIsUploading(false)
  })

  // دالة تحميل الملفات وحفظها محلياً بأمان
  const handleDownload = async (file) => {
    try {
      setDownloadingFileId(file.id)
      const response = await attachmentsApi.downloadAttachment(taskId, file.id)
      saveAs(response.data, file.file_name)
    } catch (error) {
      toast.error('حدث خطأ فني أثناء تحميل الملف، يرجى المحاولة لاحقاً')
    } finally {
      setDownloadingFileId(null)
    }
  }

  // حذف المرفق نهائياً من نظام إدارة الوثائق
  const deleteMutation = useMutation({
    mutationFn: (attachmentId) => attachmentsApi.deleteAttachment(taskId, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', taskId] })
      // حذف محلي فوري من الـ State لسرعة الاستجابة بالواجهة (UX)
      setAllAttachments(prev => prev.filter(item => item.id !== deleteMutation.variables))
      toast.success('تم حذف المرفق بنجاح من النظام')
    },
    onError: (err) => toast.error(err.response?.data?.detail || 'فشلت عملية حذف المرفق')
  })

  // استخراج الصلاحيات الإدارية المنبثقة من النظام
  const canAdd = taskPermissions?.can_add_attachment ?? false
  const canDeleteAny = taskPermissions?.can_delete_any_attachment ?? false
  const canDeleteOwn = taskPermissions?.can_delete_own_attachment ?? false

  // التحقق الفني من صلاحية الحذف الإداري للملف الحالي
  const canDeleteAttachment = (attachmentUserId) => {
    if (canDeleteAny) return true
    if (canDeleteOwn && attachmentUserId === user?.id) return true
    return false
  }

  // فحص صيغ وأحجام الملفات المرفوعة قبل الإرسال للخادم
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 
      'csv', 'ppt', 'pptx', 'mdb', 'accdb', 'txt', 'sql', 'zip', 'rar',
      'dwg', 'dxf', 'stl', 'step', 'iges'
    ]
    const fileExtension = file.name.split('.').pop().toLowerCase()
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast.error('صيغة الملف غير مدعومة ضمن اللائحة الفنية للنظام')
      return
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً! الحد الأقصى المسموح به هو 10 ميجابايت')
      return
    }
    
    uploadMutation.mutate(file)
  }

  // تخصيص الأيقونات والألوان بحسب الامتداد الوظيفي للمستند
  const getFileIcon = (mimeType, fileName) => {
    const type = mimeType?.toLowerCase() || ''
    const ext = fileName?.split('.').pop()?.toLowerCase() || ''
    
    if (type.startsWith('image/')) return <FileImage className="w-5 h-5 text-blue-500 flex-shrink-0" />
    if (type === 'application/pdf' || ext === 'pdf') return <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
    if (type.includes('word') || type.includes('officedocument.wordprocessingml') || ['doc', 'docx'].includes(ext))
      return <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
    if (type.includes('excel') || type.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext))
      return <FileSpreadsheet className="w-5 h-5 text-green-600 flex-shrink-0" />
    if (type.includes('powerpoint') || ['ppt', 'pptx'].includes(ext))
      return <FileText className="w-5 h-5 text-orange-500 flex-shrink-0" />
    if (type.includes('access') || ['mdb', 'accdb'].includes(ext))
      return <FileSpreadsheet className="w-5 h-5 text-red-700 flex-shrink-0" />
    if (type.startsWith('text/') || ['txt', 'sql'].includes(ext))
      return <FileCode className="w-5 h-5 text-purple-500 flex-shrink-0" />
    if (type.includes('zip') || type.includes('x-rar') || ['zip', 'rar'].includes(ext))
      return <FileArchive className="w-5 h-5 text-amber-600 flex-shrink-0" />
    
    return <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
  }

  // تحويل حجم الملف لوحدات قياسية مقروءة بدقة
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // دالة معالجة "عرض المزيد" للمرفقات
  const handleLoadMore = () => {
    if (isLoading || !hasMoreAttachments) return
    setAttachmentsPage(prev => prev + 1)
  }

  return (
    <div className="p-4 sm:p-5 space-y-4" dir="rtl">
      {/* الهيدر العلوي وأداة رفع الملفات السريعة */}
      <div className="flex items-center justify-between border-b border-gray-50 pb-3">
        <h3 className="text-xs sm:text-sm font-bold text-gray-950 flex items-center gap-1.5">
          <span className="w-1.5 h-3 bg-[var(--color-primary-600)] rounded-sm inline-block" />
          <Paperclip className="w-4 h-4 text-gray-400" />
          <span>المرفقات والوثائق الفنية ({totalAttachments})</span>
        </h3>

        {canAdd && (
          <label className={`flex items-center gap-1.5 text-xs bg-[var(--color-primary-50)] text-[var(--color-primary-600)] border border-[var(--color-primary-100)] px-3 py-1.5 rounded-lg font-bold cursor-pointer hover:bg-[var(--color-primary-600)] hover:text-white transition-all shadow-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
            <span>{isUploading ? 'جاري الرفع الفني...' : 'إضافة ملف للمهمة'}</span>
            <input type="file" className="hidden" onChange={handleFileChange} disabled={isUploading} />
          </label>
        )}
      </div>

      {/* عرض وتحميل ملفات فريق العمل */}
      {isLoading && allAttachments.length === 0 ? (
        <div className="text-center py-6 text-xs font-medium text-gray-400">جاري مراجعة وفحص أرشيف المستندات...</div>
      ) : allAttachments.length === 0 ? (
        <div className="text-center py-8 text-xs font-medium text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
          لا توجد وثائق أو مخططات مرفقة بهذه المهمة الإدارية بعد.
        </div>
      ) : (
        <div className="flex flex-col space-y-3">
          {/* حاوية شبكة المرفقات المسموح بالتمرير داخلها */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pl-1 custom-scrollbar">
            {allAttachments.map((file) => {
              const isCurrentFileDownloading = downloadingFileId === file.id;
              const isCurrentFileDeleting = deleteMutation.isPending && deleteMutation.variables === file.id;

              return (
                <div key={file.id} className="flex items-center justify-between gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-100 group hover:bg-white hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {getFileIcon(file.mime_type, file.file_name)}

                    <div className="flex-1 min-w-0 space-y-0.5 text-right">
                      <p className="text-xs font-bold text-gray-800 truncate" title={file.file_name}>
                        {file.file_name}
                      </p>
                      <p className="text-[10px] text-gray-400 flex items-center gap-1.5 justify-start">
                        <span className="font-semibold text-gray-500">{formatFileSize(file.file_size)}</span>
                        <span className="text-gray-300">•</span>
                        <span className="truncate" title={file.user_name}>{file.user_name || 'موظف بالنظام'}</span>
                      </p>
                    </div>
                  </div>

                  {/* لوحة التحكم بالإجراءات (التحميل والحذف الفوري) */}
                  <div className="flex items-center gap-1 bg-white sm:bg-transparent p-1 sm:p-0 rounded-lg border border-gray-100 sm:border-0 shadow-sm sm:shadow-none flex-shrink-0">
                    <button 
                      onClick={() => handleDownload(file)}
                      disabled={isCurrentFileDownloading || isCurrentFileDeleting}
                      className="p-1.5 text-gray-400 hover:text-[var(--color-primary-600)] hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-40"
                      title="تحميل الملف"
                    >
                      {isCurrentFileDownloading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>
                    
                    {canDeleteAttachment(file.user_id) && (
                      <button
                        onClick={() => {
                          if (window.confirm(`هل أنت متأكد من رغبتك في حذف وإزالة المستند "${file.file_name}" نهائياً من أرشيف المهمة؟`)) {
                            deleteMutation.mutate(file.id)
                          }
                        }}
                        disabled={isCurrentFileDownloading || isCurrentFileDeleting}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                        title="حذف المستند"
                      >
                        {isCurrentFileDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {/* 🌟 زر "عرض المزيد" الخاص بالمرفقات والمستندات بأسفل الشبكة */}
            {hasMoreAttachments && (
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
                  <span>عرض المزيد من الوثائق</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}