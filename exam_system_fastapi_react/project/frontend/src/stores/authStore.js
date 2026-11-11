import { create } from 'zustand'
import { authApi } from '../api/authApi'
import { extractErrorMessage } from '../api/axiosClient'
import { db } from '../hooks/db' // 1. استيراد ملف الداتا بيز

export const useAuthStore = create((set, get) => ({
  admin: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    try {
      // قراءة التوكن من Dexie IndexedDB
      const tokenItem = await db.store.get('access_token')
      const token = tokenItem?.value

      if (!token) {
        set({ isLoading: false })
        return
      }

      const { data } = await authApi.me()
      set({ admin: data, isAuthenticated: true, isLoading: false })
    } catch {
      // في حالة الخطأ أو انتهاء الجلسة، نمسح التوكن من Dexie
      await db.store.delete('access_token')
      set({ admin: null, isAuthenticated: false, isLoading: false })
    }
  },

  login: async (username, password) => {
    try {
      const { data } = await authApi.login(username, password)

      // حفظ التوكنات والبيانات في Dexie بدلاً من localStorage
      await Promise.all([
        db.store.put({ key: 'token_type', value: data.token_type }),
        db.store.put({ key: 'access_token', value: data.access_token }),
        db.store.put({ key: 'refresh_token', value: data.refresh_token }),
        db.store.put({ key: 'user_id', value: data.user_id }),
        db.store.put({ key: 'full_name', value: data.full_name }),
      ])

      set({ admin: data.user_id, isAuthenticated: true })
      return { success: true }
    } catch (error) {
      return { success: false, message: extractErrorMessage(error, 'خطأ في تسجيل الدخول') }
    }
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // تجاهل الخطأ
    }

    // مسح كافة التوكنات الخاصة بالـ Auth من Dexie
    await Promise.all([
      db.store.delete('token_type'),
      db.store.delete('access_token'),
      db.store.delete('refresh_token'),
      db.store.delete('user_id'),
      db.store.delete('full_name'),
    ])

    set({ admin: null, isAuthenticated: false })
  },
}))