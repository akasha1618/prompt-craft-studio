'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Zap, Target, Users } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-8 w-8 text-indigo-600" />
            <span className="text-2xl font-bold text-gray-900">PromptCraft Studio</span>
          </div>
          <div className="space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Create, Improve & Test
            <span className="text-indigo-600"> AI Prompts</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            The ultimate platform for crafting perfect AI prompts. Generate, optimize, and test prompts across multiple AI models with ease.
          </p>
          <div className="space-x-4">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8 py-3">
                Get Started Free
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card>
            <CardHeader className="text-center">
              <Sparkles className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
              <CardTitle>AI-Powered Generation</CardTitle>
              <CardDescription>
                Generate structured prompts using advanced AI that understands your needs
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="text-center">
              <Zap className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <CardTitle>Intelligent Optimization</CardTitle>
              <CardDescription>
                Automatically optimize your prompts for better performance and clarity
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="text-center">
              <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Multi-Model Testing</CardTitle>
              <CardDescription>
                Test your prompts across different AI models and compare results
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card>
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Version Management</CardTitle>
              <CardDescription>
                Keep track of all prompt versions and improvements over time
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to craft better prompts?
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands of developers and creators who trust PromptCraft Studio for their AI prompt needs.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="px-12 py-3">
              Start Creating Now
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
} 