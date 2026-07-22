import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { User, Mail, Lock, Shield, Save, CheckCircle, Link2Off } from 'lucide-react'

import toast from 'react-hot-toast'
import { usersApi, authApi } from '@/api'
import useAuthStore from '@/stores/authStore'
import { Avatar, FormField,Spinner } from '@/components/common'
import { getApiError } from '@/utils/helpers'
import ProfileDetailsGrid from '@/components/profile/ProfileDetailsGrid'
import ProfileContactsManager from '@/components/profile/ProfileContactsManager'
import { theme } from '@/constants/theme';
import clsx from 'clsx'
export default function UserProfilePage() {
  // 1. نأخذ setUser فقط من الـ Store لتحديثه عندما تتغير البيانات في الباك إند
  const { setUser } = useAuthStore() 
  const qc = useQueryClient()
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

  // 🌟 2. جلب البيانات تلقائياً من الباك إند مباشرة (دون الاعتماد على كاش الـ auth القديم)
  const { data: dbUser, isLoading, isError } = useQuery({
    queryKey: ['live-user-profile'],
    queryFn: async () => {
      const res = await usersApi.me() // الـ Endpoint الحقيقي من السيرفر
      console.log(res.data);
      
      return res.data
    },
    // بمجرد نجاح جلب البيانات الحية، نحدث الـ Auth Store تلقائياً ليواكب التغيير
    onSuccess: (liveData) => {
      setUser(liveData)
    }
  })

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
    }
  })
  // 3. تعبئة وتحديث مدخلات الـ Form بناءً على بيانات الباك إند الحية (dbUser)
  useEffect(() => {
    if (dbUser) {
      setValue('full_name', dbUser.full_name)
      setValue('email', dbUser.email)
      // تحديث الـ Store أيضاً كإجراء احترازي للمزامنة العامة
      setUser(dbUser)
    }
  }, [dbUser, setValue, setUser])

  // معالج استجابة جوجل لطلب الصلاحيات (المهام والتنبيهات)
  const handleGoogleAccessTokenResponse = async (tokenResponse) => {
    if (!tokenResponse.access_token) {
      toast.error('لم يتم منح الصلاحيات المطلوبة من Google.')
      setIsGoogleLoading(false)
      return
    }

    try {
      const res = await authApi.linkGoogle(tokenResponse.access_token)
      toast.success('تم ربط حسابك بـ Google بنجاح وتفعيل مزامنة التنبيهات!')
      
      // 🌟 خطتك: نغير في الـ Auth Store فوراً بالبيانات الجديدة القادمة من السيرفر
      setUser(res.data)
      
      // إعادة جلب البيانات حية للتأكد من مطابقة الـ UI
      qc.invalidateQueries(['live-user-profile'])
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // تفعيل نافذة جوجل
  const triggerGoogleLink = () => {
    if (!GOOGLE_CLIENT_ID) {
      toast.error('مفتاح Google Client ID غير معرف في النظام.')
      return
    }
    setIsGoogleLoading(true)
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile https://www.googleapis.com/auth/tasks',
        callback: handleGoogleAccessTokenResponse,
      })
      client.requestAccessToken({ prompt: 'consent' })
    } catch (error) {
      toast.error('فشل في تشغيل نظام اتصالات Google.')
      setIsGoogleLoading(false)
    }
  }

  // 🌟 Mutation فك ارتباط جوجل
  const unlinkGoogleMutation = useMutation({
    mutationFn: () => authApi.unlinkGoogle(),
    onSuccess: (response) => {
      toast.success('تم إلغاء ربط حساب Google بنجاح.')
      
      // 🌟 خطتك: نغير في الـ Auth Store لإزالة حقول جوجل محلياً فوراً
      if (dbUser) {
        setUser({ ...dbUser, google_id: null, is_google_linked: false, avatar_url: null })
      }
      
      qc.invalidateQueries(['live-user-profile'])
    },
    onError: (err) => toast.error(getApiError(err))
  })

  // 🌟 Mutation تحديث البيانات الشخصية (الاسم، الباسورد)
  const updateProfileMutation = useMutation({
    mutationFn: (data) => usersApi.update(dbUser.id, data),
    onSuccess: (response) => {
      const updatedData = response.data
      toast.success('تم تحديث بياناتك بنجاح')
      
      // 🌟 خطتك: نغير في الـ Auth Store لحفظ الاسم الجديد والصورة في كامل الموقع
      setUser(updatedData)
      
      qc.invalidateQueries(['live-user-profile'])
      reset({ 
        full_name: updatedData.full_name, 
        email: updatedData.email, 
        password: '' 
      })
    },
    onError: (err) => toast.error(getApiError(err))
  })

  const onSubmit = (data) => {
    const payload = { ...data }
    if (!payload.password || payload.password.trim() === "") {
      delete payload.password
    }
    updateProfileMutation.mutate(payload)
  }

  // حالات العرض أثناء جلب البيانات من الباك إند لأول مرة
  if (isLoading) {
    return <div className="text-center py-12 text-gray-500 font-medium">جاري سحب بيانات الملف الشخصي الحية من السيرفر...</div>
  }

  if (isError) {
    return <div className="text-center py-12 text-red-500 font-medium">فشل في جلب البيانات من السيرفر. يرجى التحقق من الاتصال.</div>
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4" dir="rtl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">
          الملف الشخصي
        </h1>
        <p className="text-gray-500 dark:text-gray-400 transition-colors">
          إدارة معلوماتك الشخصية وإعدادات الأمان
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors">
        {/* هيدر الحساب والصورة */}
        <div className="h-32 relative bg-gradient-to-r from-indigo-600 to-slate-700">
        {/* إضافة نمط شبكي خفيف (اختياري لزيادة الفخامة) */}
        <div className="absolute inset-0 opacity-10" 
            style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        </div>

        <div className="h-32 relative bg-gradient-to-r from-indigo-600 to-slate-700">
          {/* حاوية الصورة الرمزية (دائرية) */}
          <div className="absolute -bottom-12 right-8 w-24 h-24 bg-white dark:bg-gray-800 rounded-full shadow-lg border-4 border-white dark:border-gray-900 flex items-center justify-center overflow-hidden transition-all">
            <Avatar 
              name={dbUser.full_name} 
              src={dbUser.avatar_url} 
              size="xl" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>
      </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-8 pt-16 space-y-6">
          <ProfileDetailsGrid user={dbUser} />
          {/* قسم فحص وعرض حالة الربط مع Google */}
          <div className="p-4 rounded-xl border border-dashed flex flex-col sm:flex-row sm:items-center justify-between gap-4 
                bg-gray-50/50 dark:bg-gray-800/30 
                border-gray-300 dark:border-gray-600 
                transition-colors">
            <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 transition-colors">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {/* تم الحفاظ على شعار Google الخاص بك */}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 48 48" className="w-4 h-4">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>  
                ربط الخدمات مع حساب Google
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                مزامنة المهام الحالية والتنبيهات مباشرة لتصلك كإشعارات على هاتفك الشخصي عبر تطبيقات Google.
              </p>
            </div>
            
            {/* 🌟 الاعتماد الكلي هنا على بيانات الباك إند الحية dbUser */}
            {(dbUser?.google_id || dbUser?.is_google_linked) ? (
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-xs font-medium border border-green-200">
                  <CheckCircle className="w-4 h-4" />
                  مربوط ومزامَن
                </div>
                <button
                  type="button"
                  disabled={unlinkGoogleMutation.isPending}
                  onClick={() => {
                    if (confirm("هل أنت متأكد من إلغاء ربط حساب Google؟ ستتوقف ميزة مزامنة المهام مع الموبايل فوراً.")) {
                      unlinkGoogleMutation.mutate();
                    }
                  }}
                  className="text-xs font-medium bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <Link2Off className="w-3.5 h-3.5" />
                  {unlinkGoogleMutation.isPending ? 'جاري الفك...' : 'إلغاء الربط'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isGoogleLoading}
                onClick={triggerGoogleLink}
                className="text-xs font-medium bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {isGoogleLoading ? 'جاري الاتصال بـ Google...' : 'ربط وتفعيل التنبيهات'}
              </button>
            )}
          </div>

          {/* المدخلات الأساسية */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="الاسم الكامل" required error={errors.full_name?.message}>
              <div className="relative">
                {/* الأيقونة */}
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                
                <input
                  {...register('full_name', { required: 'الاسم مطلوب' })}
                  className={clsx(
                    theme.input.base, // الثيم الأساسي (الخلفية، الحدود، الترانزيشن)
                    "pr-10 text-right", // المساحة للأيقونة + اتجاه النص
                    errors.full_name && theme.input.error // إضافة لون الخطأ في حال وجوده
                  )}
                />
              </div>
            </FormField>

            <FormField label="البريد الإلكتروني الحالي" required error={errors.email?.message}>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  disabled
                  className={clsx(
                    theme.input.base, // الكلاسات الأساسية (الحدود والخلفية)
                    "pr-10 text-right cursor-not-allowed",
                    // حالة التعطيل (Disabled State)
                    "bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-500 border-gray-200 dark:border-gray-700/50"
                  )}
                  {...register('email')}
                />
              </div>
            </FormField>

            <div className="md:col-span-2">
              <FormField 
                label="كلمة مرور جديدة (اتركها فارغة إذا كنت لا ترغب في التغيير)" 
                error={errors.password?.message}
              >
                <div className="relative">
                {/* الأيقونة - استخدمنا gray-400 لتبقى واضحة في كِلا الوضعين */}
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500" />
                
                <input
                  type={showPassword ? 'text' : 'password'}
                  // دمجنا كلاسات المدخل الأساسية من الثيم مع الكلاسات الخاصة بالحقل
                  className={clsx(theme.input.base, "pr-10 text-right")}
                  placeholder="••••••••"
                  {...register('password', { minLength: { value: 6, message: 'يجب أن لا تقل عن 6 أحرف' } })}
                />
                
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  // استخدمنا تلوين مخصص للزر ليتناسب مع الإنديغو في النهاري والوضع الليلي
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors"
                >
                  {showPassword ? 'إخفاء' : 'إظهار'}
                </button>
              </div>
              </FormField>
            </div>
          </div>

          {/* معلومات الوظيفة المشفرة */}
          <div className={clsx(
            "p-4 rounded-xl flex items-start gap-3 border transition-colors",
            "bg-gray-50 dark:bg-gray-800/50 border-gray-100 dark:border-gray-700"
          )}>
            <Shield className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5" />
            <div>
              <p className={clsx("text-sm font-medium", theme.text.primary)}>
                معلومات الوظيفة
              </p>
              <p className={clsx("text-xs mt-1", theme.text.secondary)}>
                أنت مسجل كـ 
                <span className="font-bold text-indigo-600 dark:text-indigo-400 mx-1">
                  {dbUser?.job_title}
                </span> 
                في 
                <span className="font-bold text-indigo-600 dark:text-indigo-400 mx-1">
                  {dbUser?.department?.name || 'إدارة غير محددة'}
                </span>. 
              </p>
            </div>
          </div>

          {/* أزرار الحفظ */}
          <div className={clsx(
            "flex justify-end gap-3 pt-4 border-t",
            // نستخدم لون الحدود من الثيم بدلاً من اللون الثابت
            "border-gray-100 dark:border-gray-800"
          )}>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className={clsx(
                "flex items-center gap-2 px-8 py-2 rounded-lg text-sm font-semibold transition-all",
                // نستخدم هنا كلاسات الألوان الأساسية للنظام
                "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
              )}
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Spinner size="sm" className="text-white" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4.5 h-4.5" />
                  حفظ التعديلات
                </>
              )}
            </button>
          </div>
        </form>
        <ProfileContactsManager user={dbUser} />
      </div>
    </div>
  )
}