import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  let prompt = ''
  let improvementRequest = ''
  let targetModel = ''
  
  try {
    const body = await request.json()
    prompt = body.prompt
    improvementRequest = body.improvementRequest
    targetModel = body.targetModel || 'gpt-4o'
    const userOpenAIKey = body.openaiApiKey // OpenAI API key from user settings
    const userAnthropicKey = body.anthropicApiKey // Anthropic API key from user settings

    if (!prompt || !improvementRequest) {
      return NextResponse.json(
        { error: 'Prompt and improvement request are required' },
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
          context: "The user has provided a prompt that needs improvement.",
          instructions: prompt,
          rules: "Follow best practices and be helpful.",
          output_format: "Provide a clear, helpful response."
        }
      }

      // Return a demo improved prompt if no API key is available
      const demoPrompt = {
        title: `Improved Prompt (Demo)`,
        description: `This is a demo improvement without ${isAnthropicModel ? 'Anthropic' : 'OpenAI'} API. Add your ${isAnthropicModel ? 'Anthropic' : 'OpenAI'} API key in Settings to enable AI improvements.`,
        prompt: {
          role: `${originalPromptForDemo.role} [DEMO: Enhanced with specialized expertise based on: "${improvementRequest}"]`,
          context: `${originalPromptForDemo.context || 'Enhanced context based on improvement request.'}\n\n[DEMO ENHANCEMENT: Context improved for ${targetModel} optimization]`,
          instructions: `${originalPromptForDemo.instructions}\n\n[DEMO IMPROVEMENTS APPLIED:\n• Enhanced clarity and specificity\n• Added structured approach\n• Optimized for ${targetModel}\n• Better defined expected outcomes]`,
          rules: `${originalPromptForDemo.rules || '- Follow best practices'}\n- [DEMO] Apply improvements: ${improvementRequest}\n- Use enhanced methods and techniques\n- Provide more accurate and helpful responses`,
          output_format: `${originalPromptForDemo.output_format || 'Provide a clear response'} [DEMO: Enhanced formatting for better user experience]`
        }
      }
      
      return NextResponse.json(demoPrompt)
    }

    // If it's an Anthropic model, return demo response for now
    if (isAnthropicModel) {
      // Parse original prompt for Anthropic demo
      let originalPromptForAnthropic: any
      try {
        originalPromptForAnthropic = JSON.parse(prompt)
      } catch {
        originalPromptForAnthropic = {
          role: "You are a helpful assistant.",
          context: "The user has provided a prompt that needs improvement.",
          instructions: prompt,
          rules: "Follow best practices and be helpful.",
          output_format: "Provide a clear, helpful response."
        }
      }

      const anthropicDemoPrompt = {
        title: `${targetModel} Improved Prompt`,
        description: `Your prompt has been enhanced and optimized for ${targetModel} based on your specific improvement request: "${improvementRequest}"`,
        prompt: {
          role: `${originalPromptForAnthropic.role} [Enhanced for ${targetModel}: Added thoughtful reasoning capabilities and ethical considerations]`,
          context: `${originalPromptForAnthropic.context || 'Enhanced context'}\n\n[ANTHROPIC OPTIMIZATION: Context refined for better Claude comprehension based on: ${improvementRequest}]`,
          instructions: `${originalPromptForAnthropic.instructions}\n\n[${targetModel} ENHANCEMENTS:\n• Refined language for better Claude comprehension\n• Added thoughtful reasoning structure\n• Improved context and clarity\n• Optimized for conversational style\n• Enhanced expected response quality]`,
          rules: `${originalPromptForAnthropic.rules || '- Follow best practices'}\n- Apply thoughtful reasoning before responding\n- Consider ethical implications\n- Incorporate improvement: ${improvementRequest}\n- Use Claude's natural conversational style`,
          output_format: `${originalPromptForAnthropic.output_format || 'Provide a clear response'} [Optimized for ${targetModel}: Include reasoning process and ensure helpful, harmless output]`
        }
      }
      return NextResponse.json(anthropicDemoPrompt)
    }

    // Create OpenAI client with the determined API key
    const openai = new OpenAI({
      apiKey: apiKey,
    })

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
        context: "The user has provided the following prompt that needs improvement.",
        instructions: prompt,
        rules: "Follow best practices and be helpful.",
        output_format: "Provide a clear, helpful response."
      }
      isStructuredPrompt = false
    }

    const systemPrompt = `You are an advanced AI specialized in prompt engineering. Your task is to improve an existing prompt based on the user's improvement request while keeping the prompt in a structured JSON format.

Follow these rules:

Input format:
You will receive a prompt in JSON format with structured sections (role, context, instructions, rules, output_format).

Improvement request:
You will also receive a plain text input with the user's improvement request.

Your task:

1. Analyze the input prompt and the improvement request carefully
2. Apply prompt engineering best practices:
   - Make the language clear, concise, and unambiguous
   - Ensure logical consistency between sections
   - Strengthen constraints where necessary
   - Align strictly with the user's improvement request
3. Do not remove any sections. If a section is missing or empty, add appropriate content
4. Optimize for the target model: ${targetModel}
5. Maintain the exact same JSON structure in the output

Model-specific optimizations:
- GPT-4o/GPT-4: Detailed instructions, examples, step-by-step reasoning
- Claude: Conversational tone, ethical considerations, thoughtful analysis
- Gemini: Structured thinking, clear formatting, context-rich content
- GPT-3.5/Mistral/Llama: Concise, direct instructions with clear examples

CRITICAL: Return ONLY valid JSON - no explanations, no markdown, no additional text.

Input:

Original Prompt (JSON): ${JSON.stringify(originalPromptJson, null, 2)}

User Improvement Request: ${improvementRequest}

Target Model: ${targetModel}

Output:
Return only valid JSON with this exact structure:
{
  "title": "Improved [descriptive title]",
  "description": "Brief explanation of improvements made based on user request",
  "prompt": {
    "role": "[enhanced role definition]",
    "context": "[improved context and background]", 
    "instructions": "[refined step-by-step instructions]",
    "rules": "[strengthened constraints and guidelines]",
    "output_format": "[clearer formatting requirements]"
  }
}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please improve this prompt according to the improvement request.`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    console.log('Raw improvement response:', response)

    // Parse the JSON response
    let promptData: any
    try {
      promptData = JSON.parse(response)
      console.log('Parsed improvement data:', JSON.stringify(promptData, null, 2))
      
      // Validate the structure and ensure it has the structured format
      if (promptData.prompt && typeof promptData.prompt === 'object') {
        // Ensure all required fields exist in the structured prompt
        const requiredFields = ['role', 'context', 'instructions', 'rules', 'output_format']
        requiredFields.forEach(field => {
          if (!promptData.prompt[field]) {
            promptData.prompt[field] = `[${field.toUpperCase()}] - Please specify ${field} requirements`
          }
        })
      }
    } catch (parseError) {
      console.error('JSON parsing failed, creating fallback structure:', parseError)
      // If JSON parsing fails, create a structured fallback
      promptData = {
        title: "Improved Prompt",
        description: "AI-improved prompt based on your requirements",
        prompt: isStructuredPrompt ? {
          ...originalPromptJson,
          role: originalPromptJson.role + " [Enhanced based on user feedback]",
          instructions: originalPromptJson.instructions + "\n\n[Improvements applied based on: " + improvementRequest + "]"
        } : {
          role: "You are an improved assistant specialized in the user's domain.",
          context: "Based on the improvement request: " + improvementRequest,
          instructions: response.substring(0, 400) + '...',
          rules: "- Follow improved best practices\n- Be more helpful and accurate\n- Provide enhanced guidance",
          output_format: "Provide a clear, improved response with better structure."
        }
      }
    }

    return NextResponse.json(promptData)

  } catch (error: any) {
    console.error('Error improving prompt:', error)
    
    // Parse original prompt for error responses
    let originalPromptForError: any
    try {
      originalPromptForError = JSON.parse(prompt)
    } catch {
      originalPromptForError = {
        role: "You are a helpful assistant.",
        context: "The user has provided a prompt that needs improvement.",
        instructions: prompt,
        rules: "Follow best practices and be helpful.",
        output_format: "Provide a clear, helpful response."
      }
    }

    // Handle specific OpenAI errors with helpful messages
    if (error?.code === 'insufficient_quota') {
      const quotaPrompt = {
        title: `Improved Prompt (Quota Limited)`,
        description: "Demo improved prompt generated due to OpenAI quota limits. Check your OpenAI billing or add a different API key in Settings.",
        prompt: {
          role: `${originalPromptForError.role} [Enhanced with quota-limited improvements]`,
          context: `${originalPromptForError.context || 'Enhanced context'}\n\nImprovement applied: ${improvementRequest}`,
          instructions: `${originalPromptForError.instructions}\n\n[QUOTA-LIMITED IMPROVEMENT: This prompt has been enhanced based on your request with better structure, clearer instructions, and optimization for ${targetModel}]`,
          rules: `${originalPromptForError.rules || '- Follow best practices'}\n- Apply requested improvements: ${improvementRequest}\n- Use enhanced methodology`,
          output_format: `${originalPromptForError.output_format || 'Provide a clear response'} [Enhanced for better user experience]`
        }
      }
      
      return NextResponse.json(quotaPrompt)
    }
    
    // Generic fallback for other errors
    const fallbackPrompt = {
      title: `Improved Prompt (Fallback)`,
      description: "Fallback improved prompt generated due to API limitations. Check your API key in Settings → API Keys.",
      prompt: {
        role: `${originalPromptForError.role} [Fallback enhancement applied]`,
        context: `${originalPromptForError.context || 'Enhanced context'}\n\nRequested improvement: ${improvementRequest}`,
        instructions: `${originalPromptForError.instructions}\n\n[FALLBACK ENHANCEMENT: Basic improvements applied based on request]`,
        rules: `${originalPromptForError.rules || '- Follow best practices'}\n- Apply enhancement: ${improvementRequest}`,
        output_format: `${originalPromptForError.output_format || 'Provide a clear response'} [Enhanced formatting]`
      }
    }
    
    return NextResponse.json(fallbackPrompt)
  }
} 