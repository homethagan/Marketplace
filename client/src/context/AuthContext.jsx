import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { jwtDecode } from 'jwt-decode'

const AuthContext = createContext(null)
const TOKEN_KEY = 'agent_marketplace_token'

const decodeUserFromToken = (token) => {
  try {
    const decoded = jwtDecode(token)
    if (!decoded?.id || !decoded?.email) {
      return null
    }
    return { id: decoded.id, email: decoded.email }
  } catch {
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    if (!savedToken) return

    const decodedUser = decodeUserFromToken(savedToken)
    if (!decodedUser) {
      localStorage.removeItem(TOKEN_KEY)
      return
    }

    setToken(savedToken)
    setUser(decodedUser)
  }, [])

  const login = (nextToken) => {
    const decodedUser = decodeUserFromToken(nextToken)
    if (!decodedUser) {
      throw new Error('Invalid token')
    }

    localStorage.setItem(TOKEN_KEY, nextToken)
    setToken(nextToken)
    setUser(decodedUser)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, token, login, logout }),
    [user, token]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
