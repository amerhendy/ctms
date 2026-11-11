// components/dashboard/AlertsSidebar.jsx
import { AlertTriangle } from 'lucide-react'
export function AlertsSidebar({ alerts = [] }) {
  if (alerts.length === 0) return null;
  
  return (
    <div className="card border-l-4 border-l-red-500 dark:border-l-red-600 bg-white dark:bg-gray-800">
      <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500" />
        تنبيهات عاجلة
      </h3>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div 
            key={alert.task_id} 
            className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50"
          >
            <p className="text-sm font-semibold text-red-800 dark:text-indigo-300">
              {alert.title}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              {alert.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}