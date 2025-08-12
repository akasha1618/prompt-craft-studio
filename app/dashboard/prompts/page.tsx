'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Plus, Search, BookOpen, Type, FileText, Clock, Calendar, ExternalLink, Edit, GitBranch, Zap, Copy, Trash2 } from 'lucide-react'
import PromptActions from '@/components/prompt-actions'
import type { Prompt } from '@/types/database'

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  // Token counting function
  const countTokens = (text: string): number => {
    return Math.ceil(text.length / 4)
  }

  // Calculate total tokens including all sections for structured prompts
  const calculateTotalTokens = (prompt: Prompt): number => {
    const content = prompt.content as any
    let baseTokens = 0
    
    // Handle legacy string format
    if (typeof content === 'string') {
      baseTokens = countTokens(content)
    }
    // Handle old format with content.prompt as string
    else if (content && typeof content === 'object' && content.prompt && typeof content.prompt === 'string') {
      baseTokens = countTokens(content.prompt)
    }
    // Handle new structured format - check if content.prompt is an object with sections
    else if (content && typeof content === 'object' && content.prompt && typeof content.prompt === 'object') {
      // Sum tokens from all structured sections (role, context, instructions, rules, output_format)
      baseTokens = Object.values(content.prompt).reduce((total: number, section: any) => {
        if (typeof section === 'string') {
          return total + countTokens(section)
        }
        return total
      }, 0)
    }
    // Handle direct structured format (where content itself has role, context, etc.)
    else if (content && typeof content === 'object' && (content.role || content.context || content.instructions)) {
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
    async function loadPrompts() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('prompts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (!error && data) {
          // Filter out chained prompts - My Prompts should only show single prompts
          const singlePrompts = data.filter(prompt => {
            const content = prompt.content as any
            return !(content && content.type === 'chain')
          })
          
          setPrompts(singlePrompts)
          setFilteredPrompts(singlePrompts)
        }
      } catch (error) {
        console.error('Error loading prompts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPrompts()
  }, [supabase])

  // Handle prompt deletion
  const handlePromptDelete = (deletedPromptId: string) => {
    // Remove the deleted prompt from local state and maintain single prompts filter
    setPrompts(prevPrompts => {
      const updated = prevPrompts.filter(prompt => prompt.id !== deletedPromptId)
      // Ensure we still only have single prompts (safety measure)
      return updated.filter(prompt => {
        const content = prompt.content as any
        return !(content && content.type === 'chain')
      })
    })
  }

  // Filter prompts based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPrompts(prompts)
    } else {
      const filtered = prompts.filter(prompt => 
        prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (prompt.description && prompt.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof prompt.content === 'object' && 'prompt' in prompt.content && 
         (prompt.content as any).prompt.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredPrompts(filtered)
    }
  }, [searchTerm, prompts])

  const promptCount = prompts.length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">My Prompts</h1>
          <p className="text-gray-600 mt-2">
            View and manage your prompt history ({promptCount} prompts)
          </p>
        </div>
        <Link href="/dashboard/create">
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 border-0">
            <Plus className="mr-2 h-4 w-4" />
            Create New Prompt
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search prompts by title, description, or content..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
                size="sm"
              >
                Clear
              </Button>
            )}
          </div>
          {searchTerm && (
            <div className="mt-3 text-sm text-gray-600">
              {filteredPrompts.length} of {promptCount} prompts match "{searchTerm}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Prompts Grid */}
      {filteredPrompts.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPrompts.map((prompt) => (
            <Card key={prompt.id} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-lg group">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center group-hover:text-blue-900 transition-colors duration-300">
                      <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded mr-2 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                        <FileText className="h-4 w-4 text-white" />
                      </div>
                      {prompt.title}
                    </CardTitle>
                    {prompt.description && (
                      <CardDescription className="mt-2 group-hover:text-gray-700 transition-colors duration-300">{prompt.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(JSON.stringify(prompt.content))}
                      className="border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      <Copy className="h-4 w-4 text-gray-600 hover:text-green-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePromptDelete(prompt.id)}
                      className="border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enhanced Prompt Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg shadow-sm">
                  <div className="text-center p-2 bg-white/70 border border-blue-200 rounded-lg hover:bg-white/90 transition-all duration-300">
                    <div className="text-lg font-bold text-blue-900">{calculateTotalTokens(prompt)}</div>
                    <div className="text-xs text-blue-600">Tokens</div>
                  </div>
                  <div className="text-center p-2 bg-white/70 border border-blue-200 rounded-lg hover:bg-white/90 transition-all duration-300">
                    <div className="text-lg font-bold text-blue-900">
                      {typeof prompt.content === 'object' && (prompt.content as any).variables?.length || 0}
                    </div>
                    <div className="text-xs text-blue-600">Variables</div>
                  </div>
                  <div className="text-center p-2 bg-white/70 border border-blue-200 rounded-lg hover:bg-white/90 transition-all duration-300">
                    <div className="text-lg font-bold text-blue-900">
                      {typeof prompt.content === 'object' && (prompt.content as any).prompt && typeof (prompt.content as any).prompt === 'object' ? 'Structured' : 'Simple'}
                    </div>
                    <div className="text-xs text-blue-600">Type</div>
                  </div>
                </div>

                {/* Enhanced Prompt Preview */}
                <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <div className="p-1 bg-gradient-to-br from-gray-500 to-blue-600 rounded mr-2">
                      <GitBranch className="h-3 w-3 text-white" />
                    </div>
                    Prompt Content:
                  </h4>
                  <div className="bg-white/70 border border-gray-200 rounded-md p-3 hover:bg-white/90 transition-all duration-300">
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {typeof prompt.content === 'object' && 'prompt' in prompt.content 
                        ? (typeof (prompt.content as any).prompt === 'string' 
                           ? (prompt.content as any).prompt 
                           : `Role: ${(prompt.content as any).prompt?.role || ''}\nInstructions: ${(prompt.content as any).prompt?.instructions || ''}`.substring(0, 200) + '...')
                        : 'Legacy prompt format'}
                    </p>
                  </div>
                  
                  {typeof prompt.content === 'object' && (prompt.content as any).prompt && typeof (prompt.content as any).prompt === 'object' && (
                    <div className="flex gap-1 flex-wrap">
                      <span className="inline-block bg-blue-100 border border-blue-200 text-blue-800 text-xs px-2 py-1 rounded-full">Role</span>
                      <span className="inline-block bg-green-100 border border-green-200 text-green-800 text-xs px-2 py-1 rounded-full">Context</span>
                      <span className="inline-block bg-orange-100 border border-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full">Instructions</span>
                      <span className="inline-block bg-red-100 border border-red-200 text-red-800 text-xs px-2 py-1 rounded-full">Rules</span>
                      <span className="inline-block bg-purple-100 border border-purple-200 text-purple-800 text-xs px-2 py-1 rounded-full">Output</span>
                    </div>
                  )}

                  {/* Variables Display */}
                  {typeof prompt.content === 'object' && (prompt.content as any).variables && (prompt.content as any).variables.length > 0 && (
                    <div className="mt-3">
                      <div className="flex flex-wrap gap-1">
                        {(prompt.content as any).variables.slice(0, 3).map((variable: any, index: number) => (
                          <span 
                            key={index} 
                            className="inline-block bg-yellow-100 border border-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full"
                          >
                            {`{{${variable.name}}}`}
                          </span>
                        ))}
                        {(prompt.content as any).variables.length > 3 && (
                          <span className="text-xs text-yellow-600 bg-yellow-100 border border-yellow-200 px-2 py-1 rounded-full">
                            +{(prompt.content as any).variables.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200 group-hover:border-gray-300 transition-colors duration-300">
                  <span className="flex items-center px-2 py-1 bg-gray-100 border border-gray-200 rounded-full">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(prompt.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center px-2 py-1 bg-gray-100 border border-gray-200 rounded-full">
                    <Clock className="h-3 w-3 mr-1" />
                    Recently updated
                  </span>
                </div>

                {/* Enhanced Actions */}
                <div className="flex space-x-2 pt-3">
                  <Link href={`/dashboard/test?promptId=${prompt.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test Prompt
                    </Button>
                  </Link>
                  <Link href={`/dashboard/prompts/${prompt.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-all duration-300 shadow-sm hover:shadow-md">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Prompt
                    </Button>
                  </Link>
                  <Link href={`/dashboard/prompts/${prompt.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : searchTerm ? (
        /* No Search Results */
        <Card>
          <CardContent className="text-center py-16">
            <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No prompts found</h2>
            <p className="text-gray-600 mb-6">
              No prompts match "{searchTerm}". Try a different search term or create a new prompt.
            </p>
            <div className="space-x-2">
              <Button onClick={() => setSearchTerm('')} variant="outline">
                Clear Search
              </Button>
              <Link href="/dashboard/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Prompt
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Empty State */
        <Card>
          <CardContent className="text-center py-16">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No prompts yet</h2>
            <p className="text-gray-600 mb-6">
              Create your first prompt to get started with AI-powered content generation.
            </p>
            <Link href="/dashboard/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Prompt
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      {prompts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prompt History Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{promptCount}</div>
                <div className="text-sm text-gray-600">Total Prompts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {prompts.filter(p => new Date(p.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </div>
                <div className="text-sm text-gray-600">This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">Versions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-gray-600">Tests Run</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 