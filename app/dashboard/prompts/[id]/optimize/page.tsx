'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import type { Prompt } from '@/types/database'
import StructuredPromptDisplay from '@/components/structured-prompt-display'

export default function OptimizePromptPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createSupabaseClient()
  
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [targetModel, setTargetModel] = useState('gpt-4o')
  const [optimizedPrompt, setOptimizedPrompt] = useState<{
    title: string
    description: string
    prompt: any // Can be string (legacy) or structured object
    improvements?: string[]
  } | null>(null)

  const models = [
    // Top OpenAI Models (2025)
    { value: 'gpt-5', label: 'GPT-5 (OpenAI) - Latest' },
    { value: 'gpt-4.1', label: 'GPT-4.1 (OpenAI) - Enhanced' },
    { value: 'gpt-4.5', label: 'GPT-4.5 (OpenAI) - Most Powerful' },
    { value: 'gpt-4o', label: 'GPT-4o (OpenAI) - Fast & Efficient' },
    { value: 'o1', label: 'o1 (OpenAI) - Reasoning Model' },
    { value: 'gpt-4', label: 'GPT-4 (OpenAI) - Classic' },
    
    // Top Anthropic Models (2025)
    { value: 'claude-sonnet-4', label: 'Claude Sonnet 4 (Anthropic) - Latest 2025' },
    { value: 'claude-3.7-sonnet', label: 'Claude 3.7 Sonnet (Anthropic) - Hybrid Reasoning' },
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Anthropic) - Balanced' },
    { value: 'claude-opus-4', label: 'Claude Opus 4 (Anthropic) - Most Capable' },
    { value: 'claude-3.5-haiku', label: 'Claude 3.5 Haiku (Anthropic) - Fast' },
  ]

  // Load prompt data
  useEffect(() => {
    async function loadPrompt() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data, error } = await supabase
          .from('prompts')
          .select('*')
          .eq('id', params.id)
          .eq('user_id', user.id)
          .single()

        if (error || !data) {
          router.push('/dashboard/prompts')
          return
        }

        setPrompt(data)
      } catch (error) {
        console.error('Error loading prompt:', error)
        router.push('/dashboard/prompts')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      loadPrompt()
    }
  }, [params.id, router, supabase])

  const getPromptText = (prompt: Prompt): string => {
    return typeof prompt.content === 'object' && prompt.content && 'prompt' in prompt.content 
      ? (prompt.content as any).prompt 
      : 'Legacy prompt format'
  }

  const handleOptimize = async () => {
    if (!prompt) return

    setOptimizing(true)

    try {
      const response = await fetch('/api/optimize-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: getPromptText(prompt),
          targetModel
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to optimize prompt')
      }

      const data = await response.json()
      setOptimizedPrompt(data)
    } catch (error) {
      console.error('Error optimizing prompt:', error)
      alert('Failed to optimize prompt. Please try again.')
    } finally {
      setOptimizing(false)
    }
  }

  const handleSave = async () => {
    if (!optimizedPrompt || !prompt) return

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Save as a new prompt with parent_id pointing to the original
      const { error } = await supabase
        .from('prompts')
        .insert({
          user_id: user.id,
          title: optimizedPrompt.title,
          description: optimizedPrompt.description,
          content: { prompt: optimizedPrompt.prompt },
          parent_id: prompt.id // Link to original prompt for versioning
        })

      if (error) throw error

      alert('Optimized prompt saved as new version!')
      router.push(`/dashboard/prompts/${prompt.id}`)
    } catch (error) {
      console.error('Error saving optimized prompt:', error)
      alert('Failed to save optimized prompt. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!prompt) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900">Prompt not found</h1>
        <Link href="/dashboard/prompts">
          <Button className="mt-4">Back to My Prompts</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/prompts/${prompt.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Prompt
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Optimize Prompt</h1>
            <p className="text-gray-600 mt-1">
              Automatically enhance "{prompt.title}" for better performance
            </p>
          </div>
        </div>
      </div>

      {/* Original Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>Original Prompt</CardTitle>
          <CardDescription>{prompt.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded border">
            <pre className="whitespace-pre-wrap text-sm text-gray-800">
              {getPromptText(prompt)}
            </pre>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            Character count: {getPromptText(prompt).length}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>Automatic Optimization</span>
          </CardTitle>
          <CardDescription>
            AI will analyze and optimize your prompt for maximum performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetModel">Target AI Model</Label>
            <Select value={targetModel} onValueChange={setTargetModel}>
              <SelectTrigger>
                <SelectValue placeholder="Select target model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Optimization will include:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Enhanced clarity and specificity</li>
              <li>• Improved instruction structure</li>
              <li>• Better context and constraints</li>
              <li>• Optimized formatting for {models.find(m => m.value === targetModel)?.label}</li>
              <li>• Removal of ambiguity and redundancy</li>
            </ul>
          </div>

          <Button onClick={handleOptimize} disabled={optimizing} className="w-full">
            {optimizing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Optimize Prompt
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Optimized Prompt Result */}
      {optimizedPrompt && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-yellow-600" />
                  <span>{optimizedPrompt.title}</span>
                </CardTitle>
                <CardDescription>{optimizedPrompt.description}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Optimized Version'
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="p-3 border-b border-yellow-200">
                <h4 className="font-medium text-yellow-800">⚡ Optimized Prompt</h4>
              </div>
              <StructuredPromptDisplay 
                prompt={optimizedPrompt.prompt}
                editable={true}
                onUpdate={(updatedPrompt: any) => {
                  setOptimizedPrompt(prev => prev ? {
                    ...prev,
                    prompt: updatedPrompt
                  } : null)
                }}
                className="border-0 rounded-t-none"
              />
              <div className="p-3 bg-yellow-50 text-sm text-yellow-700 border-t border-yellow-200">
                {(() => {
                  const optimizedLength = typeof optimizedPrompt.prompt === 'string' 
                    ? optimizedPrompt.prompt.length 
                    : JSON.stringify(optimizedPrompt.prompt).length
                  const originalLength = getPromptText(prompt).length
                  return (
                    <>
                      Character count: {optimizedLength}
                      {optimizedLength < originalLength && (
                        <span className="ml-2 text-green-600">
                          ({originalLength - optimizedLength} chars shorter)
                        </span>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
            
            {/* Improvements List */}
            {optimizedPrompt.improvements && optimizedPrompt.improvements.length > 0 && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Optimizations Applied
                </h4>
                <ul className="space-y-2">
                  {optimizedPrompt.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm text-green-700 flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Performance Comparison */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">Before</div>
                <div className="text-sm text-gray-600">{getPromptText(prompt).length} characters</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">After</div>
                <div className="text-sm text-green-600">
                  {typeof optimizedPrompt.prompt === 'string' 
                    ? optimizedPrompt.prompt.length 
                    : JSON.stringify(optimizedPrompt.prompt).length} characters
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 