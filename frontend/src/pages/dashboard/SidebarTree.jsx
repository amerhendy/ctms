import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight,Search,Info, User, Building2, Loader2,BarChart3 } from 'lucide-react';
import { orgApi } from '@/api'; 
import { getTreeData, saveTreeData } from '@/utils/db';
import useAuthStore from '@/stores/authStore';
import { Spinner, Avatar } from '@/components/common';
import UserContactPopover from '@/components/shared/UserContactPopover'
import useDashboardStore from '@/stores/dashboardStore';
import { theme, resolveFieldState } from '@/constants/theme';
import clsx from 'clsx'
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

  const filteredTreeData = useMemo(() => {
    if (!searchQuery) return treeData;
    return treeData.filter(node => 
      node.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [treeData, searchQuery]);

  useEffect(() => {
    const loadInitialData = async () => {
      const cached = await getTreeData(user.id);
      if (cached) {
        setTreeData(cached);
        return;
      }

      const params = new URLSearchParams();
      // التزمنا بنفس منطقك في الـ Params
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
    } catch (e) { console.error(e); }
    setLoadingEmployees(prev => ({ ...prev, [deptId]: false }));
  };
  return (
    <div className="w-full h-full overflow-y-auto py-2">
      {/* بوكس البحث */}
      <div className="px-3 mb-3 relative">
        <Search className={theme.input.icon} />
        <input
          type="text"
          placeholder="بحث عن قسم..."
          className={clsx(theme.input.base, theme.input.iconPaddingStart)}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      {treeData.map(node => (
        <TreeNode 
          key={node.id} 
          node={node} 
          expandedIds={expandedIds} 
          employeesMap={employeesMap} // مررنا الـ Map كامل للأبناء
          loadingEmployees={loadingEmployees} // مررنا حالة التحميل للأبناء
          toggleNode={toggleNode}
          onSelect={onSelectNode}
          hasMore={hasMore}
          loadMore={(id) => fetchEmployees(id, (pages[id] || 1) + 1)}
          setSelectedNode={setSelectedNode}
        />
      ))}
    </div>
  );
}

//function TreeNode({ node, expandedIds, employeesMap, loadingEmployees, toggleNode, onSelect, hasMore, loadMore }) {
function TreeNode({ node, expandedIds, employeesMap, loadingEmployees, toggleNode,  onSelect, type = 'department', hasMore, loadMore }) {
  const { setSelectedNode } = useDashboardStore();
  const isExpanded = expandedIds.has(node.id);
  const isEmployee = type === 'employee';
  const hasChildren = node.children?.length > 0;
  const employees = employeesMap[node.id] || [];
  const isLoading = loadingEmployees[node.id];

  const handleSelect = (e, item, type) => {
    e.stopPropagation();
    // تحديث الـ Store مباشرة سيؤدي لإعادة جلب البيانات في كافة أنحاء التطبيق
    setSelectedNode({ type, ...item });
  };

  return (
    <div className="text-sm">
      <div className="flex items-center gap-1 group py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-800">
        <div onClick={() => toggleNode(node)} className="cursor-pointer p-1">
           {node.children?.length > 0 && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
        </div>
        
        <Building2 className="w-4 h-4 text-amber-500" />
        <span className="flex-1 truncate">{node.name}</span>

        {/* الأيقونات التفاعلية */}
        <div className="hidden group-hover:flex gap-1">
          <button 
            onClick={(e) => handleSelect(e, node, 'department')}
            className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
            title="عرض إحصائيات"
          >
            <BarChart3 className="w-4 h-4 text-green-600" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pr-6 border-r border-gray-200 dark:border-gray-700">
          {/* عرض الأبناء (Recursion) مع تمرير كافة الـ Props */}
          {node.children?.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              expandedIds={expandedIds} 
              employeesMap={employeesMap}
              loadingEmployees={loadingEmployees}
              toggleNode={toggleNode} 
              onSelect={onSelect} // يمكنك إبقاء هذه إذا كنت تحتاجها لأشياء أخرى
              hasMore={hasMore}
              loadMore={loadMore}
            />
          ))}
          {/* عرض المدراء المسؤولين عن القسم */}
            {node.managers && node.managers.length > 0 && (
            <div className="bg-amber-50/50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30">
                {node.managers.map(mgr => (
                <div 
                    key={`mgr-${mgr.id}`}
                    onClick={(e) => { e.stopPropagation(); onSelect(mgr); }}
                    className="flex items-center gap-1 group py-1 px-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                    <Avatar 
                    src={mgr.avatar_url || emp?.avatar_url} 
                    name={mgr?.full_name || ''} 
                    size="sm" 
                    className="flex-shrink-0 border border-gray-100 dark:border-gray-700" 
                    />
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 flex-1 truncate">
                    {mgr?.full_name}
                    </span>
                    {/* زرين مستقلين */}
                    <div className="hidden group-hover:flex gap-1">
                      {/* زر الإحصائيات (يحدث الـ Store) */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedNode({ type, ...node }); }}
                        className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                        title="عرض إحصائيات"
                      >
                        <BarChart3 className="w-4 h-4 text-green-600" />
                      </button>
                    </div>
                </div>
                ))}
            </div>
            )}
          {/* عرض الموظفين التابعين لهذا القسم */}
          {isLoading ? (
            <div className="px-4 py-2 flex items-center gap-2 text-xs text-gray-400">
              <Spinner size="md"/> جاري التحميل...
            </div>
          ) : (
            employees.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto border-t border-gray-100 dark:border-gray-800">
                    {employees.map(emp => (
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
                            <span onClick={(e) => handleSelect(e, emp, 'employee')} className="cursor-pointer flex-1 text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {emp?.full_name}
                            </span>
                            {/* زرين مستقلين */}
                              <div className="hidden group-hover:flex gap-1">
                                {/* زر الإحصائيات (يحدث الـ Store) */}
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedNode({ type, ...node }); }}
                                  className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded"
                                  title="عرض إحصائيات"
                                >
                                  <BarChart3 className="w-4 h-4 text-green-600" />
                                </button>
                              </div>
                        </div>
                        ))}
                        {/* زر Pagination للتحميل الإضافي */}
                        {hasMore && (
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