import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/api'
import {clearUserDB,initUserDB} from '@/utils/db'
const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      managed_department_ids:[],

      login: async (identifier, password) => {
        const { data } = await authApi.login({ identifier, password })
        
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        await initUserDB(data.user_id);
        set({
          user: {
            id: data.user_id,
            full_name: data.full_name,
            global_role: data.global_role,
            managed_department_ids:data.managed_department_ids
          },
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isAuthenticated: true,
        })
        // Fetch full profile
        const me = await authApi.me()
        set({ user: me.data })
        return data
      },

      // 🌟 الدالة الجديدة المصممة خصيصاً لإغلاق ثغرة التوجيه بجوجل
      googleLoginAction: async (idTokenStr) => {
        // أ. إرسال التوكن للباك إند واستلام الـ tokens
        const { data } = await authApi.googleLogin(idTokenStr)
        
        // ب. تخزين التوكنات في المتصفح فوراً ليعتمد عليها الـ Interceptor
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        
        // ج. تحديث الحالة المبدئية للـ Store ورفع راية الأمان لتفعيل الدخول
        set({
          user: {
            id: data.user_id,
            full_name: data.full_name,
            global_role: data.global_role,
          },
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          isAuthenticated: true, // 👈 هنا مربط الفرس وحل المشكلة
        })

        // د. سحب الملف الشخصي الكامل للموظف (الإيميل، الصورة، والوظيفة) وتحديث الـ Store
        const me = await authApi.me()
        set({ user: me.data })
        
        return data
      },

      logout: () => {
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          clearUserDB(userId); // مسح بياناته نهائياً عند الخروج
        }
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      setUser: (userData) => set({ user: userData }),

      refreshUser: async () => {
        try {
          const { data } = await authApi.me()
          set({ user: data })
        } catch {
          get().logout()
        }
      },
      
      isAdmin: () => get().user?.global_role === 'global_admin',
      isPM: () => get().user?.global_role === 'program_manager',
      isAdminOrPM: () => ['global_admin', 'program_manager'].includes(get().user?.global_role),
      isDepartmentManager: () => {
        const user = get().user;
        // التحقق من وجود المستخدم، وأن القائمة موجودة وليست فارغة
        if (user && Array.isArray(user.managed_department_ids) && user.managed_department_ids.length > 0) {
          return user.managed_department_ids;
        }
        return false;
      },
    }),
    {
      name: 'auth-store',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore