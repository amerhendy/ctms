import React from 'react';

export default function PageHeader({ title, icon: Icon, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* الجزء الخاص بالعنوان والأيقونة */}
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 bg-transparent dark:bg-transparent text-primary-600 dark:text-primary-400 rounded-xl">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-950 dark:text-white tracking-tight">
          {title}
        </h1>
      </div>

      {/* الجزء الخاص بالأزرار أو الإجراءات (الـ Children) */}
      {children && (
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {children}
        </div>
      )}
    </div>
  );
}