'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
// import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Zap, Loader2, Save, Copy, Play, GitBranch, X, Plus, History, TestTube } from 'lucide-react'
import StructuredPromptDisplay from '@/components/structured-prompt-display'
import type { Prompt } from '@/types/database'

interface TestResult {
  model: string
  prompt: string
  testInput: string // Contains context files content for backward compatibility 
  response: string
  responseTime: number
  success: boolean
  timestamp: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  error?: string
}

export default function TestPromptPage() {
  const searchParams = useSearchParams()
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [chainedPrompts, setChainedPrompts] = useState<any[]>([])
  const [testMode, setTestMode] = useState<'simple' | 'chained'>('simple')
  const [showHistory, setShowHistory] = useState(false)
  
  // Simple prompt testing
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [contextFiles, setContextFiles] = useState<{name: string, content: string}[]>([])
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4o'])
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  
  // Variable management for testing
  const [promptVariables, setPromptVariables] = useState<{[key: string]: string}>({})
  
  // Chained prompt testing
  const [selectedChain, setSelectedChain] = useState<any>(null)
  const [chainStepModels, setChainStepModels] = useState<{[key: number]: string}>({})
  const [testingChain, setTestingChain] = useState(false)
  const [chainResults, setChainResults] = useState<any>(null)
  
  // Testing history
  const [testHistory, setTestHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedHistoryPrompt, setSelectedHistoryPrompt] = useState<string>('all')
  
  const [loading, setLoading] = useState(true)
  
  const supabase = createSupabaseClient()

  // File upload handler
  const handleFileUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setContextFiles(prev => [...prev, { name: file.name, content }])
    }
    reader.readAsText(file)
  }

  // Remove context file
  const removeContextFile = (index: number) => {
    setContextFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Get context text from uploaded files
  const getContextText = (): string => {
    if (contextFiles.length === 0) return ''
    
    return contextFiles.map(file => 
      `[Context from ${file.name}]:\n${file.content}`
    ).join('\n\n')
  }

  // Load test history
  const loadTestHistory = async () => {
    setLoadingHistory(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('test_sessions')
        .select(`
          *,
          prompts (
            title,
            description
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Filter by specific prompt if selected
      if (selectedHistoryPrompt !== 'all') {
        query = query.eq('prompt_id', selectedHistoryPrompt)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading test history:', error)
        return
      }

      setTestHistory(data || [])
    } catch (error) {
      console.error('Error loading test history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Load test history when mode changes to history
  useEffect(() => {
    if (showHistory) {
      loadTestHistory()
    }
  }, [showHistory, selectedHistoryPrompt])

  const models = [
    // Top OpenAI Models (2025)
    { value: 'gpt-5', label: 'GPT-5 (OpenAI) - Latest', available: true },
    { value: 'gpt-4.1', label: 'GPT-4.1 (OpenAI) - Enhanced', available: true },
    { value: 'gpt-4.5', label: 'GPT-4.5 (OpenAI) - Most Powerful', available: true },
    { value: 'gpt-4o', label: 'GPT-4o (OpenAI) - Fast & Efficient', available: true },
    { value: 'o1', label: 'o1 (OpenAI) - Reasoning Model', available: true },
    { value: 'gpt-4', label: 'GPT-4 (OpenAI) - Classic', available: true },
    
    // Top Anthropic Models (2025)
    { value: 'claude-sonnet-4', label: 'Claude Sonnet 4 (Anthropic) - Latest 2025', available: true },
    { value: 'claude-3.7-sonnet', label: 'Claude 3.7 Sonnet (Anthropic) - Hybrid Reasoning', available: true },
    { value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet (Anthropic) - Balanced', available: true },
    { value: 'claude-opus-4', label: 'Claude Opus 4 (Anthropic) - Most Intelligent', available: true },
    { value: 'claude-3.5-haiku', label: 'Claude 3.5 Haiku (Anthropic) - Fast', available: true },
    
    // Image & Video Generation (Coming Soon)
    { value: 'dall-e-3', label: '🎨 DALL-E 3 (Image Generation)', available: false },
    { value: 'midjourney', label: '🎨 Midjourney (Image Generation)', available: false },
    { value: 'stable-diffusion', label: '🎨 Stable Diffusion (Image Generation)', available: false },
    { value: 'sora', label: '🎬 Sora (Video Generation)', available: false },
    { value: 'runway', label: '🎬 Runway (Video Generation)', available: false },
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

  // Load user's prompts and chained prompts
  useEffect(() => {
    async function loadPrompts() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Load all prompts with simple query (like enhance page)
        const { data: allPrompts, error: promptsError } = await supabase
          .from('prompts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!promptsError && allPrompts) {
          // Filter prompts in JavaScript instead of problematic SQL filters
          const regularPrompts = allPrompts.filter(p => {
            // Exclude chained prompts
            const isChained = p.content?.type === 'chain'
            return !isChained
          })
          
          const chains = allPrompts.filter(p => {
            // Include only chained prompts
            const isChained = p.content?.type === 'chain'
            return isChained
          })

          console.log('Test page: Loaded all prompts:', allPrompts.length)
          console.log('Test page: Regular prompts:', regularPrompts.length)
          console.log('Test page: Chained prompts:', chains.length)
          
          setPrompts(regularPrompts)
          setChainedPrompts(chains)

          // Check URL parameters with the loaded data
          const promptId = searchParams.get('promptId')
          const chainId = searchParams.get('chainId')
          
          if (promptId) {
            const requestedPrompt = regularPrompts.find((p: any) => p.id === promptId)
            if (requestedPrompt) {
              setSelectedPrompt(requestedPrompt)
              setTestMode('simple')
              initializeVariablesForPrompt(requestedPrompt)
            }
          }

          if (chainId) {
            const requestedChain = chains.find((c: any) => c.id === chainId)
            if (requestedChain) {
              setSelectedChain(requestedChain)
              setTestMode('chained')
              // Initialize step models with default values
              const stepModels: {[key: number]: string} = {}
              requestedChain.content.chain.steps.forEach((step: any) => {
                stepModels[step.id] = requestedChain.content.targetModel || 'gpt-4o'
              })
              setChainStepModels(stepModels)
            }
          }
        } else if (promptsError) {
          console.error('Test page: Error loading prompts:', promptsError)
        }

      } catch (error) {
        console.error('Error loading prompts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPrompts()
  }, [supabase, searchParams])

  // Function to detect variables in prompt text
  const detectVariablesInPrompt = (prompt: Prompt): string[] => {
    let text = ''
    
    if (typeof prompt.content === 'object' && prompt.content && 'prompt' in prompt.content) {
      const promptContent = (prompt.content as any).prompt
      if (typeof promptContent === 'object') {
        // For structured prompts, check all sections
        text = Object.values(promptContent).join(' ')
      } else {
        text = promptContent
      }
    }
    
    const variableRegex = /\{\{([^}]+)\}\}/g
    const matches = text.match(variableRegex)
    if (matches) {
      return matches.map(match => match.replace(/[{}]/g, '').trim())
    }
    return []
  }

  // Function to replace variables in text
  const replaceVariablesInText = (text: string): string => {
    let result = text
    Object.entries(promptVariables).forEach(([variableName, variableValue]) => {
      if (variableValue) {
        const regex = new RegExp(`\\{\\{${variableName}\\}\\}`, 'g')
        result = result.replace(regex, variableValue)
      }
    })
    return result
  }

  // Updated getPromptText function with variable replacement
  const getPromptText = (prompt: Prompt): string => {
    if (typeof prompt.content === 'object' && prompt.content && 'prompt' in prompt.content) {
      const promptContent = (prompt.content as any).prompt
      // Handle structured prompts by converting to string
      if (typeof promptContent === 'object') {
        // Replace variables in each section
        const replacedPrompt = Object.fromEntries(
          Object.entries(promptContent).map(([key, value]) => [
            key, 
            typeof value === 'string' ? replaceVariablesInText(value) : value
          ])
        )
        return JSON.stringify(replacedPrompt)
      }
      // Handle string prompts with variable replacement
      return replaceVariablesInText(promptContent)
    }
    return 'Legacy prompt format'
  }

  // Function to initialize variables when a prompt is selected
  const initializeVariablesForPrompt = (prompt: Prompt) => {
    const detectedVars = detectVariablesInPrompt(prompt)
    const newVariables: {[key: string]: string} = {}
    
    // Initialize with existing values or empty strings
    detectedVars.forEach(varName => {
      newVariables[varName] = promptVariables[varName] || ''
    })
    
    setPromptVariables(newVariables)
  }

  // Update variable value
  const updateVariableValue = (variableName: string, value: string) => {
    setPromptVariables(prev => ({
      ...prev,
      [variableName]: value
    }))
  }

  const handleModelToggle = (model: string) => {
    setSelectedModels(prev => 
      prev.includes(model) 
        ? prev.filter(m => m !== model)
        : [...prev, model]
    )
  }

  const handleTest = async () => {
    if (selectedModels.length === 0) {
      alert('Please select at least one model to test')
      return
    }

    const promptToTest: string = selectedPrompt ? getPromptText(selectedPrompt) : customPrompt
    if (!promptToTest.trim()) {
      alert('Please select a prompt or enter a custom prompt')
      return
    }

    setTesting(true)
    setResults([])

    try {
      // Get both API keys for testing
      const { openaiApiKey, anthropicApiKey } = await getApiKeys()

      const testPromises = selectedModels.map(async (model) => {
        try {
          const response = await fetch('/api/test-prompt', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: promptToTest,
              model,
              testInput: getContextText(), // Use context files for test input
              openaiApiKey, // Send OpenAI API key
              anthropicApiKey // Send Anthropic API key
            }),
          })

          const result = await response.json()
          return result
        } catch (error) {
          return {
            model,
            prompt: promptToTest,
            testInput: getContextText(),
            response: `Error: ${(error as Error).message}`,
            responseTime: 0,
            success: false,
            timestamp: new Date().toISOString(),
            usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
            error: `Failed to test with ${model}`
          }
        }
      })

      const testResults = await Promise.all(testPromises)
      setResults(testResults)

    } catch (error) {
      console.error('Error testing prompts:', error)
      alert('Failed to test prompts. Please try again.')
    } finally {
      setTesting(false)
    }
  }

  const handleTestChain = async () => {
    if (!selectedChain) {
      alert('Please select a chained prompt to test')
      return
    }

    // Check that all steps have models assigned
    const missingModels = selectedChain.content.chain.steps.filter(
      (step: any) => !chainStepModels[step.id]
    )
    if (missingModels.length > 0) {
      alert('Please assign a model to each step in the chain')
      return
    }

    setTestingChain(true)
    setChainResults(null)

    try {
      const { openaiApiKey, anthropicApiKey } = await getApiKeys()

      // Prepare steps with assigned models
      const stepsWithModels = selectedChain.content.chain.steps.map((step: any) => ({
        ...step,
        model: chainStepModels[step.id]
      }))

      const response = await fetch('/api/test-prompt-chain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          steps: stepsWithModels,
          chainTitle: selectedChain.title,
          userApiKey: openaiApiKey,
          anthropicApiKey: anthropicApiKey
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to test chain')
      }

      const result = await response.json()
      setChainResults(result)

    } catch (error) {
      console.error('Error testing chain:', error)
      alert('Failed to test chain. Please try again.')
    } finally {
      setTestingChain(false)
    }
  }

  const saveTestResults = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create a test session record
      const { error } = await supabase
        .from('test_sessions')
        .insert({
          user_id: user.id,
          prompt_id: selectedPrompt?.id || null,
          prompt_text: selectedPrompt ? getPromptText(selectedPrompt) : customPrompt,
          test_input: getContextText(), // Save context files as test input
          results,
          models_tested: selectedModels
        })

      if (error) throw error

      // Show success message and offer to view history
      const viewHistory = confirm('Test results saved successfully! Would you like to view your testing history?')
      if (viewHistory) {
        setShowHistory(true)
      }
    } catch (error) {
      console.error('Error saving test results:', error)
      alert('Failed to save test results. Please try again.')
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg">
              <Play className="h-8 w-8 text-white" />
            </div>
            Test Prompts
          </h1>
          <Button
            onClick={() => setShowHistory(!showHistory)}
            variant={showHistory ? "default" : "outline"}
            className={showHistory 
              ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:from-purple-600 hover:to-pink-700" 
              : "border-purple-300 text-purple-700 hover:bg-purple-50"
            }
          >
            <History className="h-4 w-4 mr-2" />
            {showHistory ? "Back to Testing" : "View Testing History"}
          </Button>
        </div>
        <p className="text-gray-600 mt-2">
          {showHistory 
            ? "Review and analyze your previous test results and performance metrics"
            : "Test simple prompts or chained prompts across different AI models"
          }
        </p>
      </div>

      {/* Mode Selection */}
      {!showHistory && (
        <Card className="bg-gradient-to-br from-green-50 to-teal-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-green-800">Test Mode:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTestMode('simple')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg ${
                    testMode === 'simple' 
                      ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white border border-green-400' 
                      : 'bg-gradient-to-r from-green-100 to-teal-100 text-green-700 hover:from-green-200 hover:to-teal-200 border border-green-200'
                  }`}
                >
                  Simple Prompts
                </button>
                <button
                  onClick={() => setTestMode('chained')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg ${
                    testMode === 'chained' 
                      ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white border border-green-400' 
                      : 'bg-gradient-to-r from-green-100 to-teal-100 text-green-700 hover:from-green-200 hover:to-teal-200 border border-green-200'
                  }`}
                >
                  Chained Prompts
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simple Prompt Testing */}
      {!showHistory && testMode === 'simple' && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded">
                <Play className="h-4 w-4 text-white" />
              </div>
              <span>Select Prompt to Test</span>
            </CardTitle>
            <CardDescription className="text-blue-700">
              Choose a saved prompt or enter a custom prompt to test
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="saved" className="w-full">
              <TabsList>
                <TabsTrigger value="saved">Saved Prompts</TabsTrigger>
                <TabsTrigger value="custom">Custom Prompt</TabsTrigger>
              </TabsList>
              
              <TabsContent value="saved" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Select Prompt</Label>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                      {prompts.length} prompts loaded
                    </span>
                  </div>
                  <Select 
                    value={selectedPrompt?.id || ''} 
                    onValueChange={(value) => {
                      const prompt = prompts.find(p => p.id === value)
                      setSelectedPrompt(prompt || null)
                      if (prompt) {
                        initializeVariablesForPrompt(prompt)
                      } else {
                        setPromptVariables({})
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a saved prompt" />
                    </SelectTrigger>
                    <SelectContent>
                      {prompts.length === 0 ? (
                        <SelectItem value="no-prompts" disabled>
                          No prompts found - Create some prompts first
                        </SelectItem>
                      ) : (
                        prompts.map((prompt) => (
                          <SelectItem key={prompt.id} value={prompt.id}>
                            {prompt.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedPrompt && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium mb-2 text-blue-900">{selectedPrompt.title}</h4>
                    <p className="text-sm text-blue-700 mb-3">{selectedPrompt.description}</p>
                    <StructuredPromptDisplay 
                      prompt={(selectedPrompt.content as any).prompt}
                      editable={false}
                      variables={Object.entries(promptVariables).map(([name, value]) => ({ name, value }))}
                      className="border-0 rounded-t-none"
                    />
                    
                    {/* Variables Input Section */}
                    {Object.keys(promptVariables).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <h5 className="font-medium text-blue-900 mb-3">Variables (Set values for testing)</h5>
                        <div className="space-y-3">
                          {Object.entries(promptVariables).map(([variableName, variableValue]) => (
                            <div key={variableName} className="space-y-1">
                              <Label className="text-sm font-medium text-blue-800">
                                {`{{${variableName}}}`}
                              </Label>
                              <Input
                                placeholder={`Enter value for ${variableName}`}
                                value={variableValue}
                                onChange={(e) => updateVariableValue(variableName, e.target.value)}
                                className="bg-white/80 border-blue-300 focus:border-blue-500"
                              />
                            </div>
                          ))}
                          <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                            💡 Set values above - they will replace the {`{{variables}}`} when testing
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="custom" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customPrompt">Custom Prompt</Label>
                  <Textarea
                    id="customPrompt"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    rows={8}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Chained Prompt Testing */}
      {!showHistory && testMode === 'chained' && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-purple-900">
              <div className="p-1 bg-gradient-to-br from-purple-500 to-pink-600 rounded">
                <GitBranch className="h-4 w-4 text-white" />
              </div>
              <span>Select Chained Prompt to Test</span>
            </CardTitle>
            <CardDescription className="text-purple-700">
              Choose a saved chained prompt and configure models for each step
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Chained Prompt</Label>
              <Select 
                value={selectedChain?.id || ''} 
                onValueChange={(value) => {
                  const chain = chainedPrompts.find(c => c.id === value)
                  setSelectedChain(chain || null)
                  if (chain) {
                    // Initialize step models
                    const stepModels: {[key: number]: string} = {}
                    chain.content.chain.steps.forEach((step: any) => {
                      stepModels[step.id] = chain.content.targetModel || 'gpt-4o'
                    })
                    setChainStepModels(stepModels)
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a chained prompt" />
                </SelectTrigger>
                <SelectContent>
                  {chainedPrompts.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id}>
                      {chain.title} ({chain.content.chain.steps.length} steps)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedChain && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded border">
                  <h4 className="font-medium mb-2">{selectedChain.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{selectedChain.description}</p>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{selectedChain.content.chain.steps.length} steps</span> • 
                    <span className="ml-1">Target: {selectedChain.content.targetModel}</span>
                  </div>
                </div>

                {/* Step Model Configuration */}
                <div className="space-y-4">
                  <h5 className="font-medium text-gray-900">Configure Models for Each Step</h5>
                  {selectedChain.content.chain.steps.map((step: any, index: number) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="font-medium text-gray-800">
                          Step {step.id}: {step.title}
                        </h6>
                        <Select
                          value={chainStepModels[step.id] || 'gpt-4o'}
                          onValueChange={(value) => {
                            setChainStepModels(prev => ({
                              ...prev,
                              [step.id]: value
                            }))
                          }}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
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
                      <p className="text-sm text-gray-600">{step.description}</p>
                      <div className="mt-2 bg-gray-900 rounded p-2">
                        <pre className="text-xs text-gray-100 whitespace-pre-wrap max-h-20 overflow-y-auto">
                          {step.prompt.substring(0, 150)}...
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Configuration - Simple */}
      {!showHistory && testMode === 'simple' && (
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>
              Configure how you want to test your prompt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enhanced Model Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium text-gray-700 flex items-center space-x-2">
                <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <span>Select Models to Test</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {models.map((model, index) => {
                  const colorSchemes = [
                    { 
                      gradient: 'from-blue-50 to-indigo-100', 
                      border: 'border-blue-200', 
                      hoverBorder: 'hover:border-blue-400',
                      activeBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
                      activeBorder: 'border-blue-500',
                      activeText: 'text-white',
                      icon: 'bg-blue-500'
                    },
                    { 
                      gradient: 'from-green-50 to-emerald-100', 
                      border: 'border-green-200', 
                      hoverBorder: 'hover:border-green-400',
                      activeBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
                      activeBorder: 'border-green-500',
                      activeText: 'text-white',
                      icon: 'bg-green-500'
                    },
                    { 
                      gradient: 'from-purple-50 to-pink-100', 
                      border: 'border-purple-200', 
                      hoverBorder: 'hover:border-purple-400',
                      activeBg: 'bg-gradient-to-br from-purple-500 to-pink-600',
                      activeBorder: 'border-purple-500',
                      activeText: 'text-white',
                      icon: 'bg-purple-500'
                    },
                    { 
                      gradient: 'from-orange-50 to-red-100', 
                      border: 'border-orange-200', 
                      hoverBorder: 'hover:border-orange-400',
                      activeBg: 'bg-gradient-to-br from-orange-500 to-red-600',
                      activeBorder: 'border-orange-500',
                      activeText: 'text-white',
                      icon: 'bg-orange-500'
                    },
                    { 
                      gradient: 'from-teal-50 to-cyan-100', 
                      border: 'border-teal-200', 
                      hoverBorder: 'hover:border-teal-400',
                      activeBg: 'bg-gradient-to-br from-teal-500 to-cyan-600',
                      activeBorder: 'border-teal-500',
                      activeText: 'text-white',
                      icon: 'bg-teal-500'
                    }
                  ]
                  
                  const colorScheme = colorSchemes[index % colorSchemes.length]
                  const isSelected = selectedModels.includes(model.value)
                  
                  return (
                    <div
                      key={model.value}
                      onClick={() => model.available && handleModelToggle(model.value)}
                      className={`cursor-pointer p-4 rounded-lg border-2 transition-all duration-300 shadow-md hover:shadow-lg group ${
                        isSelected
                          ? `${colorScheme.activeBg} ${colorScheme.activeBorder} ${colorScheme.activeText} scale-105 shadow-lg`
                          : model.available
                          ? `bg-gradient-to-br ${colorScheme.gradient} ${colorScheme.border} ${colorScheme.hoverBorder} hover:scale-[1.02] hover:-translate-y-1`
                          : 'border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <div className="flex flex-col space-y-3">
                        {/* Header with icon and selection status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded-full ${
                              isSelected 
                                ? 'bg-white/20' 
                                : model.available 
                                ? `${colorScheme.icon}` 
                                : 'bg-gray-400'
                            } transition-all duration-300`}>
                              <Zap className={`h-3 w-3 ${
                                isSelected ? 'text-white' : 'text-white'
                              }`} />
                            </div>
                            {model.available && (
                              <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold transition-all duration-300 ${
                                isSelected 
                                  ? 'bg-white/20 text-white border border-white/30' 
                                  : `bg-white/70 border ${colorScheme.border} text-gray-700`
                              }`}>
                                {isSelected ? 'Selected' : 'Available'}
                              </span>
                            )}
                          </div>
                          
                          {!model.available && (
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-500 border border-gray-300">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        
                        {/* Model name */}
                        <div>
                          <h3 className={`font-semibold text-sm transition-colors duration-300 ${
                            isSelected 
                              ? 'text-white' 
                              : model.available 
                              ? 'text-gray-900 group-hover:text-gray-800' 
                              : 'text-gray-500'
                          }`}>
                            {model.label}
                          </h3>
                        </div>
                        
                        {/* Model description/features */}
                        {model.available && (
                          <div className="space-y-1">
                            <div className={`flex items-center space-x-1 text-xs ${
                              isSelected ? 'text-white/90' : 'text-gray-600'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-white/60' : colorScheme.icon
                              }`}></div>
                              <span>High Performance</span>
                            </div>
                            <div className={`flex items-center space-x-1 text-xs ${
                              isSelected ? 'text-white/90' : 'text-gray-600'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-white/60' : colorScheme.icon
                              }`}></div>
                              <span>Latest Training</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Add Context */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Add Context to your prompt</Label>
              <p className="text-sm text-gray-600">
                Upload files to provide context that will be automatically added to your prompt
              </p>
              
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept=".txt,.md,.doc,.docx,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFileUpload(file)
                      e.target.value = '' // Reset input
                    }
                  }}
                  className="hidden"
                  id="context-upload"
                />
                <label htmlFor="context-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="text-gray-500">
                      📄 Click to upload context files
                    </div>
                    <div className="text-sm text-gray-400">
                      Supports: .txt, .md, .doc, .docx, .pdf
                    </div>
                  </div>
                </label>
              </div>
              
              {/* Uploaded Files */}
              {contextFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Uploaded Context Files:</Label>
                  <div className="space-y-2">
                    {contextFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="text-green-700">📄</div>
                          <div>
                            <div className="font-medium text-green-900">{file.name}</div>
                            <div className="text-sm text-green-700">
                              {file.content.length} characters
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContextFile(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Context Preview */}
                  <div className="mt-3">
                    <Label className="text-sm font-medium text-gray-700">Context Preview:</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-32 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                        {getContextText().substring(0, 300)}
                        {getContextText().length > 300 && '...'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RAG Architecture - Coming Soon */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">RAG Architecture</Label>
                  <p className="text-sm text-gray-600">
                    Add documents to a vector store for advanced retrieval-augmented generation
                  </p>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full">
                  Premium Feature
                </div>
              </div>
              
              {/* Vector Store Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 opacity-60">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Vector Store</Label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose vector database" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pinecone">🌲 Pinecone</SelectItem>
                      <SelectItem value="weaviate">🔍 Weaviate</SelectItem>
                      <SelectItem value="chroma">🎨 ChromaDB</SelectItem>
                      <SelectItem value="qdrant">⚡ Qdrant</SelectItem>
                      <SelectItem value="milvus">🚀 Milvus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Embedding Model</Label>
                  <Select disabled>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose embedding model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">🤖 OpenAI text-embedding-3-large</SelectItem>
                      <SelectItem value="cohere">🧠 Cohere Embed v3</SelectItem>
                      <SelectItem value="sentence">📚 Sentence Transformers</SelectItem>
                      <SelectItem value="huggingface">🤗 HuggingFace Embeddings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Document Upload for Vector Store */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 opacity-60">
                <Label className="text-sm font-medium text-gray-700">Documents for Vector Store</Label>
                
                <div className="border-2 border-dashed border-gray-400 rounded-lg p-6 text-center">
                  <div className="space-y-2">
                    <div className="text-gray-500">
                      📚 Upload documents to vector store
                    </div>
                    <div className="text-sm text-gray-400">
                      Supports: .pdf, .docx, .txt, .md, .csv, .json
                    </div>
                  </div>
                  <Button disabled variant="outline" className="mt-3">
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Vector Store
                  </Button>
                </div>
                
                {/* RAG Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Chunk Size</Label>
                    <Input disabled placeholder="1000" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Overlap</Label>
                    <Input disabled placeholder="200" className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-600">Top K</Label>
                    <Input disabled placeholder="5" className="h-8 text-sm" />
                  </div>
                </div>
                
                <div className="text-xs text-purple-700 bg-purple-50 p-3 rounded-lg border border-purple-200">
                  <strong>🚀 Premium Feature:</strong> Advanced RAG capabilities with semantic search, 
                  multi-modal embeddings, and intelligent document chunking. 
                  <br />
                  <span className="text-purple-600">Get ready for the future of context-aware AI testing!</span>
                </div>
              </div>
            </div>

            {/* Test Button */}
            {!showHistory && (
              <Button 
                onClick={handleTest} 
                disabled={testing || selectedModels.length === 0 || (!selectedPrompt && !customPrompt.trim())}
                className="w-full"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing across {selectedModels.length} model(s)...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Test Prompt
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Configuration - Chained */}
      {!showHistory && testMode === 'chained' && selectedChain && (
        <Card>
          <CardHeader>
            <CardTitle>Test Chain Configuration</CardTitle>
            <CardDescription>
              Review the chain configuration and start testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-2">Chain Testing Overview</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Each step will be executed sequentially</li>
                <li>• Output from previous steps feeds into the next step</li>
                <li>• You can use different models for each step</li>
                <li>• Testing stops if any step fails</li>
              </ul>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{selectedChain.content.chain.steps.length}</div>
                <div className="text-xs text-gray-600">Total Steps</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {Object.values(chainStepModels).filter(Boolean).length}
                </div>
                <div className="text-xs text-gray-600">Models Assigned</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {new Set(Object.values(chainStepModels)).size}
                </div>
                <div className="text-xs text-gray-600">Unique Models</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">Est. 30s</div>
                <div className="text-xs text-gray-600">Test Duration</div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-gray-600">
                Ready to test {selectedChain.content.chain.steps.length} step chain
              </div>
              <Button 
                onClick={handleTestChain}
                disabled={testingChain || !selectedChain || Object.values(chainStepModels).some(m => !m)}
                className="w-auto"
              >
                {testingChain ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Chain...
                  </>
                ) : (
                  <>
                    <GitBranch className="mr-2 h-4 w-4" />
                    Test Chain
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Simple Prompt Results */}
      {!showHistory && testMode === 'simple' && results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  Results from testing across {results.length} model(s)
                </CardDescription>
              </div>
              <Button onClick={saveTestResults} variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Save Results
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border-2 ${
                  result.success
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      result.success ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Zap className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {models.find(m => m.value === result.model)?.label || result.model}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {(result.responseTime / 1000).toFixed(1)}s
                        </span>
                        <span>
                          Tokens: {result.usage.totalTokens} 
                          ({result.usage.promptTokens} + {result.usage.completionTokens})
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(result.response)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {result.testInput && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Context Files:</Label>
                      <div className="bg-gray-100 p-3 rounded mt-1">
                        <p className="text-sm text-gray-800">{result.testInput}</p>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Response:</Label>
                    <div className={`p-4 rounded mt-1 ${
                      result.success ? 'bg-white border' : 'bg-red-100 border border-red-200'
                    }`}>
                      <pre className="whitespace-pre-wrap text-sm text-gray-800">
                        {result.response}
                      </pre>
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="bg-red-100 border border-red-200 p-3 rounded">
                      <p className="text-sm text-red-800">
                        <strong>Error:</strong> {result.error}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Chain Test Results */}
      {!showHistory && testMode === 'chained' && chainResults && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Chain Test Results</CardTitle>
                <CardDescription>
                  Results from testing {chainResults.chainTitle}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{chainResults.completedSteps}/{chainResults.totalSteps} steps completed</span>
                <span>•</span>
                <span>{(chainResults.totalResponseTime / 1000).toFixed(1)}s total</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Chain Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{chainResults.totalSteps}</div>
                <div className="text-xs text-gray-600">Total Steps</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{chainResults.completedSteps}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {chainResults.totalTokens.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Total Tokens</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${chainResults.success ? 'text-green-600' : 'text-red-600'}`}>
                  {chainResults.success ? 'Success' : 'Failed'}
                </div>
                <div className="text-xs text-gray-600">Status</div>
              </div>
            </div>

            {/* Individual Step Results */}
            {chainResults.steps.map((step: any, index: number) => (
              <div
                key={step.stepId}
                className={`p-4 rounded-lg border-2 ${
                  step.success
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                      step.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {step.stepId}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Model: <strong>{step.model}</strong></span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {(step.responseTime / 1000).toFixed(1)}s
                        </span>
                        <span>•</span>
                        <span className="flex items-center">
                          <Zap className="h-4 w-4 mr-1" />
                          {step.usage.totalTokens} tokens
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(step.response)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {/* Step Prompt */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Prompt Used:</h5>
                  <div className="bg-gray-900 rounded p-3">
                    <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                      {step.prompt}
                    </pre>
                  </div>
                </div>

                {/* Step Response */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Response:</h5>
                  <div className="bg-white border rounded p-3 max-h-60 overflow-y-auto">
                    <div className="text-sm text-gray-900 whitespace-pre-wrap">
                      {step.response}
                    </div>
                  </div>
                </div>

                {/* Token Usage Details */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t">
                  <span>Input: {step.usage.promptTokens} tokens</span>
                  <span>Output: {step.usage.completionTokens} tokens</span>
                  <span>Total: {step.usage.totalTokens} tokens</span>
                  <span>{new Date(step.timestamp).toLocaleTimeString()}</span>
                </div>

                {step.error && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {step.error}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Testing History */}
      {showHistory && (
        <div className="space-y-6">
          {/* History Controls */}
          <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2 text-purple-900">
                    <History className="h-5 w-5" />
                    <span>Testing History</span>
                  </CardTitle>
                  <CardDescription className="text-purple-700">
                    View and analyze your previous test results
                  </CardDescription>
                </div>
                <Button
                  onClick={loadTestHistory}
                  variant="outline"
                  disabled={loadingHistory}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  {loadingHistory ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <History className="h-4 w-4 mr-2" />
                  )}
                  Refresh History
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filter by Prompt */}
              <div className="flex items-center space-x-4">
                <Label className="text-sm font-medium text-purple-800">Filter by Prompt:</Label>
                <Select value={selectedHistoryPrompt} onValueChange={setSelectedHistoryPrompt}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="All prompts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prompts</SelectItem>
                    {prompts.map((prompt) => (
                      <SelectItem key={prompt.id} value={prompt.id}>
                        {prompt.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* History Results */}
          {loadingHistory ? (
            <Card>
              <CardContent className="text-center py-16">
                <Loader2 className="h-16 w-16 mx-auto mb-4 text-gray-400 animate-spin" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading test history...</h2>
                <p className="text-gray-600">Please wait while we fetch your testing history.</p>
              </CardContent>
            </Card>
          ) : testHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <TestTube className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No test history found</h2>
                <p className="text-gray-600 mb-6">
                  {selectedHistoryPrompt === 'all' 
                    ? "You haven't saved any test results yet. Run some tests and save the results to see them here."
                    : "No test history found for the selected prompt. Try testing it and saving the results."
                  }
                </p>
                <Button onClick={() => setShowHistory(false)}>
                  Start Testing
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {testHistory.map((session, index) => (
                <Card key={session.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {session.prompts?.title || 'Custom Prompt'} - Test #{testHistory.length - index}
                        </CardTitle>
                        <CardDescription>
                          Tested on {new Date(session.created_at).toLocaleString()} • 
                          {session.models_tested?.length || 0} model(s) • 
                          {session.results?.reduce((total: number, result: any) => total + (result.usage?.totalTokens || 0), 0)} total tokens
                        </CardDescription>
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.models_tested?.join(', ')}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Test Input/Context */}
                    {session.test_input && (
                      <div className="mb-4">
                        <Label className="text-sm font-medium text-gray-700">Context Files:</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                            {session.test_input.substring(0, 300)}
                            {session.test_input.length > 300 && '...'}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Results Grid */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-gray-700">Test Results:</Label>
                      {session.results?.map((result: any, resultIndex: number) => (
                        <div key={resultIndex} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                              <span className="font-medium">{result.model}</span>
                              <span className="text-sm text-gray-500">
                                {result.responseTime}ms
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {result.usage?.totalTokens} tokens 
                              ({result.usage?.promptTokens} prompt + {result.usage?.completionTokens} completion)
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Response:</Label>
                            <div className={`mt-1 p-3 rounded-lg border ${
                              result.success ? 'bg-white' : 'bg-red-50 border-red-200'
                            }`}>
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                {result.response.length > 500 
                                  ? `${result.response.substring(0, 500)}...` 
                                  : result.response
                                }
                              </p>
                              {result.response.length > 500 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 text-xs"
                                  onClick={() => {
                                    // Toggle full response display
                                    const element = document.getElementById(`full-response-${session.id}-${resultIndex}`)
                                    if (element) {
                                      element.style.display = element.style.display === 'none' ? 'block' : 'none'
                                    }
                                  }}
                                >
                                  Show Full Response
                                </Button>
                              )}
                              {result.response.length > 500 && (
                                <div id={`full-response-${session.id}-${resultIndex}`} style={{display: 'none'}} className="mt-2 pt-2 border-t">
                                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                    {result.response}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!showHistory && prompts.length === 0 && (
        <Card>
          <CardContent className="text-center py-16">
            <Play className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No prompts to test</h2>
            <p className="text-gray-600 mb-6">
              Create some prompts first, then come back to test them across different AI models.
            </p>
            <Button onClick={() => setShowHistory(false)}>Create Your First Prompt</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 