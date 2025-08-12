import React from 'react'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, BookOpen, TestTube, Sparkles, GitBranch, History, Beaker, FileText, Clock } from 'lucide-react'
import PromptActions from '@/components/prompt-actions'

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user's prompts count (exclude chained prompts and versions)
  const { count: promptsCount } = await supabase
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('parent_id', null) // Only count original prompts, not versions
    .or('content->>type.is.null,content->>type.neq.chain') // Include where type is null OR not 'chain'

  // Get chained prompts count
  const { count: chainedPromptsCount } = await supabase
    .from('prompts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('content->>type', 'chain')

  // Get improved prompts count (original prompts that have versions)
  const { data: improvedPromptsData } = await supabase
    .from('prompts')
    .select('parent_id')
    .eq('user_id', user.id)
    .not('parent_id', 'is', null)

  // Count unique parent IDs to get number of original prompts that were improved
  const improvedPromptsCount = improvedPromptsData 
    ? new Set(improvedPromptsData.map(p => p.parent_id)).size 
    : 0

  // Get test runs count from test_sessions table (with fallback)
  let testRunsCount = 0
  try {
    const { count } = await supabase
      .from('test_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    testRunsCount = count || 0
  } catch (error) {
    // Fallback: count prompt versions as test runs if test_sessions doesn't exist
    console.log('test_sessions table not found, using fallback count')
    const { count } = await supabase
      .from('prompts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('parent_id', 'is', null)
    testRunsCount = count || 0
  }

  // Get recent prompts
  const { data: recentPrompts } = await supabase
    .from('prompts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back! Here's an overview of your prompt crafting activity.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/prompts">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-400 hover:-translate-y-1 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-800 group-hover:text-blue-900 transition-colors duration-300">Total Prompts</CardTitle>
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 group-hover:text-blue-950 transition-colors duration-300">{promptsCount || 0}</div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/chains/history">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-green-400 hover:-translate-y-1 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-green-800 group-hover:text-green-900 transition-colors duration-300">Chained Prompts</CardTitle>
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                <GitBranch className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 group-hover:text-green-950 transition-colors duration-300">{chainedPromptsCount || 0}</div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/enhance">
          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-2 border-purple-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-purple-400 hover:-translate-y-1 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-purple-800 group-hover:text-purple-900 transition-colors duration-300">Improved</CardTitle>
              <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 group-hover:text-purple-950 transition-colors duration-300">{improvedPromptsCount || 0}</div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/dashboard/test">
          <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-2 border-orange-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-orange-400 hover:-translate-y-1 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-orange-800 group-hover:text-orange-900 transition-colors duration-300">Tests Run</CardTitle>
              <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                <TestTube className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900 group-hover:text-orange-950 transition-colors duration-300">{testRunsCount || 0}</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-blue-300 group">
          <CardHeader>
            <CardTitle className="text-blue-900 flex items-center gap-2 group-hover:text-blue-950 transition-colors duration-300">
              <Sparkles className="h-5 w-5 text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-blue-700 group-hover:text-blue-800 transition-colors duration-300">Get started with creating and managing prompts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/create">
              <Button className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border border-blue-500 hover:border-blue-400">
                <Plus className="mr-2 h-4 w-4" />
                Create New Prompt
              </Button>
            </Link>
            <Link href="/dashboard/prompts">
              <Button variant="outline" className="w-full justify-start border-2 border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5">
                <BookOpen className="mr-2 h-4 w-4" />
                View My Prompts
              </Button>
            </Link>
            <Link href="/dashboard/lab">
              <Button variant="outline" className="w-full justify-start border-2 border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5">
                <Beaker className="mr-2 h-4 w-4" />
                Prompt Lab
              </Button>
            </Link>
            <Link href="/dashboard/enhance">
              <Button variant="outline" className="w-full justify-start border-2 border-pink-300 text-pink-700 hover:bg-pink-50 hover:border-pink-400 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5">
                <Sparkles className="mr-2 h-4 w-4" />
                Improve & Optimize
              </Button>
            </Link>
            <Link href="/dashboard/test">
              <Button variant="outline" className="w-full justify-start border-2 border-violet-300 text-violet-700 hover:bg-violet-50 hover:border-violet-400 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5">
                <TestTube className="mr-2 h-4 w-4" />
                Test Prompts
              </Button>
            </Link>
            <Link href="/dashboard/chains">
              <Button variant="outline" className="w-full justify-start border-2 border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5">
                <GitBranch className="mr-2 h-4 w-4" />
                Create Chained Prompts
              </Button>
            </Link>
            <Link href="/dashboard/chains/history">
              <Button variant="outline" className="w-full justify-start border-2 border-cyan-300 text-cyan-700 hover:bg-cyan-50 hover:border-cyan-400 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.01] hover:-translate-y-0.5">
                <History className="mr-2 h-4 w-4" />
                View Chains History
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Enhanced Recent Prompts */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-2 border-indigo-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-300 group">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-indigo-900 group-hover:text-indigo-950 transition-colors duration-300">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <span>Recent Prompts</span>
            </CardTitle>
            <CardDescription className="text-indigo-700 group-hover:text-indigo-800 transition-colors duration-300">Your latest prompt creations</CardDescription>
          </CardHeader>
          <CardContent className="h-64 flex flex-col">
            {recentPrompts && recentPrompts.length > 0 ? (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {recentPrompts.map((prompt) => (
                  <div 
                    key={prompt.id} 
                    className="bg-gradient-to-r from-white to-indigo-50 border-2 border-indigo-200 rounded-lg p-3 shadow-md hover:shadow-lg hover:border-indigo-300 transition-all duration-300 hover:scale-[1.01] group/prompt"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-gradient-to-br from-indigo-500 to-purple-600 rounded shadow-sm group-hover/prompt:shadow-md transition-all duration-300">
                            <FileText className="h-3 w-3 text-white" />
                          </div>
                          <h3 className="font-semibold text-gray-900 group-hover/prompt:text-indigo-900 transition-colors duration-300 line-clamp-1 text-sm">
                            {prompt.title}
                          </h3>
                        </div>
                        
                        {prompt.description && (
                          <p className="text-xs text-gray-600 group-hover/prompt:text-gray-700 transition-colors duration-300 line-clamp-1">
                            {prompt.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-2 text-xs text-indigo-600">
                          <span className="flex items-center space-x-1 bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded-full">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{new Date(prompt.created_at).toLocaleDateString()}</span>
                          </span>
                          
                          {typeof prompt.content === 'object' && (prompt.content as any).prompt && typeof (prompt.content as any).prompt === 'object' && (
                            <span className="bg-purple-100 border border-purple-200 text-purple-700 px-1.5 py-0.5 rounded-full">
                              Structured
                            </span>
                          )}
                          
                          {typeof prompt.content === 'object' && (prompt.content as any).variables?.length > 0 && (
                            <span className="bg-green-100 border border-green-200 text-green-700 px-1.5 py-0.5 rounded-full">
                              {(prompt.content as any).variables.length} vars
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-3 opacity-80 group-hover/prompt:opacity-100 transition-opacity duration-300 flex-shrink-0">
                        <PromptActions prompt={prompt} showLabels={false} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-indigo-600 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-lg">
                <div className="text-center">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-medium text-indigo-800 mb-1 text-sm">No prompts yet</p>
                  <p className="text-xs text-indigo-600">Create your first prompt to get started</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 