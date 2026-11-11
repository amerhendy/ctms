import { apiClient } from './axiosClient'

export const authApi = {
  login: (username, password) => apiClient.post('/auth/login', { username, password }),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
}