// src/modals/CreateLocationFormModal.jsx
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { LocationApi } from '@/api'
import { Modal } from '@/components/common'

export default function LocationFormModal({ location, onClose, onSuccess }) {
  // القيمة الافتراضية للـ is_active هي true عند الإضافة الجديدة
  const { register, handleSubmit } = useForm({ 
    defaultValues: location || { is_active: true } 
  })

  const mutation = useMutation({
    mutationFn: (data) => location?.id 
      ? LocationApi.updateLocation(location.id, data) 
      : LocationApi.createLocation(data),
    onSuccess: () => {
      toast.success('تم الحفظ بنجاح')
      onSuccess()
    },
    onError: () => toast.error('حدث خطأ')
  })

  return (
    <Modal open onClose={onClose} title={location ? "تعديل موقع" : "إضافة موقع"}>
      <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-4">
        <input {...register('name', { required: true })} placeholder="اسم الموقع" className="input" />
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" {...register('is_active')} className="w-4 h-4" />
          <span>موقع مفعل</span>
        </label>

        <button type="submit" disabled={mutation.isLoading} className="btn-primary w-full">
          {mutation.isLoading ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </form>
    </Modal>
  )
}