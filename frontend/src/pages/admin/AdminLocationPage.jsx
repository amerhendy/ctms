// src/pages/admin/AdminLocationPage.jsx
import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { LocationApi } from '@/api'
import { PageLoader } from '@/components/common'
import LocationFormModal from '@/modals/CreateLocationFormModal'
import clsx from 'clsx' 
import { Users, Building2, MapPin, Plus, Edit, ToggleLeft, ToggleRight, ChevronRight, ChevronDown, FolderTree } from 'lucide-react'
import toast from 'react-hot-toast'
import useAuthStore from '@/stores/authStore'
import PageHeader from '@/components/common/pageheader'
import LocationUsersModal from '@/modals/LocationUsersModal'
import LocationDepartmentsModal from '@/modals/LocationDepartmentsModal'

export default function AdminLocationPage() {
  const qc = useQueryClient()
  const { isAdmin } = useAuthStore()
  const [showModal, setShowModal] = useState(false)
  const [editLocation, setEditLocation] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [showDeptsModal, setShowDeptsModal] = useState(false)
  
  const [expandedNodes, setExpandedNodes] = useState({})

  const { data: treeData = [], isLoading } = useQuery({
    queryKey: ['locations-tree', activeFilter],
    queryFn: () => LocationApi.getTree(activeFilter).then(r => r.data),
  })

  const toggleNode = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => LocationApi.updateLocation(id, { is_active }),
    onSuccess: () => {
      toast.success('تم تحديث الحالة بنجاح')
      qc.invalidateQueries(['locations-tree'])
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || 'حدث خطأ أثناء التحديث')
    }
  })

  // مكون فرعي مستقل للعقدة لضمان تمرير الـ Key بشكل نظامي وسليم
  const LocationNode = ({ loc, level = 0 }) => {
    const hasChildren = loc.children && loc.children.length > 0
    const isExpanded = expandedNodes[loc.id] ?? true

    return (
      <>
        <tr className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors">
          <td className="py-3 px-4">
            <div 
              className="flex items-center gap-2" 
              style={{ paddingRight: `${level * 1.5}rem` }}
            >
              {hasChildren ? (
                <button 
                  onClick={() => toggleNode(loc.id)}
                  className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <span className="w-6" />
              )}
              
              <FolderTree className="w-4 h-4 text-primary-500" />
              <p className={clsx("font-medium", loc.is_active ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500 line-through")}>
                {loc.name}
              </p>
            </div>
          </td>
          <td className="py-3 px-4 text-left">
            <div className="flex items-center justify-end gap-1">
              <button 
                onClick={() => { setSelectedLocation(loc); setShowUsersModal(true) }}
                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg"
                title="عرض موظفي الموقع"
              >
                <Users className="w-4 h-4" />
              </button>

              <button 
                onClick={() => { setSelectedLocation(loc); setShowDeptsModal(true) }}
                className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg"
                title="عرض أقسام الموقع"
              >
                <Building2 className="w-4 h-4" />
              </button>

              <button 
                onClick={() => toggleMutation.mutate({ id: loc.id, is_active: !loc.is_active })}
                disabled={toggleMutation.isLoading}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                {loc.is_active ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-gray-400 dark:text-gray-500" />}
              </button>

              <button 
                onClick={() => { setEditLocation(loc); setShowModal(true) }} 
                className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg transition-colors"
                title="تعديل الموقع"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </td>
        </tr>

        {hasChildren && isExpanded && loc.children.map(child => (
          <LocationNode key={child.id} loc={child} level={level + 1} />
        ))}
      </>
    )
  }

  return (
    <div className="space-y-5 text-right" dir="rtl">
      <div className={clsx("flex gap-2 p-1 rounded-lg w-fit transition-colors", "bg-gray-100 dark:bg-gray-800")}>
        {[
          { label: 'الكل', value: 'all' },
          { label: 'النشطة', value: 'true' },
          { label: 'غير النشطة', value: 'false' }
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className={clsx(
              "px-4 py-1.5 text-sm rounded-md transition-all",
              activeFilter === f.value ? "bg-white shadow text-gray-950 font-semibold" : "text-gray-600 hover:text-gray-900"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <PageHeader title="إدارة المواقع (الهيكل الشجري)" icon={MapPin}>
          {isAdmin() && (
            <button 
              onClick={() => { setEditLocation(null); setShowModal(true) }}
              className="btn-primary w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة موقع</span>
            </button>
          )}
        </PageHeader>
      </div>

      {isLoading ? <PageLoader /> : (
        <div className="card overflow-hidden p-0 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
              <tr>
                <th className="py-3 px-4 text-right">اسم الموقع والهيكل التنظيمي</th>
                <th className="py-3 px-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {treeData.length > 0 ? (
                treeData.map(loc => (
                  <LocationNode key={loc.id} loc={loc} level={0} />
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="text-center py-8 text-gray-500">لا توجد مواقع مسجلة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <LocationFormModal
          location={editLocation}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); qc.invalidateQueries(['locations-tree']) }}
        />
      )}

      {showUsersModal && selectedLocation && (
        <LocationUsersModal 
          loc={selectedLocation} 
          onClose={() => { setShowUsersModal(false); setSelectedLocation(null) }} 
        />
      )}

      {showDeptsModal && selectedLocation && (
        <LocationDepartmentsModal 
          loc={selectedLocation} 
          onClose={() => { setShowDeptsModal(false); setSelectedLocation(null) }} 
        />
      )}
    </div>
  )
}