// LoginPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { CheckSquare, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '@/stores/authStore'
import { getApiError } from '@/utils/helpers'
import { authApi } from '@/api'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { googleLoginAction } = useAuthStore()
  
  // 🌟 استيراد login والـ setUser من الـ Zustand Store لتوحيد إدارة الحالة
  const { login, setUser } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors } } = useForm()

  // تسجيل الدخول العادي
  const onSubmit = async ({ identifier, password }) => {
    setLoading(true)
    try {
      await login(identifier, password)
      toast.success('مرحباً بك!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  // تهيئة وإعدادات Google One Tap / Popup
  const showGooglePrompt = () => {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
    } else {
      toast.error('نظام اتصالات Google غير جاهز بعد، يرجى المحاولة مجدداً.')
    }
  }
  const initGoogleSDK = () => {
    if (!GOOGLE_CLIENT_ID) {
      console.error('مفتاح Google Client ID غير معرف في ملف الـ .env')
      return
    }

    // منع التهيئة المتكررة إذا كان قد تم تهيئته مسبقاً
    if (window.google_sdk_initialized) return

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          setGoogleLoading(true)
          await googleLoginAction(response.credential)
          toast.success('تم تسجيل الدخول بواسطة Google بنجاح')
          navigate('/dashboard')
        } catch (err) {
          toast.error(err.response?.data?.detail || 'فشل تسجيل الدخول عبر Google')
        } finally {
          setGoogleLoading(false)
        }
      },
    })

    // وضع علامة (Flag) تفيد بإتمام التهيئة بنجاح
    window.google_sdk_initialized = true
  }

  // تسجيل الدخول عبر Google (مع معالجة التحميل الديناميكي للسكربت)
  const handleGoogleLogin = () => {
    setGoogleLoading(true)
    if (!window.google) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => {
        initGoogleSDK()
        setGoogleLoading(false)
        showGooglePrompt()
      }
      script.onerror = () => {
        toast.error('فشل في تحميل مكتبة اتصال Google.')
        setGoogleLoading(false)
      }
      document.head.appendChild(script)
    } else {
      initGoogleSDK()
      setGoogleLoading(false)
      showGooglePrompt()
    }
  }
  // تحميل مسبق هادئ لسكربت جوجل عند فتح الصفحة لتحسين سرعة الاستجابة للضغط
  useEffect(() => {
    if (window.google) {
      initGoogleSDK()
    } else if (GOOGLE_CLIENT_ID) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => initGoogleSDK()
      document.head.appendChild(script)
    }
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-600 flex items-center justify-center p-4 sm:p-6 md:p-8" dir="rtl">
      <div className="card w-full max-w-md p-6 sm:p-8 slide-in bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-800">
        
        {/* الشعار والترويسة */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-32 h-32 bg-transparent rounded-xl flex items-center justify-center mb-4 shadow-sm shadow-blue-100 dark:shadow-transparent">
            <img 
            src="assets/logo.webp" 
            alt="AmerSchadual Logo" 
            className="w-full h-full object-contain" 
          />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950 dark:text-gray-100">نظام إدارة المهام</h1>
          <p className="text-gray-500 dark:text-gray-100 text-xs sm:text-sm mt-1">المؤسسي المتكامل</p>
        </div>

        {/* نموذج تسجيل الدخول التقليدي */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label text-sm font-medium text-gray-700 dark:text-gray-100">رقم الموظف أو البريد الإلكتروني</label>
            <input
              type="text"
              className="input text-base sm:text-sm mt-1 w-full"
              placeholder="رقم الموظف أو example@company.com"
              {...register('identifier', { required: 'هذا الحقل مطلوب' })}
            />
            {errors.identifier && (
              <p className="text-xs font-medium text-red-600 mt-1.5 flex items-center gap-1">
                ⚠️ {errors.identifier.message}
              </p>
            )}
          </div>

          <div>
            <label className="label text-sm font-medium text-gray-700 dark:text-gray-100">كلمة المرور</label>
            <div className="relative mt-1">
              <input
                type={showPass ? 'text' : 'password'}
                className="input text-base sm:text-sm pr-3 pl-10 w-full"
                placeholder="••••••••"
                {...register('password', { required: 'كلمة المرور مطلوبة' })}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs font-medium text-red-600 mt-1.5 flex items-center gap-1">
                ⚠️ {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-sm sm:text-base mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'تسجيل الدخول'}
          </button>
        </form>

        {/* الفاصل الخطي */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="px-3 bg-white dark:bg-gray-500 text-gray-400 dark:text-gray-100 font-medium">أو عبر</span>
          </div>
        </div>

        {/* زر تسجيل الدخول بواسطة Google */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="btn-secondary w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          ) : (
            <>
              <svg className="w-4 h-4 sm:w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>تسجيل الدخول عبر Google</span>
            </>
          )}
        </button>

        {/* البيانات التجريبية للمحاكاة */}
        <div className="mt-6 p-4.5 bg-gray-50 dark:bg-gray-500 rounded-xl border border-gray-100 dark:border-gray-500 text-xs text-gray-500 dark:text-gray-100 space-y-1">
          <p className="font-semibold text-gray-700 dark:text-gray-100 mb-1">🔑 بيانات المحاكاة التجريبية:</p>
          <div className="flex justify-between">
            <span>مدير النظام:</span>
            <span className="font-mono bg-gray-200/60 dark:bg-gray-800/60 px-1 rounded">1001 / Admin@123</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>المدير المالي:</span>
            <span className="font-mono bg-gray-200/60 dark:bg-gray-800/60 px-1 rounded">fin.head@company.com / Fin@12345</span>
          </div>
        </div>

      </div>
    </div>
  )
}