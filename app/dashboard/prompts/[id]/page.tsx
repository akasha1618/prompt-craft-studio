import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ExternalLink, Sparkles, Zap, GitBranch, Clock, Workflow, Copy, ArrowDown, Type, FileText, CheckCircle } from 'lucide-react'
import PromptActions from '@/components/prompt-actions'
import CopyButton from '@/components/copy-button'
import StructuredPromptDisplay from '@/components/structured-prompt-display'

interface PromptPageProps {
  params: {
    id: string
  }
}

export default async function PromptPage({ params }: PromptPageProps) {
  const supabase = createSupabaseServerClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return notFound()

  // Get the specific prompt
  const { data: prompt, error } = await supabase
    .from('prompts')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !prompt) {
    return notFound()
  }

  // Determine if this is a chained prompt or regular prompt
  const isChainedPrompt = typeof prompt.content === 'object' && prompt.content.type === 'chain'
  const promptText = typeof prompt.content === 'object' && 'prompt' in prompt.content 
    ? prompt.content.prompt 
    : 'Legacy prompt format'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={isChainedPrompt ? "/dashboard/chains/history" : "/dashboard/prompts"}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {isChainedPrompt ? "Back to Chains History" : "Back to My Prompts"}
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              {isChainedPrompt && <GitBranch className="h-6 w-6 mr-2 text-blue-600" />}
              {prompt.title}
            </h1>
            <p className="text-gray-600 mt-1">
              {isChainedPrompt ? "Chained Prompt • " : ""}Created {new Date(prompt.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <PromptActions prompt={prompt} showLabels={true} />
      </div>

      {/* Description */}
      {prompt.description && (
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{prompt.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Main Content - Conditional based on prompt type */}
      {isChainedPrompt ? (
        // Chained Prompt Display
        <div className="space-y-6">
          {/* Chain Overview */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-900">
                <GitBranch className="h-5 w-5" />
                <span>Chain Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800">{prompt.content.chain.steps.length}</div>
                  <div className="text-sm text-blue-700">Steps</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {prompt.content.chain.metadata?.usage?.totalTokens?.toLocaleString() || 'N/A'}
                  </div>
                  <div className="text-sm text-blue-700">Generation Tokens</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800">{prompt.content.targetModel}</div>
                  <div className="text-sm text-blue-700">Target Model</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-800">
                    {prompt.content.chain.metadata?.responseTime ? 
                      `${(prompt.content.chain.metadata.responseTime / 1000).toFixed(1)}s` : 'N/A'}
                  </div>
                  <div className="text-sm text-blue-700">Generation Time</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chain Steps */}
          {prompt.content.chain.steps.map((step: any, index: number) => (
            <div key={step.id}>
              <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full font-bold text-lg shadow-lg">
                        {step.id}
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-900">{step.title}</CardTitle>
                        <CardDescription className="text-gray-600 mt-1">{step.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <CopyButton text={step.prompt} />
                      <Link href={`/dashboard/test?chainId=${prompt.id}`}>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Test Chain
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Step Stats */}
                  <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">
                        {step.estimatedTime ? `${(step.estimatedTime / 1000).toFixed(1)}s` : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-600">Est. Runtime</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">
                        {step.estimatedTokens?.input || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-600">Input Tokens</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-gray-900">
                        {step.estimatedTokens?.output || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-600">Est. Output</div>
                    </div>
                  </div>
                  
                  {/* Prompt Content */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                      <Workflow className="h-4 w-4 mr-2" />
                      Prompt Content:
                    </h5>
                    <div className="bg-gray-900 border rounded-lg p-4 shadow-inner">
                      <pre className="text-sm text-gray-100 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                        {step.prompt}
                      </pre>
                    </div>
                  </div>

                  {/* Expected Output */}
                  {step.expectedOutput && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Expected Output:
                      </h5>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-800 whitespace-pre-wrap">
                          {step.expectedOutput}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Connection Arrow */}
              {index < prompt.content.chain.steps.length - 1 && (
                <div className="flex justify-center my-6">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="w-px h-4 bg-gradient-to-b from-blue-400 to-blue-600"></div>
                    <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg">
                      <ArrowDown className="h-4 w-4 text-white" />
                    </div>
                    <div className="w-px h-4 bg-gradient-to-b from-blue-600 to-blue-400"></div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Output feeds into Step {index + 2}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // Regular Prompt Display
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Prompt Content</CardTitle>
                <div className="flex space-x-2">
                  <CopyButton text={typeof prompt.content === 'object' && 'prompt' in prompt.content ? 
                    (typeof prompt.content.prompt === 'string' ? prompt.content.prompt : 
                     Object.values(prompt.content.prompt || {}).join('\n\n')) : promptText} />
                  <Link href={`/dashboard/test?promptId=${prompt.id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test Prompt
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <StructuredPromptDisplay 
                prompt={typeof prompt.content === 'object' && 'prompt' in prompt.content ? 
                  prompt.content.prompt : promptText}
                editable={false}
              />
            </CardContent>
          </Card>

          {/* Variables Display for Regular Prompts */}
          {typeof prompt.content === 'object' && (prompt.content as any).variables && (prompt.content as any).variables.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Variables ({(prompt.content as any).variables.length})
                </CardTitle>
                <CardDescription>
                  Variable values saved with this prompt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(prompt.content as any).variables.map((variable: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {variable.type === 'text' ? (
                            <Type className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileText className="h-4 w-4 text-green-500" />
                          )}
                          <span className="font-medium">{variable.name}</span>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {variable.type}
                        </span>
                      </div>
                      
                      {variable.value ? (
                        <div className="space-y-2">
                          {variable.fileName && (
                            <div className="text-xs text-green-600 flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {variable.fileName}
                            </div>
                          )}
                          <div className="bg-gray-50 border rounded p-3 text-sm max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-gray-700 font-mono text-xs">
                              {variable.value}
                            </pre>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          No value saved
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Token Summary */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Token Usage:</strong> {(() => {
                      // Calculate base tokens properly for structured prompts
                      let baseTokens = 0
                      if (typeof promptText === 'string') {
                        baseTokens = Math.ceil(promptText.length / 4)
                      } else if (typeof promptText === 'object' && promptText) {
                        // Sum tokens from all sections of structured prompt
                        baseTokens = Object.values(promptText).reduce((total: number, section: any) => {
                          if (typeof section === 'string') {
                            return total + Math.ceil(section.length / 4)
                          }
                          return total
                        }, 0)
                      }
                      return baseTokens
                    })()} base tokens
                    {(prompt.content as any).variables.some((v: any) => v.value) && (
                      <span> + {(prompt.content as any).variables.reduce((total: number, v: any) => 
                        total + (v.value ? Math.ceil(v.value.length / 4) : 0), 0)} variable tokens</span>
                    )}
                    {' = '}
                    <strong>
                      {(() => {
                        // Calculate total tokens (base + variables)
                        let baseTokens = 0
                        if (typeof promptText === 'string') {
                          baseTokens = Math.ceil(promptText.length / 4)
                        } else if (typeof promptText === 'object' && promptText) {
                          baseTokens = Object.values(promptText).reduce((total: number, section: any) => {
                            if (typeof section === 'string') {
                              return total + Math.ceil(section.length / 4)
                            }
                            return total
                          }, 0)
                        }
                        const variableTokens = (prompt.content as any).variables.reduce((total: number, v: any) => 
                          total + (v.value ? Math.ceil(v.value.length / 4) : 0), 0)
                        return baseTokens + variableTokens
                      })()} total tokens
                    </strong>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* AI Enhancement Tools - Only for regular prompts */}
      {!isChainedPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>AI Enhancement Tools</CardTitle>
            <CardDescription>
              Use AI to improve or optimize this prompt for better performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href={`/dashboard/prompts/${prompt.id}/improve`} className="block">
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors h-full">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Improve Prompt</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Enhance or add new features to your prompt with AI guidance
                  </p>
                </div>
              </Link>
              
              <Link href={`/dashboard/prompts/${prompt.id}/optimize`} className="block">
                <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors h-full">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">Optimize Prompt</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Automatically optimize for better performance and clarity
                  </p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Guide - Only for regular prompts */}
      {!isChainedPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>How to Use This Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. Copy the prompt</h4>
                <p className="text-sm text-gray-600">
                  Use the "Copy Prompt" button above to copy the entire prompt to your clipboard.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. Paste in your AI tool</h4>
                <p className="text-sm text-gray-600">
                  Paste the prompt into ChatGPT, Claude, or any other AI chat interface.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. Add your specific input</h4>
                <p className="text-sm text-gray-600">
                  Follow the prompt with your specific question, content, or requirements.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chain Usage Guide - Only for chained prompts */}
      {isChainedPrompt && (
        <Card>
          <CardHeader>
            <CardTitle>How to Use This Chain</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">1. Copy each step individually</h4>
                <p className="text-sm text-gray-600">
                  Use the "Copy" button for each step to copy the prompt to your clipboard.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">2. Execute steps sequentially</h4>
                <p className="text-sm text-gray-600">
                  Run Step 1 in your AI tool first, then use its output as input for Step 2, and so on.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">3. Replace placeholders</h4>
                <p className="text-sm text-gray-600">
                  Replace "[OUTPUT FROM STEP X]" placeholders with the actual output from previous steps.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">4. Or test the entire chain</h4>
                <p className="text-sm text-gray-600">
                  Use the "Test Chain" button to automatically run all steps with different AI models.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>{isChainedPrompt ? "Chain Details" : "Prompt Details"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900">Created</div>
              <div className="text-gray-600">{new Date(prompt.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">ID</div>
              <div className="text-gray-600 font-mono text-xs">{prompt.id}</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {isChainedPrompt ? "Steps" : "Characters"}
              </div>
              <div className="text-gray-600">
                {isChainedPrompt ? prompt.content.chain.steps.length : promptText.length}
              </div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Status</div>
              <div className="text-green-600 font-medium">Ready to use</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex justify-center space-x-4">
        {isChainedPrompt ? (
          <>
            <Link href={`/dashboard/test?chainId=${prompt.id}`}>
              <Button variant="outline">
                <GitBranch className="h-4 w-4 mr-2" />
                Test Chain
              </Button>
            </Link>
            <Link href="/dashboard/chains">
              <Button variant="outline">
                <GitBranch className="h-4 w-4 mr-2" />
                Create New Chain
              </Button>
            </Link>
            <Link href="/dashboard/chains/history">
              <Button variant="outline">View All Chains</Button>
            </Link>
          </>
        ) : (
          <>
            <Link href={`/dashboard/prompts/${prompt.id}/edit`}>
              <Button variant="outline">Edit This Prompt</Button>
            </Link>
            <Link href="/dashboard/create">
              <Button variant="outline">Create Similar Prompt</Button>
            </Link>
            <Link href={`/dashboard/test?promptId=${prompt.id}`}>
              <Button variant="outline">Test Performance</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  )
} 