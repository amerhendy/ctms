import { useEffect, useState } from 'react'

import { applicantsApi } from '../../api/adminApi'
import StatusBadge from '../../components/StatusBadge'
import DownloadApplicantBTN from '../../components/common/DownloadApplicantBTN'
import ResetExamBTN         from '../../components/common/ResetExamBTN'
import { Loader2,UserX } from 'lucide-react'
import clsx from 'clsx'
import { theme } from '../../constants/theme'
export default function ResultsTab({ jobModels }) {
  const [applicants, setApplicants] = useState([])
  const [jobFilter, setJobFilter] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadResults() {
    setLoading(true)
    try {
      const { data } = await applicantsApi.list(jobFilter || undefined)
      setApplicants(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadResults()
  }, [jobFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id) {
    if (!window.confirm('هل أنت متأكد من حذف هذا المتقدم وكل بياناته؟')) return
    await applicantsApi.remove(id)
    loadResults()
  }

  return (
    <div>
      <div className={clsx(theme.card.base)}>
        <div className={clsx(theme.card.header, 'flex items-center justify-between gap-3')}>
        <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} className="input-field w-auto">
          <option value="">كل الوظائف</option>
          {jobModels.map((jm) => (
            <option key={jm.id} value={jm.id}>
              {jm.name}
            </option>
          ))}
        </select>
        <button onClick={loadResults} className="btn-primary flex items-center gap-1.5" disabled={loading}>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          تحديث
        </button>
      </div>
      <div className={clsx(theme.card.body, 'overflow-x-auto')}>
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">جاري تحميل النتائج...</p>
          </div>
        )}
        <div className={clsx(theme.table.responsiveWrapper)}>
        <table className={theme.table.base}>
          <thead className={theme.table.thead}>
            <tr>
              <th className={theme.table.th}>الاسم</th>
              <th className={theme.table.th}>الرقم القومي</th>
              <th className={theme.table.th}>الوظيفة</th>
              <th className={theme.table.th}>الحالة</th>
              <th className={theme.table.th}>الدرجة</th>
              <th className={theme.table.th}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((a) => (
              <tr key={a.id} className={`${theme.table.tr.base} ${theme.table.tr.hover} ${theme.table.tr.striped}`}>
                <td className={theme.table.td}>{a.full_name}</td>
                <td className={theme.table.td}>{a.national_id}</td>
                <td className={theme.table.td}>{a.job_model_name}</td>
                <td className={theme.table.td}>
                  <ResetExamBTN onclick={loadResults} applicant={a} />
                  <StatusBadge status={a.status} />
                </td>
                <td className={theme.table.td}>
                  {a.status === 'finished' ? `${a.total_score} / ${a.max_score}` : '-'}
                </td>
                <td className={theme.table.td}>
                  <DownloadApplicantBTN applicant={a} className="flex items-center gap-1.5" />
                  <button
                      onClick={() => handleDelete(a.id)}
                      className={clsx(theme.button.base, theme.button.danger, 'flex items-center gap-1.5')}
                    >
                      <UserX className="w-3 h-3" />
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {!loading && applicants.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">لا يوجد متقدمون بعد.</p>
        )}
      </div>
      </div>
    </div>
  )
}
