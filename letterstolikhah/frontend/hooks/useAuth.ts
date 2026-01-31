'use client'

import { useState, useCallback } from 'react'
import { authApi } from '@/lib/api'

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  const checkAuth = useCallback(() => {
    const authenticated = authApi.isAuthenticated()
    setIsAuthenticated(authenticated)
    return authenticated
  }, [])

  const login = useCallback(async (password: string) => {
    await authApi.login(password)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    authApi.logout()
    setIsAuthenticated(false)
  }, [])

  return {
    isAuthenticated,
    login,
    logout,
    checkAuth,
  }
}
