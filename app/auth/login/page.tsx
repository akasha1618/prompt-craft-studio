'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles, ArrowLeft, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setResetEmailSent(true)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setShowForgotPassword(false)
    setResetEmailSent(false)
    setError('')
    setResetEmail('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              PromptCraft Studio
            </span>
          </div>
          
          {resetEmailSent ? (
            <>
              <CardTitle className="text-green-800">Check Your Email</CardTitle>
              <CardDescription className="text-green-600">
                We've sent a password reset link to {resetEmail}
              </CardDescription>
            </>
          ) : showForgotPassword ? (
            <>
              <CardTitle className="text-indigo-900">Reset Your Password</CardTitle>
              <CardDescription className="text-indigo-700">
                Enter your email address and we'll send you a reset link
              </CardDescription>
            </>
          ) : (
            <>
              <CardTitle className="text-indigo-900">Welcome back</CardTitle>
              <CardDescription className="text-indigo-700">
                Sign in to your account to continue
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent>
          {resetEmailSent ? (
            /* Success State */
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <Mail className="h-16 w-16 mx-auto mb-4 text-green-500" />
                <p className="text-sm text-green-700 mb-4">
                  Password reset instructions have been sent to your email address. 
                  Please check your inbox and follow the link to reset your password.
                </p>
                <p className="text-xs text-green-600">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={resetForm}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  onClick={() => setResetEmailSent(false)}
                  disabled={loading}
                >
                  Send Again
                </Button>
              </div>
            </div>
          ) : showForgotPassword ? (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail" className="text-indigo-800">Email Address</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={loading}
                  className="border-indigo-200 focus:border-indigo-400"
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                  {error}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  className="flex-1"
                  onClick={resetForm}
                  disabled={loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                  disabled={loading || !resetEmail.trim()}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </div>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-indigo-800">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="border-indigo-200 focus:border-indigo-400"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-indigo-800">Password</Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-indigo-200 focus:border-indigo-400"
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                  {error}
                  {error.includes('Invalid login credentials') && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline text-sm"
                      >
                        Forgot your password? Reset it here →
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          )}
          
          {!resetEmailSent && (
            <div className="mt-6 text-center">
              <p className="text-sm text-indigo-600">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-indigo-700 hover:text-indigo-900 font-medium hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 