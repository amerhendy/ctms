import { apiClient } from './axiosClient'

export const jobModelsApi = {
  list: () => apiClient.get('/job-models'),
  create: (payload) => apiClient.post('/job-models', payload),
  update: (id, payload) => apiClient.put(`/job-models/${id}`, payload),
  remove: (id) => apiClient.delete(`/job-models/${id}`),
}

export const applicantsApi = {
  list: (jobModelId) =>
    apiClient.get('/applicants', { params: jobModelId ? { job_model_id: jobModelId } : {} }),
  create: (payload) => apiClient.post('/applicants', payload),
  update: (id, payload) => apiClient.put(`/applicants/${id}`, payload),
  remove: (id) => apiClient.delete(`/applicants/${id}`),
  getResult: (id) => apiClient.get(`/applicants/${id}/result`),
  downloadPdf: (id) => apiClient.get(`/applicants/${id}/pdf`),
  resetCode:(id) => apiClient.get(`/applicants/${id}/reset`),
  resetExam:(id) => apiClient.get(`/applicants/${id}/reset-exam`),
}

export const questionsApi = {
  list: (jobModelId) => apiClient.get('/questions', { params: { job_model_id: jobModelId } }),
  
  create: (payload) => apiClient.post('/questions', payload, {
    headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  }),
  
  update: (id, payload) => apiClient.put(`/questions/${id}`, payload, {
    headers: payload instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
  }),

  remove: (id) => apiClient.delete(`/questions/${id}`),
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post('/questions/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}