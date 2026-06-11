import api from './axios';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updatePreferences: (data) => api.put('/auth/preferences', data),
  requestAuthorRole: (message) => api.post('/auth/role-request', { message }),
  myRoleRequest: () => api.get('/auth/role-request/me'),
};