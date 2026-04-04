import api from './client.js'

export function getCredits() {
  return api.get('/credits').then(r => r.data)
}
