import { apiClient } from './axiosClient'

export const examApi = {
  login: (accessCode) => apiClient.post('/exam/login', { access_code: accessCode }),
  saveBatch: (answers) => apiClient.post('/exam/save-batch', { answers }),
  logViolation: (violationType, details) =>
    apiClient.post('/exam/log-violation', { violation_type: violationType, details }),
  finish: () => apiClient.post('/exam/finish'),
}
