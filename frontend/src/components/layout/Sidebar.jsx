// src/components/layout/Sidebar.jsx
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, CheckSquare, Search, Bell, Star,
  Users, Building2, ChevronLeft, LogOut, Settings,
  ArrowLeftRight, UserCheck, Menu, X, User,
  Repeat,LayoutTemplate,GitBranch // تم استيراد أيقونة التكرار والجدولة هنا
} from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import { notificationsApi } from '@/api'
import { ROLE_LABELS } from '@/utils/helpers'
import clsx from 'clsx'
import { Avatar } from '@/components/common'
const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/tasks',     icon: CheckSquare,    label: 'المهام'       },
  { to: '/favorites', icon: Star,           label: 'المفضلة'      },
  { to: '/transfers', icon: ArrowLeftRight,  label: 'التحويلات'    },
  { to: '/delegations', icon: UserCheck,    label: 'التفويضات'    },
  { to: '/search',    icon: Search,         label: 'بحث متقدم'    },
  { to: '/notifications', icon: Bell,        label: 'الإشعارات'    },
]

// تحديث مصفوفة الإدارة لتشمل الرابط الجديد
const adminItems = [
  { to: '/admin/users', icon: Users, label: 'المستخدمون', roles: ['admin', 'pm', 'dept_manager'] },
  { to: '/admin/org', icon: Building2, label: 'الهيكل التنظيمي', roles: ['admin', 'pm', 'dept_manager'] },
  { to: '/admin/loc', icon: Building2, label: 'المواقع', roles: ['admin', 'pm'] },
  { to: '/admin/levels', icon: Settings, label: 'المستويات الوظيفية', roles: ['admin', 'pm'] },
  { to: '/admin/recurring', icon: Repeat, label: 'المهام المتكررة', roles: ['admin', 'pm'] },
  { to: '/admin/workflow-templates', label: 'قوالب Workflow',  icon: LayoutTemplate , roles: ['admin', 'pm'] },
  { to: '/admin/workflow-monitor',   label: 'مراقبة Workflow', icon: GitBranch , roles: ['admin', 'pm'] },
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout, isAdminOrPM,isDepartmentManager } = useAuthStore()
  const navigate = useNavigate()

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.unreadCount().then(r => r.data),
    refetchInterval: 30_000,
  })
  const unreadCount = unreadData?.count || 0

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const SidebarContent = () => (
    
    <div className="flex flex-col h-full text-right bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        
      {/* Logo */}
      <div className={clsx(
        'flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800', // إضافة dark:border-gray-800
        collapsed && 'justify-center'
      )}>
        <div className="w-9 h-9 bg-transparent flex items-center justify-center flex-shrink-0">
          <img 
            src="assets/logo.webp" 
            alt="AmerSchadual Logo" 
            className="w-full h-full object-contain" 
          /> 
        </div>
        {!collapsed && (
          <div className="flex-1 transition-colors">
            <p className="text-sm font-bold text-gray-950 dark:text-gray-100 leading-tight">
              نظام المهام
            </p>
            <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
              المؤسسي والأرشيف
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mr-auto hidden lg:flex p-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-all"
        >
          <ChevronLeft className={clsx('w-4 h-4 transition-transform duration-200', collapsed && 'rotate-180')} />
        </button>
      </div>

      {/* User profile section */}
      {!collapsed && (
        <NavLink 
          to="/profile" 
          className="px-4 py-3 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors block"
        >
          <div className="flex items-center gap-2">
            <Avatar 
              src={user.avatar_url || user?.avatar_url} 
              name={user?.full_name || ''} 
              size="sm" 
              className="flex-shrink-0 border border-gray-100 dark:border-gray-700" 
            />
            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
              {user?.full_name}
            </p>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5 font-medium">
            <User className="w-3 h-3 text-gray-400 dark:text-gray-500" />
            {ROLE_LABELS[user?.global_role] || user?.job_title}
          </p>
        </NavLink>
      )}

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isNotifications = to === '/notifications';
          return (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                clsx(
                  'sidebar-item', isActive && 'active', collapsed && 'justify-center px-2',
                  'dark:text-white-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                )
              }
            >
              <div className="relative">
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                {isNotifications && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold ring-2 ring-white dark:ring-gray-900">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && <span className="font-medium text-sm">{label}</span>}
            </NavLink>
          );
        })}

        {/* Admin section */}
        {
          (() => {
            // التحقق من الصلاحيات
            const isDeptManager = !!isDepartmentManager(); // true إذا كان مدير قسم
            const isHighLevel = isAdminOrPM(); // true إذا كان admin أو pm
            
            // فلترة الروابط بناءً على الدور
            const visibleItems = adminItems.filter(item => {
              if (isHighLevel) return true; // الـ Admin والـ PM يشوفوا كل حاجة
              if (isDeptManager && item.roles.includes('dept_manager')) return true;
              return false;
            });

            if (visibleItems.length === 0) return null;

            return (
              <>
                {!collapsed && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 px-3 pt-4 pb-1 font-bold uppercase tracking-wide">
                    {isHighLevel ? 'إدارة النظام' : 'إدارة القسم'}
                  </p>
                )}
                {collapsed && <div className="border-t border-gray-100 dark:border-gray-800 my-2" />}
                {visibleItems.map(({ to, icon: Icon, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      clsx('sidebar-item', isActive && 'active', collapsed && 'justify-center px-2')
                    }
                  >
                    <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium text-sm">{label}</span>}
                  </NavLink>
                ))}
              </>
            );
          })()
        }
      </nav>

      {/* Logout */}
      <div className="p-2 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className={clsx(
            'sidebar-item w-full font-medium text-sm transition-all',
            // الألوان للوضع النهاري والوضع الليلي
            'text-red-500 hover:bg-red-50 hover:text-red-600',
            'dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-4.5 h-4.5" />
          {!collapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={clsx(
        'lg:hidden fixed top-0 right-0 h-full w-64 bg-white shadow-xl z-50 transition-transform duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={clsx(
        'hidden lg:flex flex-col bg-white border-l border-gray-100 transition-all duration-300 flex-shrink-0 h-screen sticky top-0',
        collapsed ? 'w-16' : 'w-60'
      )}>
        <SidebarContent />
      </aside>
    </>
  )
}