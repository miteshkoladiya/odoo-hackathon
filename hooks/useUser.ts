import { useState, useEffect } from "react"

export type User = {
    id: string
    email: string
    firstName: string
    lastName: string
    role: "admin" | "hr" | "employee"
    employeeId: string
}

export function useUser() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check local storage for user data
        const storedUser = localStorage.getItem("dayflow_user")
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch (e) {
                console.error("Failed to parse user data", e)
                localStorage.removeItem("dayflow_user")
            }
        }
        setLoading(false)
    }, [])

    const login = (userData: User) => {
        localStorage.setItem("dayflow_user", JSON.stringify(userData))
        setUser(userData)
    }

    const logout = () => {
        localStorage.removeItem("dayflow_user")
        setUser(null)
        window.location.href = "/"
    }

    return { user, loading, login, logout }
}
