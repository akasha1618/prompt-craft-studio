'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, GitBranch, Plus, Trash2, ArrowDown, Workflow, Copy, Type, FileText, X, Upload } from 'lucide-react'
import type { Prompt } from '@/types/database'
import StructuredPromptDisplay from '@/components/structured-prompt-display'

export default function EditPromptPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createSupabaseClient()
  
  const [prompt, setPrompt] = useState<Prompt | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [promptContent, setPromptContent] = useState<string | any>('')
  const [variables, setVariables] = useState<any[]>([])
  
  // Chained prompt state
  const [isChainedPrompt, setIsChainedPrompt] = useState(false)
  const [chainSteps, setChainSteps] = useState<any[]>([])
  const [targetModel, setTargetModel] = useState('gpt-4o')
  const [chainMetadata, setChainMetadata] = useState<any>(null)

  // Helper function to check if prompt content is valid
  const isValidPromptContent = (content: string | any): boolean => {
    if (typeof content === 'string') {
      return content.trim().length > 0
    }
    if (typeof content === 'object' && content !== null) {
      // For structured prompts, check if at least role and instructions exist
      return !!(content.role || content.instructions)
    }
    return false
  }

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
        setTitle(data.title)
        setDescription(data.description || '')
        
        // Check if this is a chained prompt
        const isChain = typeof data.content === 'object' && data.content.type === 'chain'
        setIsChainedPrompt(isChain)
        
        if (isChain) {
          // Load chained prompt data
          setChainSteps(data.content.chain.steps || [])
          setTargetModel(data.content.targetModel || 'gpt-4o')
          setChainMetadata(data.content.chain.metadata || null)
        } else {
          // Extract regular prompt content and variables
          const content = typeof data.content === 'object' && 'prompt' in data.content 
            ? data.content.prompt 
            : 'Legacy prompt format'
          setPromptContent(content)
          
          // Extract variables if they exist
          const vars = typeof data.content === 'object' && 'variables' in data.content 
            ? data.content.variables || []
            : []
          setVariables(vars)
        }
        
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt) return

    setSaving(true)

    try {
      let contentToSave
      
      if (isChainedPrompt) {
        // Save chained prompt format
        contentToSave = {
          type: 'chain',
          targetModel: targetModel,
          chain: {
            title: title.trim(),
            description: description.trim() || 'Chained prompt workflow',
            steps: chainSteps,
            metadata: chainMetadata
          }
        }
      } else {
        // Save regular prompt format with variables
        const promptToSave = typeof promptContent === 'string' 
          ? promptContent.trim() 
          : promptContent
        
        contentToSave = { 
          prompt: promptToSave,
          variables: variables
        }
      }

      const { error } = await supabase
        .from('prompts')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          content: contentToSave
        })
        .eq('id', prompt.id)

      if (error) {
        throw error
      }

      // Redirect back to the prompt view
      router.push(`/dashboard/prompts/${prompt.id}`)
    } catch (error) {
      console.error('Error saving prompt:', error)
      alert('Failed to save prompt. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Helper functions for managing chain steps
  const updateStep = (stepId: number, field: string, value: string) => {
    setChainSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, [field]: value } : step
    ))
  }

  const addStep = () => {
    const newStepId = Math.max(...chainSteps.map(s => s.id), 0) + 1
    const newStep = {
      id: newStepId,
      title: `Step ${newStepId}`,
      description: 'New step description',
      prompt: 'Enter your prompt here...',
      expectedOutput: 'Expected output description',
      connectsTo: newStepId < chainSteps.length + 1 ? [newStepId + 1] : [],
      estimatedTime: 3000,
      estimatedTokens: {
        input: 200,
        output: 150
      }
    }
    setChainSteps(prev => [...prev, newStep])
  }

  const removeStep = (stepId: number) => {
    if (chainSteps.length <= 1) {
      alert('A chain must have at least one step.')
      return
    }
    setChainSteps(prev => prev.filter(step => step.id !== stepId))
  }

  const moveStep = (stepId: number, direction: 'up' | 'down') => {
    const currentIndex = chainSteps.findIndex(step => step.id === stepId)
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === chainSteps.length - 1)
    ) {
      return
    }

    const newSteps = [...chainSteps]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    ;[newSteps[currentIndex], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[currentIndex]]
    setChainSteps(newSteps)
  }

  // Variable management functions
  const addVariable = () => {
    const newVar = {
      id: Date.now().toString(),
      name: `variable_${variables.length + 1}`,
      type: 'text' as const,
      value: ''
    }
    setVariables([...variables, newVar])
  }

  const removeVariable = (id: string) => {
    setVariables(variables.filter(v => v.id !== id))
  }

  const updateVariableValue = (id: string, value: string, fileName?: string) => {
    setVariables(variables.map(v => 
      v.id === id ? { ...v, value, fileName } : v
    ))
  }

  const updateVariableName = (id: string, name: string) => {
    setVariables(variables.map(v => 
      v.id === id ? { ...v, name } : v
    ))
  }

  const updateVariableType = (id: string, type: 'text' | 'document') => {
    setVariables(variables.map(v => 
      v.id === id ? { ...v, type, value: '' } : v
    ))
  }

  const handleFileUpload = async (id: string, file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      updateVariableValue(id, content, file.name)
    }
    reader.readAsText(file)
  }

  // Token counting function
  const countTokens = (text: string): number => {
    return Math.ceil(text.length / 4)
  }

  const calculateTotalTokens = (): number => {
    let baseTokens = 0
    
    // Handle both string and structured prompt formats
    if (typeof promptContent === 'string') {
      baseTokens = countTokens(promptContent)
    } else if (typeof promptContent === 'object' && promptContent !== null) {
      // For structured prompts, sum tokens from all sections
      baseTokens = Object.values(promptContent).reduce((total: number, section: any) => {
        return total + countTokens(String(section || ''))
      }, 0)
    }
    
    // Add tokens from variables
    const variableTokens = variables.reduce((total, variable) => {
      if (variable.value) {
        return total + countTokens(variable.value)
      }
      return total
    }, 0)
    
    return baseTokens + variableTokens
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
              {isChainedPrompt ? "Back to Chain" : "Back to Prompt"}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              {isChainedPrompt && <GitBranch className="h-6 w-6 mr-2 text-blue-600" />}
              {isChainedPrompt ? "Edit Chained Prompt" : "Edit Prompt"}
            </h1>
            <p className="text-gray-600 mt-1">
              {isChainedPrompt ? "Modify your prompt chain steps and configuration" : "Make changes to your prompt"}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the title and description of your prompt
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title for your prompt"
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this prompt does and when to use it"
                disabled={saving}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Content - Conditional based on prompt type */}
        {isChainedPrompt ? (
          // Chained Prompt Editor
          <div className="space-y-6">
            {/* Chain Configuration */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-900">
                  <GitBranch className="h-5 w-5" />
                  <span>Chain Configuration</span>
                </CardTitle>
                <CardDescription>Configure the overall chain settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="targetModel">Target Model</Label>
                    <Select onValueChange={(value) => setTargetModel(value)} value={targetModel} disabled={saving}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* OpenAI Models (2025) */}
                        <SelectItem value="gpt-5">GPT-5 (OpenAI) - Latest</SelectItem>
                        <SelectItem value="gpt-4.1">GPT-4.1 (OpenAI) - Enhanced</SelectItem>
                        <SelectItem value="gpt-4.5">GPT-4.5 (OpenAI) - Most Powerful</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o (OpenAI) - Fast & Efficient</SelectItem>
                        <SelectItem value="o1">o1 (OpenAI) - Reasoning Model</SelectItem>
                        <SelectItem value="gpt-4">GPT-4 (OpenAI) - Classic</SelectItem>
                        {/* Anthropic Models (2025) */}
                        <SelectItem value="claude-sonnet-4">Claude Sonnet 4 (Anthropic) - Latest 2025</SelectItem>
                        <SelectItem value="claude-3.7-sonnet">Claude 3.7 Sonnet (Anthropic) - Hybrid Reasoning</SelectItem>
                        <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet (Anthropic) - Balanced</SelectItem>
                        <SelectItem value="claude-opus-4">Claude Opus 4 (Anthropic) - Most Capable</SelectItem>
                        <SelectItem value="claude-3.5-haiku">Claude 3.5 Haiku (Anthropic) - Fast</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-3 bg-white rounded-lg border">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-800">{chainSteps.length}</div>
                      <div className="text-xs text-blue-700">Total Steps</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-800">
                        {chainSteps.reduce((total, step) => total + (step.estimatedTokens?.input || 0), 0)}
                      </div>
                      <div className="text-xs text-blue-700">Est. Input Tokens</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-800">
                        {(chainSteps.reduce((total, step) => total + (step.estimatedTime || 0), 0) / 1000).toFixed(1)}s
                      </div>
                      <div className="text-xs text-blue-700">Est. Total Time</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chain Steps Editor */}
            {chainSteps.map((step, index) => (
              <div key={step.id}>
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full font-bold text-lg shadow-lg">
                          {step.id}
                        </div>
                        <div className="flex-1">
                          <Input
                            value={step.title}
                            onChange={(e) => updateStep(step.id, 'title', e.target.value)}
                            placeholder="Step title"
                            className="font-semibold text-lg border-none p-0 focus:ring-0"
                            disabled={saving}
                          />
                          <Input
                            value={step.description}
                            onChange={(e) => updateStep(step.id, 'description', e.target.value)}
                            placeholder="Step description"
                            className="text-gray-600 border-none p-0 focus:ring-0 mt-1"
                            disabled={saving}
                          />
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeStep(step.id)}
                          disabled={saving || chainSteps.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Prompt Content */}
                    <div>
                      <Label className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                        <Workflow className="h-4 w-4 mr-2" />
                        Prompt Content:
                      </Label>
                      <Textarea
                        value={step.prompt}
                        onChange={(e) => updateStep(step.id, 'prompt', e.target.value)}
                        placeholder="Enter the prompt for this step..."
                        className="min-h-[120px] font-mono text-sm bg-gray-900 text-gray-100 border-gray-700"
                        disabled={saving}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use "[OUTPUT FROM STEP {index}]" to reference previous step outputs
                      </p>
                    </div>

                    {/* Expected Output */}
                    <div>
                      <Label className="text-sm font-semibold text-gray-800">Expected Output:</Label>
                      <Input
                        value={step.expectedOutput}
                        onChange={(e) => updateStep(step.id, 'expectedOutput', e.target.value)}
                        placeholder="Describe what this step should produce"
                        disabled={saving}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Connection Arrow */}
                {index < chainSteps.length - 1 && (
                  <div className="flex justify-center my-4">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-px h-4 bg-gradient-to-b from-blue-400 to-blue-600"></div>
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg">
                        <ArrowDown className="h-4 w-4 text-white" />
                      </div>
                      <div className="w-px h-4 bg-gradient-to-b from-blue-600 to-blue-400"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Step Button */}
            <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
              <CardContent className="p-6">
                <Button
                  type="button"
                  onClick={addStep}
                  variant="outline"
                  className="w-full"
                  disabled={saving}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Step
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Regular Prompt Editor
          <div className="space-y-6">
            <Card>
            <CardHeader>
              <CardTitle>Prompt Content</CardTitle>
              <CardDescription>
                Edit the actual prompt text that will be used with AI models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt Content</Label>
                {typeof promptContent === 'string' ? (
                  // Legacy string prompt editor
                  <>
                    <Textarea
                      id="prompt"
                      value={promptContent}
                      onChange={(e) => setPromptContent(e.target.value)}
                      placeholder="Enter your prompt text here..."
                      required
                      disabled={saving}
                      rows={12}
                      className="font-mono text-sm"
                    />
                    <p className="text-sm text-gray-500">
                      Characters: {promptContent.length} • Tokens: {calculateTotalTokens()}
                    </p>
                  </>
                ) : (
                  // Structured prompt editor
                  <>
                    <StructuredPromptDisplay 
                      prompt={promptContent}
                      editable={true}
                      onUpdate={(updatedPrompt: any) => {
                        setPromptContent(updatedPrompt)
                      }}
                    />
                    <p className="text-sm text-gray-500">
                      Structured Prompt • Tokens: {calculateTotalTokens()}
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Variables Section for Regular Prompts */}
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-purple-900">
                <div className="flex items-center space-x-2">
                  <Type className="h-5 w-5" />
                  <span>Variables ({variables.length})</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariable}
                  disabled={saving}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variable
                </Button>
              </CardTitle>
              <CardDescription>Add dynamic placeholders for your prompt</CardDescription>
            </CardHeader>
            <CardContent>
              {variables.length > 0 ? (
                <div className="space-y-4">
                  {variables.map((variable) => (
                    <div key={variable.id} className="border-l-4 border-l-purple-500 bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {variable.type === 'text' ? (
                            <Type className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-green-500" />
                          )}
                          <Input
                            value={variable.name}
                            onChange={(e) => updateVariableName(variable.id, e.target.value)}
                            placeholder="Variable name"
                            className="w-48 h-8"
                            disabled={saving}
                          />
                          <Select 
                            value={variable.type} 
                            onValueChange={(value: 'text' | 'document') => updateVariableType(variable.id, value)}
                            disabled={saving}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="document">Document</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariable(variable.id)}
                          disabled={saving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {variable.type === 'text' ? (
                        <Textarea
                          placeholder={`Enter value for {{${variable.name}}}`}
                          value={variable.value || ''}
                          onChange={(e) => updateVariableValue(variable.id, e.target.value)}
                          rows={3}
                          disabled={saving}
                        />
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              type="file"
                              accept=".txt,.md,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(variable.id, file)
                              }}
                              className="flex-1"
                              disabled={saving}
                            />
                            <Upload className="h-4 w-4 text-gray-400" />
                          </div>
                          {variable.fileName && (
                            <div className="text-sm text-green-600">
                              📄 {variable.fileName} uploaded
                            </div>
                          )}
                          {variable.value && (
                            <Textarea
                              placeholder="Document content will appear here..."
                              value={variable.value}
                              onChange={(e) => updateVariableValue(variable.id, e.target.value)}
                              rows={4}
                              className="text-sm"
                              disabled={saving}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {/* Token Summary */}
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-800">
                      <strong>Token Usage:</strong> {countTokens(promptContent)} base tokens
                      {variables.some((v: any) => v.value) && (
                        <span> + {variables.reduce((total, v) => 
                          total + (v.value ? countTokens(v.value) : 0), 0)} variable tokens</span>
                      )}
                      {' = '}
                      <strong>{calculateTotalTokens()} total tokens</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Type className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No variables added yet</p>
                  <p className="text-sm">Click "Add Variable" to create dynamic placeholders like {`{{variable_name}}`}</p>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Link href={`/dashboard/prompts/${prompt.id}`}>
            <Button type="button" variant="outline" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button 
            type="submit" 
            disabled={
              saving || 
              !title.trim() || 
              (isChainedPrompt ? chainSteps.length === 0 : !isValidPromptContent(promptContent))
            }
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 