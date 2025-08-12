'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sparkles } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a confirmation link!')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-white to-purple-50 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              PromptCraft Studio
            </span>
          </div>
          <CardTitle className="text-purple-900">Create an account</CardTitle>
          <CardDescription className="text-purple-700">Sign up to start crafting amazing prompts</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-purple-800">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-purple-800">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-purple-800">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="border-purple-200 focus:border-purple-400"
              />
            </div>
            
            {/* Password Requirements */}
            <div className="text-xs text-purple-600 bg-purple-50 p-3 rounded border border-purple-200">
              <p className="font-medium mb-1">Password requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li className={password.length >= 6 ? 'text-purple-700' : 'text-gray-500'}>
                  At least 6 characters long
                </li>
                <li className={password === confirmPassword && password.length > 0 ? 'text-purple-700' : 'text-gray-500'}>
                  Passwords match
                </li>
              </ul>
            </div>
            
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
                {error}
              </div>
            )}
            {message && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded border border-green-200">
                {message}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300" 
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-purple-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-purple-700 hover:text-purple-900 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 