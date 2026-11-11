import React, { useCallback, useEffect, useState, lazy, Suspense } from 'react' // 👈 تم إضافة lazy و Suspense هنا
import { useNavigate } from 'react-router-dom'
import { db } from '../../hooks/db'
import { jobModelsApi } from '../../api/adminApi'
import AdminTabs from '../../components/AdminTabs'
import { useAuthStore } from '../../stores/authStore'
import { Signal, WifiOff, Loader2, BellRing,LayoutDashboard,LogOut } from 'lucide-react' // 👈 أضفنا Loader2 لشاشة تحميل التبويب
import {PageLoader} from '../../components/common'
import { theme } from '../../constants/theme'
import clsx from 'clsx'
import { useAdminWebSocket } from '../../hooks/useAdminWebSocket';

// 📦 تحويل التبويبات الفرعية الثقيلة إلى تحميل كسول (Lazy Loading)
const ResultsTab = lazy(() => import('./ResultsTab'))
const ApplicantsTab = lazy(() => import('./ApplicantsTab'))
const QuestionsTab = lazy(() => import('./QuestionsTab'))
const JobModelsTab = lazy(() => import('./JobModelsTab'))

function ViolationsGrid() {
  const { notifications, setNotifications } = useAdminWebSocket();

  const removeNotification = (indexToRemove) => {
    setNotifications((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <div style={{ padding: '20px' }} dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <BellRing style={{ color: '#d97706', width: '20px', hieght: '20px', flexShrink: 0 }} /> 
          <span>التنبيهات والمخالفات المباشرة ({notifications.length})</span>
        </h3>

        
        {notifications.length > 0 && (
          <button
            onClick={clearAllNotifications}
            style={{
              backgroundColor: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}
          >
            🗑️ مسح الكل
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', marginTop: '20px' }}>لا توجد تنبيهات حتى الآن...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '15px' }}>
          {notifications.map((item, index) => {
            const payload = item.data || item;
            return (
              <div
                key={index}
                style={{
                  position: 'relative',
                  backgroundColor: '#fff5f5',
                  border: '1px solid #fca5a5',
                  borderRight: '5px solid #ef4444',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <button
                  onClick={() => removeNotification(index)}
                  title="مسح التنبيه"
                  style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: '#999',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    lineHeight: '1'
                  }}
                  onMouseOver={(e) => (e.target.style.color = '#ef4444')}
                  onMouseOut={(e) => (e.target.style.color = '#999')}
                >
                  ✖
                </button>
                <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#111827', paddingLeft: '20px' }}>
                  👤 {payload.user_name || 'غير محدد'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#374151' }}>
                  <strong>🆔 الكود:</strong> {payload.user_code || '---'}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: '500' }}>
                  <strong>⚠️ الحدث:</strong> {payload.details || payload.violation_type}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 'auto', textAlign: 'left' }}>
                  🕒 {payload.timestamp}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const admin = useAuthStore((s) => s.admin)
  const logout = useAuthStore((s) => s.logout)
  const [jobModels, setJobModels] = useState([])
  const { isConnected } = useAdminWebSocket();
  const [activeTab, setActiveTabState] = useState('results')

  useEffect(() => {
    async function loadActiveTab() {
      try {
        const savedTab = await db.store.get('admin_active_tab')
        if (savedTab?.value) {
          setActiveTabState(savedTab.value)
        }
      } catch (e) {
        console.error('Error loading active tab from Dexie:', e)
      }
    }
    loadActiveTab()
  }, [])

  const setActiveTab = async (newTab) => {
    setActiveTabState(newTab)
    try {
      await db.store.put({ key: 'admin_active_tab', value: newTab })
    } catch (e) {
      console.error('Error saving active tab to Dexie:', e)
    }
  }

  const refreshJobModels = useCallback(async () => {
    const { data } = await jobModelsApi.list()
    setJobModels(data)
  }, [])

  useEffect(() => {
    refreshJobModels()
  }, [refreshJobModels])

  async function handleLogout() {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div>
      <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
            <LayoutDashboard color="#fff" strokeWidth={3} />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-slate-100 leading-tight">
              لوحة تحكم نظام الاختبارات
            </h1>
            {admin && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs text-slate-400">
                  مرحباً، <strong className="text-slate-200 font-medium">{admin.full_name || admin.username}</strong>
                </span>
                {isConnected ? (
                  <span className="text-emerald-500 flex items-center"><Signal className="w-4 h-4" /></span>
                ) : (
                  <span className="text-rose-500 flex items-center"><WifiOff className="w-4 h-4" /></span>
                )}
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleLogout} 
          className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-red-500/10 hover:border-red-500/30 border border-slate-700/60 px-3.5 py-2 rounded-xl transition-all duration-200 active:scale-95"
        >
          <span>تسجيل الخروج</span>
          <span className="text-sm"><LogOut color="#fff" strokeWidth={3} /></span>
        </button>
      </header>
      
      <AdminTabs activeTab={activeTab} onChange={setActiveTab} />
      <ViolationsGrid />
      
      <main className="max-w-5xl mx-auto px-6 py-6">
        {/* ⏳ وضع المظلة الـ Suspense لعرض مؤشر تحميل أنيق عند الانتقال بين التبويبات الكبيرة */}
        <Suspense 
          fallback={
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 gap-2">
              <PageLoader className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm font-medium">جاري تحميل القسم...</p>
            </div>
          }
        >
          {activeTab === 'results' && <ResultsTab jobModels={jobModels} />}
          {activeTab === 'applicants' && <ApplicantsTab jobModels={jobModels} onCreated={refreshJobModels} />}
          {activeTab === 'questions' && <QuestionsTab jobModels={jobModels} />}
          {activeTab === 'job-models' && <JobModelsTab jobModels={jobModels} onRefresh={refreshJobModels} />}
        </Suspense>
      </main>
    </div>
  )
}
