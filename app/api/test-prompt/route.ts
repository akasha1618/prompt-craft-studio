import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  let prompt = ''
  let model = ''
  let testInput = ''
  
  try {
    const body = await request.json()
    prompt = body.prompt
    model = body.model || 'gpt-4o'
    testInput = body.testInput || ''
    const userOpenAIKey = body.openaiApiKey // OpenAI API key
    const userAnthropicKey = body.anthropicApiKey // Anthropic API key

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Determine if we're using OpenAI or Anthropic
    const isAnthropicModel = model.includes('claude')
    const isOpenAIModel = model.includes('gpt') || model.includes('o1')

    // Get appropriate API key
    const openaiApiKey = userOpenAIKey || process.env.OPENAI_API_KEY
    const anthropicApiKey = userAnthropicKey || process.env.ANTHROPIC_API_KEY
    
    const hasOpenAI = openaiApiKey && openaiApiKey !== 'your_openai_api_key_here'
    const hasAnthropic = anthropicApiKey && anthropicApiKey !== 'your_anthropic_api_key_here'

    if ((isOpenAIModel && !hasOpenAI) || (isAnthropicModel && !hasAnthropic)) {
      // Return demo test results if no appropriate API keys are configured
      const demoResult = {
        model,
        prompt,
        testInput,
        response: `[DEMO TEST RESULT for ${model}]\n\nThis is a simulated response to demonstrate the testing functionality. The actual response would come from ${model} processing your prompt.\n\nYour prompt: "${prompt}"\nTest input: "${testInput}"\n\nAdd your ${isAnthropicModel ? 'Anthropic' : 'OpenAI'} API key in Settings → API Keys to enable real testing with AI models.`,
        responseTime: Math.floor(Math.random() * 2000) + 500, // Random demo time
        success: true,
        timestamp: new Date().toISOString(),
        usage: {
          promptTokens: Math.floor(prompt.length / 4), // Rough estimate
          completionTokens: 50,
          totalTokens: Math.floor(prompt.length / 4) + 50
        }
      }
      
      return NextResponse.json(demoResult)
    }

    let response = ''
    let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }

    // Combine prompt with test input
    const fullPrompt = testInput ? `${prompt}\n\n${testInput}` : prompt

    // Handle Anthropic models
    if (isAnthropicModel) {
      // Map model names to Anthropic API model names
      let anthropicModelName = 'claude-3-5-sonnet-20241022' // Default fallback
      
      if (model === 'claude-sonnet-4') anthropicModelName = 'claude-3-5-sonnet-20241022' // Use latest available for now
      else if (model === 'claude-3.7-sonnet') anthropicModelName = 'claude-3-5-sonnet-20241022' // Use latest available for now
      else if (model === 'claude-3.5-sonnet') anthropicModelName = 'claude-3-5-sonnet-20241022'
      else if (model === 'claude-opus-4') anthropicModelName = 'claude-3-opus-20240229' // Use Opus for now
      else if (model === 'claude-3.5-haiku') anthropicModelName = 'claude-3-haiku-20240307'

      // Call Anthropic API
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
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
              content: fullPrompt
            }
          ]
        })
      })

      if (!anthropicResponse.ok) {
        const errorText = await anthropicResponse.text()
        throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errorText}`)
      }

      const anthropicData = await anthropicResponse.json()
      response = anthropicData.content[0]?.text || 'No response'
      usage = {
        promptTokens: anthropicData.usage?.input_tokens || 0,
        completionTokens: anthropicData.usage?.output_tokens || 0,
        totalTokens: (anthropicData.usage?.input_tokens || 0) + (anthropicData.usage?.output_tokens || 0)
      }

    } else if (isOpenAIModel) {
      // Handle OpenAI models
      // Convert our internal model names to actual API model names
      let modelName = model
      if (model === 'gpt-5') modelName = 'gpt-4' // Use GPT-4 for now as GPT-5 may not be available yet
      if (model === 'gpt-4.1') modelName = 'gpt-4' // Use GPT-4 for now as 4.1 may not be available yet
      else if (model === 'gpt-4.5') modelName = 'gpt-4' // Use GPT-4 for now as 4.5 may not be available yet
      else if (model === 'gpt-4o') modelName = 'gpt-4o'
      else if (model === 'o1') modelName = 'o1-preview' // Use o1-preview as o1 exact name
      else if (model === 'gpt-4') modelName = 'gpt-4'
      else modelName = 'gpt-4o' // Default fallback

      // Create OpenAI client
      const openai = new OpenAI({
        apiKey: openaiApiKey,
      })

      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: fullPrompt }],
        max_tokens: 1000,
        temperature: 0.7,
      })

      response = completion.choices[0]?.message?.content || 'No response'
      usage = {
        promptTokens: completion.usage?.prompt_tokens || 0,
        completionTokens: completion.usage?.completion_tokens || 0,
        totalTokens: completion.usage?.total_tokens || 0
      }

    } else {
      // Handle other models (image/video generation, etc.) as coming soon
      response = `[COMING SOON for ${model}]\n\nThis model will be available in a future update. Currently supporting text generation models from OpenAI and Anthropic.\n\nPrompt tested: "${prompt.substring(0, 100)}..."`
      usage = {
        promptTokens: Math.floor(prompt.length / 4),
        completionTokens: 50,
        totalTokens: Math.floor(prompt.length / 4) + 50
      }
    }

    const endTime = Date.now()
    const responseTime = endTime - startTime

    const result = {
      model,
      prompt,
      testInput,
      response,
      responseTime,
      success: true,
      timestamp: new Date().toISOString(),
      usage
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Error testing prompt:', error)
    
    // Handle specific errors
    let errorMessage = 'Failed to test prompt'
    if (error?.code === 'insufficient_quota') {
      errorMessage = 'API quota exceeded. Please check your billing.'
    } else if (error?.code === 'model_not_found') {
      errorMessage = 'Model not found or not accessible.'
    } else if (error.message?.includes('Anthropic API error')) {
      errorMessage = 'Anthropic API error. Check your API key and billing.'
    }

    const errorResult = {
      model,
      prompt,
      testInput,
      response: `[ERROR] ${errorMessage}: ${error.message}\n\nCheck your API keys in Settings → API Keys.`,
      responseTime: 0,
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
    }
    
    return NextResponse.json(errorResult, { status: 500 })
  }
} 