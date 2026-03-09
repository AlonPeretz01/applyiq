import api from './client.js'

export const coverLettersApi = {
  getAll: (params) => api.get('/cover-letters', { params }),
  getById: (id) => api.get(`/cover-letters/${id}`),
  create: (data) => api.post('/cover-letters', data),
  update: (id, data) => api.put(`/cover-letters/${id}`, data),
  remove: (id) => api.delete(`/cover-letters/${id}`),
}
