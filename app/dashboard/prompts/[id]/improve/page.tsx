'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import type { Prompt } from '@/types/database'
import StructuredPromptDisplay from '@/components/structured-prompt-display'

export default function ImprovePromptPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createSupabaseClient()
  
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [improving, setImproving] = useState(false)
  const [saving, setSaving] = useState(false)
  const [improvementRequest, setImprovementRequest] = useState('')
  const [targetModel, setTargetModel] = useState('gpt-4o')
  const [improvedPrompt, setImprovedPrompt] = useState<{
    title: string
    description: string
    prompt: any // Can be string (legacy) or structured object
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

  const handleImprove = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt || !improvementRequest.trim()) return

    setImproving(true)

    try {
      const response = await fetch('/api/improve-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: getPromptText(prompt),
          improvementRequest: improvementRequest.trim(),
          targetModel
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to improve prompt')
      }

      const data = await response.json()
      setImprovedPrompt(data)
    } catch (error) {
      console.error('Error improving prompt:', error)
      alert('Failed to improve prompt. Please try again.')
    } finally {
      setImproving(false)
    }
  }

  const handleSave = async () => {
    if (!improvedPrompt || !prompt) return

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Save as a new prompt with parent_id pointing to the original
      const { error } = await supabase
        .from('prompts')
        .insert({
          user_id: user.id,
          title: improvedPrompt.title,
          description: improvedPrompt.description,
          content: { prompt: improvedPrompt.prompt },
          parent_id: prompt.id // Link to original prompt for versioning
        })

      if (error) throw error

      alert('Improved prompt saved as new version!')
      router.push(`/dashboard/prompts/${prompt.id}`)
    } catch (error) {
      console.error('Error saving improved prompt:', error)
      alert('Failed to save improved prompt. Please try again.')
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
            <h1 className="text-3xl font-bold text-gray-900">Improve Prompt</h1>
            <p className="text-gray-600 mt-1">
              Enhance "{prompt.title}" with AI assistance
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
        </CardContent>
      </Card>

      {/* Improvement Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>Improve This Prompt</span>
          </CardTitle>
          <CardDescription>
            Tell AI how you want to improve your prompt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleImprove} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="improvementRequest">What would you like to improve or add?</Label>
              <p className="text-sm text-gray-600 mb-2">
                Describe improvements or new features you want to add to your prompt
              </p>
              <Textarea
                id="improvementRequest"
                value={improvementRequest}
                onChange={(e) => setImprovementRequest(e.target.value)}
                placeholder="e.g., Add examples and use cases, Make it more creative, Include step-by-step instructions, Add error handling, Make it work for multiple languages, Include formatting guidelines..."
                required
                disabled={improving}
                rows={4}
              />
            </div>
            
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

            <Button type="submit" disabled={improving || !improvementRequest.trim()}>
              {improving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Improving...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Improve Prompt
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Improved Prompt Result */}
      {improvedPrompt && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{improvedPrompt.title}</CardTitle>
                <CardDescription>{improvedPrompt.description}</CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Improved Version'
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="border border-green-200 rounded-lg">
              <div className="bg-green-50 p-3 border-b border-green-200 rounded-t-lg">
                <h4 className="font-medium text-green-800">✨ Improved Prompt</h4>
              </div>
              <StructuredPromptDisplay 
                prompt={improvedPrompt.prompt}
                editable={true}
                onUpdate={(updatedPrompt) => {
                  setImprovedPrompt(prev => prev ? {
                    ...prev,
                    prompt: updatedPrompt
                  } : null)
                }}
                className="border-0 rounded-t-none"
              />
            </div>
            
            <div className="mt-4 text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <strong>Optimization applied:</strong> {improvementRequest}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 