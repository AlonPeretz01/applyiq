import axios from 'axios'
import { supabase } from '../lib/supabase.js'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor � attach Supabase JWT before every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = 'Bearer ' + session.access_token
  }
  return config
})

// Response interceptor � unwrap data
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const data = error.response?.data
    // Use the human-readable message from the server first, then the short error string
    const message = data?.message || data?.error || error.message || 'Unknown error'
    const enriched = new Error(message)
    enriched.status = error.response?.status
    return Promise.reject(enriched)
  }
)

export default api
