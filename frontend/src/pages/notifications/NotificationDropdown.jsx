import { Link } from 'react-router-dom';
import { formatDateTime } from '@/utils/helpers';
import { Bell, CheckCheck } from 'lucide-react';
import clsx from 'clsx';

export default function NotificationDropdown({ notifications, onMarkRead, onMarkAll }) {
  return (
    <div className="absolute left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
      {/* Header */}
      <div className="p-3 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
        <h3 className="text-sm font-bold text-gray-800">الإشعارات</h3>
        <button 
          onClick={onMarkAll}
          className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium"
        >
          <CheckCheck className="w-3 h-3" /> تعليم الكل كمقروء
        </button>
      </div>

      {/* List */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications?.length > 0 ? (
          notifications.slice(0, 5).map((n) => (
            <div 
              key={n.id}
              onClick={() => onMarkRead(n.id)}
              className={clsx(
                "p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer",
                !n.read_at && "bg-primary-50/20"
              )}
            >
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" 
                     style={{ visibility: n.read_at ? 'hidden' : 'visible' }} 
                />
                <div className="flex-1">
                  <p className={clsx("text-xs leading-relaxed", !n.read_at ? "font-bold text-gray-900" : "text-gray-600")}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{n.body}</p>
                  <span className="text-[10px] text-gray-400 mt-2 block">{formatDateTime(n.created_at)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">لا توجد إشعارات جديدة</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Link 
        to="/notifications" 
        className="block p-2.5 text-center text-xs font-semibold text-gray-600 hover:bg-gray-50 border-t border-gray-50"
      >
        عرض كل الإشعارات
      </Link>
    </div>
  );
}