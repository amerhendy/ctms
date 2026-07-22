// src/modals/UserFormModal.jsx
import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Lock, User, Mail, Briefcase, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { usersApi, orgApi, LocationApi } from '@/api'
import { Modal, FormField } from '@/components/common'
import { getApiError } from '@/utils/helpers'
import useAuthStore from '@/stores/authStore'
import { Avatar } from '@/components/common'
import clsx from 'clsx'
// 🌟 استيراد مكون المودال الشجري الخاص بك
import DepartmentTreeModal from '@/modals/DepartmentTreeModal'

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
    queryFn: () => orgApi.list_departments_kv().then(r => r.data),
  })
  
  const { data: levels } = useQuery({
    queryKey: ['job-levels'],
    queryFn: () => orgApi.listLevels().then(r => r.data),
  })
  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => LocationApi.list().then(r => r.data),
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
    defaultValues: {
                      full_name: user?.full_name || '',
                      email: user?.email || '',
                      job_title: user?.job_title || '',
                      employee_number: user?.employee_number || '',
                      global_role: user?.global_role || 'user',
                      department_id: user?.department_id?.toString() || '',
                      job_level_id: user?.job_level_id?.toString() || '',
                      can_transfer_external: !!user?.can_transfer_external,
                      is_active: user !== null ? !!user?.is_active : true,
                      work_location_id: user?.work_location_id?.toString() || '',
                      avatar_url:user?.avatar_url || ''
                    }
  })

  // مراقبة القيمة الحالية للمعرف المختار لربطه بالمودال الشجري
  const currentDeptId = watch('department_id')

  // ملء الحقول وتحديث اسم الإدارة عند فتح المودال في حالة التعديل
  useEffect(() => {
    if (user && depts && levels && locations) {
    console.log(user);
      
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
        avatar_url:user?.avatar_url || '',
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


const handleDepartmentSelect = (node) => {
    const deptId = node?.id;
    const deptName = node?.name;
    
    setValue('department_id', deptId ? deptId.toString() : '', { shouldValidate: true });
    // مسح المدير المباشر عند تغيير القسم لأن القائمة ستتغير

    setSelectedDeptName(deptName || '— لا توجد (إدارة عليا / رئيسية) —');
}
  const onSubmitForm = (data) => {
    // 1. تحضير كائن Payload نظيف
    const payload = { ...data };

    // 2. قائمة الحقول الرقمية التي يجب تحويلها إلى null عند الفراغ
    const numericFields = ['department_id', 'job_level_id', 'work_location_id'];
    
    numericFields.forEach(field => {
      const val = payload[field];
      // تحويل السلسلة الفارغة أو غير المعرفة إلى null صريح
      if (val === '' || val === undefined || val === null) {
        payload[field] = null;
      } else {
        payload[field] = parseInt(val, 10);
      }
    });

    // 3. معالجة كلمة المرور (استثناء)
    if (isEdit && (!payload.password || payload.password.trim() === "")) {
      delete payload.password;
    }

    // 4. الإرسال
    mutation.mutate(payload);
  }
const { data: departmentUsers, isLoading: isUsersLoading } = useQuery({
    queryKey: ['department-users', currentDeptId],
    // نفترض أن API الخاص بالموظفين يعيد قائمة بالـ Summary
    queryFn: () => orgApi.usersDept(currentDeptId).then(r => r.data.items),
    enabled: !!currentDeptId, 
  })
  return (
    <Modal open onClose={onClose} title={isEdit ? 'تعديل ملف موظف' : 'إضافة حساب موظف جديد'} size="mxw">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="bg-primary-600 dark:bg-primary-900 h-32 relative">
            <div className="rounded-full absolute -bottom-0 right-8 w-16 h-16 bg-black/5 dark:bg-black/20 shadow-md border-4 border-white flex items-center justify-center overflow-hidden">
              <Avatar src={user?.avatar_url || ''}  name={user?.full_name || ''} size="xl" className="flex-shrink-0 border-4 border-white dark:border-gray-800 shadow-lg ring-1 ring-black/5 dark:ring-white/10" />
            </div>
          </div>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4 pt-2 text-right">
          
          
          {/* الصف الأول: الاسم والرقم الوظيفي */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField 
              label="الاسم الكامل (رباعي)" 
              required 
              error={errors.full_name && 'الاسم مطلوب'}
              className="dark:text-gray-200"
            >
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input 
                  className={clsx(
                    "input pr-9 text-base sm:text-sm transition-colors",
                    // الوضع النهاري
                    "bg-gray-50/30 border-gray-200 text-gray-900",
                    // الوضع الليلي
                    "dark:bg-gray-900 dark:border-gray-700 dark:text-white dark:placeholder-gray-600",
                    // التركيز (Focus)
                    "focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  )}
                  placeholder="عبد الله أحمد محمد..." 
                  {...register('full_name', { required: true })} 
                />
              </div>
            </FormField>
            
            <FormField
              label="رقم الموظف الوظيفي (ID)"
              required
              error={errors.employee_number && 'الرقم الوظيفي مطلوب'}
              className="dark:text-gray-200"
            >
              <input 
                className={clsx(
                  "input text-base sm:text-sm transition-colors font-mono",
                  // الحالة العادية
                  "bg-gray-50/30 text-gray-900 border-gray-200",
                  // الوضع الليلي
                  "dark:bg-gray-900 dark:text-white dark:border-gray-700",
                  // حالة الـ Disabled (مهمة جداً في الوضع الليلي)
                  "disabled:bg-gray-100 disabled:text-gray-500",
                  "dark:disabled:bg-gray-800 dark:disabled:text-gray-600",
                  // التركيز
                  "focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                )}
                placeholder="مثال: 1002" 
                {...register('employee_number', { required: !isEdit })} 
                disabled={isEdit && !isAdmin()}
              />
            </FormField>

            <FormField 
              label="البريد الإلكتروني المهني" 
              required 
              error={errors.email && 'البريد الإلكتروني مطلوب ومثبت بشكل صحيح'}
              className="dark:text-gray-200"
            >
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input 
                  type="email" 
                  className={clsx(
                      "input pr-9 text-base sm:text-sm text-left font-mono transition-colors",
                      // التنسيق المشترك والنهاري
                      "bg-gray-50/30 text-gray-900 border-gray-200",
                      // التنسيق الليلي
                      "dark:bg-gray-900 dark:text-blue-300 dark:border-gray-700 dark:placeholder-gray-600",
                      // التركيز
                      "focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    )}
                  dir="ltr" 
                  placeholder="name@company.com" 
                  {...register('email', { required: true, pattern: /^\S+@\S+$/i })} 
                />
              </div>
            </FormField>
            
            <FormField 
                label="المسمى الوظيفي الفعلي" 
                required 
                error={errors.job_title && 'المسمى الوظيفي مطلوب'}
                className="dark:text-gray-200"
              >
                <div className="relative">
                  <Briefcase className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <input 
                    className={clsx(
                      "input pr-9 text-base sm:text-sm transition-colors",
                      // التنسيق المشترك
                      "bg-gray-50/30 text-gray-900 border-gray-200",
                      // التنسيق الليلي
                      "dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:placeholder-gray-600",
                      // الحالة المعطلة
                      "disabled:bg-gray-100 disabled:text-gray-500",
                      "dark:disabled:bg-gray-800 dark:disabled:text-gray-600",
                      // التركيز
                      "focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    )} 
                    placeholder="أخصائي نظم معلومات أول" 
                    {...register('job_title', { required: true })} 
                    disabled={isEdit && !isAdmin()}
                  />
                </div>
              </FormField>
          </div>

          {/* خانة كلمة المرور */}
          <FormField 
            label="كلمة المرور للنظام" 
            required={!isEdit} 
            error={errors.password?.message}
            className="dark:text-gray-200"
          >
            <div className="relative">
              {/* أيقونة القفل */}
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              
              <input 
                type={showPassword ? "text" : "password"} 
                dir="ltr"
                className={clsx(
                  "input px-9 text-base sm:text-sm text-left font-mono transition-colors",
                  // التنسيق النهاري
                  "bg-gray-50/30 text-gray-900 border-gray-200",
                  // التنسيق الليلي
                  "dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:placeholder-gray-600",
                  // التركيز
                  "focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                )}
                placeholder={isEdit ? "اتركه فارغاً للاحتفاظ بكلمة المرور الحالية" : "••••••••"}
                {...register('password', { 
                  required: !isEdit,
                  validate: v => {
                    if (isEdit && !v) return true
                    if (v && v.length < 6) return "يجب ألا تقل كلمة المرور عن 6 أحرف"
                    return true
                  }
                })} 
              />

              {/* زر إظهار/إخفاء كلمة المرور */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-lg transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </FormField>
          {/* الصف الثالث: التبعية الإدارية الشجرية الاحترافية والمرتبة التنظيمية */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 🌟 استبدال الـ Select القديم بزر يفتح المودال الشجري الخاص بك بحيازة مظهر حقل إدخال */}
            <FormField label="التبعية الإدارية (الإدارة)" className="dark:text-gray-200">
              <div className="relative">
                <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setIsTreeOpen(true)}
                  className={clsx(
                    "input w-full pr-9 text-right text-base sm:text-sm border rounded-lg shadow-sm transition-colors flex items-center justify-between font-medium truncate",
                    "bg-white border-gray-300 hover:bg-gray-50 text-gray-900",
                    "dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800 dark:text-white"
                  )}
                >
                  <span className={currentDeptId ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"}>
                    {selectedDeptName}
                  </span>
                  <span className={clsx(
                    "text-[10px] px-2 py-0.5 rounded-md font-semibold shrink-0 ml-1 border",
                    "text-indigo-600 bg-indigo-50 border-indigo-100",
                    "dark:text-indigo-400 dark:bg-indigo-950/50 dark:border-indigo-900/50"
                  )}>
                    تغيير الهيكل
                  </span>
                </button>
                
                {/* Hidden field for react-hook-form */}
                <input type="hidden" {...register('department_id')} />
                
                {/* Clear/Reset option */}
                {currentDeptId && (
                  <button
                    type="button"
                    onClick={() => handleDepartmentSelect('', '— لا توجد (إدارة عليا / رئيسية) —')}
                    className="text-[10px] text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 underline mt-1 block w-fit mr-auto"
                  >
                    تعيين كإدارة عليا رئيسية
                  </button>
                )}
              </div>
            </FormField>
            
            <FormField label="المرتبة / المستوى التنظيمي" className="dark:text-gray-200">
              <select 
                className={clsx(
                  "input w-full text-base sm:text-sm cursor-pointer border transition-colors appearance-none",
                  // التنسيق النهاري
                  "bg-white border-gray-300 text-gray-900",
                  // التنسيق الليلي
                  "dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                )}
                {...register('job_level_id')}
              >
                <option value="">— غير محدد —</option>
                {(levels || []).map(l => (
                  <option key={l.id} value={l.id}>
                    درجة {l.level_number} - {l.title}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField label="الموقع الجغرافي / الفرع" className="dark:text-gray-200">
              <select 
                className={clsx(
                  "input w-full text-base sm:text-sm cursor-pointer border transition-colors appearance-none",
                  // التنسيق النهاري
                  "bg-white border-gray-300 text-gray-900",
                  // التنسيق الليلي
                  "dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                )}
                {...register('work_location_id')}
              >
                <option value="">— غير محدد —</option>
                {(locations || []).map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </FormField>
            
            <FormField label="دور الصلاحيات العام بالنظام" className="dark:text-gray-200">
              <select 
                className={clsx(
                  "input w-full text-base sm:text-sm cursor-pointer border transition-colors appearance-none",
                  // التنسيق النهاري
                  "bg-white border-gray-300 text-gray-900",
                  // التنسيق الليلي
                  "dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                )}
                {...register('global_role')}
              >
                <option value="user">موظف (مشاهدة وتنفيذ)</option>
                <option value="program_manager">مدير البرامج والأقسام</option>
                <option value="global_admin">مدير النظام العام (صلاحيات كاملة)</option>
              </select>
            </FormField>
          </div>

          {/* خيارات الحالة والتحويل */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className={clsx(
              "flex items-center gap-3 p-3 rounded-xl border select-none cursor-pointer transition-colors",
              // التنسيق النهاري
              "bg-gray-50 border-gray-100 hover:bg-gray-100/50",
              // التنسيق الليلي
              "dark:bg-gray-800/50 dark:border-gray-700 dark:hover:bg-gray-800"
            )}>
              <input 
                type="checkbox" 
                className={clsx(
                  "w-4 h-4 rounded border-gray-300 focus:ring-2 transition-all",
                  "text-primary-600 focus:ring-primary-500", // اللون الأساسي
                  "dark:border-gray-600 dark:bg-gray-900"
                )} 
                {...register('can_transfer_external')} 
              />
              <div className="text-xs">
                <p className="font-semibold text-gray-900 dark:text-gray-100">تحويل خارجي تلقائي</p>
                <p className="text-gray-500 dark:text-gray-400">منح صلاحية التحويل المباشر دون المرور بالموافقات</p>
              </div>
            </label>
            
            <label className={clsx(
              "flex items-center gap-3 p-3 rounded-xl border select-none cursor-pointer transition-colors",
              // التنسيق النهاري
              "bg-gray-50 border-gray-100 hover:bg-gray-100/50",
              // التنسيق الليلي
              "dark:bg-gray-800/50 dark:border-gray-700 dark:hover:bg-gray-800"
            )}>
              <input 
                type="checkbox" 
                className={clsx(
                  "w-4 h-4 rounded border-gray-300 focus:ring-2 transition-all",
                  "text-primary-600 focus:ring-primary-500", 
                  "dark:border-gray-600 dark:bg-gray-900"
                )} 
                {...register('is_active')} 
              />
              <div className="text-xs">
                <p className="font-semibold text-gray-900 dark:text-gray-100">حالة الحساب (نشط)</p>
                <p className="text-gray-500 dark:text-gray-400">تمكين الموظف من تسجيل الدخول للنظام ومباشرة المهام</p>
              </div>
            </label>
          </div>

          {/* أزرار التحكم الفنية */}
          <div className="flex gap-3 pt-6 mt-6 border-t border-gray-100 dark:border-gray-800">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn-secondary flex-1 justify-center py-2.5 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
            >
              إلغاء
            </button>
            
            <button 
              type="submit" 
              disabled={mutation.isPending} 
              className={clsx(
                "btn-primary flex-1 justify-center py-2.5 transition-all",
                mutation.isPending && "opacity-70 cursor-not-allowed"
              )}
            >
              {mutation.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري حفظ البيانات...
                </span>
              ) : (
                isEdit ? 'اعتماد التعديلات' : 'إصدار الحساب الجديد'
              )}
            </button>
          </div>
        </form>

        {/* 🌟 استدعاء المودال الشجري الخاص بك وحقن المدخلات والمصفوفات بداخله */}
        <DepartmentTreeModal
          isOpen={isTreeOpen}
          onClose={() => setIsTreeOpen(false)}
          selectedId={currentDeptId ? parseInt(currentDeptId) : null}
          onSelect={(id, name) => handleDepartmentSelect(id, name)}
        />
      </div>
    </Modal>
  )
}