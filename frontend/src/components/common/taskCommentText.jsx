
import { useState, useEffect } from 'react'
import clsx from 'clsx'
export default function CommentText({ text, maxLength = 180 }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  // تحديد ما إذا كان النص طويلاً (بعدد الأحرف أو عدد الأسطر)
  const isLongText = text.length > maxLength || text.split('\n').length > 3;
 
  return (
    <div className="pt-1 text-right inline-flex">
      <p
        className={clsx(
          "text-xs sm:text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed break-words transition-all",
          !isExpanded && isLongText && "line-clamp-1"
        )}
      >
        {text}
      </p>

      {isLongText && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded((prev) => !prev);
          }}
          className="mt-1 inline-flex items-center text-[11px] sm:text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
        >
          {isExpanded ? 'عرض أقل' : '... المزيد'}
        </button>
      )}
    </div>
  );
}