import axios from 'axios'
import { supabase } from '../lib/supabase.js'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach Supabase JWT before every request
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = 'Bearer ' + session.access_token
  }
  return config
})

// Response interceptor — unwrap data
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error?.message || error.message || 'Unknown error'
    return Promise.reject(new Error(message))
  }
)

export default api
