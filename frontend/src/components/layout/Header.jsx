// src/components/layout/Header.jsx
import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MoonIcon, SunIcon, Bell, Menu, CheckSquare, LogOut, User as UserIcon, ChevronDown } from 'lucide-react'
import { notificationsApi } from '@/api'
import NotificationDropdown from '@/pages/notifications/NotificationDropdown'
import { useNavigate, NavLink } from 'react-router-dom'
import useAuthStore from '@/stores/authStore'
import { useTheme } from '@/hooks/useTheme';
// إذا لم تكن التسميات مستوردة من ملف خارجي، يمكنك تركها هنا
const ROLE_LABELS = {
  global_admin: 'مدير النظام التنفيذي',
  program_manager: 'مدير البرنامج الهيكلي',
  user: 'موظف / مدير إدارة',
}

export default function Header({ setMobileOpen }) {
  const [showNotif, setShowNotif] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false) // قائمة المستخدم الجديدة
  const [theme, setTheme] = useTheme();

  const notifRef = useRef(null)
  const userMenuRef = useRef(null)
  const qc = useQueryClient()
  const navigate = useNavigate()
  
  // جلب بيانات المستخدم الحالي ودالة الحذف للـ Token من هوك الـ Auth الخاص بك
  const { user, logout, isAdminOrPM } = useAuthStore()

  // إغلاق القوائم تلقائياً عند الضغط خارج المساحة المخصصة لها
  useEffect(() => {
    function handleClickOutside(event) {
      // إغلاق جرس الإشعارات
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false)
      }
      // إغلاق قائمة المستخدم
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // جلب الإشعارات الأخيرة للقائمة المنسدلة
  const { data: recentNotifs } = useQuery({
  queryKey: ['notifications', 'recent'],
  // التغيير هنا: قمنا بالدخول إلى مصفوفة items مباشرة ليفهمها الـ Dropdown
  queryFn: () => notificationsApi.list({ page_size: 5 }).then(r => r.data.items), 
  enabled: showNotif, 
})
  
  // جلب عدد الإشعارات غير المقروءة للتنبيه الفوري
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.unreadCount().then(r => r.data),
    refetchInterval: 30_000,
  })
  const unreadCount = unreadData?.count || 0

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries(['notifications'])
    }
  })

  const handleLogout = () => {
    if (logout) {
      logout() // تنفيذ دالة تفريغ التوكن والـ state
    }
    navigate('/login') // التوجيه الفوري لصفحة الدخول
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 h-16 flex items-center justify-between px-4 sticky top-0 z-30 w-full text-right" dir="rtl">
      
      {/* ─── الجزء الأيمن: زر الموبايل وعنوان المنصة ─── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(p => !p)}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-xs sm:text-sm font-bold text-gray-400 dark:text-gray-90 hidden sm:inline-block bg-gray-50 dark:bg-gray-800 px-2.5 py-1 rounded-lg border border-gray-100/70 dark:border-gray-700">
          منصة المتابعة الإدارية والمهام
        </span>
      </div>

      {/* ─── الجزء الأيسر: أزرار الجرس وقائمة المستخدم المنسدلة ─── */}
      <div className="flex items-center gap-4 transition-all duration-300">
        
        {/* أولاً: قائمة الإشعارات (الجرس) */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotif(!showNotif)
              setShowUserMenu(false) // غلق القائمة الأخرى منعاً للتداخل بالواجهة
            }}
            className={`p-2 rounded-xl border transition-all relative ${
              showNotif 
                ? 'bg-[var(--color-primary-50)] border-[var(--color-primary-100)]' 
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title="الإشعارات الواردة"
          >
            <Bell className="w-5 h-5 stroke-[2] text-amber-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-black ring-2 ring-white animate-bounce">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 animate-in fade-in slide-in-from-top-3 duration-200">
              <NotificationDropdown 
                notifications={recentNotifs}
                onMarkRead={(id) => {
                  markReadMutation.mutate(id);
                  setShowNotif(false);
                  navigate('/notifications');
                }}
                onMarkAll={() => notificationsApi.markAllRead().then(() => {
                  qc.invalidateQueries(['notifications']);
                  setShowNotif(false);
                })}
              />
            </div>
          )}
        </div>
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            title="تبديل السمة"
          >
            {theme === 'dark' ? (
              <SunIcon className="w-5 h-5 text-amber-500" />
            ) : (
              <MoonIcon className="w-5 h-5 text-gray-500" />
            )}
          </button>
        {/* ثانياً: قائمة ملف المستخدم الجديدة (User Control) */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu)
              setShowNotif(false) // غلق الجرس منعاً للتداخل بالواجهة
            }}
            className={`flex items-center gap-2 p-1.5 pl-3 rounded-xl border transition-all text-right ${
              showUserMenu 
                ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
                : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            
            {/* أيقونة رمزية للمستخدم (أو يمكنك استبدالها بـ Avatar صورة لاحقاً) */}
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
              <UserIcon className="w-4 h-4" />
            </div>
            
            <div className="hidden md:block">
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1 max-w-[120px]">
                {user?.full_name || 'جاري التحميل...'}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-3 duration-200 text-right">
              
              
              {/* الرابط السريع وعرض الاسم بداخل القائمة */}
              <NavLink 
                to="/profile" 
                onClick={() => setShowUserMenu(false)}
                className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 bg-gray-50/40 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors block"
              >
                <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user?.full_name}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-400 flex items-center gap-1 mt-0.5 font-medium">
                  <UserIcon className="w-3 h-3 text-gray-400" />
                  {ROLE_LABELS[user?.global_role] || user?.job_title || 'موظف'}
                </p>
              </NavLink>

              {/* زر الحذف النهائي للجلسة وتسجيل الخروج */}
              <div className="p-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium text-xs sm:text-sm transition-all text-right"
                >
                  <LogOut className="w-4 h-4 transform rotate-180" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>

            </div>
          )}
        </div>

      </div>
    </header>
  )
}