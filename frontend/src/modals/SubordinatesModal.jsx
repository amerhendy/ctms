//src/modals/SubordinatesModal.jsx
import clsx from 'clsx';
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api'
import { PageLoader,Modal, Avatar } from '@/components/common'
import UserContactPopover from '@/components/shared/UserContactPopover'
import { theme } from '@/constants/theme';
function UserBlock({userData={}}){
  return(<div className={clsx("flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl border border-gray-100/70 transition-all",
                              "flex items-center ")}>
    <div className="flex items-center gap-3 min-w-0">
      
      <UserContactPopover user={userData}>
        <Avatar name={userData.full_name} size="sm" src={userData.avatar_url} className="border border-gray-100 dark:border-gray-600" />
      </UserContactPopover>
      <div className="leading-tight min-w-0">
        <p className="font-semibold text-gray-950 dark:text-white">{userData.full_name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{userData.job_title}</p>
      </div>
    </div>
    <span className="text-[11px] font-mono bg-white px-2 py-1 rounded-md border border-gray-200 text-gray-600 flex-shrink-0">
      #{userData.employee_number}
    </span>
  </div>)
}
export default function SubordinatesModal({ manager, onClose }) {
  const { data: subs, isLoading } = useQuery({
    queryKey: ['subordinates', manager.id],
    queryFn: async () => {return await usersApi.subordinates(manager.id).then(r => r.data)},
    enabled: !!manager?.id,
    keepPreviousData: true,
  })
  const userList = subs?.items || []
  const totalPages = subs?.pages || subs?.total_pages || 1
  return (
    <Modal open onClose={onClose} title={`الهيكل التابع لـ: ${manager.full_name}`} size="md">
      {isLoading ? (
        <PageLoader />
      ) : userList?.length > 0 ? (
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto p-1 pr-0">
          {userList.map(sub => (
            <UserBlock userData={sub} key={sub.id}/>
          ))}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-gray-50 border-t border-gray-100 text-xs sm:text-sm">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 font-medium"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </button>

              <span className="text-gray-500 font-semibold">
                الصفحة {page} من {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 font-medium"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center text-gray-400 text-sm">
          لا يوجد موظفون مسجلون تحت إدارة {manager.full_name} مباشرة حالياً.
        </div>
      )}
      
      <div className="mt-5 pt-3 border-t border-gray-100">
        <button onClick={onClose} className="btn-secondary w-full justify-center py-2.5">إغلاق النافذة</button>
      </div>
    </Modal>
  )
}