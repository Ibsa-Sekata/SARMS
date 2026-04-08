import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Response interceptor to handle errors
api.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        // Do not redirect on 401 from login — wrong password also returns 401;
        // redirecting would full-reload the page and hide the error toast.
        const reqUrl = String(error.config?.url ?? '')
        const isLoginRequest = reqUrl.includes('/auth/login')
        if (error.response?.status === 401 && !isLoginRequest) {
            localStorage.removeItem('token')
            delete api.defaults.headers.common['Authorization']
            window.location.href = '/login/teacher'
        }
        return Promise.reject(error)
    }
)

export default api
