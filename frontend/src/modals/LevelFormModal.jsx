// srv/modals/LevelFormModal.jsx
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { orgApi } from '@/api'
import { Modal, FormField } from '@/components/common'
import { getApiError } from '@/utils/helpers'

export default function LevelFormModal({ level, onClose, onSuccess }) {
  const isEdit = !!level
  
  const mutation = useMutation({
    mutationFn: (data) => isEdit ? orgApi.updateLevel(level.id, data) : orgApi.createLevel(data),
    onSuccess: () => { 
      toast.success(isEdit ? 'تم تحديث البيانات' : 'تم إنشاء المستوى بنجاح')
      onSuccess() 
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: level ? {
      level_number: level.level_number,
      title: level.title,
      description: level.description || '',
    } : {},
  })

  return (
    <Modal open onClose={onClose} title={isEdit ? 'تعديل بيانات المستوى' : 'إضافة مستوى جديد'} size="lg">
      <form 
        onSubmit={handleSubmit(d => mutation.mutate({ ...d, level_number: parseInt(d.level_number) }))} 
        className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2"
      >
        <FormField label="رقم الفئة" required error={errors.level_number?.message}>
          <input type="number" className="input" {...register('level_number', { required: true })} disabled={isEdit} />
        </FormField>
        
        <FormField label="المسمى الوظيفي" required>
          <input className="input" {...register('title', { required: true })} />
        </FormField>
        
        <div className="md:col-span-2">
          <FormField label="الوصف">
            <textarea className="input h-24 p-3" {...register('description')} />
          </FormField>
        </div>
        
        <div className="md:col-span-2 flex gap-3 pt-3 mt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 py-2.5">إلغاء</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 py-2.5">
            {mutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </form>
    </Modal>
  )
}