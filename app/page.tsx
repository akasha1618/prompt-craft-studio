import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import LandingPage from '@/components/landing-page'
import React from 'react'

export default async function Home() {
  const supabase = createSupabaseServerClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return <LandingPage />
} 