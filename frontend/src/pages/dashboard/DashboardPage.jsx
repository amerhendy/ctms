import { clsx } from 'clsx';
//react
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
//icons
import { Plus, Menu, X, TrendingUp,Clock,
  CheckSquare,AlertTriangle,ArrowLeftRight,Bell
 } from 'lucide-react'

import { theme, resolveFieldState } from '@/constants/theme';
import { daysUntilDue,dueDateColor } from '@/utils/helpers'
//import store
import useAuthStore from '@/stores/authStore'
import useDashboardStore from '@/stores/dashboardStore';
//stats
import { useDashboardStats } from '@/hooks/useDashboardStats';
//components
import SidebarTree from '@/pages/dashboard/SidebarTree'
import { StatDisplayCard } from '@/components/dashboard/StatDisplayCard';
import  EisenhowerChart from '@/components/dashboard/EisenhowerChart'
import { StatsGrid } from '@/components/dashboard/StatsGrid'
import  {DepartmentDistribution} from '@/components/dashboard/DepartmentDistribution'

import { Spinner, PageLoader,PriorityBadge,ProgressBar } from '@/components/common'
function TaskRow({ task }) {
  const days = daysUntilDue(task.due_date)
  return (
    <Link
      to={`/tasks/${task.id ?? task.task_id}`}
      className={clsx(
        'flex items-center gap-3 p-3 rounded-xl border hover:bg-gray-50 transition-colors',
        'dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700',
        task.urgency_request_status === 'approved' ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/30' : ''
      )}
    >
      {task.urgency_request_status === 'approved' && (
        <span className="text-red-500 dark:text-red-400 animate-pulse">🚨</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{task.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{task.department_name}</p>
        {task.message && (
          <span className="text-xs text-red-600 dark:text-red-400">
            {task.message}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <PriorityBadge priority={task.priority} />
        {task.due_date && (
          <span className={clsx('text-xs', dueDateColor(days))}>
            {days === null ? '' : days < 0 ? `متأخر ${Math.abs(days)} يوم` : `${days} يوم`}
          </span>
        )}
        
        <ProgressBar value={task.progress_percentage} className="w-16" />
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user,isAdminOrPM,isDepartmentManager } = useAuthStore()
  const { data: stats, isLoading: statsLoading } = useDashboardStats();


  const { setSelectedNode } = useDashboardStore();
  const handleNodeSelect = (node) => {

    // تحديث الـ Store سيؤدي فوراً إلى تشغيل الـ Hooks (useDashboardStats, useDashboardTasks)
    // لأننا وضعنا [selectedNode] في الـ queryKey الخاص بها
    setSelectedNode(node); 
    console.log("Selected:", node);
    
    // إغلاق الدرج في الموبايل عند الاختيار
    closeDrawer(); 
  };
  
  
  //mobile
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth >= 1024) { // lg breakpoint
          setIsDrawerOpen(false);
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);
  
  if (statsLoading) return <PageLoader />
  return (
    <div className={clsx("space-y-6 transition-colors duration-300")}>
      <div className="w-full h-full overflow-y-auto py-2">
        <h1 className={theme.text.pageTitle}>مرحباً، {user?.full_name?.split(' ')[0]} 👋</h1>
        <Link to="/tasks/new" className={clsx(theme.button.base, theme.button.primary, "w-full sm:w-auto")}>
          <Plus className="w-4 h-4" /> مهمة جديدة
        </Link>
      </div>
      {/* الشبكة الأساسية */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6 relative">
         {/* القسم الجانبي الثابت (يظهر فقط في lg فما فوق) */}
       {(isAdminOrPM() || isDepartmentManager()) && (
          <aside className="hidden lg:block col-span-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden h-fit">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 font-bold">الأقسام والموظفون</div>
            <SidebarTree onSelect={handleNodeSelect} />
          </aside>
        )}
        {/* المحتوى الرئيسي (البطاقات) */}
        <StatDisplayCard 
          title="الإنتاجية" 
          icon={TrendingUp}
          cardsize="3"
          className={clsx(theme.card.base, "col-span-4")}
          cols="4"
        >
          {statsLoading ? (
            <Spinner size="md"/>
          ):(
            <>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className={theme.text.label}>مهام منجزة</span>
              <span className={clsx(theme.text.sectionTitle)}>{stats.completedTasksCount}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className={theme.text.label}>نسبة الالتزام</span>
              <span className={clsx(theme.text.sectionTitle)}>{stats.commitmentRate?.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={theme.text.label}>سرعة الأداء</span>
              <span className={clsx(theme.text.sectionTitle)}>{stats.avgRelativeSpeed?.toFixed(1)}%</span>
            </div>
          </>
          )}
          
        </StatDisplayCard>  
        <StatDisplayCard 
          title="المشاركة" 
          icon={Clock}
          className={clsx(theme.card.base, "col-span-4")}
          cols="4"
        >
          {statsLoading ? (
            <Spinner size="md"/>
          ):(
            <>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className={theme.text.label}>ساعات العمل</span>
                <span className={clsx(theme.text.sectionTitle)}>{stats.totalHours?.toFixed(1)} س</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className={theme.text.label}>التعليقات</span>
                <span className={clsx(theme.text.sectionTitle)}>{stats.commentsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={theme.text.label}>المفضلة</span>
                <span className={clsx(theme.text.sectionTitle)}>{stats.favoritesCount}</span>
              </div>
            </>
          )}
        </StatDisplayCard>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 relative">
        {!statsLoading && (
            <StatDisplayCard
              icon={CheckSquare}
              title="مهام نشطة"
              children={stats?.active_tasks_count || 0} 
              className="bg-emerald-600 dark:bg-emerald-900"
              cardsize="1"
              to="/tasks?status=not_started,in_progress" 
              cols="1"
            />
          )}
           {!statsLoading && (
              <StatDisplayCard 
                icon={AlertTriangle}   
                title="مهام مستعجلة"   
                children={stats?.urgent_count || 0} 
                className="bg-red-600 dark:bg-red-900"
                cardsize="1"
                to="/tasks?is_urgent=true"
                cols="1"
              />
            )}
            {!statsLoading && (
              <StatDisplayCard 
                icon={ArrowLeftRight}  
                title="تحويلات معلقة"   
                children={stats?.pending_count || 0} 
                className="bg-orange-600 dark:bg-orange-900"
                cardsize="1"
                to="/transfers"
                cols="1"
            />
            )}
            {!statsLoading && (
              <StatDisplayCard 
                icon={Bell}            
                title="إشعارات جديدة"  
                children={stats?.notification_count || 0} 
                className="bg-purple-600 dark:bg-purple-900"
                cardsize="1"
                to="/notifications"
                cols="1"
            />
            )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!statsLoading && (
        <div className="p-4">
          <EisenhowerChart data={stats?.eisenhower_distribution} onQuadrantClick={(q) => console.log(q)} />
        </div>
        )}
        
        {/* الابن الثاني */}
        <div className="p-4">
          {!statsLoading && (
          <div className="lg:col-span-2 card bg-white dark:bg-transparent">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-primary-500 " />
                المهام النشطة
              </h2>
              <Link to="/tasks" className="text-xs text-primary-600 hover:underline">عرض الكل</Link>
            </div>
            {stats?.active_tasks.length === 0 ? (
              <p className="text-center text-gray-400 py-8">لا توجد مهام نشطة</p>
            ) : (
              <div className="space-y-2">
                {stats?.active_tasks.slice(0, 6).map(task => <TaskRow key={task.id} task={task} />)}
              </div>
            )}
          </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4">
          {!statsLoading && (
          <div className="lg:col-span-2 card bg-white dark:bg-transparent">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <span className="relative flex h-5 w-5 items-center justify-center">
                    {/* الدائرة أو النبضة الخارجية */}
                    <AlertTriangle className="absolute h-5 w-5 text-red-500 animate-ping opacity-75" />
                    {/* الأيقونة الأساسية الثابتة في المنتصف */}
                    <AlertTriangle className="relative h-5 w-5 text-red-500" />
                  </span>
                تنبيهات عاجلة
              </h2>
              <Link to="/tasks" className="text-xs text-primary-600 hover:underline">عرض الكل</Link>
            </div>
            {stats?.alerts.length === 0 ? (
              <p className="text-center text-gray-400 py-8">لا توجد مهام نشطة</p>
            ) : (
              <div className="space-y-2">
                {stats?.alerts.slice(0, 6).map(task => <TaskRow key={task.task_id} task={task} />)}
              </div>
            )}
          </div>
          )}
        </div>
        <div className="p-4">
          <DepartmentDistribution data={stats?.department_distribution} />
        </div>
        <div className="card bg-white dark:bg-transparent">
          <h3 className="font-bold mb-3">المفضلة النشطة</h3>
          {(stats?.active_favorites || []).map(t => (
            <Link key={t.id} to={`/tasks/${t.id}`} className="block text-sm py-1">⭐ {t.title}</Link>
          ))}
        </div>
        {!statsLoading && (
        <div className="card bg-transparent">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4 text-orange-500" />
              تحويلات معلقة
            </h3>
            <Link to="/transfers" className="text-xs text-primary-600 hover:underline">الكل</Link>
          </div>
          {stats?.pending_count=== 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">لا توجد تحويلات</p>
          ) : (
            <div className="space-y-2">
              {(stats?.transfared_tasks || []).slice(0, 4).map(t => (
                <TaskRow  key={t.id} task={t} />
              ))}
            </div>
          )}
        </div>
        )}
      </div>
      
        
      {/* ============================================= */}
      {/* زر فتح الدرج (يظهر فقط في الشاشات الصغيرة) */}
      {/* ============================================= */}
      {(isAdminOrPM() || isDepartmentManager()) && (
        <button
          onClick={toggleDrawer}
          className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all duration-200 active:scale-95"
        >
          <Menu className="w-5 h-5" />
          عرض الأقسام
        </button>
      )}

      {/* ============================================= */}
      {/* الدرج الجانبي المنبثق (خاص بالشاشات الصغيرة) */}
      {/* ============================================= */}
      {(isAdminOrPM() || isDepartmentManager()) && (
        <>
          {/* الخلفية المعتمة */}
          <div
            className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
              isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={closeDrawer}
          />

          {/* محتوى الدرج */}
          <div
            className={`fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 z-50 shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto ${
              isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {/* رأس الدرج مع زر الإغلاق */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <span className={theme.text.sectionTitle}>الأقسام والموظفون</span>
              <button
                onClick={closeDrawer}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* محتوى الشريط الجانبي */}
            <SidebarTree onSelect={handleNodeSelect} />
          </div>
        </>
      )}
    </div>
  )
}