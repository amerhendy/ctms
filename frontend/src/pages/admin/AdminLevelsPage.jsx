// AdminLevelsPage.jsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Settings, Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { orgApi } from '@/api'
import { PageLoader, Modal, FormField } from '@/components/common'
import { getApiError } from '@/utils/helpers'
import LevelFormModal from '@/modals/LevelFormModal'
import useAuthStore from '@/stores/authStore'
import PageHeader from '@/components/common/pageheader'
export default function AdminLevelsPage() {
  const qc = useQueryClient()
  const { isAdmin } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [editLevel, setEditLevel] = useState(null)

  const { data: levels, isLoading } = useQuery({
    queryKey: ['job-levels'],
    queryFn: () => orgApi.listLevels().then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => orgApi.deleteLevel(id),
    onSuccess: () => { 
      toast.success('تم حذف المستوى بنجاح')
      qc.invalidateQueries(['job-levels']) 
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5 max-w-3xl">
      {/* الهيدر العلوي */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <PageHeader title="المستويات الوظيفية للمؤسسة" icon={Settings}>
        {isAdmin() && (
          <button 
            onClick={() => { setEditLevel(null); setShowModal(true) }} 
            className="btn-primary w-full sm:w-auto justify-center"
          >
            <Plus className="w-4 h-4" />
            <span>مستوى جديد</span>
          </button>
        )}
      </PageHeader>
      </div>

      {/* حاوية الجدول المتجاوبة */}
      <div className="card overflow-hidden p-0 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        
        {/* 1. مظهر الجدول للشاشات المتوسطة والكبيرة (يبدأ من sm) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm text-right" dir="rtl">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
              <tr>
                <th className="py-3.5 px-4 w-28">رقم المستوى</th>
                <th className="py-3.5 px-4">المسمى الوظيفي</th>
                <th className="py-3.5 px-4">الوصف الصلاحي</th>
                <th className="py-3.5 px-4 text-left pl-6 w-28">الإجراءات</th>
              </tr>
            </thead>
           <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {(levels || []).map(l => (
                <tr key={l.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="py-3.5 px-4">
                   <span className="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm border transition-colors 
                      bg-primary-50 text-primary-700 border-primary-100 
                      dark:bg-gray-900 dark:text-orange-500 dark:border-transparent">
                      {l.level_number}
                    </span>
                  </td>
                  <td className="font-medium text-gray-700 dark:text-gray-300">{l.title}</td>
                  <td className="font-medium text-gray-700 dark:text-gray-300 truncate">{l.description || '—'}</td>
                  <td className="py-3.5 px-4 text-left pl-5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => { setEditLevel(l); setShowModal(true) }}
                        className="text-primary-600 dark:text-primary-400 hover:dark:bg-gray-900 dark:hover:bg-primary-950/30 p-2 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                          onClick={() => { if(confirm('هل أنت متأكد من الحذف؟')) deleteMutation.mutate(l.id) }}
                          className="text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 2. مظهر الكروت المكدسة لشاشات الموبايل الصغيرة جداً (أقل من sm) */}
        <div className="block sm:hidden divide-y divide-gray-100">
          {(levels || []).map(l => (
            <div key={l.id} className="p-4 flex flex-col gap-3 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 bg-[var(--color-primary-50)] text-[var(--color-primary-700)] rounded-md flex items-center justify-center font-bold text-xs border border-[var(--color-primary-100)]">
                    {l.level_number}
                  </span>
                  <span className="font-bold text-gray-950 text-sm">{l.title}</span>
                </div>
                
                {/* أزرار التحكم بالموبايل متباعدة ومريحة للمس */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => { setEditLevel(l); setShowModal(true) }}
                    className="p-2 text-[var(--color-primary-600)] bg-gray-50 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { if(confirm('هل أنت متأكد من الحذف؟')) deleteMutation.mutate(l.id) }}
                    className="p-2 text-red-500 bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {l.description && (
                <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded-lg border border-gray-100/60">
                  {l.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* حالة عدم وجود بيانات */}
        {(!levels || levels.length === 0) && (
          <p className="text-center text-gray-400 py-12 text-sm">لا توجد مستويات وظيفية مضافة حالياً</p>
        )}
      </div>

      {/* النافذة المنبثقة */}
      {showModal && (
        <LevelFormModal
          level={editLevel}
          onClose={() => { setShowModal(false); setEditLevel(null) }}
          onSuccess={() => { setShowModal(false); setEditLevel(null); qc.invalidateQueries(['job-levels']) }}
        />
      )}
    </div>
  )
}
