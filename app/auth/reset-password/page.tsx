'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()

  useEffect(() => {
    // Handle the auth callback
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setError('Invalid or expired reset link. Please request a new password reset.')
        return
      }

      if (!data.session) {
        setError('Invalid or expired reset link. Please request a new password reset.')
        return
      }
    }

    handleAuthCallback()
  }, [supabase])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-white to-green-50 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              PromptCraft Studio
            </span>
          </div>
          
          {success ? (
            <>
              <CardTitle className="text-green-800">Password Reset Successful!</CardTitle>
              <CardDescription className="text-green-600">
                Your password has been updated successfully
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-green-900">Set New Password</CardTitle>
              <CardDescription className="text-green-700">
                Enter your new password below
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent>
          {success ? (
            /* Success State */
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <p className="text-sm text-green-700 mb-4">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>
                <p className="text-xs text-green-600">
                  Redirecting to login page in 3 seconds...
                </p>
              </div>
              
              <Link href="/auth/login">
                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                  Go to Login Page
                </Button>
              </Link>
            </div>
          ) : (
            /* Reset Password Form */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-green-800">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    disabled={loading}
                    className="border-green-200 focus:border-green-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-800"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-green-800">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={loading}
                    className="border-green-200 focus:border-green-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 hover:text-green-800"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="text-xs text-green-600 bg-green-50 p-3 rounded border border-green-200">
                <p className="font-medium mb-1">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li className={password.length >= 6 ? 'text-green-700' : 'text-gray-500'}>
                    At least 6 characters long
                  </li>
                  <li className={password === confirmPassword && password.length > 0 ? 'text-green-700' : 'text-gray-500'}>
                    Passwords match
                  </li>
                </ul>
              </div>
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                  {error}
                </div>
              )}
              
              <div className="flex gap-2">
                <Link href="/auth/login" className="flex-1">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full"
                    disabled={loading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Login
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  disabled={loading || !password.trim() || !confirmPassword.trim()}
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 