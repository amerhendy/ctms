import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import RequireAdmin from './components/RequireAdmin'
import { useAuthStore } from './stores/authStore'

// ⚡ صفحات خفيفة يفضل تركها كما هي لتحميل فوري عند فتح الموقع لأول مرة
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'

// 📦 صفحات ثقيلة تحتوي على مكتبات ضخمة (يتم تحميلها من الإنترنت فقط عند دخولها!)
const ExamPage = lazy(() => import('./pages/ExamPage'))
const ResultPage = lazy(() => import('./pages/ResultPage'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))

export default function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <BrowserRouter 
      future={{ 
        v7_startTransition: true, 
        v7_relativeSplatPath: true
      }}
    >
      {/* ⏳ Suspense يعرض واجهة مؤقتة (شاشة تحميل) أثناء جلب ملفات الصفحة من السيرفر */}
      <Suspense 
        fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-gray-50 text-gray-600 font-sans" dir="rtl">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-lg font-medium">جاري تحميل الصفحة...</p>
            </div>
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/exam" element={<ExamPage />} />
          <Route path="/result" element={<ResultPage />} />

          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
