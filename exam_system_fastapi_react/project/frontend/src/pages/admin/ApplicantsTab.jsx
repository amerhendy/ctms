import { useCallback, useEffect, useState } from 'react'
import clsx from 'clsx'
import { UserPen, RefreshCcw, UserX } from 'lucide-react'
import { applicantsApi } from '../../api/adminApi'
import { extractErrorMessage } from '../../api/axiosClient'
import Button from '../../components/Button'
import Input from '../../components/Input'
import StatusBadge from '../../components/StatusBadge'
import AccessCodeModal from '../../modals/AccessCodeModal'
import ApplicantModal from '../../modals/ApplicantModal'
import { downloadBlob } from '../../utils/helpers'
import { ConfirmDialog,FormField,Select } from '../../components/common/index'
import { theme } from '../../constants/theme'
import DownloadApplicantBTN from '../../components/common/DownloadApplicantBTN'
import ResetExamBTN from '../../components/common/ResetExamBTN'
export default function ApplicantsTab({ jobModels = [], onCreated }) {
  const [applicants, setApplicants] = useState([])
  const [jobFilter, setJobFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // حالات النوافذ المنبثقة
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedApplicant, setSelectedApplicant] = useState(null)
  const [createdCodeData, setCreatedCodeData] = useState(null)

  // حالة التحكم في نافذة تأكيد تجديد الكود
  const [resetConfirmApplicant, setResetConfirmApplicant] = useState(null)

  const loadApplicants = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await applicantsApi.list(jobFilter || undefined)
      setApplicants(data || [])
    } catch (err) {
      setError(extractErrorMessage(err, 'تعذر تحميل قائمة المتقدمين'))
    } finally {
      setLoading(false)
    }
  }, [jobFilter])

  useEffect(() => {
    loadApplicants()
  }, [loadApplicants])

  function handleOpenCreate() {
    setSelectedApplicant(null)
    setModalOpen(true)
  }

  function handleOpenEdit(applicant) {
    setSelectedApplicant(applicant)
    setModalOpen(true)
  }

  async function handleDelete(id) {
    if (!window.confirm('هل أنت متأكد من حذف هذا المتقدم وكل بياناته ورسائل الاختبار الخاصة به؟')) return
    try {
      await applicantsApi.remove(id)
      loadApplicants()
    } catch (err) {
      setError(extractErrorMessage(err, 'تعذر حذف المتقدم'))
    }
  }

  async function handleResetExam(id) {
    if (!window.confirm('هل أنت متأكد من إعادة تعيين حالة الاختبار لهذا المتقدم؟')) return
    try {
      await applicantsApi.resetExam(id)
      loadApplicants()
    } catch (err) {
      setError(extractErrorMessage(err, 'تعذر حذف المتقدم'))
    }
  }

  function handleOpenResetConfirm(applicant) {
    setResetConfirmApplicant(applicant)
  }

  async function handleConfirmResetCode() {
    if (!resetConfirmApplicant) return
    try {
      const { data } = await applicantsApi.resetCode(resetConfirmApplicant.id)
      setCreatedCodeData({
        full_name: resetConfirmApplicant.full_name,
        access_code: data.access_code,
      })
      setResetConfirmApplicant(null)
      loadApplicants()
    } catch (err) {
      setError(extractErrorMessage(err, 'تعذر إعادة توليد كود الدخول'))
    }
  }

  function handleModalSuccess(createdData) {
    loadApplicants()
    onCreated?.()
    if (createdData && createdData.access_code) {
      setCreatedCodeData(createdData)
    }
  }

  function copyToClipboard(text) {
    if (!text) return
    navigator.clipboard.writeText(text)
    alert('تم نسخ كود الدخول إلى الحافظة')
  }

  // فلترة حسب البحث بالاسم أو الرقم القومي أو الكود
  const filteredApplicants = applicants.filter((a) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return (
      a.full_name?.toLowerCase().includes(q) ||
      a.national_id?.toLowerCase().includes(q) ||
      a.access_code?.toLowerCase().includes(q)
    )
  })

  function handleExportCsv() {
    if (filteredApplicants.length === 0) {
      alert('لا توجد بيانات للتصدير')
      return
    }

    const headers = ['اسم المتقدم', 'كود الدخول', 'الرقم القومي', 'الوظيفة']
    
    const rows = filteredApplicants.map((a) => [
      `"${(a.full_name || '').replace(/"/g, '""')}"`,
      `"${(a.access_code || '').replace(/"/g, '""')}"`,
      `"${(a.national_id || '').replace(/"/g, '""')}"`,
      `"${(a.job_model_name || '').replace(/"/g, '""')}"`,
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const fileName = `applicants_export_${new Date().toISOString().slice(0, 10)}.csv`
    downloadBlob(blob, fileName)
  }

  return (
    <div className={clsx(theme.card.base)}>
      <div className={clsx(theme.card.header, 'flex items-center justify-between gap-3')}>
      {/* الشريط العلوي للتحكم والفلترة */}
      <div className="flex items-center gap-2 flex-wrap flex-1">
          <FormField>
            <Input
              placeholder="بحث بالاسم أو الرقم القومي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={clsx(theme.input.base)}
            />
          </FormField>
          <FormField>
            <Select options={jobModels.map((job) => ({
                value: job.id,
                label: job.name,
              }))}
            placeholder='كل الوظائف'
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            />
          </FormField>
          
          
        </div>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleExportCsv} className={clsx(theme.button.base,theme.button.secondary)}>
            📄 تصدير CSV
          </Button>
          <Button onClick={handleOpenCreate} className={clsx(theme.button.base,theme.button.primary)}>+ إضافة متقدم جديد</Button>
        </div>
      </div>

      {error && <p className="text-danger text-sm mb-3">{error}</p>}
      </div>
      {/* جدول عرض المتقدمين */}
      <div className={clsx(theme.card.body, 'overflow-x-auto')}>

        {!loading && filteredApplicants.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">
            {searchQuery || jobFilter ? 'لا توجد نتائج تطابق خيارات البحث.' : 'لا يوجد متقدمون بعد.'}
          </p>
        )}
        <div className={theme.table.responsiveWrapper}>
          <table className={theme.table.base}>
            <thead className={theme.table.thead}>
              <tr>
                <th className={theme.table.th}>الاسم</th>
                <th className={theme.table.th}>الرقم القومي</th>
                <th className={theme.table.th}>الوظيفة</th>
                <th className={theme.table.th}>كود الدخول</th>
                <th className={theme.table.th}>الحالة</th>
                <th className={theme.table.th}>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplicants.map((a) => (
                <tr key={a.id} className={`${theme.table.tr.base} ${theme.table.tr.hover} ${theme.table.tr.striped}`}>
                  <td className={theme.table.td}>{a.full_name}</td>
                  <td className={theme.table.td}>{a.national_id}</td>
                  <td className={theme.table.td}>{a.job_model_name}</td>
                  <td className={theme.table.td}>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-primary bg-slate-100 px-2 py-0.5 rounded">
                        {a.access_code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(a.access_code)}
                        title="نسخ الكود"
                        className="text-gray-400 hover:text-primary text-xs"
                      >
                        📋
                      </button>
                      

                      <button
                        onClick={() => handleOpenResetConfirm(a)}
                        className="text-red-400 hover:text-blue-500 text-xs hover:background-blue-500 p-1 rounded"
                        title="إعادة توليد كود دخول جديد"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className={theme.table.td}>
                      <ResetExamBTN onclick={loadApplicants} applicant={a} />
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <DownloadApplicantBTN applicant={a} className="flex items-center gap-1.5" />
                      <button
                        onClick={() => handleOpenEdit(a)}
                        className={clsx(theme.button.base, theme.button.primary, 'flex items-center gap-1.5')}
                      >
                        <UserPen className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(a.id)}
                        className={clsx(theme.button.base, theme.button.danger, 'flex items-center gap-1.5')}
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* النوافذ المنبثقة */}
      <ApplicantModal
        open={modalOpen}
        initialData={selectedApplicant}
        jobModels={jobModels}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <AccessCodeModal
        open={Boolean(createdCodeData)}
        applicantData={createdCodeData}
        onClose={() => setCreatedCodeData(null)}
      />

      <ConfirmDialog
        open={Boolean(resetConfirmApplicant)}
        onClose={() => setResetConfirmApplicant(null)}
        onConfirm={handleConfirmResetCode}
        title="تأكيد إعادة توليد كود الدخول"
        message={`هل أنت متأكد من إعادة إنشاء كود دخول جديد للمتقدم (${resetConfirmApplicant?.full_name})؟ سيتم إبطال الكود القديم.`}
      />
    </div>
  )
}