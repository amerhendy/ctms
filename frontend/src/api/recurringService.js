import api from '@/api';

export const recurringService = {
  // جلب القوالب النشطة مع خيارات التصفية والبحث
  getTemplates: async (params = {}) => {
    const response = await api.get('/recurrTasks/recurring', { params });
    return response.data;
  },

  // جلب القوالب المحذوفة (سلة المهملات)
  getTrashTemplates: async (params = {}) => {
    const response = await api.get('/recurrTasks/recurring/trash', { params });
    return response.data;
  },

  // جلب تفاصيل قالب محدد عبر الـ ID
  getTemplateById: async (id) => {
    const response = await api.get(`/recurrTasks/recurring/${id}`);
    return response.data;
  },

  // إنشاء قالب جديد
  createTemplate: async (payload) => {
    const response = await api.post('/recurrTasks/recurring', payload);
    return response.data;
  },

  // تحديث جزئي للقالب (يشمل تحديث الخطوات بالـ Diff)
  updateTemplate: async (id, payload) => {
    const response = await api.patch(`/recurrTasks/recurring/${id}`, payload);
    return response.data;
  },

  // حذف ناعم لقالب
  deleteTemplate: async (id) => {
    const response = await api.delete(`/recurrTasks/recurring/${id}`);
    return response.data;
  },

  // استرجاع قالب من سلة المهملات
  restoreTemplate: async (id) => {
    const response = await api.post(`/recurrTasks/recurring/${id}/restore`);
    return response.data;
  },

  // جلب سجلات التنفيذ
  getLogs: async (params = {}) => {
    const response = await api.get('/recurrTasks/recurring/logs', { params });
    return response.data;
  },

  // التشغيل اليدوي للأتمتة (Trigger)
  triggerAutomation: async () => {
    const response = await api.post('/recurrTasks/recurring/trigger-automation');
    return response.data;
  },
};