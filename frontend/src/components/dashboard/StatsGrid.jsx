// components/common/StatsGrid.jsx
import { StatDisplayCard } from './StatDisplayCard';
import { TrendingUp, Clock } from 'lucide-react';

export function StatsGrid({ stats, onStatClick }) {
  if (!stats) return null;

 

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* بطاقة الإنتاجية */}
      <StatDisplayCard 
        title="الإنتاجية" 
        icon={TrendingUp}
        onClick={() => onStatClick?.('productivity')}
        cardsize="3"
        className="dark:bg-gray-900 text-gray-500 dark:text-white/90"
      >
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <span className="text-sm text-gray-900 dark:text-gray-50">مهام منجزة</span>
          <span className="text-xl font-bold text-gray-900 dark:text-gray-50">{stats.completedTasksCount}</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <span className="text-sm  text-gray-900 dark:text-gray-50">نسبة الالتزام</span>
          <span className="text-xl font-bold text-green-600">{stats.commitmentRate?.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm  text-gray-900 dark:text-gray-50">سرعة الأداء</span>
          <span className="text-xl font-bold text-blue-600">{stats.avgRelativeSpeed?.toFixed(1)}%</span>
        </div>
      </StatDisplayCard>

      {/* بطاقة المشاركة */}
      <StatDisplayCard 
        title="المشاركة" 
        icon={Clock}
        onClick={() => onStatClick?.('engagement')}
        className="dark:bg-gray-900 text-gray-500 dark:text-white/90"
      >
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <span className="text-sm  text-gray-900 dark:text-gray-50">ساعات العمل</span>
          <span className="text-xl font-bold text-gray-900  dark:text-gray-100">{stats.totalHours?.toFixed(1)} س</span>
        </div>
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <span className="text-sm  text-gray-900 dark:text-gray-50">التعليقات</span>
          <span className="text-xl font-bold text-gray-900  dark:text-gray-100">{stats.commentsCount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm  text-gray-900 dark:text-gray-50">المفضلة</span>
          <span className="text-xl font-bold text-amber-600">{stats.favoritesCount}</span>
        </div>
      </StatDisplayCard>
    </div>
  );
}