'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { GitBranch, Search, Clock, Zap, ExternalLink, Copy, Trash2, Loader2, Calendar, ChevronRight, Edit } from 'lucide-react'
interface ChainedPrompt {
  id: string
  user_id: string
  title: string
  description: string | null
  created_at: string
  content: {
    type: 'chain'
    chain: {
      title: string
      description: string
      steps: Array<{
        id: number
        title: string
        description: string
        prompt: string
        expectedOutput: string
        connectsTo: number[]
        estimatedTime?: number
        estimatedTokens?: {
          input: number
          output: number
        }
      }>
      metadata?: {
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
    }
    targetModel: string
  }
}

export default function ChainedPromptsHistoryPage() {
  const [chainedPrompts, setChainedPrompts] = useState<ChainedPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null)
  const supabase = createSupabaseClient()

  useEffect(() => {
    loadChainedPrompts()
  }, [])

  const loadChainedPrompts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .eq('user_id', user.id)
        .eq('content->>type', 'chain')
        .order('created_at', { ascending: false })

      if (error) throw error

      setChainedPrompts(data as ChainedPrompt[])
    } catch (error) {
      console.error('Error loading chained prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredChains = chainedPrompts.filter(chain =>
    chain.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chain.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCopyChain = async (chain: ChainedPrompt) => {
    const chainText = chain.content.chain.steps
      .map((step, index) => `Step ${step.id}: ${step.title}\n${step.prompt}\n`)
      .join('\n---\n\n')
    
    try {
      await navigator.clipboard.writeText(chainText)
      setCopiedPrompt(chain.id)
      setTimeout(() => setCopiedPrompt(null), 2000)
    } catch (error) {
      console.error('Failed to copy chain:', error)
    }
  }

  const handleDeleteChain = async (chainId: string) => {
    if (!confirm('Are you sure you want to delete this chained prompt?')) return

    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', chainId)

      if (error) throw error

      setChainedPrompts(prev => prev.filter(chain => chain.id !== chainId))
    } catch (error) {
      console.error('Error deleting chained prompt:', error)
      alert('Failed to delete chained prompt. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Enhanced Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Chained Prompts History</h1>
        <p className="text-gray-600 mt-2">View and manage your sequential prompt workflows</p>
      </div>

      {/* Enhanced Search and Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-100 border-2 border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 h-4 w-4" />
          <Input
            placeholder="Search chained prompts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-2 border-blue-200 focus:border-blue-400 transition-all duration-300 shadow-sm hover:shadow-md bg-white/70 backdrop-blur"
          />
        </div>
        
        <div className="flex items-center space-x-6 text-sm">
          <span className="flex items-center px-3 py-1 bg-white/70 border border-blue-300 rounded-full text-blue-700 font-medium">
            <GitBranch className="h-4 w-4 mr-2" />
            {filteredChains.length} chains
          </span>
          <span className="flex items-center px-3 py-1 bg-white/70 border border-blue-300 rounded-full text-blue-700 font-medium">
            <Zap className="h-4 w-4 mr-2" />
            {filteredChains.reduce((total, chain) => total + chain.content.chain.steps.length, 0)} total steps
          </span>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-purple-300 group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-purple-900 group-hover:text-purple-950 transition-colors duration-300 flex items-center">
                <div className="p-1 bg-gradient-to-br from-purple-500 to-pink-600 rounded mr-2">
                  <GitBranch className="h-4 w-4 text-white" />
                </div>
                Quick Actions
              </h3>
              <p className="text-sm text-purple-700 group-hover:text-purple-800 transition-colors duration-300">Create new chained prompts or test existing ones</p>
            </div>
            <div className="flex space-x-3">
              <Link href="/dashboard/chains">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md hover:shadow-lg transition-all duration-300 border border-purple-500 hover:border-purple-400 hover:scale-105">
                  <GitBranch className="mr-2 h-4 w-4" />
                  Create New Chain
                </Button>
              </Link>
              <Link href="/dashboard/test">
                <Button variant="outline" className="border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 shadow-sm hover:shadow-md hover:scale-105">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Test Chains
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chained Prompts Grid */}
      {filteredChains.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <GitBranch className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No matching chains found' : 'No chained prompts yet'}
            </h2>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms or create a new chained prompt.'
                : 'Create your first chained prompt to get started with sequential AI workflows.'
              }
            </p>
            <Link href="/dashboard/chains">
              <Button>
                <GitBranch className="mr-2 h-4 w-4" />
                Create First Chain
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredChains.map((chain) => (
            <Card key={chain.id} className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 shadow-lg group">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center group-hover:text-blue-900 transition-colors duration-300">
                      <div className="p-1 bg-gradient-to-br from-blue-500 to-indigo-600 rounded mr-2 shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                        <GitBranch className="h-4 w-4 text-white" />
                      </div>
                      {chain.title}
                    </CardTitle>
                    {chain.description && (
                      <CardDescription className="mt-2 group-hover:text-gray-700 transition-colors duration-300">{chain.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyChain(chain)}
                      className="border-2 border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      {copiedPrompt === chain.id ? (
                        <span className="text-green-600 font-medium">Copied!</span>
                      ) : (
                        <Copy className="h-4 w-4 text-gray-600 hover:text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteChain(chain.id)}
                      className="border-2 border-gray-200 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Enhanced Chain Stats */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-lg shadow-sm">
                  <div className="text-center p-2 bg-white/70 border border-blue-200 rounded-lg hover:bg-white/90 transition-all duration-300">
                    <div className="text-lg font-bold text-blue-900">{chain.content.chain.steps.length}</div>
                    <div className="text-xs text-blue-600">Steps</div>
                  </div>
                  <div className="text-center p-2 bg-white/70 border border-blue-200 rounded-lg hover:bg-white/90 transition-all duration-300">
                    <div className="text-lg font-bold text-blue-900">
                      {chain.content.chain.metadata?.usage.totalTokens.toLocaleString() || 'N/A'}
                    </div>
                    <div className="text-xs text-blue-600">Tokens</div>
                  </div>
                  <div className="text-center p-2 bg-white/70 border border-blue-200 rounded-lg hover:bg-white/90 transition-all duration-300">
                    <div className="text-lg font-bold text-blue-900">{chain.content.targetModel}</div>
                    <div className="text-xs text-blue-600">Target Model</div>
                  </div>
                </div>

                {/* Enhanced Chain Steps Preview */}
                <div className="space-y-3 p-4 bg-gradient-to-br from-gray-50 to-blue-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center">
                    <div className="p-1 bg-gradient-to-br from-gray-500 to-blue-600 rounded mr-2">
                      <GitBranch className="h-3 w-3 text-white" />
                    </div>
                    Chain Steps:
                  </h4>
                  <div className="space-y-2">
                    {chain.content.chain.steps.slice(0, 3).map((step, index) => (
                      <div key={step.id} className="flex items-center space-x-2 text-sm p-2 bg-white/70 border border-gray-200 rounded-md hover:bg-white/90 transition-all duration-300">
                        <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full text-xs font-semibold shadow-sm">
                          {step.id}
                        </div>
                        <span className="text-gray-700 truncate flex-1">{step.title}</span>
                        {index < Math.min(chain.content.chain.steps.length - 1, 2) && (
                          <ChevronRight className="h-3 w-3 text-blue-500" />
                        )}
                      </div>
                    ))}
                    {chain.content.chain.steps.length > 3 && (
                      <div className="text-xs text-blue-600 ml-8 font-medium bg-blue-100 px-2 py-1 rounded-full inline-block border border-blue-200">
                        +{chain.content.chain.steps.length - 3} more steps
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-200 group-hover:border-gray-300 transition-colors duration-300">
                  <span className="flex items-center px-2 py-1 bg-gray-100 border border-gray-200 rounded-full">
                    <Calendar className="h-3 w-3 mr-1" />
                    {formatDate(chain.created_at)}
                  </span>
                  {chain.content.chain.metadata && (
                    <span className="flex items-center px-2 py-1 bg-gray-100 border border-gray-200 rounded-full">
                      <Clock className="h-3 w-3 mr-1" />
                      {(chain.content.chain.metadata.responseTime / 1000).toFixed(1)}s generation
                    </span>
                  )}
                </div>

                {/* Enhanced Actions */}
                <div className="flex space-x-2 pt-3">
                  <Link href={`/dashboard/test?chainId=${chain.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-2 border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test Chain
                    </Button>
                  </Link>
                  <Link href={`/dashboard/prompts/${chain.id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-all duration-300 shadow-sm hover:shadow-md">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Chain
                    </Button>
                  </Link>
                  <Link href={`/dashboard/prompts/${chain.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md">
                      View Details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 