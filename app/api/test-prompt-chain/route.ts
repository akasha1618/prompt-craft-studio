import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface ChainStep {
  id: number
  title: string
  description: string
  prompt: string
  expectedOutput: string
  connectsTo: number[]
  model: string // Model chosen for this specific step
}

interface ChainTestRequest {
  steps: ChainStep[]
  chainTitle: string
  userApiKey?: string
  anthropicApiKey?: string
}

interface StepResult {
  stepId: number
  title: string
  model: string
  prompt: string
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

async function callOpenAI(openai: OpenAI, model: string, prompt: string): Promise<{ response: string, usage: any }> {
  // Convert our internal model names to actual API model names
  let modelName = model
  if (model === 'gpt-5') modelName = 'gpt-4' // Use GPT-4 for now as GPT-5 may not be available yet
  if (model === 'gpt-4.1') modelName = 'gpt-4' // Use GPT-4 for now
  else if (model === 'gpt-4.5') modelName = 'gpt-4' // Use GPT-4 for now
  else if (model === 'gpt-4o') modelName = 'gpt-4o'
  else if (model === 'o1') modelName = 'o1-preview'
  else if (model === 'gpt-4') modelName = 'gpt-4'
  else modelName = 'gpt-4o' // Default fallback

  const completion = await openai.chat.completions.create({
    model: modelName,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
    temperature: 0.7,
  })

  return {
    response: completion.choices[0]?.message?.content || 'No response',
    usage: {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0
    }
  }
}

async function callAnthropic(anthropicApiKey: string, model: string, prompt: string): Promise<{ response: string, usage: any }> {
  // Map model names to Anthropic API model names
  let anthropicModelName = 'claude-3-5-sonnet-20241022' // Default fallback
  
  if (model === 'claude-sonnet-4') anthropicModelName = 'claude-3-5-sonnet-20241022'
  else if (model === 'claude-3.7-sonnet') anthropicModelName = 'claude-3-5-sonnet-20241022'
  else if (model === 'claude-3.5-sonnet') anthropicModelName = 'claude-3-5-sonnet-20241022'
  else if (model === 'claude-opus-4') anthropicModelName = 'claude-3-opus-20240229'
  else if (model === 'claude-3.5-haiku') anthropicModelName = 'claude-3-haiku-20240307'

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: anthropicModelName,
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`)
  }

  const anthropicData = await response.json()
  return {
    response: anthropicData.content[0]?.text || 'No response',
    usage: {
      promptTokens: anthropicData.usage?.input_tokens || 0,
      completionTokens: anthropicData.usage?.output_tokens || 0,
      totalTokens: (anthropicData.usage?.input_tokens || 0) + (anthropicData.usage?.output_tokens || 0)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChainTestRequest = await request.json()
    const { steps, chainTitle, userApiKey, anthropicApiKey } = body

    if (!steps || steps.length === 0) {
      return NextResponse.json(
        { error: 'Chain steps are required' },
        { status: 400 }
      )
    }

    // Get API keys
    const openaiApiKey = userApiKey || process.env.OPENAI_API_KEY
    const anthropicKey = anthropicApiKey || process.env.ANTHROPIC_API_KEY

    if (!openaiApiKey && !anthropicKey) {
      return NextResponse.json(
        { error: 'No API key provided. Please add an API key in Settings → API Keys.' },
        { status: 401 }
      )
    }

    const results: StepResult[] = []
    let previousOutput = ''

    // Test each step sequentially
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      const startTime = Date.now()

      try {
        let stepPrompt = step.prompt

        // Replace placeholder with previous step's output
        if (i > 0 && previousOutput) {
          stepPrompt = stepPrompt.replace(
            /\[OUTPUT FROM STEP \d+\]/g,
            previousOutput
          )
        }

        let response = ''
        let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }

        if (step.model.includes('claude')) {
          // Anthropic models
          if (!anthropicKey) {
            response = `[DEMO CLAUDE RESPONSE for Step ${step.id}]\n\nThis would be Claude's response for "${step.title}".\n\nClaude excels at thoughtful, step-by-step reasoning and would provide a detailed response here.\n\nTo enable real Claude testing, integrate with Anthropic's API.\n\nStep Input: "${stepPrompt.substring(0, 100)}..."`
            usage = {
              promptTokens: Math.floor(stepPrompt.length / 4),
              completionTokens: Math.floor(Math.random() * 250) + 100,
              totalTokens: Math.floor(stepPrompt.length / 4) + Math.floor(Math.random() * 250) + 100
            }
          } else {
            const anthropicResult = await callAnthropic(anthropicKey, step.model, stepPrompt)
            response = anthropicResult.response
            usage = anthropicResult.usage
          }
        } else {
          // OpenAI models
          if (!openaiApiKey) {
            response = `[DEMO RESPONSE for Step ${step.id}]\n\nThis is a simulated response for "${step.title}" using ${step.model}.\n\nStep Prompt: "${stepPrompt.substring(0, 100)}..."\n\nAdd your API key in Settings → API Keys to enable real testing.\n\nThis would be the actual output that feeds into the next step.`
            usage = {
              promptTokens: Math.floor(stepPrompt.length / 4),
              completionTokens: Math.floor(Math.random() * 200) + 50,
              totalTokens: Math.floor(stepPrompt.length / 4) + Math.floor(Math.random() * 200) + 50
            }
          } else {
            const openai = new OpenAI({ apiKey: openaiApiKey })
            const openaiResult = await callOpenAI(openai, step.model, stepPrompt)
            response = openaiResult.response
            usage = openaiResult.usage
          }
        }

        const endTime = Date.now()
        const responseTime = endTime - startTime

        // Store this step's result
        results.push({
          stepId: step.id,
          title: step.title,
          model: step.model,
          prompt: stepPrompt,
          response,
          responseTime,
          success: true,
          timestamp: new Date().toISOString(),
          usage
        })

        // Use this step's output for the next step
        previousOutput = response

      } catch (error: any) {
        const endTime = Date.now()
        const responseTime = endTime - startTime

        // Store error result
        results.push({
          stepId: step.id,
          title: step.title,
          model: step.model,
          prompt: step.prompt,
          response: `[ERROR] ${error.message}`,
          responseTime,
          success: false,
          timestamp: new Date().toISOString(),
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          error: error.message
        })

        // Don't continue chain if a step fails
        break
      }
    }

    const chainResult = {
      chainTitle,
      totalSteps: steps.length,
      completedSteps: results.filter(r => r.success).length,
      totalResponseTime: results.reduce((total, r) => total + r.responseTime, 0),
      totalTokens: results.reduce((total, r) => total + r.usage.totalTokens, 0),
      success: results.every(r => r.success),
      timestamp: new Date().toISOString(),
      steps: results
    }

    return NextResponse.json(chainResult)

  } catch (error: any) {
    console.error('Error testing prompt chain:', error)
    
    return NextResponse.json({
      chainTitle: 'Unknown Chain',
      totalSteps: 0,
      completedSteps: 0,
      totalResponseTime: 0,
      totalTokens: 0,
      success: false,
      timestamp: new Date().toISOString(),
      steps: [],
      error: `Failed to test chain: ${error.message}`
    }, { status: 500 })
  }
} 