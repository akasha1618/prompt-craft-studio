'use client'

import React, { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2 } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Auth callback error:', error)
        router.push('/auth/login?error=callback_error')
        return
      }

      if (data.session) {
        // User is authenticated
        const type = searchParams.get('type')
        
        if (type === 'recovery') {
          // Password reset flow
          router.push('/auth/reset-password')
        } else {
          // Email confirmation or regular login
          router.push('/dashboard')
        }
      } else {
        // No session, redirect to login
        router.push('/auth/login')
      }
    }

    handleAuthCallback()
  }, [router, searchParams, supabase])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-lg">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              PromptCraft Studio
            </span>
          </div>
          <CardTitle className="text-blue-900">Verifying...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-spin" />
            <p className="text-blue-700 mb-2">Processing your authentication</p>
            <p className="text-sm text-blue-600">Please wait while we verify your credentials...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 