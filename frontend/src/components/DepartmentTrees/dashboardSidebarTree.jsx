import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Search, Building2, BarChart3 } from 'lucide-react';
import { orgApi } from '@/api'; 
import { getTreeData, saveTreeData } from '@/utils/db';
import useAuthStore from '@/stores/authStore';
import { Spinner, Avatar } from '@/components/common';
import UserContactPopover from '@/components/shared/UserContactPopover';
import useDashboardStore from '@/stores/dashboardStore';
import { theme } from '@/constants/theme';
import clsx from 'clsx';

export default function SidebarTree({ onSelectNode }) {
  const { user } = useAuthStore();
  const { setSelectedNode } = useDashboardStore();

  const [treeData, setTreeData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [employeesMap, setEmployeesMap] = useState({});
  const [loadingEmployees, setLoadingEmployees] = useState({});
  const [pages, setPages] = useState({});
  const [hasMore, setHasMore] = useState({});

  // جلب البيانات الأولية وحفظها في Cache
  useEffect(() => {
    const loadInitialData = async () => {
      const cached = await getTreeData(user.id);
      if (cached) {
        setTreeData(cached);
        return;
      }

      const params = new URLSearchParams();
      if (user?.managed_department_ids) {
        user.managed_department_ids.forEach(id => {
          params.append('department_id', id);
        });
      }

      try {
        const { data } = await orgApi.getDeptTree(params); 
        setTreeData(data);
        await saveTreeData(user.id, data);
      } catch (error) {
        console.error("Error fetching department tree:", error);
      }
    };

    if (user?.id) {
      loadInitialData();
    }
  }, [user.id, user.managed_department_ids]);

  // منطق البحث المحلي الشامل (Dept, Managers, Employees)
  const { filteredTreeData, autoExpandedIds } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { filteredTreeData: treeData, autoExpandedIds: new Set() };
    }

    const query = searchQuery.toLowerCase();
    const matchedExpandedIds = new Set();

    const filterNodes = (nodes) => {
      return nodes.reduce((acc, node) => {
        // 1. فحص اسم القسم
        const matchesDeptName = node.name.toLowerCase().includes(query);

        // 2. فحص قائمة المدراء
        const hasMatchingManager = node.managers?.some(mgr => 
          mgr?.full_name?.toLowerCase().includes(query)
        );

        // 3. فحص الموظفين المحملين في الـ Memory للقسم الحالي
        const loadedEmployees = employeesMap[node.id] || [];
        const hasMatchingEmployee = loadedEmployees.some(emp => 
          emp?.full_name?.toLowerCase().includes(query)
        );

        // 4. فحص الأقسام الفرعية (Recursion)
        const filteredChildren = node.children ? filterNodes(node.children) : [];
        const hasMatchingChildren = filteredChildren.length > 0;

        // إذا تحقق التوافق في العقدة أو أبنائها أو أفرادها
        if (matchesDeptName || hasMatchingManager || hasMatchingEmployee || hasMatchingChildren) {
          matchedExpandedIds.add(node.id);

          acc.push({
            ...node,
            children: filteredChildren
          });
        }
        return acc;
      }, []);
    };

    return {
      filteredTreeData: filterNodes(treeData),
      autoExpandedIds: matchedExpandedIds
    };
  }, [treeData, searchQuery, employeesMap]);

  // دمج الأقسام المفتوحة يدوياً مع الأقسام الناتجة عن البحث
  const effectiveExpandedIds = useMemo(() => {
    if (searchQuery.trim()) {
      return new Set([...expandedIds, ...autoExpandedIds]);
    }
    return expandedIds;
  }, [expandedIds, autoExpandedIds, searchQuery]);

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

  const fetchEmployees = async (deptId, page) => {
    setLoadingEmployees(prev => ({ ...prev, [deptId]: true }));
    try {
      const { data } = await orgApi.usersDept(deptId, { params: { page, page_size: 2 } });
      
      setEmployeesMap(prev => ({ 
        ...prev, 
        [deptId]: page === 1 ? data.items : [...(prev[deptId] || []), ...data.items] 
      }));
      
      setPages(prev => ({ ...prev, [deptId]: page }));
      setHasMore(prev => ({ ...prev, [deptId]: page < data.pages }));
    } catch (e) {
      console.error(e);
    }
    setLoadingEmployees(prev => ({ ...prev, [deptId]: false }));
  };

  return (
    <div className="w-full h-full overflow-y-auto py-2">
      {/* حقل البحث */}
      <div className="px-3 mb-3 relative">
        <Search className={theme.input.icon} />
        <input
          type="text"
          placeholder="بحث عن قسم أو موظف..."
          className={clsx(theme.input.base, theme.input.iconPaddingStart)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* عرض الشجرة المفلترة */}
      {filteredTreeData.map(node => (
        <TreeNode 
          key={node.id} 
          node={node} 
          expandedIds={effectiveExpandedIds} 
          employeesMap={employeesMap}
          loadingEmployees={loadingEmployees}
          toggleNode={toggleNode}
          onSelect={onSelectNode}
          hasMore={hasMore}
          loadMore={(id) => fetchEmployees(id, (pages[id] || 1) + 1)}
          setSelectedNode={setSelectedNode}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  );
}

function TreeNode({ 
  node, 
  expandedIds, 
  employeesMap, 
  loadingEmployees, 
  toggleNode,  
  onSelect, 
  hasMore, 
  loadMore,
  setSelectedNode,
  searchQuery
}) {
  const isExpanded = expandedIds.has(node.id);
  const employees = employeesMap[node.id] || [];
  const isLoading = loadingEmployees[node.id];

  const handleSelect = (e, item, type) => {
    e.stopPropagation();
    setSelectedNode({ type, ...item });
  };

  // تصفية الأفراد (مدراء وموظفين) أثناء البحث للتحديد المباشر
  const query = searchQuery?.trim().toLowerCase();

  const filteredManagers = useMemo(() => {
    if (!query || !node.managers) return node.managers || [];
    // إذا كان نص البحث يطابق اسم القسم، نعرض كل المدراء
    if (node.name.toLowerCase().includes(query)) return node.managers;
    return node.managers.filter(mgr => mgr?.full_name?.toLowerCase().includes(query));
  }, [node.managers, node.name, query]);

  const filteredEmployees = useMemo(() => {
    if (!query) return employees;
    // إذا كان نص البحث يطابق اسم القسم، نعرض كل الموظفين المحملين
    if (node.name.toLowerCase().includes(query)) return employees;
    return employees.filter(emp => emp?.full_name?.toLowerCase().includes(query));
  }, [employees, node.name, query]);

  return (
    <div className="text-sm">
      {/* صف القسم الرئيسي */}
      <div className="flex items-center gap-1 group py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-800">
        <div onClick={() => toggleNode(node)} className="cursor-pointer p-1">
           {node.children?.length > 0 && (
             isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
           )}
        </div>
        
        <Building2 className="w-4 h-4 text-amber-500" />
        <span className="flex-1 truncate cursor-pointer" onClick={(e) => handleSelect(e, node, 'department')}>
          {node.name}
        </span>

        {/* زر إحصائيات القسم */}
        <div className="hidden group-hover:flex gap-1">
          <button 
            onClick={(e) => handleSelect(e, node, 'department')}
            className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
            title="عرض إحصائيات القسم"
          >
            <BarChart3 className="w-4 h-4 text-green-600" />
          </button>
        </div>
      </div>

      {/* المحتوى الداخلي عند التوسيع */}
      {isExpanded && (
        <div className="pr-6 border-r border-gray-200 dark:border-gray-700">
          {/* الأقسام الفرعية */}
          {node.children?.map(child => (
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
              setSelectedNode={setSelectedNode}
              searchQuery={searchQuery}
            />
          ))}

          {/* المدراء التابعين للقسم */}
          {filteredManagers && filteredManagers.length > 0 && (
            <div className="bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30">
              {filteredManagers.map(mgr => (
                <div 
                  key={`mgr-${mgr.id}`}
                  className="flex items-center gap-1 group py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Avatar 
                    src={mgr?.avatar_url} 
                    name={mgr?.full_name || ''} 
                    size="sm" 
                    className="flex-shrink-0 border border-gray-100 dark:border-gray-700" 
                  />
                  <span 
                    onClick={(e) => handleSelect(e, mgr, 'employee')} 
                    className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 flex-1 truncate cursor-pointer"
                  >
                    {mgr?.full_name}
                  </span>
                  
                  {/* زر إحصائيات المدير */}
                  <div className="hidden group-hover:flex gap-1">
                    <button 
                      onClick={(e) => handleSelect(e, mgr, 'employee')}
                      className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                      title="عرض إحصائيات المدير"
                    >
                      <BarChart3 className="w-4 h-4 text-green-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* الموظفين التابعين للقسم */}
          {isLoading ? (
            <div className="px-4 py-2 flex items-center gap-2 text-xs text-gray-400">
              <Spinner size="md"/> جاري التحميل...
            </div>
          ) : (
            filteredEmployees.length > 0 && (
              <div className="max-h-[200px] overflow-y-auto border-t border-gray-100 dark:border-gray-800">
                {filteredEmployees.map(emp => (
                  <div 
                    key={emp.id}
                    className="flex items-center gap-1 group py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <UserContactPopover user={emp} taskId="" taskTitle="">
                      <Avatar 
                        src={emp.avatar_url || emp?.avatar_url} 
                        name={emp?.full_name || ''} 
                        size="sm" 
                        className="flex-shrink-0 border border-gray-100 dark:border-gray-700 cursor-pointer" 
                      />
                    </UserContactPopover>
                    <span 
                      onClick={(e) => handleSelect(e, emp, 'employee')} 
                      className="cursor-pointer flex-1 text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate"
                    >
                      {emp?.full_name}
                    </span>
                    
                    {/* زر إحصائيات الموظف */}
                    <div className="hidden group-hover:flex gap-1">
                      <button 
                        onClick={(e) => handleSelect(e, emp, 'employee')}
                         className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                        title="عرض إحصائيات الموظف"
                      >
                        <BarChart3 className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* زر Pagination للتحميل الإضافي عند عدم البحث */}
                {!query && hasMore[node.id] && (
                  <button 
                    onClick={() => loadMore(node.id)}
                    className="w-full py-1 text-[10px] text-blue-600 hover:bg-blue-100 transition-colors"
                  >
                    تحميل المزيد...
                  </button>
                )}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}