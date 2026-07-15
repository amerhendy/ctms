import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query'
import { X, ChevronDown, ChevronLeft, Folder, FolderOpen, Building2, Search } from 'lucide-react';
import {Modal} from '@/components/common/index'
import { orgApi } from '@/api'
export default function DepartmentTreeModal({ isOpen, onClose, onSelect, selectedId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [tempSelectedNode, setTempSelectedNode] = useState(null);
  // جلب البيانات (استبدل orgApi.getDeptTree بطلبك الفعلي)
  const { data: treeData = [] } = useQuery({
    queryKey: ['departmentTree'],
    queryFn: async() => {
      const response = await orgApi.getDeptTree();
      return response.data;  
    },
    enabled: isOpen,
  });
  const handleConfirm = () => {
      if (tempSelectedNode) {
        onSelect(tempSelectedNode);
        onClose(); // إغلاق المودال بعد التأكيد
      }
    };
  // منطق البحث التراجعي
  const filterTree = (nodes, term) => {
    if (!term) return nodes;
    return nodes.reduce((acc, node) => {
      const matchesName = node.name.toLowerCase().includes(term.toLowerCase());
      const filteredChildren = filterTree(node.children || [], term);
      
      if (matchesName || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
      return acc;
    }, []);
  };
  const filteredData = useMemo(() => filterTree(treeData, searchTerm), [treeData, searchTerm]);

  const toggleNode = (id) => {
    const next = new Set(expandedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedIds(next);
  };

  if (!isOpen) return null;
  return (
    <Modal open={isOpen} onClose={onClose} title="اختر الإدارة" size="md">
      <div className="space-y-4">
        {/* البحث */}
        <div className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-gray-50 dark:bg-gray-800">
          <Search className="w-4 h-4 text-gray-400" />
          <input 
            placeholder="بحث..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* الشجرة */}
        <div className="max-h-[50vh] overflow-y-auto">
          {filteredData.map(node => (
            <TreeNode 
              key={node.id} 
              node={node} 
              expandedIds={expandedIds}
              toggleNode={toggleNode}
              // هنا نمرر دالة لتحديث الحالة المؤقتة فقط
              onSelect={(node) => setTempSelectedNode(node)} 
              selectedId={tempSelectedNode?.id || selectedId}
            />
          ))}
        </div>

        {/* زر التأكيد في الأسفل */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 flex justify-end gap-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            إلغاء
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!tempSelectedNode}
            className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            تأكيد الاختيار
          </button>
        </div>
      </div>
    </Modal>
  );
}

function TreeNode({ node, expandedIds, toggleNode, onSelect, selectedId }) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div>
      <div className="flex items-center justify-between p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors">
        
        <div className="flex items-center gap-2">
          {/* السهم: منطقة ضغط خاصة به */}
          {hasChildren ? (
            <div 
              className="cursor-pointer p-1"
              onClick={() => toggleNode(node.id)}
            >
              {isExpanded ? <ChevronDown className="w-4 text-gray-500 dark:text-gray-400" /> : <ChevronLeft className="w-4 text-gray-500 dark:text-gray-400" />}
            </div>
          ) : <div className="w-6" />}

          {/* الاسم: منطقة ضغط خاصة به */}
          <span 
            className={`text-xs cursor-pointer ${
              selectedId === node.id ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => hasChildren && toggleNode(node.id)}
          >
            {node.name}
          </span>
        </div>

        {/* الراديو: منطقة مستقلة تماماً */}
        <input 
          type="radio" 
          name="dept-selection"
          checked={selectedId === node.id} 
          onChange={() => onSelect(node)}
          className="cursor-pointer accent-indigo-600"
        />
      </div>

      {/* الأبناء */}
      {isExpanded && hasChildren && (
        <div className="mr-6 border-r border-gray-200 dark:border-gray-700 pr-2">
          {node.children.map(child => (
            <TreeNode 
              key={child.id} 
              node={child} 
              expandedIds={expandedIds} 
              toggleNode={toggleNode} 
              onSelect={onSelect} 
              selectedId={selectedId} 
            />
          ))}
        </div>
      )}
    </div>
  );
}