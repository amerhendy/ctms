//App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from '@/stores/authStore'
import MainLayout from '@/components/layout/MainLayout'
import ErrorBoundary from '@/components/common/ErrorBoundary' // <-- استيراد المكون الجديد هنا

// Pages
import LoginPage from '@/pages/auth/LoginPage'
import ProfilePage from '@/pages/UserProfilePage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import TasksListPage from '@/pages/tasks/TasksListPage'
import TaskDetailPage from '@/pages/tasks/TaskDetail/TaskDetailPage'
import TaskFormModal from '@/pages/tasks/TaskFormModal'
import TransfersPage from '@/pages/tasks/TransfersPage'
import DelegationsPage from '@/pages/tasks/DelegationsPage'
import SearchPage from '@/pages/tasks/SearchPage'
import NotificationsPage from '@/pages/notifications/NotificationsPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminOrgPage from '@/pages/admin/AdminOrgPage'
import AdminLocationPage from '@/pages/admin/AdminLocationPage'
import AdminLevelsPage from '@/pages/admin/AdminLevelsPage'
import AdminRecurringTasksPage from '@/pages/admin/AdminRecurringTasksPage'
import RecurringTasksLogs from '@/pages/admin/RecurringTasksLogs' 
import AdminWorkflowTemplatesPage from '@/pages/admin/AdminWorkflowTemplatesPage'
import AdminWorkflowMonitorPage   from '@/pages/admin/AdminWorkflowMonitorPage'
// محمود مختار - موسى كوست
//محمد مختار - نتصحيح
//هشام صقر - رسالة صوتية
import { useState } from 'react'
import TasksListPageWithNew from '@/pages/tasks/TasksListPage'

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

// Favorites page
function FavoritesPage() {
  return <TasksListPageWithNew defaultFavorites />
}

// New task page wrapper
function NewTaskPage() {
  const [open, setOpen] = useState(true)
  if (!open) return <Navigate to="/tasks" replace />
  return (
    <div>
      <TasksListPageWithNew />
      <TaskFormModal onClose={() => setOpen(false)} onSuccess={() => setOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {/* تغليف الـ Layout لضمان عدم اختفاء الـ App كاملاً وعرض رسالة الخطأ مكانه */}
              <ErrorBoundary>
                <MainLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Tasks */}
          <Route path="tasks" element={<TasksListPage />} />
          <Route path="tasks/new" element={<NewTaskPage />} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />

          {/* Favorites */}
          <Route path="favorites" element={<FavoritesPage />} />

          {/* Transfers */}
          <Route path="transfers" element={<TransfersPage />} />

          {/* Delegations */}
          <Route path="delegations" element={<DelegationsPage />} />

          {/* Search */}
          <Route path="search" element={<SearchPage />} />

          {/* Notifications */}
          <Route path="notifications" element={<NotificationsPage />} />

          {/* Admin */}
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/org" element={<AdminOrgPage />} />
          <Route path="admin/loc" element={<AdminLocationPage />} />
          <Route path="admin/levels" element={<AdminLevelsPage />} />
          
          <Route path="admin/recurring" element={<AdminRecurringTasksPage />} />
          <Route path="admin/recurring-tasks/logs" element={<RecurringTasksLogs />} />

          <Route path="/admin/workflow-templates" element={<AdminWorkflowTemplatesPage />} />
          <Route path="/admin/workflow-monitor"   element={<AdminWorkflowMonitorPage />} />

          {/* Profile */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}