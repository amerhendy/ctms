// src/components/DepartmentTrees/SidebarTree.jsx

import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, ChevronRight, Search, Building2, Target, User, Loader2 } from 'lucide-react';
import { orgApi } from '@/api';
import { getTreeData, saveTreeData } from '@/utils/db';
import useAuthStore from '@/stores/authStore';
import { Avatar, Spinner } from '@/components/common';
import { theme } from '@/constants/theme';
import clsx from 'clsx';

/**
 * 🆕 دالة مساعدة للبحث الشجري عن مسار الآباء للقسم أو الموظف
 */
function findParentPath(nodes, targetId, targetType, employeesMap) {
  if (!nodes || !targetId) return [];

  const path = [];

  function search(currentNodes) {
    for (const node of currentNodes) {
      // 1. إذا كان الهدف قسماً وطابق المعرف
      if (targetType === 'department' && Number(node.id) === Number(targetId)) {
        return true;
      }

      // 2. إذا كان الهدف موظفاً وهو ضمن مدراء هذا القسم
      if (targetType === 'employee' && node.managers?.some((m) => Number(m.id) === Number(targetId))) {
        path.push(node.id);
        return true;
      }

      // 3. إذا كان الهدف موظفاً وهو ضمن موظفي هذا القسم المجلوبين
      if (targetType === 'employee' && employeesMap[node.id]?.some((e) => Number(e.id) === Number(targetId))) {
        path.push(node.id);
        return true;
      }

      // 4. البحث التكراري في الأقسام الفرعية
      if (node.children?.length > 0) {
        path.push(node.id);
        if (search(node.children)) {
          return true;
        }
        path.pop(); // التراجع إذا لم يعثر عليه في هذا الفرع
      }
    }
    return false;
  }

  search(nodes);
  return path;
}

/**
 * شجرة الأقسام والموظفين
 * تدعم التوسيع التلقائي والتمرير التلقائي للأنصر المحدد
 */
export default function SidebarTree({
  onSelectNode,      // دالة اختيار عقدة { id, type, name }[cite: 5]
  onClose,           // دالة لإغلاق الـ Popover[cite: 5]
  isPopover = false, 
  initialExpanded = [], 
  showSearch = true, 
  maxHeight = '400px', 
  selectedId = null,   // المعرف المحدد حالياً
  selectedType = null, // النوع المحدد ('employee' أو 'department')
}) {
  const { user } = useAuthStore();
  const [treeData, setTreeData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set(initialExpanded));
  const [employeesMap, setEmployeesMap] = useState({});
  const [loadingEmployees, setLoadingEmployees] = useState({});
  const [pages, setPages] = useState({});
  const [hasMore, setHasMore] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // مرجع الـ Container للتحكم بالتمرير التلقائي (Auto-Scroll)
  const treeContainerRef = useRef(null);

  // ── 1. تحميل بيانات الشجرة ──
  useEffect(() => {
    const loadTree = async () => {
      setIsLoading(true);
      try {
        const cached = await getTreeData(user.id);
        if (cached) {
          setTreeData(cached);
          setIsLoading(false);
          return;
        }

        const params = new URLSearchParams();
        if (user?.managed_department_ids) {
          user.managed_department_ids.forEach((id) => {
            params.append('department_id', id);
          });
        }

        const { data } = await orgApi.getDeptTree(params);
        setTreeData(data);
        await saveTreeData(user.id, data);
      } catch (error) {
        console.error('Error fetching department tree:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      loadTree();
    }
  }, [user.id, user.managed_department_ids]);

  // ── 2. جلب موظفي القسم ──
  const fetchEmployees = async (deptId, page) => {
    setLoadingEmployees((prev) => ({ ...prev, [deptId]: true }));
    try {
      const { data } = await orgApi.usersDept(deptId, {
        params: { page, page_size: 10 },
      });

      setEmployeesMap((prev) => ({
        ...prev,
        [deptId]: page === 1 ? data.items : [...(prev[deptId] || []), ...data.items],
      }));

      setPages((prev) => ({ ...prev, [deptId]: page }));
      setHasMore((prev) => ({ ...prev, [deptId]: page < data.pages }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingEmployees((prev) => ({ ...prev, [deptId]: false }));
    }
  };

  // ── 3. التوسيع التلقائي (Auto-Expand) عند وجود selectedId ──
  useEffect(() => {
    if (!treeData.length || !selectedId || !selectedType) return;

    const parentPath = findParentPath(treeData, selectedId, selectedType, employeesMap);

    if (parentPath.length > 0) {
      setExpandedIds((prev) => {
        const updated = new Set(prev);
        parentPath.forEach((id) => updated.add(id));
        return updated;
      });

      // إذا كان المحدد موظفاً ولم تجلب قائمة موظفي قسمه بعد، قم بجلبهم
      parentPath.forEach((deptId) => {
        if (!employeesMap[deptId]) {
          fetchEmployees(deptId, 1);
        }
      });
    }
  }, [treeData, selectedId, selectedType]);

  // ── 4. التمرير التلقائي (Auto-Scroll) للتركيز على العنصر المحدد ──
  useEffect(() => {
    if (!selectedId || !treeContainerRef.current) return;

    // مهلة زمنية بسيطة لضمان اكتمال الرندر وتوسيع العناصر
    const timer = setTimeout(() => {
      const selectedEl = treeContainerRef.current?.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedId, expandedIds, employeesMap]);

  // ── فلترة الشجرة حسب البحث ──
  const filteredTreeData = useMemo(() => {
    if (!searchQuery) return treeData;
    return treeData.filter((node) =>
      node.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [treeData, searchQuery]);

  // ── تبديل حالة العقدة ──
  const toggleNode = async (node) => {
    const next = new Set(expandedIds);
    if (next.has(node.id)) {
      next.delete(node.id);
    } else {
      next.add(node.id);
      if (node.id && !employeesMap[node.id]) {
        fetchEmployees(node.id, 1);
      }
    }
    setExpandedIds(next);
  };

  // ── معالج اختيار العقدة ──
  const handleSelect = (item, type) => {
    const selected = {
      id: item.id,
      type: type, // 'employee' أو 'department'[cite: 5]
      name: item.full_name || item.name,
    };
    onSelectNode(selected);
    if (onClose) {
      onClose();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
        <span className="mr-2 text-sm text-slate-500">جاري التحميل...</span>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'flex flex-col h-full',
        isPopover && 'p-2 bg-white dark:bg-slate-800 rounded-lg shadow-xl'
      )}
      style={{ maxHeight }}
    >
      {/* ─── حقل البحث ─── */}
      {showSearch && (
        <div className="px-2 mb-3 relative flex-shrink-0">
          <Search className={clsx(theme.input.icon, 'absolute left-3 top-1/2 -translate-y-1/2')} />
          <input
            type="text"
            placeholder="بحث عن قسم أو موظف..."
            className={clsx(theme.input.base, theme.input.iconPaddingStart, 'w-full')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* ─── قائمة الشجرة ─── */}
      <div ref={treeContainerRef} className="flex-1 overflow-y-auto">
        {filteredTreeData.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            {searchQuery ? 'لا توجد نتائج بحث' : 'لا توجد أقسام متاحة'}
          </div>
        ) : (
          filteredTreeData.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              expandedIds={expandedIds}
              employeesMap={employeesMap}
              loadingEmployees={loadingEmployees}
              toggleNode={toggleNode}
              onSelect={handleSelect}
              hasMore={hasMore}
              loadMore={(id) => fetchEmployees(id, (pages[id] || 1) + 1)}
              searchQuery={searchQuery}
              selectedId={selectedId}
              selectedType={selectedType}
            />
          ))
        )}
      </div>

      {/* ─── زر إغلاق (في وضع Popover) ─── */}
      {isPopover && onClose && (
        <div className="flex-shrink-0 px-2 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
          <button
            onClick={onClose}
            className="w-full py-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            إغلاق
          </button>
        </div>
      )}
    </div>
  );
}

// ─── مكون العقدة (Node) ──────────────────────────────────────────────
function TreeNode({
  node,
  expandedIds,
  employeesMap,
  loadingEmployees,
  toggleNode,
  onSelect,
  hasMore,
  loadMore,
  searchQuery = '',
  selectedId,
  selectedType,
}) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children?.length > 0;
  const employees = employeesMap[node.id] || [];
  const isLoading = loadingEmployees[node.id];

  const isDeptSelected = selectedType === 'department' && Number(selectedId) === Number(node.id);

  const filteredEmployees = searchQuery
    ? employees.filter((emp) =>
        emp.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : employees;

  return (
    <div className="text-sm">
      {/* ─── العقدة (القسم) ─── */}
      <div
        data-selected={isDeptSelected ? 'true' : 'false'}
        className={clsx(
          'flex items-center gap-1 group py-1.5 px-2 rounded-md transition-colors cursor-pointer',
          isDeptSelected
            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-semibold'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800'
        )}
        onClick={() => toggleNode(node)}
      >
        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )
          )}
        </div>

        <Building2 className="w-4 h-4 text-amber-500 flex-shrink-0" />

        <span className="flex-1 truncate text-slate-700 dark:text-slate-300 font-medium">
          {node.name}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node, 'department');
          }}
          className={clsx(
            'p-1 rounded transition-opacity',
            isDeptSelected ? 'opacity-100 text-primary-600' : 'opacity-0 group-hover:opacity-100 text-primary-600 hover:bg-primary-100 dark:hover:bg-primary-900/30'
          )}
          title="اختيار هذا القسم كمسؤول"
        >
          <Target className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── الأبناء ─── */}
      {isExpanded && (
        <div className="pr-6 border-r border-slate-200 dark:border-slate-700">
          {/* الأقسام الفرعية */}
          {node.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              expandedIds={expandedIds}
              employeesMap={employeesMap}
              loadingEmployees={loadingEmployees}
              toggleNode={toggleNode}
              onSelect={onSelect}
              hasMore={hasMore}
              loadMore={loadMore}
              searchQuery={searchQuery}
              selectedId={selectedId}
              selectedType={selectedType}
            />
          ))}

          {/* عرض المدراء */}
          {node.managers && node.managers.length > 0 && (
            <div className="mt-1 mb-1.5 bg-amber-50/50 dark:bg-amber-900/10 rounded-md border border-amber-100 dark:border-amber-900/30">
              {node.managers.map((mgr) => {
                const isEmpSelected = selectedType === 'employee' && Number(selectedId) === Number(mgr.id);
                return (
                  <div
                    key={`mgr-${mgr.id}`}
                    data-selected={isEmpSelected ? 'true' : 'false'}
                    className={clsx(
                      'flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors cursor-pointer',
                      isEmpSelected
                        ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                    onClick={() => onSelect(mgr, 'employee')}
                  >
                    <Avatar
                      src={mgr.avatar_url}
                      name={mgr.full_name || ''}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <span className="flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                      {mgr.full_name}
                    </span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      مدير
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* عرض الموظفين */}
          {isLoading ? (
            <div className="flex items-center justify-center py-2">
              <Spinner size="sm" />
              <span className="mr-2 text-xs text-slate-400">جاري التحميل...</span>
            </div>
          ) : filteredEmployees.length > 0 ? (
            <div className="space-y-0.5">
              {filteredEmployees.map((emp) => {
                const isEmpSelected = selectedType === 'employee' && Number(selectedId) === Number(emp.id);
                return (
                  <div
                    key={emp.id}
                    data-selected={isEmpSelected ? 'true' : 'false'}
                    className={clsx(
                      'flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors cursor-pointer',
                      isEmpSelected
                        ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-800 dark:text-primary-200 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                    onClick={() => onSelect(emp, 'employee')}
                  >
                    <Avatar
                      src={emp.avatar_url}
                      name={emp.full_name || ''}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <span className="flex-1 truncate text-xs text-slate-600 dark:text-slate-300">
                      {emp.full_name}
                    </span>
                    {emp.job_title && (
                      <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                        {emp.job_title}
                      </span>
                    )}
                  </div>
                );
              })}

              {hasMore[node.id] && (
                <button
                  onClick={() => loadMore(node.id)}
                  className="w-full py-1.5 text-[11px] text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-colors"
                >
                  تحميل المزيد...
                </button>
              )}
            </div>
          ) : (
            !isLoading && (
              <div className="py-1.5 px-2 text-xs text-slate-400">
                لا يوجد موظفون
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}