import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
<<<<<<< HEAD
import { UserCheck, Plus, Trash2, Calendar, FileText, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { delegationsApi, usersApi } from '@/api'
import { PageLoader, EmptyState, Modal, FormField, Avatar, TextArea } from '@/components/common'
import { formatDate, getApiError, DELEGATION_PERMISSION_LABELS } from '@/utils/helpers'
import { theme } from '@/constants/theme'
=======
import { UserCheck, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { delegationsApi, usersApi } from '@/api'
import { PageLoader, EmptyState, Modal, FormField, Avatar } from '@/components/common'
import { formatDate, getApiError, DELEGATION_PERMISSION_LABELS } from '@/utils/helpers'
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
import clsx from 'clsx'

export default function DelegationsPage() {
  const qc = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['delegations', 'my'],
    queryFn: () => delegationsApi.my().then(r => r.data),
  })

  const revokeMutation = useMutation({
    mutationFn: (id) => delegationsApi.revoke(id),
    onSuccess: () => {
<<<<<<< HEAD
      toast.success('تم إلغاء التفويض بنجاح')
      qc.invalidateQueries({ queryKey: ['delegations'] })
=======
      toast.success('تم إلغاء التفويض')
      qc.invalidateQueries(['delegations'])
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  if (isLoading) return <PageLoader />

  const given = data?.delegations_given || []
  const received = data?.delegations_received || []

  return (
<<<<<<< HEAD
    <div className={clsx("min-h-screen transition-colors duration-300 bg-slate-50 dark:bg-slate-950 pb-12 space-y-6")}>
      
      {/* رأس الصفحة وصندوق الإدارة العلوي */}
      <div className={clsx(theme.card.base, "flex flex-col sm:flex-row sm:items-center justify-between gap-4")}>
        <div className="space-y-1">
          <h1 className={clsx(theme.text.pageTitle, "flex items-center gap-2.5")}>
            <span className="p-2 bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 rounded-xl border border-primary-100 dark:border-primary-900/50 flex items-center justify-center shadow-sm">
              <UserCheck className="w-5 h-5 stroke-[2.2]" />
            </span>
            <span>إدارة التفويضات والصلاحيات</span>
          </h1>
          <p className={theme.text.muted}>إدارة وتتبع تفويض الصلاحيات الإدارية الممنوحة منك أو لك</p>
        </div>
        
        <button 
          onClick={() => setShowCreate(true)} 
          className={clsx(theme.button.base, theme.button.primary, "text-xs sm:text-sm px-4 py-2.5 shadow-sm")}
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>منح تفويض جديد</span>
        </button>
      </div>

      {/* المحتوى الرئيسي مقسم لقطاعات */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* التفويضات الممنوحة مني */}
        <div className={clsx(theme.card.base, "space-y-4")}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-500" />
              التفويضات الممنوحة مني ({given.length})
            </h2>
          </div>

          {given.length === 0 ? (
            <EmptyState 
              icon={UserCheck} 
              title="لم تمنح أي تفويضات بعد" 
              description="يمكنك تفويض مستخدم آخر لإدارة مهامك وصلاحياتك أثناء غيابك أو لحالات العمل المشترك."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {given.map(d => (
                <DelegationCard
                  key={d.id}
                  delegation={d}
                  mode="given"
                  onRevoke={() => {
                    if (confirm('هل أنت متأكد من رغبتك في إلغاء هذا التفويض فوراً؟')) {
                      revokeMutation.mutate(d.id)
                    }
                  }}
                  isRevoking={revokeMutation.isPending && revokeMutation.variables === d.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* التفويضات الممنوحة لي */}
        <div className={clsx(theme.card.base, "space-y-4")}>
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              التفويضات الممنوحة لي ({received.length})
            </h2>
          </div>

          {received.length === 0 ? (
            <EmptyState 
              icon={UserCheck} 
              title="لا توجد تفويضات ممنوحة لك" 
              description="عندما يمنحك أي زميل تفويضاً لإدارة صلاحياته، ستظهر هنا بشكل مباشر."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {received.map(d => (
                <DelegationCard key={d.id} delegation={d} mode="received" />
              ))}
            </div>
          )}
        </div>

      </div>
=======
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary-500" />
            التفويضات
          </h1>
          <p className="text-sm text-gray-500">إدارة تفويض الصلاحيات</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          تفويض جديد
        </button>
      </div>

      {/* Given delegations */}
      <section>
        <h2 className="font-bold text-gray-700 mb-3">التفويضات الممنوحة مني</h2>
        {given.length === 0 ? (
          <EmptyState icon={UserCheck} title="لم تمنح أي تفويضات بعد" />
        ) : (
          <div className="space-y-2">
            {given.map(d => (
              <DelegationCard
                key={d.id}
                delegation={d}
                mode="given"
                onRevoke={() => revokeMutation.mutate(d.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Received delegations */}
      <section>
        <h2 className="font-bold text-gray-700 mb-3">التفويضات الممنوحة لي</h2>
        {received.length === 0 ? (
          <EmptyState icon={UserCheck} title="لا توجد تفويضات ممنوحة لك" />
        ) : (
          <div className="space-y-2">
            {received.map(d => (
              <DelegationCard key={d.id} delegation={d} mode="received" />
            ))}
          </div>
        )}
      </section>
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172

      {showCreate && (
        <CreateDelegationModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
<<<<<<< HEAD
            qc.invalidateQueries({ queryKey: ['delegations'] })
=======
            qc.invalidateQueries(['delegations'])
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
          }}
        />
      )}
    </div>
  )
}

<<<<<<< HEAD
function DelegationCard({ delegation: d, mode, onRevoke, isRevoking }) {
  const isActive = d.is_active
  const permissionList = d?.permissions ? d.permissions.split(',') : []
  
  return (
    <div className={clsx(
      theme.card.base,
      "flex items-start gap-3.5 relative group transition-all duration-200 border border-slate-200/80 dark:border-slate-800 p-4",
      !isActive && 'opacity-60 bg-slate-50/50 dark:bg-slate-900/30'
    )}>
      <Avatar name={d.other_name || ''} size="md" className="flex-shrink-0 mt-0.5 shadow-sm" />
      
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{d.other_name}</p>
          <span className={clsx(
            'text-[11px] font-semibold px-2.5 py-0.5 rounded-full border',
            isActive 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' 
              : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
          )}>
            {isActive ? 'نشط وحالي' : 'منتهي الصلاحية'}
          </span>
        </div>

        {/* الصلاحيات */}
        <div className="flex flex-wrap gap-1.5">
          {permissionList.map(p => (
            <span key={p} className={clsx(theme.badge.base, "text-[11px] font-medium bg-primary-50 text-primary-700 border border-primary-200/60 dark:bg-primary-950/40 dark:text-primary-300 dark:border-primary-900 px-2.5 py-0.5")}>
=======
function DelegationCard({ delegation: d, mode, onRevoke }) {
  const isActive = d.is_active
  return (
    <div className={clsx(
      'card flex items-start gap-4',
      !isActive && 'opacity-60'
    )}>
      <Avatar name={d.other_name || ''} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-800">{d.other_name}</p>
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded-full',
            isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          )}>
            {isActive ? 'نشط' : 'منتهي'}
          </span>
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {d.permissions.map(p => (
            <span key={p} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
              {DELEGATION_PERMISSION_LABELS[p] || p}
            </span>
          ))}
        </div>
<<<<<<< HEAD

        {/* التواريخ والملاحظات */}
        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 pt-1">
          <p className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>من {formatDate(d.start_date)} {d.end_date ? `إلى ${formatDate(d.end_date)}` : '(بدون تاريخ انتهاء)'}</span>
          </p>
          {d.notes && (
            <p className="flex items-start gap-1.5 italic text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
              <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{d.notes}</span>
            </p>
          )}
        </div>
      </div>

      {mode === 'given' && isActive && onRevoke && (
        <button
          onClick={onRevoke}
          disabled={isRevoking}
          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          title="إلغاء التفويض الفوري"
=======
        <p className="text-xs text-gray-400 mt-1">
          من {formatDate(d.start_date)}
          {d.end_date ? ` إلى ${formatDate(d.end_date)}` : ' (بلا نهاية)'}
        </p>
        {d.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{d.notes}</p>}
      </div>
      {mode === 'given' && isActive && onRevoke && (
        <button
          onClick={onRevoke}
          className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg"
          title="إلغاء التفويض"
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

function CreateDelegationModal({ onClose, onSuccess }) {
<<<<<<< HEAD
=======
  const qc = useQueryClient()
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const { register, handleSubmit, formState: { errors } } = useForm()

  const { data: users } = useQuery({
    queryKey: ['users', 'search', search],
    queryFn: () => usersApi.list({ q: search, is_active: true }).then(r => r.data),
    enabled: search.length > 1,
  })

  const mutation = useMutation({
    mutationFn: (data) => delegationsApi.create({
      delegate_id: selectedUser.id,
      permission_types: permissions,
      start_date: data.start_date,
      end_date: data.end_date || null,
      notes: data.notes || null,
    }),
    onSuccess: () => {
<<<<<<< HEAD
      toast.success('تم منح التفويض بنجاح')
=======
      toast.success('تم التفويض بنجاح')
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
      onSuccess()
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const togglePerm = (p) => setPermissions(prev =>
    prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
  )

  return (
<<<<<<< HEAD
    <Modal open onClose={onClose} title="منح تفويض صلاحيات إدارية جديد" size="md">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
        
        {/* بحث المستخدم */}
        <div className="space-y-1.5">
          <FormField label="ابحث عن المستخدم المفوَّض">
            <input
              className={clsx(theme.input.base, "w-full")}
              placeholder="اكتب اسم المستخدم أو بريده الإلكتروني للبحث..."
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedUser(null) }}
            />
          </FormField>
          
          {users && users.total > 0 && search.length > 1 && !selectedUser && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-44 overflow-y-auto bg-white dark:bg-slate-900 shadow-lg">
              {users.items.map(u => (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <Avatar name={u.full_name} size="sm" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{u.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.job_title || u.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedUser && (
            <div className="flex items-center justify-between p-3 bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Avatar name={selectedUser.full_name} size="sm" />
                <div>
                  <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">المستخدم المحدد للتفويض:</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedUser.full_name}</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedUser(null)} 
                className="text-xs font-semibold text-slate-500 hover:text-red-500 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
              >
                تغيير
              </button>
            </div>
          )}
        </div>

        {/* الصلاحيات الممنوحة */}
        <FormField label="اختر الصلاحيات الممنوحة بدقة">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {Object.entries(DELEGATION_PERMISSION_LABELS).map(([val, label]) => {
              const isSelected = permissions.includes(val)
              return (
                <div
                  key={val}
                  onClick={() => togglePerm(val)}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer text-sm font-medium transition-all',
                    isSelected 
                      ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/30 text-primary-900 dark:text-primary-200 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}} // Controlled by parent div click for better UX
                    className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                  />
                  <span>{label}</span>
                </div>
              )
            })}
          </div>
        </FormField>

        {/* التواريخ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="تاريخ البدء" required>
            <input 
              type="date" 
              className={clsx(theme.input.base, "uppercase w-full")} 
              {...register('start_date', { required: 'تاريخ البدء مطلوب' })} 
            />
            {errors.start_date && <span className="text-xs text-red-500 mt-1 block">{errors.start_date.message}</span>}
          </FormField>
          
          <FormField label="تاريخ الانتهاء (اختياري)">
            <input 
              type="date" 
              className={clsx(theme.input.base, "uppercase w-full")} 
              {...register('end_date')} 
            />
          </FormField>
        </div>

        {/* ملاحظات */}
        <FormField label="ملاحظات توجيهية إضافية">
          <TextArea
            placeholder="اكتب أي ملاحظات أو تعليمات خاصة بالمفوض (اختياري)..."
            {...register('notes')}
            className={clsx(theme.input.base, "w-full resize-none h-20")}
          />
        </FormField>

        {/* أزرار الإجراءات */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button 
            type="button" 
            onClick={onClose} 
            className={clsx(theme.button.base, theme.button.secondary, "flex-1 justify-center py-2.5")}
          >
            إلغاء
          </button>
          
          <button
            type="submit"
            disabled={!selectedUser || permissions.length === 0 || mutation.isPending}
            className={clsx(theme.button.base, theme.button.primary, "flex-1 justify-center py-2.5")}
          >
            {mutation.isPending ? 'جاري الاعتماد...' : 'منح التفويض الآن'}
          </button>
        </div>

      </form>
    </Modal>
  )
}
=======
    <Modal open onClose={onClose} title="منح تفويض جديد" size="md">
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-4">
        {/* User search */}
        <FormField label="ابحث عن المستخدم المفوَّض">
          <input
            className="input"
            placeholder="اكتب الاسم أو البريد..."
            value={search}
            onChange={e => { setSearch(e.target.value); setSelectedUser(null) }}
          />
        </FormField>
        {users && search.length > 1 && !selectedUser && (
          <div className="border border-gray-200 rounded-xl divide-y max-h-40 overflow-y-auto">
            {users.map(u => (
              <div
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="flex items-center gap-3 p-2.5 cursor-pointer hover:bg-gray-50"
              >
                <Avatar name={u.full_name} size="sm" />
                <div>
                  <p className="text-sm font-medium">{u.full_name}</p>
                  <p className="text-xs text-gray-400">{u.job_title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {selectedUser && (
          <div className="flex items-center gap-3 p-3 bg-primary-50 border border-primary-200 rounded-xl">
            <Avatar name={selectedUser.full_name} size="sm" />
            <p className="text-sm font-medium text-primary-800">{selectedUser.full_name}</p>
            <button type="button" onClick={() => setSelectedUser(null)} className="mr-auto text-xs text-gray-400 hover:text-red-500">تغيير</button>
          </div>
        )}

        {/* Permissions */}
        <FormField label="الصلاحيات الممنوحة">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(DELEGATION_PERMISSION_LABELS).map(([val, label]) => (
              <label key={val} className={clsx(
                'flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer text-sm transition-colors',
                permissions.includes(val) ? 'border-primary-300 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'
              )}>
                <input
                  type="checkbox"
                  checked={permissions.includes(val)}
                  onChange={() => togglePerm(val)}
                  className="rounded text-primary-600"
                />
                {label}
              </label>
            ))}
          </div>
        </FormField>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <FormField label="تاريخ البدء" required>
            <input type="date" className="input" {...register('start_date', { required: true })} />
          </FormField>
          <FormField label="تاريخ الانتهاء">
            <input type="date" className="input" {...register('end_date')} />
          </FormField>
        </div>

        <FormField label="ملاحظات">
          <textarea className="input resize-none h-16" placeholder="ملاحظات اختيارية..." {...register('notes')} />
        </FormField>

        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">إلغاء</button>
          <button
            type="submit"
            disabled={!selectedUser || permissions.length === 0 || mutation.isPending}
            className="btn-primary flex-1 justify-center"
          >
            {mutation.isPending ? 'جاري التفويض...' : 'منح التفويض'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
>>>>>>> bba781d614bd14ebc2c7f825d5451eff39c0a172
