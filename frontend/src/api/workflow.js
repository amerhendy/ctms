// src/api/workflow.js
import api from '@/api'

// ── Workflow Templates ────────────────────────────────────────────
export const workflowTemplatesApi = {
  // 📌 APIs الأساسية (الموجودة سابقاً)
  list: () => api.get('/workflow/templates'),
  create: (data) => api.post('/workflow/templates', data),
  update: (id, data) => api.patch(`/workflow/templates/${id}`, data),
  addStep: (id, data) => api.post(`/workflow/templates/${id}/steps`, data),

  // ════════════════════════════════════════════════════════════════
  // 🆕 المهمة 5.2: دوال الـ Diagram الخاصة بالقوالب (لـ ReactFlow)
  // ════════════════════════════════════════════════════════════════

  /**
   * جلب قالب Workflow بصيغة ReactFlow (Nodes + Edges)
   * @param {number|string} templateId - معرف القالب
   * @returns {Promise} - البيانات بصيغة { template_id, name, description, is_active, nodes, edges }
   */
  getDiagram: (templateId) => api.get(`/workflow/templates/${templateId}/diagram`),

  /**
   * تحديث قالب Workflow بالكامل بناءً على تعديلات المستخدم في ReactFlow
   * @param {number|string} templateId - معرف القالب
   * @param {Object} data - كائن يحتوي على { nodes, edges }
   * @returns {Promise} - البيانات المحدثة بصيغة { template_id, name, description, is_active, nodes, edges }
   */
  updateDiagram: (templateId, data) =>
    api.put(`/workflow/templates/${templateId}/diagram`, data),
}

// ── Task Workflow ─────────────────────────────────────────────────
export const workflowApi = {
  // 📌 APIs الأساسية (الموجودة سابقاً)
  getByTask: (taskId) => api.get(`/workflow/tasks/${taskId}`),
  create: (taskId, data) => api.post(`/workflow/tasks/${taskId}`, data),
  completeStep: (stepId, notes) =>
    api.post(`/workflow/steps/${stepId}/complete`, { notes }),
  updateStep: (stepId, data) => api.patch(`/workflow/steps/${stepId}`, data),
  deleteStep: (stepId) => api.delete(`/workflow/steps/${stepId}`),

  // ════════════════════════════════════════════════════════════════
  // 🆕 دوال الـ Diagram الخاصة بالمهام (تم إضافتها في المهمة 3.1)
  // ════════════════════════════════════════════════════════════════

  /**
   * جلب الـ Workflow الخاص بمهمة معينة بصيغة ReactFlow (Nodes + Edges)
   * @param {number|string} taskId - معرف المهمة
   * @returns {Promise} - البيانات بصيغة { workflow_id, task_id, workflow_status, nodes, edges }
   */
  getDiagram: (taskId) => api.get(`/workflow/${taskId}/diagram`),

  /**
   * تحديث الـ Workflow بالكامل بناءً على تعديلات المستخدم في ReactFlow
   * @param {number|string} taskId - معرف المهمة
   * @param {Object} data - كائن يحتوي على { nodes, edges }
   * @returns {Promise} - البيانات المحدثة بصيغة { workflow_id, task_id, workflow_status, nodes, edges }
   */
  updateDiagram: (taskId, data) => api.put(`/workflow/${taskId}/diagram`, data),
}