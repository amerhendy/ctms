import { useEffect, useState } from 'react'

import { applicantsApi } from '../api/adminApi'
import { extractErrorMessage } from '../api/axiosClient'
import Button from '../components/Button'
import Input from '../components/Input'
import {Modal,FormField,Select,ToggleSwitch,RadioButton} from '../components/common/index'
import {theme} from '../constants/theme'
import clsx from 'clsx'

export default function ApplicantModal({ open, initialData, jobModels, onClose, onSuccess }) {
  const [nationalId, setNationalId] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [jobModelId, setJobModelId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isEdit = Boolean(initialData?.id)

  useEffect(() => {
    if (initialData) {
      setNationalId(initialData.national_id || '')
      setFullName(initialData.full_name || '')
      setPhone(initialData.phone || '')
      setJobModelId(initialData.job_model_id || '')
    } else {
      setNationalId('')
      setFullName('')
      setPhone('')
      setJobModelId('')
    }
    setError('')
  }, [initialData, open])

  if (!open) return null

  async function handleSubmit() {
    setError('')
    if (!nationalId.trim() || !fullName.trim() || !jobModelId) {
      setError('الرجاء تعبئة الحقول المطلوبة (الرقم القومي، الاسم الكامل، والوظيفة)')
      return
    }

    const payload = {
      national_id: nationalId.trim(),
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      job_model_id: jobModelId,
    }

    setSubmitting(true)
    try {
      if (isEdit) {
        await applicantsApi.update(initialData.id, payload)
        onSuccess(null) // لا يوجد كود جديد في وضع التعديل
      } else {
        const { data } = await applicantsApi.create(payload)
        onSuccess(data) // إرسال الاستجابة التي تحتوي على access_code لعرضه
      }
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err, 'حدث خطأ أثناء حفظ بيانات المتقدم'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'تعديل بيانات المتقدم' : 'إضافة متقدم جديد'} size='lg'>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="الرقم القومى" required>
          <Input
            placeholder="أدخل الرقم القومي"
            value={nationalId}
            onChange={(e) => setNationalId(e.target.value)}
            className={clsx(theme.input.base)}
          />
        </FormField>
        <FormField label="الاسم الكامل" required>
          <Input
            placeholder="أدخل الاسم الرباعي"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={clsx(theme.input.base)}
          />
        </FormField>
        <FormField label="رقم الهاتف">
          <p className={clsx(theme.text.muted)}>(اختيارى)</p>
          <Input
            placeholder="01000000000"
            pattern="^01[0125][0-9]{8}$"
            value={phone}
            type="tel"
            onChange={(e) => setPhone(e.target.value)}
            className={clsx(theme.input.base)}
            size="20"
            minLength="9"
            maxLength="14"
          />
        </FormField>
        <FormField label="اختر الوظيفة" required>
          <Select
              options={jobModels.map((job) => ({
                value: job.id,
                label: job.name,
              }))}
              value={jobModelId}
              onChange={(e) => setJobModelId(e.target.value)}
              placeholder="اختر الوظيفة..."
            />
        </FormField>
      </div>
      {error && <p className={clsx(theme.text.error)}>{error}</p>}
        

        <div className="flex gap-3 mt-5">
          <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة المتقدم'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            إلغاء
          </Button>
        </div>
      
    </Modal>
  )
}