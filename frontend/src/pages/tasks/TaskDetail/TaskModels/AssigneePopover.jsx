// src/pages/tasks/TaskDetail/TaskModels/AssigneePopover.jsx

import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import SidebarTree from '../SidebarTree';

/**
 * Popover صغير لاختيار المسؤول باستخدام SidebarTree
 * يستخدم في InlineEditForm بدلاً من المودال الكبير
 */
export default function AssigneePopover({
  isOpen,
  onClose,
  onSelect,
  triggerRef, // ref الزر الذي يفتح الـ Popover
  position = 'bottom-start', // 'bottom-start', 'bottom-end', 'top-start', 'top-end'
}) {
  const popoverRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);

  // حساب موقع الـ Popover
  const updatePosition = () => {
    if (!triggerRef?.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = triggerRect.bottom + scrollY + 6; // 6px فاصل
    let left = triggerRect.left + scrollX;

    // ضبط حسب position
    if (position === 'bottom-end') {
      left = triggerRect.right + scrollX - popoverRect.width;
    } else if (position === 'top-start') {
      top = triggerRect.top + scrollY - popoverRect.height - 6;
    } else if (position === 'top-end') {
      top = triggerRect.top + scrollY - popoverRect.height - 6;
      left = triggerRect.right + scrollX - popoverRect.width;
    }

    // التأكد من أن الـ popover لا يخرج عن الشاشة (أفقياً)
    const maxLeft = window.innerWidth + scrollX - popoverRect.width - 10;
    if (left > maxLeft) left = maxLeft;
    if (left < 10) left = 10;

    // عمودياً: إذا كان خارج الشاشة من الأسفل، نضعه فوق
    const viewportHeight = window.innerHeight;
    if (top + popoverRect.height > scrollY + viewportHeight - 20) {
      // نضعه فوق الزر
      top = triggerRect.top + scrollY - popoverRect.height - 6;
    }

    setCoords({ top, left });
    setIsPositioned(true);
  };

  // تحديث الموقع عند الفتح أو تغيير المحتوى
  useLayoutEffect(() => {
    if (isOpen) {
      // نؤجل قليلاً حتى يظهر الـ popover ويتم قياسه
      requestAnimationFrame(() => {
        updatePosition();
      });
    } else {
      setIsPositioned(false);
    }
  }, [isOpen]);

  // تحديث الموقع عند تغيير حجم النافذة أو التمرير
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => updatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isOpen]);

  // إغلاق عند الضغط خارج الـ popover
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={clsx(
        'fixed z-[1000] w-72 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden',
        'transition-opacity duration-150',
        isPositioned ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        top: coords.top,
        left: coords.left,
        minWidth: '280px',
        maxHeight: '360px',
      }}
    >
      {/* رأس الـ Popover */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          اختيار المسؤول
        </span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <span className="sr-only">إغلاق</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* محتوى الـ Popover: SidebarTree */}
      <div className="overflow-y-auto max-h-[280px] p-1">
        <SidebarTree
          onSelectNode={(node) => {
            onSelect(node);
            onClose(); // إغلاق بعد الاختيار
          }}
        />
      </div>
    </div>,
    document.body
  );
}