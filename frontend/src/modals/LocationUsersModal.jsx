import { useQuery } from '@tanstack/react-query'
import { LocationApi } from '@/api'
import { useState,useEffect } from 'react'
import { X, Users, Loader2, Search } from 'lucide-react'
import { PageLoader, Modal, Avatar } from '@/components/common'

export default function LocationUsersModal({ loc, onClose }) {
  if (!loc) return null;
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('') // إضافة حالة البحث


  const { data, isLoading } = useQuery({
    // أضفنا search لـ queryKey ليعيد جلب البيانات عند البحث
    queryKey: ['loc-users', loc.id, page, search],
    queryFn: async () => {
      const response = await LocationApi.getUsers(loc.id, page, 10, search);
      return response.data;
    },
    keepPreviousData: true,
  }) 

  return (
    <Modal open onClose={onClose} title={`العاملين في: ${loc.name}`} size="md">

        {/* حقل البحث */}
        <div className="relative mb-4">
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="بحث عن موظف..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-4 pr-10 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        
        <div className="space-y-3 min-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : data?.items?.length > 0 ? (
            data.items.map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 border dark:border-gray-700 rounded-xl">
                <Avatar name={user.full_name} src={user.avatar_url} size="md" className="border border-gray-100 dark:border-gray-600" />  
                <div>
                  <p className="font-semibold text-sm dark:text-gray-200">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.job_title} • {user.employee_number}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 mt-10">لا يوجد موظفين</p>
          )}
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t dark:border-gray-800">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1 text-sm border rounded-lg dark:border-gray-700 dark:text-gray-300 disabled:opacity-50"
            >السابق</button>
            <span className="text-xs text-gray-500">{page} / {data.pages}</span>
            <button 
              disabled={page >= data.pages} 
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1 text-sm border rounded-lg dark:border-gray-700 dark:text-gray-300 disabled:opacity-50"
            >التالي</button>
          </div>
        )}
    </Modal>
  )
}