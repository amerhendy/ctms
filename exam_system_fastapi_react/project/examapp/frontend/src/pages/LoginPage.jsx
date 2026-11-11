import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '../components/Button'
import Input from '../components/Input'
import { useExamStore } from '../stores/examStore'
import {theme} from '../constants/theme'
import clsx from 'clsx'
export default function LoginPage() {
  const navigate = useNavigate()
  const loginWithCode = useExamStore((s) => s.loginWithCode)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!code.trim()) {
      setError('الرجاء إدخال كود الدخول')
      return
    }
    setError('')
    setLoading(true)
    const result = await loginWithCode(code.trim())
    setLoading(false)
    if (result.success) {
      navigate('/exam')
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      <div className="card max-w-md w-full text-center">
        <h1 className="text-xl font-bold text-primary mb-2">نظام اختبارات التوظيف الإلكترونية</h1>
        <p className="text-sm text-gray-500 mb-6">الرجاء إدخال كود الدخول الخاص بك للبدء في أداء الاختبار</p>

        <Input
          placeholder="كود الدخول"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          maxLength={8}
          className={clsx("text-center tracking-widest",theme.input.base)}
        />

        <Button className="w-full" onClick={handleLogin} disabled={loading}>
          {loading ? 'جاري الدخول...' : 'دخول الاختبار'}
        </Button>

        {error && <p className="text-danger text-sm mt-3">{error}</p>}
      </div>
    </div>
  )
}
