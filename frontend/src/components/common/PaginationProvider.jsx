// src/components/common/PaginationProvider.jsx
import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Search, ListFilter, ChevronsRight, ChevronsLeft } from 'lucide-react'
import clsx from 'clsx'
export default function PaginationProvider({
  storageKey,
  totalPages: propsTotalPages = 1,
  children,
  defaultSortBy = 'created_at',
  defaultSortOrder = 'desc'
}) {
  const getInitialState = () => {
    const saved = localStorage.getItem(`amerCTM_${storageKey}`)
    if (saved) {
      try { return JSON.parse(saved) } catch (e) { console.error(e) }
    }
    return { page: 1, page_size: 10, search: '', sort_by: defaultSortBy, sort_order: defaultSortOrder }
  }

  const [state, setState] = useState(getInitialState)

  useEffect(() => {
    localStorage.setItem(`amerCTM_${storageKey}`, JSON.stringify(state))
  }, [state, storageKey])

  const updateState = (updater) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return { ...prev, ...next }
    })
  }

  const totalPages = PaginationProvider.totalPages || propsTotalPages;
  const current_page = state.page
  const has_next = current_page < totalPages
  const has_previous = current_page > 1

  const handleSort = (columnName) => {
    updateState(prev => ({
      sort_by: columnName,
      sort_order: prev.sort_by === columnName && prev.sort_order === 'asc' ? 'desc' : 'asc',
      page: 1
    }))
  }

  // 🌟 معادلة حساب الـ 6 صفحات الذكية حول الصفحة الحالية
  const getVisiblePages = () => {
    const maxVisible = 6
    let start = Math.max(1, current_page - Math.floor(maxVisible / 2))
    let end = start + maxVisible - 1

    if (end > totalPages) {
      end = totalPages
      start = Math.max(1, end - maxVisible + 1)
    }

    const pages = []
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="space-y-4 w-full" dir="rtl">
      
      {/* التحكم العلوي: شريط البحث وحجم الصفحة */}
      <div className={clsx(
          "flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border transition-colors",
          // النهاري
          "bg-white border-gray-100 shadow-sm",
          // الليلي
          "dark:bg-gray-900 dark:border-gray-800 dark:shadow-none"
        )}>
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </span>
          <input
            type="text"
            value={state.search}
            onChange={(e) => updateState({ search: e.target.value, page: 1 })}
            placeholder="بحث شامل في السجلات..."
            className={clsx(
              "w-full text-xs pr-9 pl-3 py-2 rounded-lg transition-all font-medium outline-none",
              // الألوان في الوضع النهاري
              "bg-gray-50 border border-gray-200 text-gray-700 placeholder-gray-400 focus:border-indigo-500 focus:bg-white",
              // الألوان في الوضع الليلي
              "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-indigo-500 dark:focus:bg-gray-900"
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
            <ListFilter className="w-3.5 h-3.5" /> عرض:
          </span>
          <select
            value={state.page_size}
            onChange={(e) => updateState({ page_size: Number(e.target.value), page: 1 })}
            className={clsx(
              "text-xs rounded-lg py-1.5 px-2.5 font-bold cursor-pointer transition-colors focus:outline-none",
              // الألوان للنهاري
              "bg-gray-50 border border-gray-200 text-gray-700 focus:border-indigo-500",
              // الألوان لليلي
              "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 dark:focus:border-indigo-500"
            )}
          >
            {[10, 25, 50, 100].map(size => (
              <option key={size} value={size} className="dark:bg-gray-800">
                {size} سجلات
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* الوسط: حقن الجدول */}
      <div className="w-full">
        {children({ currentParams: state, handleSort: handleSort })}
      </div>

      {/* التحكم السفلي: لوحة التنقل الاحترافية الجديدة */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm gap-4 select-none">
          <span className="text-xs font-semibold text-gray-500">
            الصفحة <strong className="text-indigo-600">{current_page}</strong> من <strong className="text-gray-900">{totalPages}</strong>
          </span>
          
          <div className="flex items-center gap-1.5 text-xs font-bold flex-wrap">
            {/* زر الصفحة الأولى */}
            <button
              onClick={() => updateState({ page: 1 })}
              disabled={!has_previous}
              className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
              title="الصفحة الأولى"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>

            {/* زر السابقة */}
            <button
              onClick={() => updateState({ page: Math.max(1, current_page - 1) })}
              disabled={!has_previous}
              className="flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-2 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* 🌟 رندرة الـ 6 صفحات الديناميكية */}
            {visiblePages.map(p => (
              <button
                key={p}
                onClick={() => updateState({ page: p })}
                disabled={p === current_page} // 🌟 تعطيل الزر إذا كنا نقف على نفس الصفحة
                className={`w-8 h-8 rounded-lg border transition-all text-center flex items-center justify-center font-bold ${
                  p === current_page
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-600 cursor-default opacity-80' // ستايل الـ disable للحالية
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                {p}
              </button>
            ))}

            {/* زر التالية */}
            <button
              onClick={() => updateState({ page: Math.min(totalPages, current_page + 1) })}
              disabled={!has_next}
              className="flex items-center gap-1 bg-white border border-gray-200 px-2.5 py-2 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* زر الصفحة الأخيرة */}
            <button
              onClick={() => updateState({ page: totalPages })}
              disabled={!has_next}
              className="flex items-center justify-center p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
              title="الصفحة الأخيرة"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}