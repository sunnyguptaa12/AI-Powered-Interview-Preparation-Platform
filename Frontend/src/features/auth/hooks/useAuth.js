import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";

export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    // handleLogin - loading state touch nahi karta (caller manage karega)
    const handleLogin = async ({ email, password }) => {
        try {
            const data = await login({ email, password })
            setUser(data.user)
        } catch (err) {
            console.log("Login error:", err)
            throw err
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        try {
            const data = await register({ username, email, password })
            setUser(data.user)
        } catch (err) {
            console.log("Register error:", err)
            throw err
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
        } catch (err) {
            console.log("Logout error:", err)
        } finally {
            setLoading(false)
        }
    }

    // Sirf initial app load pe getMe check karta hai (loading: true → false)
    useEffect(() => {
        const getAndSetUser = async () => {
            try {
                const data = await getMe()
                setUser(data.user)
            } catch (err) {
                // Normal - user logged in nahi hai
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        getAndSetUser()
    }, [])

    return { user, loading, handleRegister, handleLogin, handleLogout }
}
