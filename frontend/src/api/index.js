  import axios from 'axios'

  const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

  const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
  })

  // ── Request interceptor: attach token ──────────────────────────
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  // ── Response interceptor: handle 401 ──────────────────────────
  api.interceptors.response.use(
    (res) => res,
    async (err) => {
      const original = err.config
      if (err.response?.status === 401 && !original._retry) {
        original._retry = true
        const refresh = localStorage.getItem('refresh_token')
        if (refresh) {
          try {
            const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
              refresh_token: refresh,
            })
            localStorage.setItem('access_token', data.access_token)
            localStorage.setItem('refresh_token', data.refresh_token)
            original.headers.Authorization = `Bearer ${data.access_token}`
            return api(original)
          } catch {
            localStorage.clear()
            window.location.href = '/login'
          }
        } else {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
      return Promise.reject(err)
    }
  )

// ── Auth ────────────────────────────────────────────────────────
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  
  // 🌟 تسجيل الدخول عبر جوجل (صفحة LoginPage)
  googleLogin: (idTokenStr) => api.post('/auth/google', { id_token_str: idTokenStr }),

  // 🌟 ربط الحساب الحالي بجوجل (صفحة UserProfilePage)
  linkGoogle: (idTokenStr) => api.post('/auth/google/link', { id_token_str: idTokenStr }),

  // 🔄 إلغاء ربط الحساب الحالي بجوجل (مستحدثة للأمان والمرونة)
  // تقوم بمسح الـ google_id من قاعدة البيانات ليعود الحساب تقليدياً فقط
  unlinkGoogle: () => api.post('/auth/google/unlink'), 
}
export const statsApi = {
  getme: () => api.get(`/stats/me`),
  getuser: (id) => api.get(`/stats/users/${id}`),
  getdepartment: (id) => api.get(`/stats/department/${id}`),
}
  // ── Tasks ───────────────────────────────────────────────────────
  export const tasksApi = {
    list: (params) => api.get('/tasks', { params }),
    get: (id) => api.get(`/tasks/${id}`),
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.patch(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
  
  
    // Urgency
    requestUrgency: (taskId, data) => api.post(`/tasks/${taskId}/request-urgency`, data),
    respondUrgency: (taskId, data) => api.post(`/tasks/${taskId}/respond-urgency`, data),
    // Favorite
    toggleFavorite: (taskId) => api.post(`/tasks/${taskId}/favorite`),
    // Logs
    getLogs: (taskId,params) => api.get(`/tasks/${taskId}/logs`,{params}),
    
    
    
  } 
  // ─── مؤقت الوقت الفعلي (Time Logs) ──────────────────────────────────
    // بدء المؤقت يستقبل note اختيارية عبر الـ Query
  export const taskTimeLogApi={
    startTimeLog: (taskId, note = null) => api.post(`/TimeLog/${taskId}/start`, null, { params: { note } }),
    // تعديل: تحويلها إلى post لتطابق الباك إند تماماً
    stopTimeLog: (taskId) => api.post(`/TimeLog/${taskId}/stop`),
    getTimeLogs: (taskId) => api.get(`/TimeLog/${taskId}/logs`),
  }

  export const taskAssignsApi = {
    listAssignments: (taskId) => api.get(`/assignment/${taskId}`),
    // جلب قائمة المرؤوسين مع دعم الترقيم والبحث الموحد (q)
    getSubordinates: (userId, params) => 
      api.get(`/users/${userId}/subordinates`, { 
        params: {
          page: params?.page || 1,
          page_size: params?.page_size || 10,
          q: params?.q || undefined,
          sort_by: 'full_name',
          sort_order: 'asc'
        } 
      }),

    // تعيين عضو جديد (Query Params متوافقة 100% مع الباك آند)
    assign: (taskId, userId, type) => 
      api.post(`/assignment/${taskId}`, null, { 
        params: { 
          user_id: userId, 
          assignment_type: type 
        } 
      }),

    // إلغاء التعيين الرسمي (Soft Delete)
    unassign: (taskId, userId) => 
      api.delete(`/assignment/${taskId}/${userId}`),
  } 
  // ─── خطوات المهام TaskSteps ──────────────────────────
  export const TaskStepsApi = {
    listSteps: (taskId) => api.get(`/Steps/${taskId}`),
    addStep: (taskId, data) => api.post(`/Steps/${taskId}`, data),
    updateStep: (taskId, stepId, data) => api.patch(`/Steps/${taskId}/${stepId}`, data),
    deleteStep: (taskId, stepId) => api.delete(`/Steps/${taskId}/${stepId}`),
    reorderSteps: (taskId, stepsOrderList) => api.put(`/Steps/${taskId}/reorder`, stepsOrderList),
  }
  // ─── المهام المتكررة (Recurring Tasks CRUD) ──────────────────────────
  export const recurringTasksApi = {
    // تعديل: إضافة الـ / في البداية وتمرير البيانات في الـ params بناءً على دالة الباك إند
    ///api/v1/recurrTasks/recurring
    createRecurringTask: (data) => api.post('/recurrTasks/recurring', data),
    // تعديل: إضافة الـ / وتمرير الفلاتر إن وجدت
    listRecurringTasks: (params = {}) => api.get('/recurrTasks/recurring/', { params }),
    // تعديل: تصحيح اسم المتغير من templateId إلى id
    getRecurringTask: (id) => api.get(`/recurrTasks/recurring/${id}`),
    // تعديل: تصحيح اسم المتغير وتمرير البيانات في الـ params
    updateRecurringTask: (id, data) => api.patch(`/recurrTasks/recurring/${id}`, data),
    // تعديل: تصحيح اسم المتغير ليكون id
    deleteRecurringTask: (id) => api.delete(`/recurrTasks/recurring/${id}`),

    triggerAutomation: (data) => api.post('/recurrTasks/recurring/trigger-automation'),

    getRecurringTasksLog: (params = {}) => api.get('/recurrTasks/recurring/logs', { params }),

  }
  // ─── التعليقات (Comments) ───────────────────────────────────────────
  // نرسل البيانات بداخل params لأن الباك إند يستقبلها كـ Query Parameters
  export const commentsApi = {
    addComment: (taskId, text) => api.post(`/comments/${taskId}`, null, { params: { comment_text: text } }),
    listComments: (taskId,params) => api.get(`/comments/${taskId}`, { params }),
    // نرسل النص الجديد أيضاً في الـ params كما هو محدد في الباك إند
    updateComment: (taskId, commentId, text) => api.patch(`/comments/${taskId}/${commentId}`, null, { params: { comment_text: text } }),
    deleteComment: (taskId, commentId) => api.delete(`/comments/${taskId}/${commentId}`),
  }
    
    // ─── المرفقات (Attachments) ─────────────────────────────────────────
    // المرفقات تستقبل معاملاها كـ Query， نمرر كائن الـ data بداخل الـ params
  export const attachmentsApi = {
    addAttachment: (taskId, file) => {
      const formData = new FormData();
      formData.append('file', file); // 'file' يجب أن تطابق اسم المعامل في الباك إند
      return api.post(`/taskAttachments/${taskId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    listAttachments: (taskId,params) => api.get(`/taskAttachments/${taskId}`,{params}),
    deleteAttachment: (taskId, attachmentId) => api.delete(`/taskAttachments/${taskId}/${attachmentId}`),
    downloadAttachment: (taskId, attachmentId) => {
      try {
        return api.get(`/taskAttachments/${taskId}/${attachmentId}/getItem`)
      } catch (error) {
        console.log(error);
      }
      
      
    },

  }
  // ── Transfers ───────────────────────────────────────────────────
  export const transfersApi = {
    create: (data) => api.post('/transfers', data),
    pending: () => api.get('/transfers/pending'),
    respond: (id, data) => api.post(`/transfers/${id}/respond`, data),
    history: (taskId) => api.get(`/transfers/history/${taskId}`),
  }

  // ── Shares ──────────────────────────────────────────────────────
  export const sharesApi = {
    share: (data) => api.post('/shares', data),
    getForTask: (taskId) => api.get(`/shares/task/${taskId}`),
    revoke: (shareId) => api.delete(`/shares/${shareId}`),
    updateShare: (shareId, permission, expiresAt) => 
      api.put(`/shares/${shareId}`, { 
        permission: permission || undefined, 
        expires_at: expiresAt || undefined 
      }),
  }

  // ── Delegations ─────────────────────────────────────────────────
  export const delegationsApi = {
    create: (data) => api.post('/delegations', data),
    my: () => api.get('/delegations/my'),
    revoke: (id) => api.delete(`/delegations/${id}`),
  }

  // ── Notifications ───────────────────────────────────────────────
  export const notificationsApi = {
    list: (params) => api.get('/notifications', { params }),
    markRead: (id) => api.post(`/notifications/${id}/read`),
    markAllRead: () => api.post('/notifications/mark-all-read'),
    unreadCount: () => api.get('/notifications/unread-count'),
    delete: (id) => api.delete(`/notifications/${id}`),
    clearAllRead: () => api.delete('/notifications/clear-read'),
  }

  // ── Organization ─────────────────────────────────────────────────
  export const orgApi = {
    // Departments
    listDepts: (params) => {api.get('/departments', { params })},
    list_departments_kv:()=>api.get('/departments/kv'),
    getDeptTree: (params) => api.get('/departments/tree', {params} ),
    usersDept: (id,data) => api.get(`/departments/${id}/users`,data),
    createDept: (data) => api.post('/departments', data),
    updateDept: (id, data) => api.patch(`/departments/${id}`, data),
    deleteDept: (id) => api.delete(`/departments/${id}`),
    // Job Levels
    listLevels: () => api.get('/job-levels'),
    createLevel: (data) => api.post('/job-levels', data),
    updateLevel: (id, data) => api.put(`/job-levels/${id}`, data),
    deleteLevel: (id) => api.delete(`/job-levels/${id}`),
    
  }
  export const ManagerApi={
    assignManager:(data)=>api.post('/department-managers',data),
    removeManager:(dept_id,user_id)=>api.delete(`/department-managers/${dept_id}/${user_id}`,),
  }
  // Locations
  export const LocationApi = {
    list: (params) => api.get('/locations', { params }),
    getUsers: (deptId, page = 1, pageSize = 20) => 
        api.get(`/locations/${deptId}/users`, { 
            params: { page, page_size: pageSize } 
        }),
    getDepartments: (deptId, page = 1, pageSize = 20) => 
        api.get(`/locations/${deptId}/departments`, { 
            params: { page, page_size: pageSize } 
        }),
    createLocation: (data) => api.post('/locations', data),
    updateLocation: (id, data) => api.put(`/locations/${id}`, data),
    deleteLocation: (id) => api.delete(`/locations/${id}`),             // إضافة هذه لاحقاً إذا احتجتها
  }
  // ── Users ────────────────────────────────────────────────────────
  export const usersApi = {
    list: (params) => api.get('/users', { params }),
    get: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.patch(`/users/${id}`, data),
    changePassword: (id, data) => api.post(`/users/${id}/change-password`, data),
    subordinates: (id) => api.get(`/users/${id}/subordinates`),
    me:()=>api.get(`/users/me`),
    updatenotification:(userid,data)=>api.patch(`/users/${userid}/notification-settings`,data),
    updateContract:(userid,params)=>{api.put(`/users/${userid}/contacts`,params)},
    getContacts:(userid)=>{api.get(`/users/${userid}/contacts`)}
  }

  // ── Search ───────────────────────────────────────────────────────
  export const searchApi = {
    advanced: (params) => api.get('/search', { params }),
  }

  export default api
