'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Loader2, Plus, X, FileText, Type, Upload, CheckCircle } from 'lucide-react'
import StructuredPromptDisplay from '@/components/structured-prompt-display'

interface Variable {
  id: string
  name: string
  type: 'text' | 'document'
  value?: string
  fileName?: string
}

export default function CreatePromptPage() {
  const [goal, setGoal] = useState('')
  const [targetModel, setTargetModel] = useState('gpt-4o')
  const [loading, setLoading] = useState(false)
  const [variables, setVariables] = useState<Variable[]>([])
  const [newVariableName, setNewVariableName] = useState('')
  const [newVariableType, setNewVariableType] = useState<'text' | 'document'>('text')
  const [newVariableValue, setNewVariableValue] = useState('')
  const [generatedPrompt, setGeneratedPrompt] = useState<{
    title: string
    description: string
    prompt: any // Can be string (legacy) or structured object
  } | null>(null)
  const [saving, setSaving] = useState(false)
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

  // Variable management functions
  const addVariable = () => {
    if (!newVariableName.trim()) return
    
    const variable: Variable = {
      id: Date.now().toString(),
      name: newVariableName.trim(),
      type: newVariableType,
      value: newVariableValue.trim()
    }
    
    setVariables([...variables, variable])
    setNewVariableName('')
    setNewVariableValue('')
    setNewVariableType('text')
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
      v.id === id ? { ...v, type, value: '' } : v // Clear value when type changes
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

  // Function to detect {{}} variables in text and auto-create them
  const detectAndCreateVariables = useCallback((text: string) => {
    const variableRegex = /\{\{([^}]+)\}\}/g
    const matches = text.match(variableRegex)
    
    if (matches) {
      const newVariables: Variable[] = []
      const existingVariableNames = variables.map(v => v.name)
      
      matches.forEach(match => {
        const variableName = match.replace(/[{}]/g, '').trim()
        if (!existingVariableNames.includes(variableName) && !newVariables.find(v => v.name === variableName)) {
          newVariables.push({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: variableName,
            type: 'text',
            value: ''
          })
        }
      })
      
      if (newVariables.length > 0) {
        console.log('Auto-detected new variables:', newVariables.map(v => v.name))
        setVariables(prev => [...prev, ...newVariables])
      }
    }
  }, [variables])

  // Function to replace {{}} variables with their actual values
  const replaceVariablesInText = (text: string): string => {
    let result = text
    variables.forEach(variable => {
      if (variable.value) {
        const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g')
        result = result.replace(regex, variable.value)
      }
    })
    return result
  }

  // Function to get text with variables replaced for display
  const getDisplayText = (text: string): string => {
    return replaceVariablesInText(text)
  }

  // Auto-detect variables in goal text with proper debouncing
  useEffect(() => {
    if (goal.trim()) {
      const timeoutId = setTimeout(() => {
        detectAndCreateVariables(goal)
      }, 500) // Debounce to avoid too many calls while typing
      
      return () => clearTimeout(timeoutId)
    }
  }, [goal, detectAndCreateVariables])

  // Auto-detect variables from generated prompt
  useEffect(() => {
    if (generatedPrompt?.prompt) {
      let promptText = ''
      
      // Extract text from structured prompt
      if (typeof generatedPrompt.prompt === 'object') {
        promptText = Object.values(generatedPrompt.prompt).join(' ')
      } else {
        promptText = generatedPrompt.prompt
      }
      
      // Detect variables in the generated prompt
      detectAndCreateVariables(promptText)
    }
  }, [generatedPrompt, detectAndCreateVariables])

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
      const { openaiApiKey, anthropicApiKey } = await getApiKeys()

      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          goal, 
          targetModel,
          variables: variables.map(v => ({ name: v.name, type: v.type })), // Send variable definitions
          openaiApiKey, // Send OpenAI API key from database
          anthropicApiKey // Send Anthropic API key from database
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate prompt')
      }

      const data = await response.json()
      console.log('Received data from API:', JSON.stringify(data, null, 2))
      setGeneratedPrompt(data)
    } catch (error) {
      console.error('Error generating prompt:', error)
      alert('Failed to generate prompt. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!generatedPrompt) return

    setSaving(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      // Prepare the content with variables
      const content = {
        prompt: generatedPrompt.prompt,
        variables: variables.map(v => ({
          name: v.name,
          type: v.type,
          value: v.value || '',
          fileName: v.fileName
        }))
      }

      const { error } = await supabase
        .from('prompts')
        .insert({
          user_id: session.user.id,
          title: generatedPrompt.title,
          description: generatedPrompt.description,
          content: content,
        })

      if (error) throw error

      router.push('/dashboard/prompts')
    } catch (error) {
      console.error('Error saving prompt:', error)
      alert('Failed to save prompt. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Token counting function (rough estimation: 1 token ≈ 4 characters)
  const countTokens = (text: string): number => {
    return Math.ceil(text.length / 4)
  }

  // Calculate total tokens including variables
  const calculateTotalTokens = (): number => {
    if (!generatedPrompt) return 0
    
    let baseTokens = 0
    
    // Handle both structured and legacy string prompts
    if (typeof generatedPrompt.prompt === 'string') {
      baseTokens = countTokens(generatedPrompt.prompt)
    } else if (typeof generatedPrompt.prompt === 'object') {
      // Sum tokens from all structured sections
      const structuredPrompt = generatedPrompt.prompt as any
      baseTokens = Object.values(structuredPrompt).reduce((total: number, section: any) => {
        return total + countTokens(String(section || ''))
      }, 0)
    }
    
    // Add tokens from variable values
    const variableTokens = variables.reduce((total, variable) => {
      if (variable.value) {
        return total + countTokens(variable.value)
      }
      return total
    }, 0)
    
    return baseTokens + variableTokens
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Create New Prompt</h1>
        <p className="text-gray-600 mt-2">Describe what you need a prompt for, and AI will generate a structured prompt for you.</p>
      </div>

      <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-2 border-indigo-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-indigo-300 group">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-indigo-900 group-hover:text-indigo-950 transition-colors duration-300">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span>AI Prompt Generator</span>
          </CardTitle>
          <CardDescription className="text-indigo-700 group-hover:text-indigo-800 transition-colors duration-300">
            Tell us what you want to achieve, and we'll create a professional prompt for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goal" className="text-gray-700 font-medium">What do you need a prompt for?</Label>
                <Textarea
                  id="goal"
                  placeholder="e.g., Write engaging social media posts for a tech startup, Create a customer service chatbot response, Generate creative story ideas..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  required
                  disabled={loading}
                  rows={4}
                  className="border-2 border-gray-200 focus:border-indigo-400 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg rounded-lg"
                />
                <div className="text-sm text-indigo-700 bg-gradient-to-r from-indigo-50 to-blue-50 p-3 rounded-lg border-2 border-indigo-200 shadow-sm hover:shadow-md transition-all duration-300">
                  <strong>💡 Pro Tip:</strong> You can add variables by typing <code className="bg-indigo-100 border border-indigo-300 text-indigo-800 px-2 py-1 rounded-md">{`{{variable_name}}`}</code> in your goal. 
                  <br />
                  <span className="text-indigo-600">Example: "Create an essay about the research field: {`{{field}}`} with the output in target language: {`{{target_language}}`}"</span>
                </div>
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

              {/* Variables Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Variables (Optional)</Label>
                  <span className="text-sm text-gray-500">Add placeholders for dynamic content</span>
                </div>
                
                {/* Add Variable Form */}
                <div className="space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label htmlFor="variableName" className="text-sm">Variable Name</Label>
                      <Input
                        id="variableName"
                        placeholder="e.g., company_name, topic, etc."
                        value={newVariableName}
                        onChange={(e) => setNewVariableName(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div className="w-32">
                      <Label className="text-sm">Type</Label>
                      <Select value={newVariableType} onValueChange={(value: 'text' | 'document') => setNewVariableType(value)}>
                        <SelectTrigger>
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
                      variant="outline"
                      size="sm"
                      onClick={addVariable}
                      disabled={!newVariableName.trim() || loading}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  
                  {/* Value input for new variable */}
                  {newVariableName.trim() && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Label className="text-sm font-medium text-blue-900">
                        Value for {`{{${newVariableName.trim()}}}`}
                      </Label>
                      {newVariableType === 'text' ? (
                        <Textarea
                          placeholder={`Enter value for ${newVariableName.trim()}`}
                          value={newVariableValue}
                          onChange={(e) => setNewVariableValue(e.target.value)}
                          disabled={loading}
                          className="mt-2"
                          rows={3}
                        />
                      ) : (
                        <div className="mt-2">
                          <Input
                            type="file"
                            accept=".txt,.md,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = (event) => {
                                  const content = event.target?.result as string
                                  setNewVariableValue(content)
                                }
                                reader.readAsText(file)
                              }
                            }}
                            disabled={loading}
                          />
                          {newVariableValue && (
                            <Textarea
                              value={newVariableValue}
                              onChange={(e) => setNewVariableValue(e.target.value)}
                              disabled={loading}
                              className="mt-2"
                              rows={4}
                              placeholder="Document content will appear here..."
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Variables List */}
                {variables.length > 0 && (
                  <div className="space-y-3">
                    {variables.map((variable) => (
                      <div key={variable.id} className="p-4 bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md group">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {variable.type === 'text' ? (
                              <Type className="h-4 w-4 text-blue-500 group-hover:text-blue-600 transition-colors duration-300" />
                            ) : (
                              <FileText className="h-4 w-4 text-green-500 group-hover:text-green-600 transition-colors duration-300" />
                            )}
                            <span className="font-medium group-hover:text-gray-800 transition-colors duration-300">{`{{${variable.name}}}`}</span>
                            <span className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-300">({variable.type})</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeVariable(variable.id)}
                            disabled={loading}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all duration-300"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {variable.value && (
                          <div className="text-sm text-gray-600 bg-white/50 border border-gray-200 p-2 rounded-md group-hover:bg-white/70 transition-all duration-300">
                            <strong>Value:</strong> {variable.value.length > 100 ? `${variable.value.substring(0, 100)}...` : variable.value}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Generate Button */}
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-indigo-500 hover:border-indigo-400 hover:scale-[1.02]" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Prompt...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Prompt
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Generated Prompt Display */}
      {generatedPrompt && (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-emerald-900">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <span>Generated Prompt</span>
            </CardTitle>
            <CardDescription className="text-emerald-700">Your AI-generated prompt is ready to use</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-emerald-800">Title</Label>
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <p className="font-medium text-emerald-900">{generatedPrompt.title}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-emerald-800">Description</Label>
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                <p className="text-emerald-700">{generatedPrompt.description}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Generated Prompt</Label>
              <StructuredPromptDisplay 
                prompt={generatedPrompt.prompt}
                editable={true}
                variables={variables.map(v => ({ name: v.name, value: v.value || '' }))}
                onVariableDetected={detectAndCreateVariables}
                onUpdate={(updatedPrompt) => {
                  setGeneratedPrompt(prev => prev ? {
                    ...prev,
                    prompt: updatedPrompt
                  } : null)
                }}
              />
            </div>

            {/* Variable Input Section */}
            <div className="space-y-4">
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Variables</Label>
                    <p className="text-sm text-gray-600 mt-1">Add and fill variables for your prompt</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Add a new variable after generation
                      const newVar: Variable = {
                        id: Date.now().toString(),
                        name: `variable_${variables.length + 1}`,
                        type: 'text'
                      }
                      setVariables([...variables, newVar])
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Variable
                  </Button>
                </div>
              </div>
              
              {variables.length > 0 && (
                <div className="space-y-4">
                  {variables.map((variable) => (
                    <div key={variable.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
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
                          />
                          <Select 
                            value={variable.type} 
                            onValueChange={(value: 'text' | 'document') => updateVariableType(variable.id, value)}
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
                            />
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {variables.length === 0 && (
                <div className="text-center py-6 text-emerald-600 border-2 border-dashed border-emerald-200 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50">
                  <Type className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                  <p className="font-medium">No variables added yet</p>
                  <p className="text-sm">Click "Add Variable" to create dynamic placeholders in your prompt</p>
                </div>
              )}
            </div>

                         <div className="flex justify-between pt-4 border-t border-emerald-200">
               <div className="text-sm text-emerald-700 space-y-1">
                 <div>✨ Optimized for: <strong className="text-emerald-800">{models.find(m => m.value === targetModel)?.label}</strong></div>
                 <div>🔢 Total tokens: <strong className="text-emerald-800">{calculateTotalTokens()}</strong> 
                   {variables.some(v => v.value) && (
                     <span className="text-xs text-emerald-600 ml-2">
                       (includes {variables.reduce((total, v) => total + (v.value ? countTokens(v.value) : 0), 0)} from variables)
                     </span>
                   )}
                 </div>
               </div>
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0"
                size="lg"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Prompt'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 