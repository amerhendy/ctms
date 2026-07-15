import { clsx } from 'clsx';
import { EISENHOWER_CONFIG } from '@/utils/helpers';
import { StatDisplayCard } from '@/components/dashboard/StatDisplayCard'
import { CheckSquare, Plus, Bell, ArrowLeftRight, AlertTriangle,Star,Clock, Trash2, Users } from 'lucide-react'
export default function EisenhowerChart({ data = {}, onQuadrantClick }) {
  const dataMap = Array.isArray(data) 
    ? data.reduce((acc, item) => {
        acc[item.quadrant] = item.count;
        return acc;
      }, {}) 
    : data;
  const quadrants = [
  { 
    key: 'Q1_DO_FIRST', 
    label: 'مهم وعاجل', 
    color: 'text-red-700 dark:text-red-300', 
    bg: 'bg-red-500 dark:bg-red-600 border-red-200 dark:border-red-900', 
    icon: AlertTriangle 
  },
  { 
    key: 'Q2_SCHEDULE', 
    label: 'مهم غير عاجل', 
    color: 'text-indigo-700 dark:text-indigo-300', 
    bg: 'bg-indigo-500 dark:bg-indigo-600 border-indigo-200 dark:border-indigo-900', 
    icon: Clock 
  },
  { 
    key: 'Q3_DELEGATE', 
    label: 'غير مهم عاجل', 
    color: 'text-emerald-700 dark:text-emerald-300', 
    bg: 'bg-emerald-500 dark:bg-emerald-600 border-emerald-200 dark:border-emerald-900', 
    icon: Users 
  },
  { 
    key: 'Q4_ELIMINATE', 
    label: 'غير مهم غير عاجل', 
    color: 'text-slate-600 dark:text-slate-400', 
    bg: 'bg-slate-500 dark:bg-slate-600 border-slate-200 dark:border-slate-800', 
    icon: Trash2 
  },
];

  return (
    <div className="card p-2 bg-white dark:bg-transparent border border-gray-100 dark:border-gray-500 shadow-sm">
      <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-1">مصفوفة أيزنهاور</h2>
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-1">
      {quadrants.map((q) => {
          const Icon = q.icon;
          const label=q.label
          const bgcolor=q.bg
          const count = dataMap[q.key] || 0;
            return (
              <StatDisplayCard
                key={q.key}
                icon={Icon}
                title={label}
                children={count}
                className={bgcolor}
                cardsize="1"
                to="/tasks" 
            />

            )})}
      </div>
      
    </div>
  );
}