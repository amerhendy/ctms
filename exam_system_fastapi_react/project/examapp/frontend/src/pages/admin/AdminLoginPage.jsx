import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '../../components/Button'
import Input from '../../components/Input'
import { useAuthStore } from '../../stores/authStore'
import { LayoutDashboard } from 'lucide-react'
import {theme} from '../../constants/theme'
import clsx from 'clsx'
export default function AdminLoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError('')
    setLoading(true)
    const result = await login(username, password)
    setLoading(false)
    if (result.success) {
      navigate('/admin')
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors">
  <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none text-center">
    
    {/* الأيقونة العلوية */}
    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold mx-auto mb-4">
      <LayoutDashboard size={60} color="#ffd500" strokeWidth={1} />
    </div>

    {/* عناوين الصفحة */}
    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
      لوحة تحكم الأدمن
    </h1>
    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 mb-6">
      نظام اختبارات التوظيف الإلكترونية
    </p>

    {/* حقول الإدخال */}
    <div className="space-y-4">
      <div>
        <Input
          placeholder="اسم المستخدم"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className={clsx(
            theme.input.base,
            "!mb-0 text-center tracking-wide focus:ring-2 focus:ring-primary/20"
          )}
        />
      </div>

      <div>
        <Input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          className={clsx(
            theme.input.base,
            "!mb-0 text-center tracking-widest focus:ring-2 focus:ring-primary/20"
          )}
        />
        
      </div>

      {/* زر تسجيل الدخول */}
      <Button 
        className="w-full py-2.5 shadow-md shadow-primary/20 font-semibold" 
        onClick={handleLogin} 
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            جاري الدخول...
          </span>
        ) : (
          'تسجيل الدخول'
        )}
      </Button>
    </div>

    {/* رسالة الخطأ */}
    {error && (
      <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-400 text-xs text-center font-medium animate-shake">
        {error}
      </div>
    )}
  </div>
</div>
  )
}
