import api from './client.js'

export const applicationsApi = {
  getAll: (params) => api.get('/applications', { params }),
  getById: (id) => api.get(`/applications/${id}`),
  create: (data) => api.post('/applications', data),
  update: (id, data) => api.put(`/applications/${id}`, data),
  // Backend PATCH /status expects { status, note }
  updateStatus: (id, status, note) =>
    api.patch(`/applications/${id}/status`, { status, note }),
  remove: (id) => api.delete(`/applications/${id}`),
}
