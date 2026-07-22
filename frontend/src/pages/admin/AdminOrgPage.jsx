import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users,UserCheck,Building2, Plus, Edit, ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { orgApi, LocationApi } from '@/api'
import { PageLoader } from '@/components/common'
import { getApiError } from '@/utils/helpers'
import PageHeader from '@/components/common/pageheader'
import useAuthStore from '@/stores/authStore'
import clsx from 'clsx'
import DeptUsersModal from '@/modals/DeptUsersModal'
import DepartmentFormModal from '@/modals/DepartmentFormModal'
import ManagerAssignmentModal from '@/modals/ManagerAssignmentModal'

export default function AdminOrgPage() {
  const { isPM,isAdmin,isAdminOrPM,isDepartmentManager } = useAuthStore()

  const managedIds = isDepartmentManager();
  const isOnlyManager = !isAdmin() && !isPM() && managedIds !== null;

  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editDept, setEditDept] = useState(null)
  const [parentId, setParentId] = useState(null)
  const [expanded, setExpanded] = useState({})

  const [selectedDept, setSelectedDept] = useState(null)
  const [showUsersModal, setShowUsersModal] = useState(false)

  const [ShowManagerModal, setShowManagerModal] = useState(false)
  
  const { data: depts, isLoading } = useQuery({
  // نضيف managedIds للـ queryKey لضمان تحديث البيانات إذا تغيرت الصلاحيات
  queryKey: ['departments', 'all', managedIds], 
  queryFn: () => {
    // إذا كان مدير قسم، نطلب من الـ API جلب هذا القسم وأبنائه فقط
    if (isOnlyManager) {
      // افتراضاً: الـ API الخاص بك يدعم جلب شجرة فرعية بقسم معين
      return orgApi.getDeptTree({ 
        department_id: managedIds[0], // يمكنك إرسال مصفوفة أو التعامل مع أول قسم
        page_size: 0 
      }).then(r => r.data);
    }
    // إذا كان أدمن، يجلب الشجرة كاملة
    return orgApi.getDeptTree({ page_size: 0 }).then(r => r.data);
  },
})

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: () => LocationApi.list().then(r => r.data),
  })

  const { data: levels } = useQuery({
    queryKey: ['job-levels'],
    queryFn: () => orgApi.listLevels().then(r => r.data),
  })

  // دالة مساعدة لتحويل الشجرة لقائمة مسطحة لاستخدامها في المودال فقط
  const flatDepts = useMemo(() => {
    const list = []
    const traverse = (items) => {
      items?.forEach(d => {
        list.push(d)
        if (d.children) traverse(d.children)
      })
    }
    traverse(depts)
    return list
  }, [depts])

  const deleteMutation = useMutation({
    mutationFn: (id) => orgApi.deleteDept(id),
    onSuccess: () => {
      toast.success('تم تعطيل الإدارة وتحديث الهيكل')
      qc.invalidateQueries(['departments'])
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  const getLevelTitle = (levelId) => {
    const l = (levels || []).find(l => l.id === levelId)
    return l ? `المستوى ${l.level_number}: ${l.title}` : ''
  }

  const DeptNode = ({ dept, depth = 0 }) => {
    const hasChildren = dept.children && dept.children.length > 0
    const isExpanded = expanded[dept.id]
    const isMobile = window.innerWidth < 640
    const paddingRightValue = isMobile ? (10 + depth * 12) : (12 + depth * 24)

    return (
      <div className="w-full">
        <div
          className={clsx(
            'flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl transition-all duration-150 group my-0.5 border',
            // تنسيق الحالة (نشط / غير نشط)
            dept.is_active 
              ? 'border-transparent hover:bg-gray-50/80 dark:hover:bg-gray-800' 
              : 'opacity-50 bg-gray-50/40 dark:bg-gray-800/20',
            // ألوان النصوص العامة
            'dark:text-gray-200'
          )}
          style={{ paddingRight: `${paddingRightValue}px` }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <button 
              type="button" 
              onClick={() => toggleExpand(dept.id)} 
              className="w-5 h-5 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {hasChildren ? (
                isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              )}
            </button>
            <Building2 className={clsx(
              "w-4 h-4", 
              depth === 0 ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500"
            )} />
            <div className="min-w-0">
              <span className="text-sm font-semibold truncate block dark:text-white">{dept.name}</span>
              {/* عرض المدير الحالي هنا */}
              {dept.managers && dept.managers.length > 0 ? (
                <span className="text-[10px] text-primary-600 bg-primary-50 dark:bg-primary-950/30 px-1.5 py-0.5 rounded-md mt-1 inline-block">
                  مدير: {dept.managers.map(m => m.full_name).join(', ')}
                </span>
              ) : (
                <span className="text-[10px] text-gray-400 mt-1 inline-block italic">لا يوجد مدير</span>
              )}
              {dept.job_level_id && (
                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">
                  {getLevelTitle(dept.job_level_id)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            
            {/* زر إدارة المديرين */}
            
            {isAdminOrPM() && 
            <button 
              onClick={() => { setSelectedDept(dept); setShowManagerModal(true); }}
              className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors"
              title="تعيين مدير"
            >
              <UserCheck className="w-4 h-4" /> 
            </button>
            }
            {/* زر عرض الموظفين الجديد */}
            <button 
              onClick={() => { setSelectedDept(dept); setShowUsersModal(true); }}
              className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
              title="عرض الموظفين"
            >
              <Users className="w-4 h-4" /> 
            </button>
            {/* زر إضافة قسم فرعي */}
            
            {isAdminOrPM() && 
              <button 
                onClick={() => { setParentId(dept.id); setEditDept(null); setShowModal(true) }} 
                className="text-xs px-2 py-1 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/30 rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" />
                فرعية
              </button>
            }
            
            
            {/* زر تعديل */}
            {isAdminOrPM() && 
            <button 
              onClick={() => { setEditDept(dept); setParentId(null); setShowModal(true) }} 
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            }
            
            {/* زر تعطيل (حذف) */}
            {/* زر تعطيل (حذف) - يظهر فقط للمدير أو الـ PM وإذا كان القسم نشطاً */}
            {dept.is_active && isAdminOrPM() && (
              <button 
                onClick={() => { if(confirm('هل أنت متأكد؟')) deleteMutation.mutate(dept.id) }} 
                className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                title="تعطيل القسم"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div className="border-r border-dashed border-gray-200 dark:border-gray-700 pr-1 mr-6">
            {dept.children.map(child => <DeptNode key={child.id} dept={child} depth={depth + 1} />)}
          </div>
        )}
      </div>
    )
  }

  if (isLoading) return <PageLoader />

  return (
    <div className="space-y-5 max-w-3xl">
      <PageHeader title="هيكلية القطاعات والإدارات" icon={Building2}>
        {isAdmin() && <button onClick={() => { setParentId(null); setEditDept(null); setShowModal(true) }} className="btn-primary"><Plus className="w-4 h-4" /> إضافة جذرية</button>}
      </PageHeader>

      <div className={clsx(
        "card p-4 border transition-colors",
        // التنسيق النهاري
        "bg-white border-gray-200",
        // التنسيق الليلي
        "dark:bg-gray-900 dark:border-gray-800"
      )}>
        {depts?.map(d => (
          <DeptNode 
            key={d.id} 
            dept={d} 
          />
        ))}
      </div>

      {showModal && (
        <DepartmentFormModal
          dept={editDept}
          parentId={parentId}
          levels={levels || []}
          locations={locations || []}
          allDepts={flatDepts}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); qc.invalidateQueries(['departments']) }}
        />
      )}
      {/* في نهاية الملف قبل إغلاق القوس الأخير لـ return */}
      {showUsersModal && (
        <DeptUsersModal
          isOpen={()=>showUsersModal}
          dept={selectedDept} 
          onClose={() => setShowUsersModal(false)} 
        />
      )}
      {ShowManagerModal && (
        <ManagerAssignmentModal 
          dept={selectedDept} 
          onClose={() => setShowManagerModal(false)} 
        />
      )}
    </div>

  )
}