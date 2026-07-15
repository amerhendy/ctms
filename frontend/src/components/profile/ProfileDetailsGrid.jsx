//components/profile/ProfileDetailsGrid.jsx
import { Building, Award, MapPin, Hash, ShieldCheck, Clock } from 'lucide-react';
import clsx from 'clsx';

export default function ProfileDetailsGrid({ user }) {
  if (!user) return null;

  const details = [
    { label: 'القسم', value: user.department?.name || 'غير محدد', icon: Building },
    { label: 'المستوى الوظيفي', value: user.job_level?.title || 'غير محدد', icon: Award },
    { label: 'الموقع', value: user.department?.location?.name || 'غير محدد', icon: MapPin },
    { label: 'رقم الموظف', value: user.employee_number || '---', icon: Hash },
    { label: 'النقل الخارجي', value: user.can_transfer_external ? 'مسموح' : 'غير مسموح', icon: ShieldCheck, highlight: true },
    { label: 'آخر دخول', value: user.last_login ? new Date(user.last_login).toLocaleDateString('ar-EG') : '---', icon: Clock },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {details.map((item, i) => {
        const Icon = item.icon; // استدعاء الأيقونة كـ Component
        return (
          <div 
            key={i} 
            className={clsx(
              "group p-4 rounded-xl border flex items-center gap-4 shadow-sm transition-all hover:shadow-md",
              item.highlight 
                ? "border-indigo-100 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-900/20" 
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            )}
          >
            {/* الأيقونة داخل حاوية مميزة */}
            <div className={clsx(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-colors shrink-0",
              item.highlight 
                ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400"
                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
            )}>
              <Icon size={20} />
            </div>

            {/* النصوص */}
            <div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-wide">{item.label}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{item.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}