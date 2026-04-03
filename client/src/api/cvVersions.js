import api from './client.js'

export const cvVersionsApi = {
  getAll: () => api.get('/cv-versions'),
  getById: (id) => api.get(`/cv-versions/${id}`),
  // data can be a plain object OR FormData (when a file is attached)
  create: (data) => api.post('/cv-versions', data),
  update: (id, data) => api.put(`/cv-versions/${id}`, data),
  remove: (id) => api.delete(`/cv-versions/${id}`),
}
