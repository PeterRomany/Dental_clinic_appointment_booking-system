import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginRequest } from '../api/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [role, setRole] = useState(() => localStorage.getItem('role'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      const storedRole = localStorage.getItem('role')
      if (!storedRole) {
        logout()
      } else {
        setRole(storedRole)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password) => {
    const data = await loginRequest(username, password)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('role', data.role)
    setToken(data.access_token)
    setRole(data.role)
    return data.role
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    setToken(null)
    setRole(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      token,
      role,
      isAuthenticated: !!token,
      login,
      logout,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
