// src/modals/DepartmentFormModal.jsx
import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { orgApi } from '@/api'
import { Modal, FormField } from '@/components/common'
import { getApiError } from '@/utils/helpers'
import DepartmentTreeModal from '@/modals/DepartmentTreeModal'


export default function DepartmentFormModal({ dept, parentId, levels, locations, allDepts, onClose, onSuccess }) {
  const isEdit = !!dept
  const [isTreeOpen, setIsTreeOpen] = useState(false)
  const [selectedParentName, setSelectedParentName] = useState('— إدارة رئيسية مستقرة (جذر) —')

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? orgApi.updateDept(dept.id, data) : orgApi.createDept(data),
    onSuccess: () => { 
      toast.success(isEdit ? 'تم تحديث بيانات القسم' : 'تم إضافة الإدارة الجديدة للهيكل')
      onSuccess() 
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: dept ? {
      name: dept.name,
      parent_department_id: dept.parent_department_id || '',
      job_level_id: dept.job_level_id || '',
      location_id: dept.location_id || '',
      is_active: dept.is_active,
    } : {
      parent_department_id: parentId || '',
      is_active: true,
    },
  })

  const currentParentId = watch('parent_department_id')

  useEffect(() => {
    if (currentParentId && Array.isArray(allDepts)) {
      const found = allDepts.find(d => d.id === parseInt(currentParentId))
      if (found) setSelectedParentName(found.name)
    } else {
      setSelectedParentName('— إدارة رئيسية مستقرة (جذر) —')
    }
  }, [currentParentId, allDepts])

  const handleParentSelect = (id, name) => {
    setValue('parent_department_id', id ? id.toString() : '', { shouldValidate: true })
    setSelectedParentName(name || '— إدارة رئيسية مستقرة (جذر) —')
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'تعديل الإدارة' : 'إدراج إدارة جديدة'} size="md">
      <form 
        onSubmit={handleSubmit(d => mutation.mutate({
          ...d,
          parent_department_id: d.parent_department_id ? parseInt(d.parent_department_id) : null,
          job_level_id: d.job_level_id ? parseInt(d.job_level_id) : null,
          location_id: d.location_id ? parseInt(d.location_id) : null,
        }))} 
        className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-right"
      >
        <div className="md:col-span-2">
            <FormField label="اسم الإدارة" required>
              <input className="input dark:bg-gray-800 dark:border-gray-700 dark:text-white" {...register('name', { required: true })} />
              </FormField>
        </div>
        
        <FormField label="التبعية الهيكلية">
          <button type="button" onClick={() => setIsTreeOpen(true)} className="input w-full text-right flex justify-between items-center bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-200">
            <span>{selectedParentName}</span>
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded">تصفح الهيكل</span>
          </button>
          <input type="hidden" {...register('parent_department_id')} />
        </FormField>
        
        <FormField label="المستوى التنظيمي">
          <select className="input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" {...register('job_level_id')}>
            <option value="">— غير محدد —</option>
            {levels.map(l => <option key={l.id} value={l.id}>درجة {l.level_number} - {l.title}</option>)}
          </select>
        </FormField>

        <FormField label="الموقع الجغرافي">
          <select className="input dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" {...register('location_id')}>
            <option value="">— غير محدد —</option>
            {locations?.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
          </select>
        </FormField>

        {isEdit && (
          <label className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer border border-gray-100 dark:border-gray-700">
            <input type="checkbox" className="accent-primary-600" {...register('is_active')} /> 
            <span className="dark:text-gray-200">نشط</span>
          </label>
        )}
        
        <button type="submit" disabled={mutation.isPending} className="btn-primary w-full md:col-span-2">حفظ</button>
      </form>

      <DepartmentTreeModal
        isOpen={isTreeOpen}
        onClose={() => setIsTreeOpen(false)}
        departments={allDepts.filter(d => d.id !== dept?.id)}
        selectedId={currentParentId ? parseInt(currentParentId) : null}
        onSelect={handleParentSelect}
      />
    </Modal>
  )
}