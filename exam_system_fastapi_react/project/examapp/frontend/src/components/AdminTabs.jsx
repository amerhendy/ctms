import { TABS } from '../constants';

import clsx from 'clsx';

export default function AdminTabs({ activeTab, onChange }) {
  return (
    <div className="border-b border-gray-200/80 dark:border-gray-800 bg-white dark:bg-slate-900">
      <nav className="flex gap-1.5 px-4 sm:px-6 pt-3 pb-2 max-w-6xl mx-auto overflow-x-auto no-scrollbar">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={clsx(
                "relative flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium rounded-xl transition-all duration-200 whitespace-nowrap select-none",
                isActive
                  ? "bg-blue-800 text-white shadow-sm shadow-primary/25 font-bold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-slate-800/60"
              )}
            >
              {/* أيقونة شارة صغيرة تنبض للتاب النشط (اختياري) */}
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              )}
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}