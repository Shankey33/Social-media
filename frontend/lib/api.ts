import axios from 'axios'
import { env } from './env.js'

const api = axios.create({
  baseURL: env.API_URL,
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only remove token on 401 Unauthorized
      // Don't redirect here - let components handle navigation
      // This prevents issues with React Router and state management
      localStorage.removeItem('token')
    }
    return Promise.reject(error)
  }
)

export default api
