'use client'

import React, { useState, useEffect } from 'react'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Beaker, 
  Search, 
  Edit, 
  Save, 
  History, 
  GitBranch, 
  Clock, 
  FileText, 
  ArrowLeft, 
  Plus,
  Eye,
  Loader2,
  Type,
  X,
  BookOpen,
  ChevronRight
} from 'lucide-react'
import StructuredPromptDisplay from '@/components/structured-prompt-display'
import Link from 'next/link'
import type { Prompt } from '@/types/database'

interface PromptVersion {
  id: string
  title: string
  description: string | null
  content: any
  created_at: string
  parent_id: string
  version: number
}

export default function PromptLabPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [chainedPrompts, setChainedPrompts] = useState<Prompt[]>([])
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([])
  const [editingPrompt, setEditingPrompt] = useState('')
  const [editingTitle, setEditingTitle] = useState('')
  const [editingDescription, setEditingDescription] = useState('')
  const [editingVariables, setEditingVariables] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [chainSearchTerm, setChainSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showVersions, setShowVersions] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const supabase = createSupabaseClient()

  // Token counting function
  const countTokens = (text: string): number => {
    return Math.ceil(text.length / 4)
  }

  // Calculate total tokens including all sections for structured prompts
  const calculateTotalTokens = (prompt: Prompt): number => {
    const content = prompt.content as any
    let baseTokens = 0
    
    // Handle chained prompts - sum tokens from all steps
    if (content && content.type === 'chain' && content.chain && content.chain.steps) {
      baseTokens = content.chain.steps.reduce((total: number, step: any) => {
        return total + countTokens(step.prompt || '')
      }, 0)
    }
    // Handle legacy string format
    else if (typeof content === 'string') {
      baseTokens = countTokens(content)
    }
    // Handle old format with content.prompt
    else if (content && typeof content === 'object' && content.prompt && typeof content.prompt === 'string') {
      baseTokens = countTokens(content.prompt)
    }
    // Handle new structured format (role, context, instructions, rules, output_format)
    else if (content && typeof content === 'object' && content.prompt && typeof content.prompt === 'object') {
      // Sum tokens from all structured sections
      baseTokens = Object.values(content.prompt).reduce((total: number, section: any) => {
        if (typeof section === 'string') {
          return total + countTokens(section)
        }
        return total
      }, 0)
    }
    // Handle direct structured format
    else if (content && typeof content === 'object') {
      // Sum tokens from all structured sections
      baseTokens = Object.values(content).reduce((total: number, section: any) => {
        if (typeof section === 'string') {
          return total + countTokens(section)
        }
        return total
      }, 0)
    }
    
    // Add tokens from variables if they exist
    if (content && content.variables && Array.isArray(content.variables)) {
      const variableTokens = content.variables.reduce((total: number, variable: any) => {
        if (variable.value) {
          return total + countTokens(variable.value)
        }
        return total
      }, 0)
      return baseTokens + variableTokens
    }
    
    return baseTokens
  }

  // Load user's prompts
  useEffect(() => {
    loadPrompts()
  }, [])

  const loadPrompts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        // Separate regular prompts and chained prompts
        const regularPrompts = data.filter(p => (p.content as any)?.type !== 'chain')
        const chains = data.filter(p => (p.content as any)?.type === 'chain')
        
        console.log('Lab: Loaded total prompts:', data.length)
        console.log('Lab: Regular prompts:', regularPrompts.length)
        console.log('Lab: Chained prompts:', chains.length)
        
        setPrompts(regularPrompts)
        setChainedPrompts(chains)
      }
    } catch (error) {
      console.error('Error loading prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPromptVersions = async (promptId: string) => {
    try {
      console.log('Loading versions for prompt:', promptId)
      
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .or(`id.eq.${promptId},parent_id.eq.${promptId}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading versions:', error)
        return
      }

      if (data) {
        console.log('Raw version data:', data)
        
        const versions = data.map((p, index) => ({
          ...p,
          version: data.length - index,
          parent_id: p.id === promptId ? null : promptId
        }))
        
        console.log('Processed versions:', versions)
        setPromptVersions(versions)
      }
    } catch (error) {
      console.error('Error loading prompt versions:', error)
    }
  }

  const selectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt)
    
    // Check if this is a chained prompt
    const isChainedPrompt = (prompt.content as any)?.type === 'chain'
    
    if (isChainedPrompt) {
      // For chained prompts, we don't have a simple "prompt" field
      // The content is structured as chain with steps
      setEditingPrompt('') // Leave empty for chains since they have steps
      setEditingVariables([]) // Chains don't use variables in the same way
    } else {
      // Handle regular prompts (both string and structured prompt formats)
      const promptContent = typeof prompt.content.prompt === 'string' 
        ? prompt.content.prompt 
        : JSON.stringify(prompt.content.prompt)
      setEditingPrompt(promptContent)
      setEditingVariables((prompt.content as any).variables || [])
    }
    
    setEditingTitle(prompt.title)
    setEditingDescription(prompt.description || '')
    setEditMode(false)
    setShowVersions(false)
    loadPromptVersions(prompt.id)
  }

  const saveNewVersion = async () => {
    if (!selectedPrompt) {
      alert('No prompt selected')
      return
    }

    if (!editingTitle.trim()) {
      alert('Please enter a title for the new version')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Not authenticated')
      }

      // Handle both string and structured prompt formats
      let promptToSave
      try {
        // Try to parse as JSON (structured format)
        promptToSave = JSON.parse(editingPrompt)
      } catch {
        // If parsing fails, treat as string (legacy format)
        promptToSave = editingPrompt
      }

      const newContent = {
        prompt: promptToSave,
        variables: editingVariables
      }

      console.log('Saving new version with data:', {
        user_id: user.id,
        title: editingTitle,
        description: editingDescription,
        content: newContent,
        parent_id: selectedPrompt.id
      })

      const { data, error } = await supabase
        .from('prompts')
        .insert({
          user_id: user.id,
          title: editingTitle,
          description: editingDescription,
          content: newContent,
          parent_id: selectedPrompt.id
        })
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('New version saved successfully:', data)

      // Reload versions and prompts
      await loadPromptVersions(selectedPrompt.id)
      await loadPrompts()
      setEditMode(false)
      alert('New version saved successfully!')
      
    } catch (error: any) {
      console.error('Error saving new version:', error)
      alert(`Failed to save new version: ${error.message || 'Unknown error'}. Please try again.`)
    } finally {
      setSaving(false)
    }
  }

  const updateVariableValue = (index: number, value: string) => {
    const updated = [...editingVariables]
    updated[index] = { ...updated[index], value }
    setEditingVariables(updated)
  }

  // Removed duplicate function - using the one defined earlier

  const filteredPrompts = prompts.filter(prompt =>
    prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <Beaker className="h-8 w-8 text-white" />
          </div>
          Prompt Lab
        </h1>
        <p className="text-gray-600 mt-2">Experiment, refine, and version control your prompts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prompt List */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-purple-900">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-gradient-to-br from-purple-500 to-pink-600 rounded">
                  <BookOpen className="h-4 w-4 text-white" />
                </div>
                <span>Your Prompts</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoading(true)
                    loadPrompts()
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Refresh'
                  )}
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search prompts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardTitle>
            <CardDescription>Select a prompt to start experimenting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  onClick={() => selectPrompt(prompt)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedPrompt?.id === prompt.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{prompt.title}</h3>
                      {prompt.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{prompt.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(prompt.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {calculateTotalTokens(prompt)} tokens
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredPrompts.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  <Beaker className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No prompts available for the lab</p>
                  <p className="text-sm mb-4">Create regular prompts to experiment with them here</p>
                  <div className="space-y-2">
                    <Link href="/dashboard/create">
                      <Button size="sm" className="mr-2">
                        <Plus className="h-4 w-4 mr-1" />
                        Create Prompt
                      </Button>
                    </Link>
                    <Link href="/dashboard/prompts">
                      <Button variant="outline" size="sm">
                        <BookOpen className="h-4 w-4 mr-1" />
                        View All Prompts
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Prompt Editor */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-blue-900">
              {selectedPrompt ? (
                <div className="flex items-center gap-2">
                  {editMode ? (
                    <Edit className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-600" />
                  )}
                  <span>{editMode ? 'Editing' : 'Viewing'}: {selectedPrompt.title}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded">
                    <GitBranch className="h-4 w-4 text-white" />
                  </div>
                  <span>Chained Prompts</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {!selectedPrompt && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLoading(true)
                        loadPrompts()
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Refresh'
                      )}
                    </Button>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search chains..."
                        value={chainSearchTerm}
                        onChange={(e) => setChainSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                  </>
                )}
                {selectedPrompt && (
                  <div className="flex gap-2">
                    <Button
                      variant={showVersions ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowVersions(!showVersions)}
                      className={showVersions ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                    >
                      <History className="h-4 w-4 mr-1" />
                      Versions ({promptVersions.length})
                    </Button>
                    {!editMode ? (
                      <Button
                        size="sm"
                        onClick={() => setEditMode(true)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditMode(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={saveNewVersion}
                          disabled={saving}
                        >
                          {saving ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4 mr-1" />
                          )}
                          Save Version
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardTitle>
            {selectedPrompt ? (
              <CardDescription>
                {editMode ? 'Make changes and save as a new version' : 'View and analyze your prompt'}
              </CardDescription>
            ) : (
              <CardDescription>Select a prompt-chain to start experimenting</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedPrompt ? (
              <div className="space-y-4">
                {/* Title and Description */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    {editMode ? (
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        placeholder="Prompt title"
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md font-medium">{selectedPrompt.title}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    {editMode ? (
                      <Textarea
                        value={editingDescription}
                        onChange={(e) => setEditingDescription(e.target.value)}
                        placeholder="Describe what this prompt does"
                        rows={2}
                      />
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md text-gray-700">
                        {selectedPrompt.description || 'No description'}
                      </div>
                    )}
                  </div>
                </div>

                {/* Prompt Content */}
                <div className="space-y-2">
                  <Label>
                    {(selectedPrompt.content as any)?.type === 'chain' ? 'Chain Steps' : 'Prompt Content'}
                  </Label>
                  
                  {(selectedPrompt.content as any)?.type === 'chain' ? (
                    /* Chained Prompt Display */
                    <div className="space-y-4 p-4 border border-purple-200 rounded-lg bg-gradient-to-r from-purple-25 to-pink-25">
                      {/* Chain Info */}
                      <div className="grid grid-cols-3 gap-4 p-3 bg-purple-50 rounded-lg">
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-900">
                            {(selectedPrompt.content as any)?.chain?.steps?.length || 0}
                          </div>
                          <div className="text-xs text-purple-600">Steps</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-900">
                            {(selectedPrompt.content as any)?.chain?.metadata?.usage?.totalTokens?.toLocaleString() || 'N/A'}
                          </div>
                          <div className="text-xs text-purple-600">Total Tokens</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-900">
                            {(selectedPrompt.content as any)?.targetModel || 'N/A'}
                          </div>
                          <div className="text-xs text-purple-600">Target Model</div>
                        </div>
                      </div>

                      {/* Chain Steps */}
                      {(selectedPrompt.content as any)?.chain?.steps && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-purple-900">Chain Workflow:</h4>
                          <div className="space-y-3">
                            {(selectedPrompt.content as any).chain.steps.map((step: any, index: number) => (
                              <div key={step.id} className="border border-purple-200 rounded-lg p-4 bg-white">
                                <div className="flex items-start gap-3">
                                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">
                                    {step.id}
                                  </div>
                                  <div className="flex-1 space-y-2">
                                    <h5 className="font-medium text-purple-900">{step.title}</h5>
                                    {step.description && (
                                      <p className="text-sm text-purple-700">{step.description}</p>
                                    )}
                                    <div className="bg-gray-50 p-3 rounded text-sm">
                                      <div className="font-medium text-gray-700 mb-1">Prompt:</div>
                                      <div className="text-gray-600 font-mono text-xs break-words">
                                        {step.prompt?.substring(0, 200)}
                                        {step.prompt?.length > 200 && '...'}
                                      </div>
                                    </div>
                                    {step.expectedOutput && (
                                      <div className="bg-blue-50 p-3 rounded text-sm">
                                        <div className="font-medium text-blue-700 mb-1">Expected Output:</div>
                                        <div className="text-blue-600 text-xs">
                                          {step.expectedOutput?.substring(0, 150)}
                                          {step.expectedOutput?.length > 150 && '...'}
                                        </div>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-4 text-xs text-purple-500">
                                      <span>⏱️ ~{step.estimatedTime}min</span>
                                      <span>🔤 ~{step.estimatedTokens?.input + step.estimatedTokens?.output || 0} tokens</span>
                                    </div>
                                  </div>
                                </div>
                                {index < (selectedPrompt.content as any).chain.steps.length - 1 && (
                                  <div className="flex justify-center mt-3">
                                    <div className="flex items-center">
                                      <ChevronRight className="h-5 w-5 text-purple-400" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Regular Prompt Display */
                    editMode ? (
                      typeof selectedPrompt.content.prompt === 'string' ? (
                        <Textarea
                          value={editingPrompt}
                          onChange={(e) => setEditingPrompt(e.target.value)}
                          rows={12}
                          className="font-mono text-sm"
                        />
                      ) : (
                        <StructuredPromptDisplay
                          prompt={selectedPrompt.content.prompt}
                          editable={true}
                          onUpdate={(updatedPrompt) => {
                            setEditingPrompt(JSON.stringify(updatedPrompt))
                          }}
                        />
                      )
                    ) : (
                      <StructuredPromptDisplay
                        prompt={selectedPrompt.content.prompt}
                        editable={false}
                      />
                    )
                  )}
                </div>

                {/* Variables */}
                {editingVariables.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Variables ({editingVariables.length})</Label>
                      {editMode && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newVar = {
                              id: Date.now().toString(),
                              name: `variable_${editingVariables.length + 1}`,
                              type: 'text' as const,
                              value: ''
                            }
                            setEditingVariables([...editingVariables, newVar])
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Variable
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {editingVariables.map((variable, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {variable.type === 'text' ? (
                                <Type className="h-4 w-4 text-blue-500" />
                              ) : (
                                <FileText className="h-4 w-4 text-green-500" />
                              )}
                              {editMode ? (
                                <div className="flex gap-2">
                                  <Input
                                    value={variable.name}
                                    onChange={(e) => {
                                      const updated = [...editingVariables]
                                      updated[index] = { ...updated[index], name: e.target.value }
                                      setEditingVariables(updated)
                                    }}
                                    placeholder="Variable name"
                                    className="w-40 h-8"
                                  />
                                  <Select 
                                    value={variable.type} 
                                    onValueChange={(value: 'text' | 'document') => {
                                      const updated = [...editingVariables]
                                      updated[index] = { ...updated[index], type: value }
                                      setEditingVariables(updated)
                                    }}
                                  >
                                    <SelectTrigger className="w-24 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Text</SelectItem>
                                      <SelectItem value="document">Document</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : (
                                <span className="font-medium">{variable.name} ({variable.type})</span>
                              )}
                            </div>
                            {editMode && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingVariables(editingVariables.filter((_, i) => i !== index))
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <Textarea
                            placeholder={`Enter value for {{${variable.name}}}`}
                            value={variable.value || ''}
                            onChange={(e) => updateVariableValue(index, e.target.value)}
                            rows={3}
                            disabled={!editMode}
                            className={editMode ? '' : 'bg-gray-50'}
                          />
                          
                          {variable.fileName && (
                            <div className="text-xs text-green-600 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {variable.fileName}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="font-medium text-blue-900">Total Tokens</div>
                      <div className="text-xl font-bold text-blue-700">{selectedPrompt ? calculateTotalTokens(selectedPrompt) : 0}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="font-medium text-green-900">Variables</div>
                      <div className="text-xl font-bold text-green-700">{editingVariables.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Chained Prompts Display */}
                <div className="space-y-4">
                  <Label className="text-base font-medium">Available Chained Prompts</Label>
                  
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                      <span className="ml-2 text-gray-500">Loading chained prompts...</span>
                    </div>
                  ) : chainedPrompts.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {chainedPrompts
                        .filter(chain => 
                          !chainSearchTerm.trim() || 
                          chain.title.toLowerCase().includes(chainSearchTerm.toLowerCase()) ||
                          (chain.description && chain.description.toLowerCase().includes(chainSearchTerm.toLowerCase()))
                        )
                        .map((chain) => (
                        <div
                          key={chain.id}
                          onClick={() => selectPrompt(chain)}
                          className="p-4 border border-purple-200 rounded-lg cursor-pointer transition-all hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm bg-gradient-to-r from-purple-25 to-pink-25"
                        >
                          <div className="space-y-3">
                            {/* Chain Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-purple-900 mb-1 flex items-center gap-2">
                                  <GitBranch className="h-4 w-4" />
                                  {chain.title}
                                </h3>
                                {chain.description && (
                                  <p className="text-sm text-purple-700 mb-2 line-clamp-2">{chain.description}</p>
                                )}
                              </div>
                              <div className="flex items-center text-purple-600">
                                <Edit className="h-4 w-4" />
                              </div>
                            </div>

                            {/* Chain Stats */}
                            <div className="grid grid-cols-3 gap-2 p-2 bg-purple-50 rounded text-xs">
                              <div className="text-center">
                                <div className="font-bold text-purple-900">{(chain.content as any)?.chain?.steps?.length || 0}</div>
                                <div className="text-purple-600">Steps</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-purple-900">
                                  {(chain.content as any)?.chain?.metadata?.usage?.totalTokens?.toLocaleString() || 'N/A'}
                                </div>
                                <div className="text-purple-600">Tokens</div>
                              </div>
                              <div className="text-center">
                                <div className="font-bold text-purple-900">{(chain.content as any)?.targetModel || 'N/A'}</div>
                                <div className="text-purple-600">Model</div>
                              </div>
                            </div>

                            {/* Chain Steps Preview */}
                            {(chain.content as any)?.chain?.steps && (
                              <div className="space-y-2">
                                <h4 className="text-xs font-medium text-purple-700">Chain Steps:</h4>
                                <div className="flex items-center space-x-1 flex-wrap">
                                  {(chain.content as any).chain.steps.slice(0, 3).map((step: any, index: number) => (
                                    <div key={step.id} className="flex items-center space-x-1">
                                      <div className="flex items-center justify-center w-5 h-5 bg-purple-100 text-purple-600 rounded-full text-xs font-semibold">
                                        {step.id}
                                      </div>
                                      <span className="text-xs text-purple-700 truncate max-w-20">{step.title}</span>
                                      {index < Math.min((chain.content as any).chain.steps.length - 1, 2) && (
                                        <ChevronRight className="h-3 w-3 text-purple-400" />
                                      )}
                                    </div>
                                  ))}
                                  {(chain.content as any).chain.steps.length > 3 && (
                                    <span className="text-xs text-purple-500">
                                      +{(chain.content as any).chain.steps.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center justify-between text-xs text-purple-500 pt-2 border-t border-purple-200">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(chain.created_at).toLocaleDateString()}
                              </span>
                              {(chain.content as any)?.chain?.metadata && (
                                <span className="flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {((chain.content as any).chain.metadata.responseTime / 1000).toFixed(1)}s
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border border-dashed border-purple-200 rounded-lg bg-gradient-to-r from-purple-25 to-pink-25">
                      <GitBranch className="h-12 w-12 mx-auto mb-4 text-purple-300" />
                      <p className="font-medium mb-2">No chained prompts yet</p>
                      <p className="text-sm mb-4">Create your first prompt chain to get started</p>
                      <Link href="/dashboard/chains">
                        <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
                          <GitBranch className="h-4 w-4 mr-1" />
                          Create Chain
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Version History */}
      {selectedPrompt && showVersions && promptVersions.length > 0 && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <GitBranch className="h-5 w-5" />
              Version History for "{selectedPrompt.title}"
            </CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription>Click any version to load it for editing</CardDescription>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => selectedPrompt && loadPromptVersions(selectedPrompt.id)}
              >
                <History className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {promptVersions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    // Handle both string and structured prompt formats
                    const promptContent = typeof version.content.prompt === 'string' 
                      ? version.content.prompt 
                      : JSON.stringify(version.content.prompt)
                    
                    setEditingPrompt(promptContent)
                    setEditingTitle(version.title)
                    setEditingDescription(version.description || '')
                    setEditingVariables((version.content as any).variables || [])
                    setEditMode(true) // Enter edit mode when loading a version
                    
                    // Show feedback
                    alert(`Loaded version ${version.version} created on ${new Date(version.created_at).toLocaleDateString()}`)
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold">
                      v{version.version}
                    </div>
                    <div>
                      <div className="font-medium">{version.title}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(version.created_at).toLocaleDateString()} at {new Date(version.created_at).toLocaleTimeString()} • {(() => {
                          // Calculate tokens for version
                          const content = version.content as any
                          let baseTokens = 0
                          
                          if (typeof content.prompt === 'string') {
                            baseTokens = countTokens(content.prompt)
                          } else if (typeof content.prompt === 'object') {
                            baseTokens = Object.values(content.prompt || {}).reduce((total: number, section: any) => {
                              return total + countTokens(String(section || ''))
                            }, 0)
                          }
                          
                          if (content.variables) {
                            const variableTokens = content.variables.reduce((total: number, variable: any) => {
                              if (variable.value) {
                                return total + countTokens(variable.value)
                              }
                              return total
                            }, 0)
                            return baseTokens + variableTokens
                          }
                          
                          return baseTokens
                        })()} tokens
                      </div>
                      {version.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {version.description}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-600">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Load Version</span>
                  </div>
                </div>
              ))}
            </div>
            {promptVersions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <GitBranch className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium">No versions yet</p>
                <p className="text-sm">Save changes to create the first version</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 