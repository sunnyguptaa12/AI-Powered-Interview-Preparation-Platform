import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "https://ai-powered-interview-preparation-platform-so7d.onrender.com/api",
    withCredentials: true
})

// Add token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export async function register({ username, email, password }) {
    try {
        const response = await api.post('/auth/register', {
            username, email, password
        })
        // Save token after register
        if (response.data.token) {
            localStorage.setItem('token', response.data.token)
        }
        return response.data
    } catch (err) {
        console.log(err)
        throw err
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post("/auth/login", {
            email, password
        })
        // Save token after login
        if (response.data.token) {
            localStorage.setItem('token', response.data.token)
        }
        return response.data
    } catch (err) {
        console.log(err)
        throw err
    }
}

export async function logout() {
    try {
        const response = await api.get("/auth/logout")
        localStorage.removeItem('token')
        return response.data
    } catch (err) {
        localStorage.removeItem('token')
    }
}

export async function getMe() {
    try {
        const response = await api.get("/auth/get-me")
        return response.data
    } catch (err) {
        console.log(err)
        throw err
    }
}