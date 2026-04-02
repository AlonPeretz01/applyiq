import api from './client.js'

export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
}
