// src/pages/admin/UserFormModal.jsx
import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Lock, User, Mail, Briefcase, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { usersApi, orgApi } from '@/api'
import { Modal, FormField } from '@/components/common'
import { getApiError } from '@/utils/helpers'
import useAuthStore from '@/stores/authStore'
// 🌟 استيراد مكون المودال الشجري الخاص بك
import DepartmentTreeModal from '@/components/common/DepartmentTreeModal'

export default function UserFormModal({ user, onClose, onSuccess }) {
  const { isAdmin } = useAuthStore()
  const isEdit = !!user
  
  
  const [showPassword, setShowPassword] = useState(false)
  
  // 🌟 حالات التحكم في فتح المودال الشجري وتخزين الاسم المرئي للإدارة المحددة
  const [isTreeOpen, setIsTreeOpen] = useState(false)
  const [selectedDeptName, setSelectedDeptName] = useState('— اضغط للاختيار من الهيكل التنظيمي —')

  // جلب البيانات المساعدة لخيارات الاختيار
  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => orgApi.listDepts({ is_active: true }).then(r => r.data),
  })
  const { data: levels } = useQuery({
    queryKey: ['job-levels'],
    queryFn: () => orgApi.listLevels().then(r => r.data),
  })
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => orgApi.listLocations().then(r => r.data),
  })

  // دالة الحفظ أو التعديل
  const mutation = useMutation({
    mutationFn: (data) => isEdit ? usersApi.update(user.id, data) : usersApi.create(data),
    onSuccess: () => {
      toast.success(isEdit ? 'تم تحديث بيانات الموظف بنجاح' : 'تم إنشاء حساب الموظف الجديد بنجاح')
      onSuccess()
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  // 🌟 تعريف الحقول مع react-hook-form وsetValue لتحديث الحقل المخفي
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { global_role: 'user', is_active: true, department_id: '' }
  })

  // مراقبة القيمة الحالية للمعرف المختار لربطه بالمودال الشجري
  const currentDeptId = watch('department_id')

  // ملء الحقول وتحديث اسم الإدارة عند فتح المودال في حالة التعديل
  useEffect(() => {
    if (user && depts && levels && locations) {
      const deptId = user.department_id || ''
      reset({
        full_name: user.full_name,
        job_title: user.job_title,
        email: user.email,
        employee_number: user.employee_number,
        global_role: user.global_role,
        department_id: deptId.toString(),
        job_level_id: user.job_level_id?.toString() || '',
        can_transfer_external: !!user.can_transfer_external,
        is_active: !!user.is_active,
        work_location_id: user.work_location_id?.toString() || '',
      })

      // العثور على اسم الإدارة الحالي لعرضه للمستخدم بدلاً من المعرف الرقمي
      if (user.department?.name) {
        setSelectedDeptName(user.department.name)
      } else if (deptId && Array.isArray(depts)) {
        const found = depts.find(d => d.id === parseInt(deptId))
        if (found) setSelectedDeptName(found.name)
      } else {
        setSelectedDeptName('— لا توجد (إدارة عليا / رئيسية) —')
      }
    }
  }, [user, depts, levels, locations, reset])

  // 🌟 معالج حدث اختيار إدارة من المودال الشجري الخاص بك
  const handleDepartmentSelect = (id, name) => {
    setValue('department_id', id ? id.toString() : '', { shouldValidate: true })
    setSelectedDeptName(name || '— لا توجد (إدارة عليا / رئيسية) —')
  }

  const onSubmitForm = (data) => {
    const payload = {
      ...data,
      department_id: data.department_id ? parseInt(data.department_id) : null,
      job_level_id: data.job_level_id ? parseInt(data.job_level_id) : null,
      work_location_id: data.work_location_id ? parseInt(data.work_location_id) : null,
    }
    
    if (isEdit && (!payload.password || payload.password.trim() === "")) {
      delete payload.password
    }
    mutation.mutate(payload)
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'تعديل ملف موظف' : 'إضافة حساب موظف جديد'} size="lg">
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 pt-2 text-right">
        
        {/* الصف الأول: الاسم والرقم الوظيفي */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="الاسم الكامل (رباعي)" required error={errors.full_name && 'الاسم مطلوب'}>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                className="input pr-9 text-base sm:text-sm bg-gray-50/30" 
                placeholder="عبد الله أحمد محمد..." 
                {...register('full_name', { required: true })} 
              />
            </div>
          </FormField>
          
          <FormField label="رقم الموظف الوظيفي (ID)" required error={errors.employee_number && 'الرقم الوظيفي مطلوب'}>
            <input 
              className="input text-base sm:text-sm bg-gray-50/30 disabled:bg-gray-100 disabled:text-gray-500 font-mono" 
              placeholder="مثال: 1002" 
              {...register('employee_number', { required: !isEdit })} 
              disabled={isEdit} 
            />
          </FormField>
        </div>

        {/* الصف الثاني: البريد الإلكتروني والمسمى الوظيفي */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="البريد الإلكتروني المهني" required error={errors.email && 'البريد الإلكتروني مطلوب ومثبت بشكل صحيح'}>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="email" 
                className="input pr-9 text-base sm:text-sm text-left font-mono bg-gray-50/30" 
                dir="ltr" 
                placeholder="name@company.com" 
                {...register('email', { required: true, pattern: /^\S+@\S+$/i })} 
              />
            </div>
          </FormField>
          
          <FormField label="المسمى الوظيفي الفعلي" required error={errors.job_title && 'المسمى الوظيفي مطلوب'}>
            <div className="relative">
              <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                className="input pr-9 text-base sm:text-sm bg-gray-50/30" 
                placeholder="أخصائي نظم معلومات أول" 
                {...register('job_title', { required: true })} 
                disabled={isEdit && !isAdmin()}
              />
            </div>
          </FormField>
        </div>

        {/* خانة كلمة المرور */}
        <FormField label="كلمة المرور للنظام" required={!isEdit} error={errors.password?.message}>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type={showPassword ? "text" : "password"} 
              className="input px-9 text-base sm:text-sm text-left font-mono bg-gray-50/30" 
              dir="ltr" 
              placeholder={isEdit ? "اتركه فارغاً للاحتفاظ بكلمة المرور الحالية دون تغيير" : "••••••••"}
              {...register('password', { 
                required: !isEdit,
                validate: v => {
                  if (isEdit && !v) return true
                  if (v && v.length < 6) return "يجب ألا تقل كلمة المرور عن 6 أحرف"
                  return true
                }
              })} 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </FormField>

        {/* الصف الثالث: التبعية الإدارية الشجرية الاحترافية والمرتبة التنظيمية */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* 🌟 استبدال الـ Select القديم بزر يفتح المودال الشجري الخاص بك بحيازة مظهر حقل إدخال */}
          <FormField label="التبعية الإدارية (الإدارة)">
            <div className="relative">
              <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <button
                type="button"
                onClick={() => setIsTreeOpen(true)}
                className="input w-full pr-9 text-right text-base sm:text-sm bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-between font-medium truncate"
              >
                <span className={currentDeptId ? "text-gray-900" : "text-gray-400"}>
                  {selectedDeptName}
                </span>
                <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-semibold shrink-0 ml-1">
                  تغيير الهيكل
                </span>
              </button>
              
              {/* حقل مخفي مخصص لتسجيل القيمة ومزامنته مع ريأكت هوك فورم لضمان الـ Validation والـ Payload */}
              <input type="hidden" {...register('department_id')} />
              
              {/* زر مسح الخيار لإرجاع الموظف للإدارة العليا مباشرة */}
              {currentDeptId && (
                <button
                  type="button"
                  onClick={() => handleDepartmentSelect('', '— لا توجد (إدارة عليا / رئيسية) —')}
                  className="text-[10px] text-gray-400 hover:text-red-500 underline mt-1 block w-fit mr-auto"
                >
                  تعيين كإدارة عليا رئيسية
                </button>
              )}
            </div>
          </FormField>
          
          <FormField label="المرتبة / المستوى التنظيمي">
            <select className="input text-base sm:text-sm bg-white cursor-pointer" {...register('job_level_id')}>
              <option value="">— غير مححدد —</option>
              {(levels || []).map(l => <option key={l.id} value={l.id}>درجة {l.level_number} - {l.title}</option>)}
            </select>
          </FormField>
        </div>

        {/* الصف الرابع: الموقع والصلاحيات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="الموقع الجغرافي / الفرع">
            <select className="input text-base sm:text-sm bg-white cursor-pointer" {...register('work_location_id')}>
              <option value="">— غير محدد —</option>
              {(locations || []).map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </FormField>
          
          <FormField label="دور الصلاحيات العام بالنظام">
            <select className="input text-base sm:text-sm bg-white cursor-pointer" {...register('global_role')}>
              <option value="user">موظف (مشاهدة وتنفيذ)</option>
              <option value="program_manager">مدير البرامج والأقسام</option>
              <option value="global_admin">مدير النظام العام (صلاحيات كاملة)</option>
            </select>
          </FormField>
        </div>

        {/* خيارات الحالة والتحويل */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 select-none cursor-pointer hover:bg-gray-100/50 transition-colors">
            <input type="checkbox" className="w-4 h-4 text-[var(--color-primary-600)] border-gray-300 rounded focus:ring-[var(--color-primary-500)]" {...register('can_transfer_external')} />
            <div className="text-xs">
              <p className="font-semibold text-gray-900">تحويل خارجي تلقائي</p>
              <p className="text-gray-500">منح صلاحية التحويل المباشر دون المرور بالموافقات</p>
            </div>
          </label>
          
          <label className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 select-none cursor-pointer hover:bg-gray-100/50 transition-colors">
            <input type="checkbox" className="w-4 h-4 text-[var(--color-primary-600)] border-gray-300 rounded focus:ring-[var(--color-primary-500)]" {...register('is_active')} />
            <div className="text-xs">
              <p className="font-semibold text-gray-900">حالة الحساب (نشط)</p>
              <p className="text-gray-500">تمكين الموظف من تسجيل الدخول للنظام ومباشرة المهام</p>
            </div>
          </label>
        </div>

        {/* أزرار التحكم الفنية */}
        <div className="flex gap-3 pt-3 mt-6 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5">إلغاء</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex-1 justify-center py-2.5">
            {mutation.isPending ? 'جاري حفظ البيانات...' : isEdit ? 'اعتماد التعديلات' : 'إصدار الحساب الجديد'}
          </button>
        </div>
      </form>

      {/* 🌟 استدعاء المودال الشجري الخاص بك وحقن المدخلات والمصفوفات بداخله */}
      <DepartmentTreeModal
        isOpen={isTreeOpen}
        onClose={() => setIsTreeOpen(false)}
        departments={depts || []}
        selectedId={currentDeptId ? parseInt(currentDeptId) : null}
        onSelect={(id, name) => handleDepartmentSelect(id, name)}
      />
    </Modal>
  )
}