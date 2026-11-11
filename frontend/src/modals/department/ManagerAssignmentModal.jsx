// modals/ManagerAssignmentModal.jsx
import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { UserCheck,Trash } from 'lucide-react'
import { Modal, FormField } from '@/components/common'
import UserContactPopover from '@/components/shared/UserContactPopover'

import UserSearchInput from '@/modals/UserSearchSelect'
import { Avatar } from '@/components/common'
import {ManagerApi} from '@/api'
import useAuthStore from '@/stores/authStore'
export default function ManagerAssignmentModal({ dept, onClose }) {
    if(!dept)return
    const { isAdminOrPM } = useAuthStore()
    
  const qc = useQueryClient();

  // Mutation للتعيين
  const assignMutation = useMutation({
    mutationFn: (data) => {
      let department_id=data?.department_id
      let user_id=data?.user_id?.id
      const redata={department_id,user_id}
      return ManagerApi.assignManager(redata)},
    onSuccess: () => {
      toast.success('تم تعيين المدير بنجاح');
      qc.invalidateQueries(['departments']);
    }
  });

  // Mutation للإلغاء
  const removeMutation = useMutation({
    mutationFn: (data) => {
        const dept_id = data?.dept_id;
        const user_id = data?.user_id;
        
        if (!dept_id || !user_id) throw new Error("بيانات غير مكتملة");
        return ManagerApi.removeManager(dept_id,user_id)
    },
    onSuccess: () => {
      toast.success('تمت إزالة المدير');
      qc.invalidateQueries(['departments']);
    }
  });

  return (
    <Modal open onClose={onClose} title="تعيين مديرين " size="lg">
    <div className="">
      {/* عرض المديرين الحاليين */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-primary-600" />
            المديرون الحاليون
        </h4>
        
        {dept.managers.length > 0 ? (
            <div className="space-y-2">
            {dept.managers.map((m) => (
                <div 
                key={m.id} 
                className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm"
                >
                <div className="flex items-center gap-3">
                    <div className="">
                      <UserContactPopover user={m}>
                        <Avatar name={m.full_name} src={m.avatar_url} />
                      </UserContactPopover>
                        <div className="leading-tight min-w-0">
                          <p className="text-xs text-gray-400 mt-0.5">{m?.job_title}</p>
                        </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{m.full_name}</span>
                </div>
                {isAdminOrPM() && (
                <button 
                    onClick={() => removeMutation.mutate({dept_id:dept.id,user_id:m.id})} 
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="إلغاء التعيين"
                >
                    <Trash className="w-4 h-4" />
                </button>
                )}
                </div>
            ))}
            </div>
        ) : (
            <div className="text-center py-4 text-sm text-gray-400 italic">
            لا يوجد مديرون حاليون
            </div>
        )}
        </div>

      {/* البحث والإضافة */}
      {isAdminOrPM() && (
      <div>
        <label className="block text-sm font-medium mb-2">إضافة مدير جديد:</label>
        <UserSearchInput 
          deptId={dept.id} // الفلترة الافتراضية لقسمه
          onSelect={(selected) => assignMutation.mutate({ department_id: dept.id, user_id: selected })}
        />
      </div>
      )}
    </div>
    </Modal>
  );
}