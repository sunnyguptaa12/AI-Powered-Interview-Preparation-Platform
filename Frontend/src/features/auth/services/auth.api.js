import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://ai-powered-interview-preparation-platform-so7d.onrender.com/api",
    withCredentials: true
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export async function register({ username, email, password }) {
    const response = await api.post('/auth/register', { username, email, password })
    if (response.data.token) localStorage.setItem('token', response.data.token)
    return response.data
}

export async function login({ email, password }) {
    const response = await api.post("/auth/login", { email, password })
    if (response.data.token) localStorage.setItem('token', response.data.token)
    return response.data
}

export async function logout() {
    try {
        await api.get("/auth/logout")
    } finally {
        localStorage.removeItem('token')
    }
}

export async function getMe() {
    const response = await api.get("/auth/get-me")
    return response.data
}

export async function forgotPassword({ email }) {
    const response = await api.post("/auth/forgot-password", { email })
    return response.data
}

export async function resetPassword({ email, otp, newPassword }) {
    const response = await api.post("/auth/reset-password", { email, otp, newPassword })
    return response.data
}
