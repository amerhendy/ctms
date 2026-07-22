// src/modals/LocationTreeSelectModal.jsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { LocationApi } from '@/api'
import { Modal } from '@/components/common'
import { ChevronRight, ChevronDown, Folder, FolderOpen, Check } from 'lucide-react'

// مكون فرعي لعرض العقدة الهرمية بشكل تداخلي (Recursive Tree Item)
function TreeNode({ node, selectedId, currentLocationId, onSelect }) {
  const [isOpen, setIsOpen] = useState(true)
  const hasChildren = node.children && node.children.length > 0
  const isCurrentSelf = node.id === currentLocationId
  const isSelected = node.id === selectedId

  return (
    <div className="select-none my-1">
      <div 
        className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
          isCurrentSelf 
            ? 'opacity-50 cursor-not-allowed bg-gray-100' 
            : isSelected 
              ? 'bg-blue-50 text-blue-600 font-medium' 
              : 'hover:bg-gray-50 cursor-pointer'
        }`}
        onClick={() => {
          if (!isCurrentSelf) {
            onSelect(node)
          }
        }}
      >
        <div className="flex items-center gap-2">
          {hasChildren ? (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(!isOpen)
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="w-6" />
          )}
          
          {isOpen ? <FolderOpen size={18} className="text-amber-500" /> : <Folder size={18} className="text-amber-500" />}
          
          <span>{node.name}</span>
          {isCurrentSelf && <span className="text-xs text-red-500">(لا يمكن اختيار الموقع كأب لنفسه)</span>}
        </div>

        {isSelected && <Check size={16} className="text-blue-600" />}
      </div>

      {hasChildren && isOpen && (
        <div className="mr-6 border-r border-gray-200 pr-2 space-y-1">
          {node.children.map((child) => (
            <TreeNode 
              key={child.id} 
              node={child} 
              selectedId={selectedId} 
              currentLocationId={currentLocationId} 
              onSelect={onSelect} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function LocationTreeSelectModal({ isOpen, onClose, onSelect, selectedId, currentLocationId }) {
  // جلب شجرة المواقع عبر الـ API
  const { data: treeData = [], isLoading } = useQuery({
    queryKey: ['locations-tree'],
    queryFn: () => LocationApi.getTree().then(r => r.data),
    enabled: isOpen
  })
  console.log(treeData);
  
  return (
    <Modal open={isOpen} onClose={onClose} title="اختر الموقع الرئيسي (الأب)">
      <div className="space-y-4">
        <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
          {isLoading ? (
            <div className="text-center py-4 text-gray-500">جاري تحميل الشجرة...</div>
          ) : treeData.length === 0 ? (
            <div className="text-center py-4 text-gray-500">لا توجد مواقع مسجلة</div>
          ) : (
            <>
              {/* خيار إزالة الأب (جعل الموقع رئيسياً جذرياً) */}
              <div 
                className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-gray-600 border-b border-gray-100 mb-2 flex items-center justify-between"
                onClick={() => onSelect(null)}
              >
                <span>🌐 [موقع رئيسي جذري - بدون أب]</span>
                {!selectedId && <Check size={16} className="text-blue-600" />}
              </div>

              {treeData.map((node) => (
                <TreeNode 
                  key={node.id} 
                  node={node} 
                  selectedId={selectedId} 
                  currentLocationId={currentLocationId} 
                  onSelect={onSelect} 
                />
              ))}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-secondary">
            إغلاق
          </button>
        </div>
      </div>
    </Modal>
  )
}