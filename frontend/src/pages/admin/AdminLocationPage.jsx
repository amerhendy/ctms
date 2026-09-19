// src/pages/admin/AdminLocationPage.jsx
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { LocationApi } from '@/api'
import { PageLoader } from '@/components/common'
import LocationFormModal from '@/modals/CreateLocationFormModal'
import clsx from 'clsx' 
import { Users, Building2, MapPin, Plus, Edit,  ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
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
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showDeptsModal, setShowDeptsModal] = useState(false);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['locations', activeFilter],
    queryFn: () => {
      // تجهيز الـ params بناءً على الفلتر
      const params = activeFilter === 'all' ? {} : { is_active: activeFilter };
      return LocationApi.list(params).then(r => r.data);
    },
  })
  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => LocationApi.updateLocation(id, { is_active }),
    onSuccess: () => {
      toast.success('تم تحديث الحالة بنجاح');
      // هنا نقوم بتحديث كل ما يخص 'locations' لضمان اختفاء العنصر من القائمة الحالية إذا لزم الأمر
      qc.invalidateQueries(['locations']); 
      qc.invalidateQueries({ queryKey: ['locations'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.detail || 'حدث خطأ أثناء التحديث');
    }
  });
  return (
    <div className="space-y-5 text-right" dir="rtl">
      {/* شريط الفلاتر */}
      <div className={clsx(
        "flex gap-2 p-1 rounded-lg w-fit transition-colors",
        // الخلفية (نهاري: رمادي فاتح جداً | ليلي: رمادي غامق)
        "bg-gray-100 dark:bg-gray-800"
      )}>
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
        <PageHeader title="إدارة المواقع" icon={MapPin}>
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
                <th className="py-3 px-4 text-right">اسم الموقع</th>
                <th className="py-3 px-4 text-left">الإجراءات</th>
              </tr>
            </thead>
             <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {list.map(loc => (
                <tr key={loc.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="py-3 px-4 ">
                     <p className="font-medium text-gray-700 dark:text-gray-300">{loc.name}</p>
                  </td>
                  <td className="py-3 px-4 text-left">
                    {/* زر عرض المستخدمين بالموقع */}
                      <button 
                        onClick={() => {setSelectedLocation(loc);setShowUsersModal(true)}}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg"
                        title="عرض موظفي الموقع"
                      >
                        <Users className="w-4 h-4" />
                      </button>

                      {/* زر عرض الأقسام بالموقع */}
                      <button 
                        onClick={() => { setSelectedLocation(loc); setShowDeptsModal(true); }}
                        className="p-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg"
                        title="عرض أقسام الموقع"
                      >
                        <Building2 className="w-4 h-4" />
                      </button>
                    <button 
                      onClick={() => toggleMutation.mutate({ id: loc.id, is_active: !loc.is_active })}
                      disabled={toggleMutation.isLoading}
                      className={clsx(
                        "p-2 rounded-lg transition-all",
                        toggleMutation.isLoading 
                          ? "cursor-not-allowed opacity-50" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800" // أضفنا dark hover
                      )}
                    >
                      {toggleMutation.isLoading ? (
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                      ) : (
                        loc.is_active 
                          ? <ToggleRight className="w-6 h-6 text-green-500" /> 
                          : <ToggleLeft className="w-6 h-6 text-gray-400 dark:text-gray-500" /> // أضفنا dark text
                      )}
                    </button>
                    <button 
                        onClick={() => { setEditLocation(loc); setShowModal(true) }} 
                        className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <LocationFormModal
          location={editLocation}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); qc.invalidateQueries(['locations']) }}
        />
      )}
     {/* مودال المستخدمين: يظهر فقط إذا كان showUsersModal ترو والموقع موجود */}
{showUsersModal && selectedLocation && (
  <LocationUsersModal 
    loc={selectedLocation} 
    onClose={() => {
      setShowUsersModal(false);
      setSelectedLocation(null);
    }} 
  />
)}

{/* مودال الأقسام: يظهر فقط إذا كان showDeptsModal ترو والموقع موجود */}
{showDeptsModal && selectedLocation && (
  <LocationDepartmentsModal 
    loc={selectedLocation} 
    onClose={() => {
      setShowDeptsModal(false);
      setSelectedLocation(null);
    }} 
  />
)}
    </div>
  )
}