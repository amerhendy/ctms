// src/components/layout/DashboardLayout.jsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-hidden" dir="rtl">
      {/* الشريط الجانبي */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* حاوي المحتوى الرئيسي والعلوي */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50/50 dark:bg-gray-900/50 transition-colors duration-300">
        {/* شريط الرأس العلوي */}
        <Header setMobileOpen={setMobileOpen} />

        {/* مساحة عرض الصفحات المتغيرة */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}