import axios from 'axios'
import { db } from '../hooks/db';

// في وضع التطوير: Vite يعمل Proxy لـ /api نحو الباك اند (راجع vite.config.js).
// في وضع الإنتاج (Docker): يمكن ضبط VITE_API_BASE_URL ليشير مباشرة لعنوان الباك اند.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// ── Request interceptor: attach token from Dexie IndexedDB ─────
apiClient.interceptors.request.use(async (config) => {
  try {
    const tokenRecord = await db.store.get('access_token')
    const token = tokenRecord?.value

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch (e) {
    console.error('Error reading access_token from Dexie:', e)
  }
  return config
})

// ── Response interceptor: handle 401 ──────────────────────────
apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      
      try {
        const refreshRecord = await db.store.get('refresh_token')
        const refresh = refreshRecord?.value

        if (refresh) {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, {
            refresh_token: refresh,
          })

          // تحديث التوكنات الجديدة في IndexedDB
          await Promise.all([
            db.store.put({ key: 'access_token', value: data.access_token }),
            db.store.put({ key: 'refresh_token', value: data.refresh_token }),
          ])

          original.headers.Authorization = `Bearer ${data.access_token}`
          return apiClient(original)
        } else {
          await db.store.clear()
          window.location.href = '/admin/login'
        }
      } catch (refreshErr) {
        await db.store.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export function extractErrorMessage(error, fallback = 'حدث خطأ غير متوقع') {
  return error?.response?.data?.detail || error?.message || fallback
}