'use client'

import React, { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sparkles, Zap, Loader2, Save, CheckCircle, GitBranch, FileText } from 'lucide-react'
import type { Prompt } from '@/types/database'
import StructuredPromptDisplay from '@/components/structured-prompt-display'

export default function EnhancePromptPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [chainedPrompts, setChainedPrompts] = useState<any[]>([])
  const [enhanceMode, setEnhanceMode] = useState<'simple' | 'chained'>('simple')
  
  // Simple prompt enhancement
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [enhanceType, setEnhanceType] = useState<'improve' | 'optimize'>('improve')
  const [improvementRequest, setImprovementRequest] = useState('')
  const [targetModel, setTargetModel] = useState('gpt-4o')
  const [loading, setLoading] = useState(true)
  const [enhancing, setEnhancing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState<{
    title: string
    description: string
    prompt: any // Can be string (legacy) or structured object
    improvements?: string[]
  } | null>(null)

  // Chained prompt enhancement
  const [selectedChain, setSelectedChain] = useState<any>(null)
  const [enhancingChain, setEnhancingChain] = useState(false)
  const [enhancedChain, setEnhancedChain] = useState<any>(null)

  const supabase = createSupabaseClient()

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

  // Get API keys from database/localStorage
  const getApiKeys = async () => {
    try {
      // Try database first
      const response = await fetch('/api/user-settings')
      if (response.ok) {
        const settings = await response.json()
        return {
          openaiApiKey: settings.openai_api_key || '',
          anthropicApiKey: settings.anthropic_api_key || ''
        }
      }
    } catch (error) {
      console.error('Error reading API keys from database:', error)
    }
    
    // Fallback to localStorage
    try {
      const settings = localStorage.getItem('promptcraft_settings')
      if (settings) {
        const parsed = JSON.parse(settings)
        return {
          openaiApiKey: parsed.openaiKey || '',
          anthropicApiKey: parsed.anthropicKey || ''
        }
      }
    } catch (error) {
      console.error('Error reading API keys from localStorage:', error)
    }
    
    return { openaiApiKey: '', anthropicApiKey: '' }
  }

  // Load user's prompts
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Load all prompts
        const { data: allPrompts, error } = await supabase
          .from('prompts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading prompts:', error)
          return
        }

        console.log('All prompts loaded:', allPrompts)

        // Separate regular prompts and chained prompts
        const regularPrompts: Prompt[] = []
        const chainedPrompts: any[] = []

        allPrompts?.forEach((prompt: any) => {
          try {
            if (prompt.content && typeof prompt.content === 'object' && prompt.content.type === 'chain') {
              chainedPrompts.push(prompt)
            } else {
              regularPrompts.push(prompt)
            }
          } catch (error) {
            console.error('Error processing prompt:', prompt.id, error)
            // Default to regular prompt if there's any issue
            regularPrompts.push(prompt)
          }
        })

        console.log('Regular prompts:', regularPrompts.length)
        console.log('Chained prompts:', chainedPrompts.length)

        setPrompts(regularPrompts)
        setChainedPrompts(chainedPrompts)
      } catch (error) {
        console.error('Error loading prompts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPrompts()
  }, [supabase])

  // Clear states when switching enhancement modes
  useEffect(() => {
    if (enhanceMode === 'simple') {
      setSelectedChain(null)
      setEnhancedChain(null)
    } else if (enhanceMode === 'chained') {
      setSelectedPrompt(null)
      setCustomPrompt('')
      setEnhancedPrompt(null)
    }
    // Clear improvement request when switching modes
    setImprovementRequest('')
  }, [enhanceMode])

  // Clear improvement request when switching from improve to optimize
  useEffect(() => {
    if (enhanceType === 'optimize') {
      setImprovementRequest('')
    }
  }, [enhanceType])

  const getPromptText = (prompt: Prompt): string => {
    if (typeof prompt.content === 'object' && prompt.content && 'prompt' in prompt.content) {
      const promptContent = (prompt.content as any).prompt
      // Handle structured prompts by converting to string
      if (typeof promptContent === 'object') {
        return JSON.stringify(promptContent)
      }
      // Handle string prompts
      return promptContent
    }
    return 'Legacy prompt format'
  }

  const handleEnhance = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (enhanceMode === 'simple') {
      const promptToEnhance = selectedPrompt ? getPromptText(selectedPrompt) : customPrompt
      if (!promptToEnhance.trim()) {
        alert('Please select a prompt or enter a custom prompt')
        return
      }

      if (enhanceType === 'improve' && !improvementRequest.trim()) {
        alert('Please describe what you want to improve')
        return
      }

      setEnhancing(true)
      setEnhancedPrompt(null)

      try {
        const { openaiApiKey, anthropicApiKey } = await getApiKeys()
        const endpoint = enhanceType === 'improve' ? '/api/improve-prompt' : '/api/optimize-prompt'
        const body = enhanceType === 'improve' 
          ? { 
              prompt: promptToEnhance, 
              improvementRequest, 
              targetModel,
              openaiApiKey, // Send OpenAI API key from database
              anthropicApiKey // Send Anthropic API key from database
            }
          : { 
              prompt: promptToEnhance, 
              targetModel,
              openaiApiKey, // Send OpenAI API key from database
              anthropicApiKey // Send Anthropic API key from database
            }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          throw new Error(`Failed to ${enhanceType} prompt`)
        }

        const data = await response.json()
        setEnhancedPrompt(data)
      } catch (error) {
        console.error(`Error ${enhanceType}ing prompt:`, error)
        alert(`Failed to ${enhanceType} prompt. Please try again.`)
      } finally {
        setEnhancing(false)
      }
    } else if (enhanceMode === 'chained') {
      if (!selectedChain) {
        alert('Please select a chained prompt to enhance')
        return
      }

      if (enhanceType === 'improve' && !improvementRequest.trim()) {
        alert('Please describe what you want to improve in the chained prompt')
        return
      }

      setEnhancingChain(true)
      setEnhancedChain(null)

      try {
        const { openaiApiKey, anthropicApiKey } = await getApiKeys()
        
        // Use the appropriate endpoint based on enhancement type
        const endpoint = enhanceType === 'improve' ? '/api/improve-prompt' : '/api/optimize-prompt'
        const body = enhanceType === 'improve' 
          ? {
              prompt: JSON.stringify(selectedChain.content.chain),
              improvementRequest,
              targetModel,
              openaiApiKey,
              anthropicApiKey,
              isChain: true
            }
          : {
              prompt: JSON.stringify(selectedChain.content.chain),
              targetModel,
              openaiApiKey,
              anthropicApiKey,
              isChain: true
            }
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        if (!response.ok) {
          throw new Error(`Failed to ${enhanceType} chained prompt`)
        }

        const data = await response.json()
        setEnhancedChain({
          title: `${enhanceType === 'improve' ? 'Improved' : 'Optimized'} ${selectedChain.title}`,
          description: `${enhanceType === 'improve' ? 'Improved' : 'Optimized'} version of ${selectedChain.title}`,
          prompt: data.prompt,
          chain: data.chain || selectedChain.content.chain
        })
      } catch (error) {
        console.error(`Error ${enhanceType}ing chained prompt:`, error)
        alert(`Failed to ${enhanceType} chained prompt. Please try again.`)
      } finally {
        setEnhancingChain(false)
      }
    }
  }

  const handleSaveAsNew = async () => {
    if (!enhancedPrompt && !enhancedChain) return

    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (enhanceMode === 'simple' && enhancedPrompt) {
        // Save enhanced simple prompt
        const insertData: any = {
          user_id: user.id,
          title: enhancedPrompt.title,
          description: enhancedPrompt.description,
          content: { prompt: enhancedPrompt.prompt }
        }

        // If we enhanced an existing prompt (not custom), set parent_id for versioning
        if (selectedPrompt) {
          insertData.parent_id = selectedPrompt.id
        }

        const { error } = await supabase
          .from('prompts')
          .insert(insertData)

        if (error) throw error
        
        if (selectedPrompt) {
          alert('Enhanced prompt saved as new version!')
        } else {
          alert('Enhanced prompt saved successfully!')
        }
      } else if (enhanceMode === 'chained' && enhancedChain) {
        // Save enhanced chained prompt
        const insertData: any = {
          user_id: user.id,
          title: enhancedChain.title,
          description: enhancedChain.description,
          content: {
            type: 'chain',
            chain: enhancedChain.chain,
            targetModel
          }
        }

        // If we enhanced an existing chained prompt, set parent_id for versioning
        if (selectedChain) {
          insertData.parent_id = selectedChain.id
        }

        const { error } = await supabase
          .from('prompts')
          .insert(insertData)

        if (error) throw error
        
        if (selectedChain) {
          alert('Enhanced chained prompt saved as new version!')
        } else {
          alert('Enhanced chained prompt saved successfully!')
        }
      }
      
      // Reset form
      setEnhancedPrompt(null)
      setEnhancedChain(null)
      setSelectedPrompt(null)
      setSelectedChain(null)
      setCustomPrompt('')
      setImprovementRequest('')
      setEnhanceType('improve')
    } catch (error) {
      console.error('Error saving enhanced prompt:', error)
      alert('Failed to save enhanced prompt. Please try again.')
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Improve & Optimize Prompts</h1>
        <p className="text-gray-600 mt-2">
          Enhance your prompts with AI-powered improvements and optimizations
        </p>
      </div>

      {/* Mode Selection */}
      <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-orange-800">Enhancement Mode:</span>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setEnhanceMode('simple')
                  setSelectedChain(null)
                  setEnhancedChain(null)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg ${
                  enhanceMode === 'simple' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white border border-orange-400' 
                    : 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 hover:from-orange-200 hover:to-red-200 border border-orange-200'
                }`}
              >
                <Sparkles className="h-4 w-4 mr-2 inline" />
                Simple Prompts
              </button>
              <button
                onClick={() => {
                  setEnhanceMode('chained')
                  setSelectedPrompt(null)
                  setCustomPrompt('')
                  setEnhancedPrompt(null)
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg ${
                  enhanceMode === 'chained' 
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white border border-orange-400' 
                    : 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 hover:from-orange-200 hover:to-red-200 border border-orange-200'
                }`}
              >
                <GitBranch className="h-4 w-4 mr-2 inline" />
                Chained Prompts
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Simple Prompt Enhancement */}
      {enhanceMode === 'simple' && (
        <>
          {/* Enhancement Type Selection */}
          <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-900">
                <div className="p-1 bg-gradient-to-br from-orange-500 to-red-600 rounded">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span>Choose Enhancement Type</span>
              </CardTitle>
              <CardDescription className="text-orange-700">
                Select how you want to enhance your prompt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setEnhanceType('improve')}
                  className={`cursor-pointer rounded-lg p-4 border-2 transition-all shadow-md hover:shadow-lg ${
                    enhanceType === 'improve' 
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg' 
                      : 'border-orange-200 hover:border-orange-300 bg-gradient-to-br from-orange-25 to-red-25 hover:from-orange-50 hover:to-red-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`p-1 rounded ${enhanceType === 'improve' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-orange-400 to-red-500'}`}>
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className={`font-medium ${enhanceType === 'improve' ? 'text-indigo-900' : 'text-orange-800'}`}>Improve Prompt</span>
                  </div>
                  <p className={`text-sm ${enhanceType === 'improve' ? 'text-indigo-700' : 'text-orange-600'}`}>
                    Enhance your prompt or add new capabilities with AI guidance
                  </p>
                </div>
                
                <div
                  onClick={() => setEnhanceType('optimize')}
                  className={`cursor-pointer rounded-lg p-4 border-2 transition-all shadow-md hover:shadow-lg ${
                    enhanceType === 'optimize' 
                      ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg' 
                      : 'border-orange-200 hover:border-orange-300 bg-gradient-to-br from-orange-25 to-red-25 hover:from-orange-50 hover:to-red-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`p-1 rounded ${enhanceType === 'optimize' ? 'bg-gradient-to-br from-amber-500 to-yellow-600' : 'bg-gradient-to-br from-orange-400 to-red-500'}`}>
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span className={`font-medium ${enhanceType === 'optimize' ? 'text-amber-900' : 'text-orange-800'}`}>Optimize Prompt</span>
                  </div>
                  <p className={`text-sm ${enhanceType === 'optimize' ? 'text-amber-700' : 'text-orange-600'}`}>
                    Automatically optimize for better performance and clarity
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Prompt Selection */}
          <Card className="bg-gradient-to-br from-white to-green-50 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-green-300 group">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-green-900 group-hover:text-green-950 transition-colors duration-300">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span>Select Prompt to Enhance</span>
              </CardTitle>
              <CardDescription className="text-green-700 group-hover:text-green-800 transition-colors duration-300">
                Choose an existing prompt from your history or enter a custom prompt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="existing" className="w-full">
                <TabsList className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200">
                  <TabsTrigger 
                    value="existing"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
                  >
                    My Prompts
                  </TabsTrigger>
                  <TabsTrigger 
                    value="custom"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300"
                  >
                    Custom Prompt
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="existing" className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">Select from your prompts</Label>
                    <Select 
                      value={selectedPrompt?.id || ''} 
                      onValueChange={(value) => {
                        const prompt = prompts.find(p => p.id === value)
                        setSelectedPrompt(prompt || null)
                        setCustomPrompt('')
                      }}
                    >
                      <SelectTrigger className="border-2 border-gray-200 hover:border-green-300 focus:border-green-400 transition-all duration-300 shadow-sm hover:shadow-md">
                        <SelectValue placeholder="Choose a prompt to enhance" />
                      </SelectTrigger>
                      <SelectContent>
                        {prompts.map((prompt) => (
                          <SelectItem key={prompt.id} value={prompt.id}>
                            {prompt.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedPrompt && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200 shadow-sm hover:shadow-md transition-all duration-300">
                      <h4 className="font-medium mb-2 text-green-900 flex items-center space-x-2">
                        <div className="p-1 bg-gradient-to-br from-green-500 to-emerald-600 rounded">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        <span>{selectedPrompt.title}</span>
                      </h4>
                      <p className="text-sm text-green-700 mb-3">{selectedPrompt.description}</p>
                      <StructuredPromptDisplay 
                        prompt={(selectedPrompt.content as any).prompt}
                        editable={false}
                        className="border-0 rounded-t-none"
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="custom" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customPrompt" className="text-gray-700 font-medium">Custom Prompt</Label>
                    <Textarea
                      id="customPrompt"
                      value={customPrompt}
                      onChange={(e) => {
                        setCustomPrompt(e.target.value)
                        setSelectedPrompt(null)
                      }}
                      placeholder="Enter your prompt here..."
                      rows={8}
                      className="border-2 border-gray-200 focus:border-green-400 transition-all duration-300 shadow-sm hover:shadow-md"
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Enhanced Configuration */}
          <Card className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 group">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-900 group-hover:text-blue-950 transition-colors duration-300">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  {enhanceType === 'improve' ? (
                    <Sparkles className="h-5 w-5 text-white" />
                  ) : (
                    <Zap className="h-5 w-5 text-white" />
                  )}
                </div>
                <span>{enhanceType === 'improve' ? 'Improvement' : 'Optimization'} Configuration</span>
              </CardTitle>
              <CardDescription className="text-blue-700 group-hover:text-blue-800 transition-colors duration-300">
                Configure how you want to enhance your prompt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEnhance} className="space-y-6">
                {enhanceType === 'improve' && (
                  <div className="space-y-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg shadow-sm">
                    <Label htmlFor="improvementRequest" className="text-gray-700 font-medium flex items-center space-x-2">
                      <div className="p-1 bg-gradient-to-br from-purple-500 to-blue-600 rounded">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <span>What would you like to improve or add?</span>
                    </Label>
                    <p className="text-sm text-purple-700 mb-3">
                      Describe improvements or new features you want to add to your prompt
                    </p>
                    <Textarea
                      id="improvementRequest"
                      value={improvementRequest}
                      onChange={(e) => setImprovementRequest(e.target.value)}
                      placeholder="e.g., Add examples and use cases, Make it more creative, Include step-by-step instructions, Add error handling, Make it work for multiple languages, Include formatting guidelines..."
                      required
                      disabled={enhancing}
                      rows={4}
                      className="border-2 border-purple-200 focus:border-purple-400 transition-all duration-300 shadow-sm hover:shadow-md"
                    />
                  </div>
                )}
                
                <div className="space-y-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-lg shadow-sm">
                  <Label htmlFor="targetModel" className="text-gray-700 font-medium flex items-center space-x-2">
                    <div className="p-1 bg-gradient-to-br from-gray-500 to-blue-600 rounded">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                    <span>Target AI Model</span>
                  </Label>
                  <Select value={targetModel} onValueChange={setTargetModel}>
                    <SelectTrigger className="border-2 border-gray-200 hover:border-blue-300 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md">
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

                {enhanceType === 'optimize' && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border-2 border-blue-200 shadow-sm hover:shadow-md transition-all duration-300">
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center space-x-2">
                      <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <span>Optimization will include:</span>
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-2">
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span>Enhanced clarity and specificity</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span>Improved instruction structure</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span>Better context and constraints</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span>Optimized formatting for {models.find(m => m.value === targetModel)?.label}</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <span>Removal of ambiguity and redundancy</span>
                      </li>
                    </ul>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={enhancing || (!selectedPrompt && !customPrompt.trim())}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-500 hover:border-blue-400 hover:scale-[1.02]"
                >
                  {enhancing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {enhanceType === 'improve' ? 'Improving...' : 'Optimizing...'}
                    </>
                  ) : (
                    <>
                      {enhanceType === 'improve' ? (
                        <Sparkles className="mr-2 h-4 w-4" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      {enhanceType === 'improve' ? 'Improve Prompt' : 'Optimize Prompt'}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Enhanced Result */}
          {enhancedPrompt && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {enhanceType === 'improve' ? (
                        <Sparkles className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Zap className="h-5 w-5 text-yellow-600" />
                      )}
                      <span>{enhancedPrompt.title}</span>
                    </CardTitle>
                    <CardDescription>{enhancedPrompt.description}</CardDescription>
                  </div>
                  <Button onClick={handleSaveAsNew} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save as New Prompt
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`border rounded-lg ${
                  enhanceType === 'improve' 
                    ? 'border-blue-200' 
                    : 'border-yellow-200'
                }`}>
                  <div className={`p-3 ${
                    enhanceType === 'improve' ? 'bg-blue-50' : 'bg-yellow-50'
                  } rounded-t-lg border-b`}>
                    <h4 className={`font-medium ${
                      enhanceType === 'improve' ? 'text-blue-800' : 'text-yellow-800'
                    }`}>
                      {enhanceType === 'improve' ? '✨ Improved Prompt' : '⚡ Optimized Prompt'}
                    </h4>
                  </div>
                  <StructuredPromptDisplay 
                    prompt={enhancedPrompt.prompt}
                    editable={true}
                    onUpdate={(updatedPrompt) => {
                      setEnhancedPrompt(prev => prev ? {
                        ...prev,
                        prompt: updatedPrompt
                      } : null)
                    }}
                    className="border-0 rounded-t-none"
                  />
                </div>
                
                {enhanceType === 'improve' && improvementRequest && (
                  <div className="bg-gray-50 p-3 rounded">
                    <strong>Applied improvement:</strong> {improvementRequest}
                  </div>
                )}

                {enhancedPrompt.improvements && enhancedPrompt.improvements.length > 0 && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-3 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enhancements Applied
                    </h4>
                    <ul className="space-y-2">
                      {enhancedPrompt.improvements.map((improvement, index) => (
                        <li key={index} className="text-sm text-green-700 flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {prompts.length === 0 && (
            <Card>
              <CardContent className="text-center py-16">
                <Sparkles className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No prompts to enhance</h2>
                <p className="text-gray-600 mb-6">
                  Create some prompts first, then come back to improve and optimize them.
                </p>
                <Button>Create Your First Prompt</Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Chained Prompt Enhancement */}
      {enhanceMode === 'chained' && (
        <>
          {/* Prompt Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Chained Prompt to Enhance</CardTitle>
              <CardDescription>
                Choose an existing chained prompt from your history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedChain?.id || ''} 
                onValueChange={(value) => {
                  const chain = chainedPrompts.find(p => p.id === value)
                  setSelectedChain(chain || null)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a chained prompt to enhance" />
                </SelectTrigger>
                <SelectContent>
                  {chainedPrompts.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedChain && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-medium mb-2 text-orange-900">{selectedChain.title}</h4>
              <p className="text-sm text-orange-700 mb-3">{selectedChain.description}</p>
              
              {/* Display chained prompt steps */}
              <div className="space-y-3">
                <h5 className="font-medium text-orange-800">Chain Steps:</h5>
                {selectedChain.content.chain.steps.map((step: any, index: number) => (
                  <div key={step.id} className="bg-white p-3 rounded border border-orange-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">Step {step.id}</span>
                      <span className="font-medium text-orange-900">{step.title}</span>
                    </div>
                    <p className="text-sm text-orange-700 mb-2">{step.description}</p>
                    <div className="bg-gray-50 p-2 rounded text-sm font-mono">
                      {step.prompt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enhancement Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <span>Chained Prompt Enhancement</span>
              </CardTitle>
              <CardDescription>
                Choose how you want to enhance your chained prompt
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Enhancement Type Selection for Chained Prompts */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Enhancement Type</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => setEnhanceType('improve')}
                      className={`cursor-pointer rounded-lg p-4 border-2 transition-all shadow-md hover:shadow-lg ${
                        enhanceType === 'improve' 
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-lg' 
                          : 'border-orange-200 hover:border-orange-300 bg-gradient-to-br from-orange-25 to-red-25 hover:from-orange-50 hover:to-red-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`p-1 rounded ${enhanceType === 'improve' ? 'bg-gradient-to-br from-indigo-500 to-purple-600' : 'bg-gradient-to-br from-orange-400 to-red-500'}`}>
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <span className={`font-medium ${enhanceType === 'improve' ? 'text-indigo-900' : 'text-orange-800'}`}>Improve Chain</span>
                      </div>
                      <p className={`text-sm ${enhanceType === 'improve' ? 'text-indigo-700' : 'text-orange-600'}`}>
                        Enhance the chain with specific improvements and new capabilities
                      </p>
                    </div>
                    
                    <div
                      onClick={() => setEnhanceType('optimize')}
                      className={`cursor-pointer rounded-lg p-4 border-2 transition-all shadow-md hover:shadow-lg ${
                        enhanceType === 'optimize' 
                          ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-lg' 
                          : 'border-orange-200 hover:border-orange-300 bg-gradient-to-br from-orange-25 to-red-25 hover:from-orange-50 hover:to-red-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`p-1 rounded ${enhanceType === 'optimize' ? 'bg-gradient-to-br from-amber-500 to-yellow-600' : 'bg-gradient-to-br from-orange-400 to-red-500'}`}>
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                        <span className={`font-medium ${enhanceType === 'optimize' ? 'text-amber-900' : 'text-orange-800'}`}>Optimize Chain</span>
                      </div>
                      <p className={`text-sm ${enhanceType === 'optimize' ? 'text-amber-700' : 'text-orange-600'}`}>
                        Automatically optimize the chain for better performance and flow
                      </p>
                    </div>
                  </div>
                </div>

                {/* Improvement Request for Chained Prompts */}
                {enhanceType === 'improve' && (
                  <div className="space-y-2">
                    <Label htmlFor="chainImprovementRequest">What do you want to improve?</Label>
                    <Textarea
                      id="chainImprovementRequest"
                      placeholder="Describe what you want to improve in this chained prompt (e.g., 'Make the outputs more detailed', 'Add error handling steps', 'Improve the flow between steps', etc.)"
                      value={improvementRequest}
                      onChange={(e) => setImprovementRequest(e.target.value)}
                      className="min-h-[100px]"
                      disabled={enhancingChain}
                    />
                    <p className="text-sm text-gray-500">
                      Be specific about what aspects of the chain you want to enhance.
                    </p>
                  </div>
                )}

              <form onSubmit={handleEnhance} className="space-y-4">
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

                <Button 
                  type="submit" 
                  disabled={enhancingChain || !selectedChain || (enhanceType === 'improve' && !improvementRequest.trim())}
                  className="w-full"
                >
                  {enhancingChain ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enhancing...
                    </>
                  ) : (
                    <>
                      {enhanceType === 'improve' ? (
                        <Sparkles className="mr-2 h-4 w-4" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      {enhanceType === 'improve' ? 'Improve' : 'Optimize'} Chained Prompt
                    </>
                  )}
                </Button>
              </form>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Result */}
          {enhancedChain && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {enhanceType === 'improve' ? (
                        <Sparkles className="h-5 w-5 text-indigo-600" />
                      ) : (
                        <Zap className="h-5 w-5 text-amber-600" />
                      )}
                      <span>{enhancedChain.title}</span>
                    </CardTitle>
                    <CardDescription>{enhancedChain.description}</CardDescription>
                  </div>
                  <Button onClick={handleSaveAsNew} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save as New Chain
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`p-3 rounded ${enhanceType === 'improve' ? 'bg-indigo-50 border border-indigo-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <strong className={enhanceType === 'improve' ? 'text-indigo-800' : 'text-amber-800'}>
                    {enhanceType === 'improve' ? '✨ Improved' : '⚡ Optimized'} Chained Prompt:
                  </strong>
                </div>
                
                {/* Display enhanced chain steps */}
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-800">Enhanced Chain Steps:</h5>
                  {enhancedChain.chain.steps.map((step: any, index: number) => (
                    <div key={step.id} className={`bg-white p-3 rounded border ${enhanceType === 'improve' ? 'border-indigo-200' : 'border-amber-200'}`}>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`text-white text-xs px-2 py-1 rounded ${enhanceType === 'improve' ? 'bg-indigo-500' : 'bg-amber-500'}`}>
                          Step {step.id}
                        </span>
                        <span className={`font-medium ${enhanceType === 'improve' ? 'text-indigo-900' : 'text-amber-900'}`}>
                          {step.title}
                        </span>
                      </div>
                      <p className={`text-sm mb-2 ${enhanceType === 'improve' ? 'text-indigo-700' : 'text-amber-700'}`}>
                        {step.description}
                      </p>
                      <div className="bg-gray-50 p-2 rounded text-sm font-mono">
                        {step.prompt}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Show improvement request if it was an improvement */}
                {enhanceType === 'improve' && improvementRequest && (
                  <div className="mt-4 text-sm text-indigo-700 bg-indigo-50 p-3 rounded border border-indigo-200">
                    <strong>Improvement applied:</strong> {improvementRequest}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {chainedPrompts.length === 0 && (
            <Card>
              <CardContent className="text-center py-16">
                <Sparkles className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No chained prompts to enhance</h2>
                <p className="text-gray-600 mb-6">
                  Create some chained prompts first, then come back to enhance them.
                </p>
                <Button onClick={() => window.location.href = '/dashboard/chains'}>
                  Create Your First Chained Prompt
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
} 