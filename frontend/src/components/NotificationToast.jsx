// src/components/NotificationToast.jsx
import React from 'react';
import toast from 'react-hot-toast';

export const NotificationToast = ({ t, n, icon }) => {
  return (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-md w-full bg-white shadow-2xl rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-r-4 border-primary-500`}
      dir="rtl"
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5 text-2xl">
            {icon}
          </div>
          <div className="ml-3 mr-3 flex-1">
            <p className="text-sm font-bold text-gray-900">{n.title}</p>
            <p className="mt-1 text-xs text-gray-500 line-clamp-2">{n.body}</p>
          </div>
        </div>
      </div>
      <div className="flex border-r border-gray-100">
        <button
          onClick={() => {
            toast.dismiss(t.id);
            if (n.related_task_id) window.location.href = `/tasks/${n.related_task_id}`;
          }}
          className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-xs font-bold text-primary-600 hover:text-primary-500"
        >
          عرض
        </button>
      </div>
    </div>
  );
};