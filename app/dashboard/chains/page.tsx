'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GitBranch, Loader2, Copy, Save, ArrowDown, ArrowRight, Workflow, CheckCircle, Clock, Zap, Database, TrendingUp, Link2 } from 'lucide-react'
import ChainGenerationAnimation from '@/components/chain-generation-animation'

interface PromptStep {
  id: number
  title: string
  description: string
  prompt: string
  expectedOutput: string
  connectsTo: number[]
  estimatedTime: number
  estimatedTokens: {
    input: number
    output: number
  }
}

interface ChainMetadata {
  generatedAt: string
  responseTime: number
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  targetModel: string
}

interface PromptChain {
  title: string
  description: string
  steps: PromptStep[]
  metadata?: ChainMetadata
}

export default function ChainedPromptsPage() {
  const [goal, setGoal] = useState('')
  const [targetModel, setTargetModel] = useState('gpt-4o')
  const [loading, setLoading] = useState(false)
  const [generatedChain, setGeneratedChain] = useState<PromptChain | null>(null)
  const [saving, setSaving] = useState(false)
  const [copiedStep, setCopiedStep] = useState<number | null>(null)
  const router = useRouter()
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { openaiApiKey } = await getApiKeys()

      const response = await fetch('/api/generate-prompt-chain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          goal, 
          targetModel,
          openaiApiKey
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate prompt chain')
      }

      const data = await response.json()
      setGeneratedChain(data)
    } catch (error) {
      console.error('Error generating prompt chain:', error)
      alert('Failed to generate prompt chain. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyStep = async (stepId: number, prompt: string) => {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedStep(stepId)
      setTimeout(() => setCopiedStep(null), 2000)
    } catch (error) {
      console.error('Failed to copy prompt:', error)
    }
  }

  const handleSave = async () => {
    if (!generatedChain) return

    setSaving(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Save the entire chain as a single prompt with chain data
      const { error } = await supabase
        .from('prompts')
        .insert({
          user_id: session.user.id,
          title: generatedChain.title,
          description: generatedChain.description,
          content: { 
            type: 'chain',
            chain: generatedChain,
            targetModel
          },
        })

      if (error) {
        throw error
      }

      alert('Prompt chain saved successfully!')
      router.push('/dashboard/prompts')
    } catch (error) {
      console.error('Error saving prompt chain:', error)
      alert('Failed to save prompt chain. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const renderChainFlow = () => {
    if (!generatedChain) return null

    return (
      <div className="space-y-8">
        {/* Enhanced Chain Metadata Overview */}
        {generatedChain.metadata && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-100 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 group">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-900 group-hover:text-blue-950 transition-colors duration-300">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <span>Generation Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2 p-3 bg-white/70 border border-blue-200 rounded-lg hover:bg-white/90 transition-all duration-300">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Generation Time</p>
                    <p className="text-xs text-blue-700">{(generatedChain.metadata.responseTime / 1000).toFixed(1)}s</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-white/70 border border-blue-200 rounded-lg hover:bg-white/90 transition-all duration-300">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Total Tokens</p>
                    <p className="text-xs text-blue-700">{generatedChain.metadata.usage.totalTokens.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-white/70 border border-blue-200 rounded-lg hover:bg-white/90 transition-all duration-300">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Model Used</p>
                    <p className="text-xs text-blue-700">{generatedChain.metadata.model}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-white/70 border border-blue-200 rounded-lg hover:bg-white/90 transition-all duration-300">
                  <GitBranch className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Chain Steps</p>
                    <p className="text-xs text-blue-700">{generatedChain.steps.length} connected prompts</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enhanced Chain Steps */}
        <div className="space-y-6">
          {generatedChain.steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Enhanced Connection Arrow */}
              {index < generatedChain.steps.length - 1 && (
                <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-3 z-10">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2 rounded-full shadow-lg border-2 border-white">
                    <ArrowDown className="h-4 w-4" />
                  </div>
                </div>
              )}

              {/* Enhanced Step Card */}
              <Card className="relative border-2 border-l-4 border-l-blue-500 hover:border-l-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] bg-gradient-to-br from-white to-gray-50 group">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full font-bold text-sm shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        {step.id}
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-900 group-hover:text-blue-900 transition-colors duration-300">{step.title}</CardTitle>
                        <CardDescription className="text-gray-600 mt-1 group-hover:text-gray-700 transition-colors duration-300">{step.description}</CardDescription>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopyStep(step.id, step.prompt)}
                      className="ml-4 shadow-sm hover:shadow-md border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 hover:scale-105"
                    >
                      {copiedStep === step.id ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Prompt
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Enhanced Step Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-2 p-2 bg-white/70 border border-gray-200 rounded-md hover:bg-white/90 transition-all duration-300">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs font-medium text-gray-800">Est. Time</p>
                        <p className="text-xs text-gray-600">{step.estimatedTime} min</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-white/70 border border-gray-200 rounded-md hover:bg-white/90 transition-all duration-300">
                      <Zap className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs font-medium text-gray-800">Input Tokens</p>
                        <p className="text-xs text-gray-600">{step.estimatedTokens.input.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-2 bg-white/70 border border-gray-200 rounded-md hover:bg-white/90 transition-all duration-300">
                      <TrendingUp className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-xs font-medium text-gray-800">Output Tokens</p>
                        <p className="text-xs text-gray-600">{step.estimatedTokens.output.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Prompt Display */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900 flex items-center">
                      <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded mr-2">
                        <Workflow className="h-4 w-4 text-white" />
                      </div>
                      Prompt for Step {step.id}:
                    </h4>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md">
                      {step.prompt}
                    </div>
                  </div>

                  {/* Enhanced Expected Output */}
                  {step.expectedOutput && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                        <div className="p-1 bg-gradient-to-br from-green-500 to-emerald-600 rounded mr-2">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                        Expected Output:
                      </h5>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md">
                        <p className="text-sm text-green-800 whitespace-pre-wrap">
                          {step.expectedOutput}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Connections Display */}
                  {step.connectsTo && step.connectsTo.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-gray-600 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                      <Link2 className="h-4 w-4 text-indigo-600" />
                      <span className="font-medium">Connects to:</span>
                      {step.connectsTo.map((connectionId, idx) => (
                        <span key={connectionId} className="bg-indigo-100 border border-indigo-300 text-indigo-800 px-2 py-1 rounded-full text-xs">
                          Step {connectionId}
                          {idx < step.connectsTo.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Enhanced Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Chained Prompts</h1>
        <p className="text-gray-600 mt-2">
          Create sequential, chained prompts that work together to solve complex tasks more effectively
        </p>
      </div>

      {/* Enhanced Main Form Card */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-2 border-indigo-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-indigo-300 group">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-indigo-900 group-hover:text-indigo-950 transition-colors duration-300">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
              <Workflow className="h-5 w-5 text-white" />
            </div>
            <span>AI Chain Generator</span>
          </CardTitle>
          <CardDescription className="text-indigo-700 group-hover:text-indigo-800 transition-colors duration-300">
            Describe a complex task and AI will break it down into a sequence of connected prompts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal" className="text-gray-700 font-medium">What complex task do you need a prompt chain for?</Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., Create a comprehensive marketing strategy for a new SaaS product, Develop a detailed research report on AI trends, Write a complete business proposal for a startup..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                  disabled={loading}
                  rows={4}
                  className="border-2 border-gray-200 focus:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg rounded-lg"
                />
                <p className="text-sm text-indigo-600 group-hover:text-indigo-700 transition-colors duration-300">
                  Describe complex, multi-step tasks that would benefit from being broken down into sequential prompts
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetModel" className="text-gray-700 font-medium">Target AI Model</Label>
                <Select value={targetModel} onValueChange={setTargetModel}>
                  <SelectTrigger className="border-2 border-gray-200 hover:border-indigo-300 focus:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-md">
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
            </div>
            
            {/* Enhanced Info Box */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-100 border-2 border-amber-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 group/info">
              <div className="flex items-start space-x-2">
                <GitBranch className="h-5 w-5 text-amber-600 mt-0.5 group-hover/info:text-amber-700 transition-colors duration-300" />
                <div>
                  <p className="text-sm text-amber-800 font-medium group-hover/info:text-amber-900 transition-colors duration-300">How Chained Prompts Work</p>
                  <ul className="text-sm text-amber-700 mt-1 space-y-1 group-hover/info:text-amber-800 transition-colors duration-300">
                    <li>• <strong>Step 1:</strong> AI analyzes your complex task</li>
                    <li>• <strong>Step 2:</strong> Breaks it into 2-3 sequential prompts</li>
                    <li>• <strong>Step 3:</strong> Each prompt builds on the previous output</li>
                    <li>• <strong>Result:</strong> More effective than a single monolithic prompt</li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Enhanced Generate Button */}
            <Button 
              type="submit" 
              disabled={loading || !goal.trim()}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-indigo-500 hover:border-indigo-400 hover:scale-[1.02]"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Chain...
                </>
              ) : (
                <>
                  <Workflow className="mr-2 h-4 w-4" />
                  Generate Prompt Chain
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Enhanced Animation Component */}
      <ChainGenerationAnimation isLoading={loading} />

      {/* Enhanced Generated Chain Display */}
      {generatedChain && (
        <Card className="bg-gradient-to-br from-white to-green-50 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-green-300 group">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center space-x-2 text-green-900 group-hover:text-green-950 transition-colors duration-300">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                    <GitBranch className="h-5 w-5 text-white" />
                  </div>
                  <span>{generatedChain.title}</span>
                </CardTitle>
                <CardDescription className="text-green-700 group-hover:text-green-800 transition-colors duration-300">{generatedChain.description}</CardDescription>
              </div>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300 border border-green-500 hover:border-green-400"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Chain
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Enhanced Success Banner */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center text-green-800 font-semibold">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    <strong>🎉 Prompt Chain Generated Successfully!</strong>
                  </span>
                  <span className="text-sm text-green-700 bg-green-100 px-3 py-1 rounded-full border border-green-300">
                    Optimized for: <strong>{models.find(m => m.value === targetModel)?.label}</strong>
                  </span>
                </div>
                {generatedChain.metadata && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                    <div className="text-center bg-white/70 border border-green-200 rounded-lg p-3 hover:bg-white/90 transition-all duration-300">
                      <div className="font-bold text-green-800">{generatedChain.steps.length}</div>
                      <div className="text-green-600">Chain Steps</div>
                    </div>
                    <div className="text-center bg-white/70 border border-green-200 rounded-lg p-3 hover:bg-white/90 transition-all duration-300">
                      <div className="font-bold text-green-800">{(generatedChain.metadata.responseTime / 1000).toFixed(1)}s</div>
                      <div className="text-green-600">Generated In</div>
                    </div>
                    <div className="text-center bg-white/70 border border-green-200 rounded-lg p-3 hover:bg-white/90 transition-all duration-300">
                      <div className="font-bold text-green-800">{generatedChain.metadata.usage.totalTokens.toLocaleString()}</div>
                      <div className="text-green-600">Tokens Used</div>
                    </div>
                    <div className="text-center bg-white/70 border border-green-200 rounded-lg p-3 hover:bg-white/90 transition-all duration-300">
                      <div className="font-bold text-green-800">
                        {generatedChain.steps.reduce((total, step) => total + step.estimatedTokens.input, 0).toLocaleString()}
                      </div>
                      <div className="text-green-600">Est. Input Tokens</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {renderChainFlow()}
            
            {/* Enhanced Usage Instructions */}
            <div className="mt-6 pt-6 border-t border-green-200">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 p-4 rounded-lg shadow-sm">
                <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                  <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded mr-2">
                    <Link2 className="h-4 w-4 text-white" />
                  </div>
                  💡 How to Use This Chain:
                </h4>
                <ol className="text-sm text-blue-700 space-y-2">
                  <li><strong>1. Copy Step 1</strong> → Run in your AI tool → Save the output</li>
                  <li><strong>2. Copy Step 2</strong> → Replace "[OUTPUT FROM STEP 1]" with actual output → Run → Save output</li>
                  <li><strong>3. Continue</strong> → Each step builds on the previous one's output</li>
                  <li><strong>4. Result</strong> → Get a more thorough, well-structured final result</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 