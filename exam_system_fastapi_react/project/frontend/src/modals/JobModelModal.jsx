import { useEffect, useState } from 'react'

import { jobModelsApi } from '../api/adminApi'
import { extractErrorMessage } from '../api/axiosClient'
import Button from '../components/Button'
import Input from '../components/Input'
import {Modal,FormField} from '../components/common/index'

import {theme} from '../constants/theme'
import clsx from 'clsx'
export default function JobModelModal({ open, initialData, onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState(60)
  const [countQuestions,setCountQuestions]=useState(1)
  const [targetScore,setTargetScore]=useState(100.0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isEdit = Boolean(initialData?.id)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setDescription(initialData.description || '')
      setDuration(initialData.duration_minutes || 60)
      setCountQuestions(initialData.count_questions || 1)
      setTargetScore(initialData.target_score || 100.0)
    } else {
      setName('')
      setDescription('')
      setDuration(60)
      setCountQuestions(1)
      setTargetScore(100.0)
    }
    setError('')
  }, [initialData, open])

  if (!open) return null

  async function handleSubmit() {
    setError('')
    if (!name.trim()) {
      setError('الرجاء إدخال اسم الوظيفة')
      return
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      duration_minutes: Number(duration) || 60,
      count_questions:Number(countQuestions) || 1,
      target_score: Number(targetScore) || 100.0
    }

    setSubmitting(true)
    try {
      if (isEdit) {
        await jobModelsApi.update(initialData.id, payload)
      } else {
        await jobModelsApi.create(payload)
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(extractErrorMessage(err, 'حدث خطأ أثناء حفظ النموذج'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'تعديل نموذج وظيفة' : 'إضافة نموذج وظيفة جديد'} size='xl'>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
          <div>
            <FormField label="اسم الوظيفة" required error={error}>
              <Input
                className={clsx(theme.input.base, error && 'border-red-500')}
                placeholder="مثال: محاسب، مبرمج..."
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>
            <FormField label="مدة الاختبار (بالدقائق)" error={error}>
              <Input
                className={clsx(theme.input.base, error && 'border-red-500')}
                type="number"
                min="1"
                placeholder="60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
            />
            </FormField>
            <FormField label="عدد الأسئلة" error={error}>
              <Input
              type="number"
              min="1"
              placeholder="1"
              value={countQuestions}
              onChange={(e) => setCountQuestions(e.target.value)}
              className={clsx(theme.input.base, error && 'border-red-500')}
            />
            </FormField>
          </div>
          <div>
            <FormField label="الوصف" error={error}>
              <textarea
                className={clsx(
                  theme.textarea.base,
                  theme.textarea.resizable,
                  theme.textarea.fixed,
                    error && 'border-red-500')}
                placeholder="وصف مختصر للوظيفة..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </FormField>
            
            <FormField label="درجة الاختبار النهائية" error={error}>
              <Input
              type="number"
              min="1"
              placeholder="1"
              value={targetScore}
              onChange={(e) => setTargetScore(e.target.value)}
              className={clsx(theme.input.base, error && 'border-red-500')}
            />
            </FormField>
          </div>
        </div>
          {error && <p className="text-danger text-sm mb-3">{error}</p>}

          <div className={clsx(theme.form.footer)}>
            <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة النموذج'}
            </Button>
            <Button variant="secondary" onClick={onClose}>
              إلغاء
            </Button>
          </div>
    </Modal>
  )
}