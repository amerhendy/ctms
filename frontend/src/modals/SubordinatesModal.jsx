//src/modals/SubordinatesModal.jsx
import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api'
import { Modal, Avatar } from '@/components/common'

export default function SubordinatesModal({ manager, onClose }) {
  const { data: subs, isLoading } = useQuery({
    queryKey: ['subordinates', manager.id],
    queryFn: () => usersApi.subordinates(manager.id).then(r => r.data),
    enabled: !!manager?.id,
  })

  return (
    <Modal open onClose={onClose} title={`الهيكل التابع لـ: ${manager.full_name}`} size="md">
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-500">جاري تحميل الهيكل الوظيفي التابع...</div>
      ) : subs?.length > 0 ? (
        <div className="space-y-2.5 max-h-[50vh] overflow-y-auto p-1 pr-0">
          {subs.map(sub => (
            <div key={sub.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100/70">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={sub.full_name} size="sm" />
                <div className="leading-tight min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{sub.full_name}</p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{sub.job_title}</p>
                </div>
              </div>
              <span className="text-[11px] font-mono bg-white px-2 py-1 rounded-md border border-gray-200 text-gray-600 flex-shrink-0">
                #{sub.employee_number}
              </span>
            </div>
          ))}
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