'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import AdminDashboard from '@/components/AdminDashboard'
import LoadingSpinner from '@/components/LoadingSpinner'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { isAuthenticated, login, checkAuth } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Check if already authenticated
    checkAuth()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(password)
    } catch (err) {
      setError('Invalid password')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-secondary rounded-lg p-8 border border-border">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-accent p-3 rounded-full">
                <Lock className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-white mb-2">
              Admin Access
            </h1>
            <p className="text-muted-foreground text-center text-sm mb-6">
              Enter password to access the admin panel
            </p>

            <form onSubmit={handleLogin}>
              <div className="relative mb-4">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-black border border-border rounded-lg px-4 py-3 pr-12 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/20"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <p className="text-destructive text-sm mb-4">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full bg-white text-black font-medium py-3 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Show admin dashboard if authenticated
  return <AdminDashboard />
}
