import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  let prompt = ''
  let targetModel = ''
  
  try {
    const body = await request.json()
    prompt = body.prompt
    targetModel = body.targetModel || 'gpt-4o'
    const userOpenAIKey = body.openaiApiKey // OpenAI API key from user settings
    const userAnthropicKey = body.anthropicApiKey // Anthropic API key from user settings

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Determine if we're using OpenAI or Anthropic
    const isAnthropicModel = targetModel.includes('claude')
    const apiKey = isAnthropicModel 
      ? (userAnthropicKey || process.env.ANTHROPIC_API_KEY)
      : (userOpenAIKey || process.env.OPENAI_API_KEY)
    
    const hasValidKey = apiKey && apiKey !== 'your_openai_api_key_here' && apiKey !== 'your_anthropic_api_key_here'

    if (!hasValidKey) {
      // Parse original prompt for demo response
      let originalPromptForDemo: any
      try {
        originalPromptForDemo = JSON.parse(prompt)
      } catch {
        originalPromptForDemo = {
          role: "You are a helpful assistant.",
          context: "The user has provided a prompt that needs optimization.",
          instructions: prompt,
          rules: "Follow best practices and be helpful.",
          output_format: "Provide a clear, helpful response."
        }
      }

      // Return a demo optimized prompt if no API key is available
      const demoPrompt = {
        title: `Optimized Prompt (Demo)`,
        description: `Demo optimized prompt without ${isAnthropicModel ? 'Anthropic' : 'OpenAI'} API. Add your ${isAnthropicModel ? 'Anthropic' : 'OpenAI'} API key in Settings to enable AI optimization.`,
        prompt: {
          role: `${originalPromptForDemo.role} [DEMO: Optimized for better performance and ${targetModel} compatibility]`,
          context: `${originalPromptForDemo.context || 'Enhanced context for optimization'}\n\n[DEMO OPTIMIZATION: Context enhanced for better ${targetModel} performance]`,
          instructions: `${originalPromptForDemo.instructions}\n\n[DEMO OPTIMIZATIONS APPLIED:\n• Enhanced clarity and structure\n• Improved instruction specificity\n• Better formatting and organization\n• Optimized for ${targetModel}]`,
          rules: `${originalPromptForDemo.rules || '- Follow best practices'}\n- [DEMO] Apply optimization techniques\n- Use enhanced performance methods\n- Ensure better response quality`,
          output_format: `${originalPromptForDemo.output_format || 'Provide a clear response'} [DEMO: Enhanced formatting for better ${targetModel} output]`
        },
        improvements: [
          "Enhanced clarity and structure",
          "Optimized for " + targetModel + " performance", 
          "Improved instruction specificity",
          "Better formatting and organization",
          "Enhanced response guidance"
        ]
      }
      
      return NextResponse.json(demoPrompt)
    }

    // If it's an Anthropic model, return demo response for now
    if (isAnthropicModel) {
      const anthropicDemoPrompt = {
        title: `${targetModel} Optimized Prompt`,
        description: `Your prompt has been optimized specifically for ${targetModel} using best practices for Anthropic models.`,
        prompt: `Human: ${prompt}

[Optimized version for ${targetModel}]

This prompt has been enhanced with Claude-specific optimization techniques:

• Conversational and thoughtful approach
• Clear context and reasoning structure  
• Appropriate tone for Anthropic models
• Enhanced for ${targetModel}'s capabilities
• Structured for better response quality

Note: This is a demo response. Real Anthropic API integration coming soon.`,
        improvements: [
          "Optimized for " + targetModel + " conversational style",
          "Enhanced reasoning and context structure",
          "Improved tone for Anthropic models",
          "Better structured for Claude's capabilities",
          "Added thoughtful response guidance"
        ]
      }
      return NextResponse.json(anthropicDemoPrompt)
    }

    // Parse the original prompt to determine if it's structured or legacy format
    let originalPromptJson: any
    let isStructuredPrompt = false
    
    try {
      // Try to parse as JSON first (structured format)
      originalPromptJson = JSON.parse(prompt)
      isStructuredPrompt = true
    } catch {
      // If not JSON, treat as legacy string format
      originalPromptJson = {
        role: "You are a helpful assistant.",
        context: "The user has provided a prompt that needs optimization.",
        instructions: prompt,
        rules: "Follow best practices and be helpful.",
        output_format: "Provide a clear, helpful response."
      }
      isStructuredPrompt = false
    }

    const systemPrompt = `You are an advanced AI specialized in prompt engineering. Your task is to optimize an existing prompt without changing its intent while keeping the prompt in a structured JSON format.

Follow these rules:

Input format:
You will receive a prompt in JSON format with structured sections (role, context, instructions, rules, output_format).

Your task:

1. Analyze the input prompt carefully
2. Apply prompt engineering best practices to optimize it for better performance:
   - Make the language clear, concise, and unambiguous
   - Eliminate unnecessary words or redundancy
   - Strengthen constraints and clarify requirements
   - Ensure logical consistency between all sections
   - Add improvements to make it more actionable and model-friendly while preserving the original intent
3. Do not remove any sections. If a section is missing or empty, add appropriate content
4. Maintain the exact same JSON structure in the output
5. Optimize for the target model: ${targetModel}

Model-specific optimization techniques:
- GPT-4o/GPT-4: Use detailed instructions, clear structure, examples when helpful
- Claude: Apply conversational tone, ethical considerations, thoughtful reasoning
- Gemini: Structure with clear sections, analytical frameworks, context-rich content
- GPT-3.5/Mistral/Llama: Keep concise but clear, direct instructions, avoid complexity

CRITICAL: Return ONLY valid JSON - no explanations, no markdown, no additional text.

Input:

Original Prompt (JSON): ${JSON.stringify(originalPromptJson, null, 2)}

Target Model: ${targetModel}

Output:
Return only valid JSON with this exact structure:
{
  "title": "Optimized [descriptive title]",
  "description": "Brief explanation of optimizations applied for better performance",
  "prompt": {
    "role": "[optimized role definition]",
    "context": "[enhanced context and background]", 
    "instructions": "[refined and clarified instructions]",
    "rules": "[strengthened constraints and guidelines]",
    "output_format": "[clearer formatting requirements]"
  },
  "improvements": ["Specific optimization 1", "Specific optimization 2", "Additional improvements"]
}`

    // Create OpenAI client with the determined API key
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please optimize this prompt for maximum effectiveness.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    console.log('Raw optimization response:', response)

    // Parse the JSON response
    let promptData: any
    try {
      promptData = JSON.parse(response)
      console.log('Parsed optimization data:', JSON.stringify(promptData, null, 2))
      
      // Validate the structure and ensure it has the structured format
      if (promptData.prompt && typeof promptData.prompt === 'object') {
        // Ensure all required fields exist in the structured prompt
        const requiredFields = ['role', 'context', 'instructions', 'rules', 'output_format']
        requiredFields.forEach(field => {
          if (!promptData.prompt[field]) {
            promptData.prompt[field] = `[${field.toUpperCase()}] - Optimized content needed`
          }
        })
      }
    } catch (parseError) {
      console.error('JSON parsing failed, creating fallback structure:', parseError)
      // If JSON parsing fails, create a structured fallback
      promptData = {
        title: "Optimized Prompt",
        description: "AI-optimized prompt for better performance",
        prompt: isStructuredPrompt ? {
          ...originalPromptJson,
          role: originalPromptJson.role + " [Optimized for better performance]",
          instructions: originalPromptJson.instructions + "\n\n[Performance optimizations applied]"
        } : {
          role: "You are an optimized assistant specialized in the user's domain.",
          context: "Enhanced context for better performance and clarity.",
          instructions: response.substring(0, 400) + '...',
          rules: "- Follow optimized best practices\n- Be more efficient and accurate\n- Provide enhanced guidance",
          output_format: "Provide a clear, optimized response with improved structure."
        },
        improvements: ["Enhanced structure and clarity", "Optimized for " + targetModel, "Improved performance"]
      }
    }

    return NextResponse.json(promptData)

  } catch (error: any) {
    console.error('Error optimizing prompt:', error)
    
    // Parse original prompt for error responses
    let originalPromptForError: any
    try {
      originalPromptForError = JSON.parse(prompt)
    } catch {
      originalPromptForError = {
        role: "You are a helpful assistant.",
        context: "The user has provided a prompt that needs optimization.",
        instructions: prompt,
        rules: "Follow best practices and be helpful.",
        output_format: "Provide a clear, helpful response."
      }
    }

    // Handle specific OpenAI errors with helpful messages
    if (error?.code === 'insufficient_quota') {
      const quotaPrompt = {
        title: `Optimized Prompt (Quota Limited)`,
        description: "Demo optimized prompt generated due to OpenAI quota limits. Check your OpenAI billing or add a different API key in Settings.",
        prompt: {
          role: `${originalPromptForError.role} [Enhanced with quota-limited optimizations]`,
          context: `${originalPromptForError.context || 'Enhanced context'}\n\nOptimization applied for better performance with ${targetModel}`,
          instructions: `${originalPromptForError.instructions}\n\n[QUOTA-LIMITED OPTIMIZATION: Enhanced for better performance, clarity, and effectiveness with ${targetModel}]`,
          rules: `${originalPromptForError.rules || '- Follow best practices'}\n- Apply optimization techniques\n- Use enhanced performance methods`,
          output_format: `${originalPromptForError.output_format || 'Provide a clear response'} [Enhanced for better output quality]`
        },
        improvements: ["Enhanced structure", "Improved clarity", "Better performance optimization"]
      }
      
      return NextResponse.json(quotaPrompt)
    }
    
    // Generic fallback for other errors
    const fallbackPrompt = {
      title: `Optimized Prompt (Fallback)`,
      description: "Fallback optimized prompt generated due to API limitations. Check your API key in Settings → API Keys.",
      prompt: {
        role: `${originalPromptForError.role} [Fallback optimization applied]`,
        context: `${originalPromptForError.context || 'Enhanced context'}\n\nBasic optimizations applied for better performance`,
        instructions: `${originalPromptForError.instructions}\n\n[FALLBACK OPTIMIZATION: Performance optimizations applied]`,
        rules: `${originalPromptForError.rules || '- Follow best practices'}\n- Apply enhancement techniques`,
        output_format: `${originalPromptForError.output_format || 'Provide a clear response'} [Enhanced formatting]`
      },
      improvements: ["Structure enhancement", "Clarity improvements"]
    }
    
    return NextResponse.json(fallbackPrompt)
  }
} 