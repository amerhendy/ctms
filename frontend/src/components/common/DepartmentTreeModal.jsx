//components/common/DepartmentTreeModal.jsx
import { useState } from 'react'
import { X, ChevronDown, ChevronLeft, Folder, FolderOpen, Building2 } from 'lucide-react'

export default function DepartmentTreeModal({ isOpen, onClose, departments, onSelect, selectedId }) {
  if (!isOpen) return null

  // 1. تجميع البيانات شجرياً في الذاكرة
  const itemMap = new Map()
  departments.forEach(item => itemMap.set(item.id, item))

  const roots = []
  const childrenMap = new Map()

  departments.forEach(item => {
    const parentId = item.parent_department_id
    if (parentId === null || !itemMap.has(parentId)) {
      roots.push(item)
    } else {
      if (!childrenMap.has(parentId)) childrenMap.set(parentId, [])
      childrenMap.get(parentId).push(item)
    }
  })

  roots.sort((a, b) => (a.job_level?.level_number || 0) - (b.job_level?.level_number || 0))

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      {/* 🌟 تعديل الحاوية: تم ضبط أقصى ارتفاع متاح لتجبر المحتوى الداخلي على التمرير */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg text-right flex flex-col max-h-[85vh] h-[550px]" dir="rtl">
        
        {/* رأس الموديل */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h4 className="text-sm font-bold text-gray-900">الهيكل التنظيمي للأقسام والإدارات</h4>
            <p className="text-[11px] text-gray-400 mt-0.5">اضغط على القطاع لتوسيع الفروع، ثم اختر الإدارة المستهدفة</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 🌟 محتوى الشجرة التفاعلية مع دعم كامل للـ Scrollbar وتنسيقه */}
        <div className="p-4 flex-1 overflow-y-auto min-h-0 space-y-1 scrollbar-thin scrollbar-thumb-gray-200">
          {roots.map(root => (
            <TreeNode 
              key={root.id} 
              node={root} 
              childrenMap={childrenMap} 
              onSelect={onSelect} 
              selectedId={selectedId}
              depth={0}
            />
          ))}
        </div>

        {/* تذييل الموديل */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            تأكيد الاختيار
          </button>
        </div>
      </div>
    </div>
  )
}

// مكوّن العقدة الشجرية التكراري (TreeNode تبقى كما هي بدون تغيير)
function TreeNode({ node, childrenMap, onSelect, selectedId, depth }) {
  const hasChildren = childrenMap.has(node.id)
  const children = hasChildren ? childrenMap.get(node.id) : []
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = (e) => {
    if (e.target.type === 'radio') return
    if (hasChildren) setIsExpanded(!isExpanded)
  }

  const isSelected = selectedId === node.id

  return (
    <div className="select-none">
      <div 
        onClick={handleToggle}
        style={{ paddingRight: `${depth * 16 + 8}px` }}
        className={`flex items-center justify-between py-2 px-2 rounded-lg cursor-pointer transition-colors ${
          isSelected ? 'bg-indigo-50 border-r-2 border-indigo-600' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronLeft className="w-4 h-4 text-gray-500" />
          ) : (
            <div className="w-4" />
          )}

          {hasChildren ? (
            isExpanded ? <FolderOpen className="w-4 h-4 text-amber-500" /> : <Folder className="w-4 h-4 text-amber-500" />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
          )}

          <span className={`text-xs ${isSelected ? 'font-bold text-indigo-900' : 'text-gray-700'}`}>
            {node.name}
          </span>
          
          {node.job_level?.title && (
            <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
              {node.job_level.title}
            </span>
          )}
        </div>

        <input
          type="radio"
          name="selected_dept"
          checked={isSelected}
          onChange={() => onSelect(node.id, node.name)}
          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
        />
      </div>

      {hasChildren && isExpanded && (
        <div className="overflow-hidden transition-all duration-300">
          {children.sort((a, b) => (a.job_level?.level_number || 0) - (b.job_level?.level_number || 0)).map(child => (
            <TreeNode
              key={child.id}
              node={child}
              childrenMap={childrenMap}
              onSelect={onSelect}
              selectedId={selectedId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}