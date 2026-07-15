import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { UserCheck, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { delegationsApi, usersApi } from '@/api'
import { PageLoader, EmptyState, Modal, FormField, Avatar } from '@/components/common'
import { formatDate, getApiError, DELEGATION_PERMISSION_LABELS } from '@/utils/helpers'
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
      toast.success('تم إلغاء التفويض')
      qc.invalidateQueries(['delegations'])
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  if (isLoading) return <PageLoader />

  const given = data?.delegations_given || []
  const received = data?.delegations_received || []

  return (
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

      {showCreate && (
        <CreateDelegationModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false)
            qc.invalidateQueries(['delegations'])
          }}
        />
      )}
    </div>
  )
}

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
              {DELEGATION_PERMISSION_LABELS[p] || p}
            </span>
          ))}
        </div>
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
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

function CreateDelegationModal({ onClose, onSuccess }) {
  const qc = useQueryClient()
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
      toast.success('تم التفويض بنجاح')
      onSuccess()
    },
    onError: (err) => toast.error(getApiError(err)),
  })

  const togglePerm = (p) => setPermissions(prev =>
    prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
  )

  return (
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
