// src/modals/CreateLocationFormModal.jsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { LocationApi } from '@/api'
import { Modal } from '@/components/common'
import LocationTreeSelectModal from './LocationTreeSelectModal'
import { FolderTree, X } from 'lucide-react'

export default function LocationFormModal({ location, onClose, onSuccess }) {
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false)
  const [selectedParentName, setSelectedParentName] = useState(location?.parent_name || '')

  // تهيئة الـ Form مع الحفاظ على القيم الافتراضية
  const { register, handleSubmit, setValue, watch } = useForm({ 
    defaultValues: location || { is_active: true, parent_id: null } 
  })

  const parentId = watch('parent_id')

  const mutation = useMutation({
    mutationFn: (data) => location?.id 
      ? LocationApi.updateLocation(location.id, data) 
      : LocationApi.createLocation(data),
    onSuccess: () => {
      toast.success('تم الحفظ بنجاح')
      onSuccess()
    },
    onError: () => toast.error('حدث خطأ أثناء الحفظ')
  })

  const handleSelectParent = (node) => {
    if (node === null) {
      setValue('parent_id', null, { shouldDirty: true })
      setSelectedParentName('')
    } else {
      setValue('parent_id', node.id, { shouldDirty: true })
      setSelectedParentName(node.name)
    }
    setIsTreeModalOpen(false)
  }

  return (
    <>
      <Modal open onClose={onClose} title={location ? "تعديل موقع" : "إضافة موقع"}>
        <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">اسم الموقع</label>
            <input {...register('name', { required: true })} placeholder="أدخل اسم الموقع" className="input w-full" />
          </div>

          {/* حقل اختيار الموقع الأب عبر الشجرة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الموقع الرئيسي (الأب)</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 input bg-gray-50 flex items-center justify-between text-sm py-2">
                <span className={selectedParentName ? "text-gray-900" : "text-gray-400"}>
                  {selectedParentName || "موقع رئيسي جذري (بدون أب)"}
                </span>
                {parentId && (
                  <button 
                    type="button" 
                    onClick={() => handleSelectParent(null)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button 
                type="button" 
                onClick={() => setIsTreeModalOpen(true)}
                className="btn-secondary flex items-center gap-1"
              >
                <FolderTree size={16} />
                <span>اختر الأب</span>
              </button>
            </div>
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer pt-2">
            <input type="checkbox" {...register('is_active')} className="w-4 h-4 rounded text-blue-600" />
            <span className="text-sm font-medium text-gray-700">موقع مفعل</span>
          </label>

          <button type="submit" disabled={mutation.isLoading} className="btn-primary w-full mt-4">
            {mutation.isLoading ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </form>
      </Modal>

      {/* مودل اختيار الشجرة */}
      <LocationTreeSelectModal 
        isOpen={isTreeModalOpen}
        onClose={() => setIsTreeModalOpen(false)}
        onSelect={handleSelectParent}
        selectedId={parentId}
        currentLocationId={location?.id}
      />
    </>
  )
}