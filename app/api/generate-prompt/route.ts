import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface VariableDefinition {
  name: string
  type: 'text' | 'document'
}

export async function POST(request: NextRequest) {
  let goal = ''
  let variables: VariableDefinition[] = []
  
  try {
    const body = await request.json()
    goal = body.goal
    const targetModel = body.targetModel || 'gpt-4o'
    variables = body.variables || [] // Variable definitions from frontend
    const userOpenAIKey = body.openaiApiKey // OpenAI API key from user settings
    const userAnthropicKey = body.anthropicApiKey // Anthropic API key from user settings

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal is required' },
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
      // Return a demo prompt if no API key is available
      const variableSection = variables.length > 0 
        ? `\n\nVariables to customize:\n${variables.map(v => `- {{${v.name}}} (${v.type}): Replace with your ${v.type === 'text' ? 'text content' : 'document content'}`).join('\n')}`
        : ''

      const demoPrompt = {
        title: `Demo Prompt for: ${goal}`,
        description: `This is a demo prompt generated without ${isAnthropicModel ? 'Anthropic' : 'OpenAI'} API. Add your ${isAnthropicModel ? 'Anthropic' : 'OpenAI'} API key in Settings → API Keys to enable AI generation.`,
        prompt: {
          role: `You are an expert assistant specializing in ${goal}, with deep knowledge and practical experience in this domain.`,
          context: `The user needs assistance with ${goal}.${variables.length > 0 ? `\n\nAvailable variables:\n${variables.map(v => `- {{${v.name}}} (${v.type}): ${v.type === 'text' ? 'Text input' : 'Document content'} to be provided`).join('\n')}` : ''}`,
          instructions: `1. Understand the specific requirements and context${variables.length > 0 ? '\n2. Use the provided variables to personalize your response' : ''}\n${variables.length > 0 ? '3' : '2'}. Break down complex tasks into manageable steps\n${variables.length > 0 ? '4' : '3'}. Provide practical examples and best practices\n${variables.length > 0 ? '5' : '4'}. Anticipate potential challenges and offer solutions\n${variables.length > 0 ? '6' : '5'}. Deliver your response in a clear, organized format`,
          rules: `- Be helpful, accurate, and specific\n- Focus on actionable guidance\n- Maintain professional tone\n- Ensure completeness of response${variables.length > 0 ? '\n- Utilize all provided variables appropriately' : ''}`,
          output_format: `Provide a structured response with clear sections, bullet points where appropriate, and actionable recommendations.`
        }
      }
      
      return NextResponse.json(demoPrompt)
    }

    // If it's an Anthropic model, return demo response for now
    if (isAnthropicModel) {
      const variableSection = variables.length > 0 
        ? `\n\nVariables to use:\n${variables.map(v => `- {{${v.name}}} (${v.type}): Include your ${v.type === 'text' ? 'text content' : 'document content'} here`).join('\n')}`
        : ''

      const anthropicDemoPrompt = {
        title: `${targetModel} Optimized Prompt for: ${goal}`,
        description: `A professionally crafted prompt optimized for ${targetModel} to help you achieve: ${goal}`,
        prompt: {
          role: `You are an expert assistant with specialized knowledge in ${goal}. You excel at providing thoughtful, well-reasoned responses that balance thoroughness with clarity.`,
          context: `The user needs assistance with achieving the following objective: ${goal}.${variables.length > 0 ? `\n\nAvailable inputs:\n${variables.map(v => `- {{${v.name}}} (${v.type}): ${v.type === 'text' ? 'Text content' : 'Document content'} that will be provided`).join('\n')}` : ''}`,
          instructions: `1. Take a moment to understand the full scope and context${variables.length > 0 ? '\n2. Analyze and incorporate the provided variables' : ''}\n${variables.length > 0 ? '3' : '2'}. Break down complex aspects into digestible components\n${variables.length > 0 ? '4' : '3'}. Provide practical, actionable guidance with concrete examples\n${variables.length > 0 ? '5' : '4'}. Anticipate potential challenges and offer preemptive solutions\n${variables.length > 0 ? '6' : '5'}. Organize your response in a clear, logical structure`,
          rules: `- Be comprehensive yet practical\n- Ask clarifying questions if needed\n- Maintain Claude's thoughtful reasoning approach\n- Ensure ethical considerations are addressed${variables.length > 0 ? '\n- Make effective use of all provided variables' : ''}`,
          output_format: `Provide a well-structured response with clear reasoning, specific recommendations, and actionable next steps.`
        }
      }
      return NextResponse.json(anthropicDemoPrompt)
    }

    // Create OpenAI client with the determined API key
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    const systemPrompt = `You are PromptCraft Studio, a senior expert in prompt engineering. 

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object - no explanations, no markdown, no additional text
2. Do NOT wrap the JSON in code blocks or quotes
3. Ensure each prompt section is a clean string, not nested JSON
4. Use \\n for line breaks within JSON strings, never actual newlines
5. Keep all content on single lines within JSON string values

Your task: Generate a structured prompt respecting the prompt engineering techniques with 5 distinct sections based on the user's request.

Create these sections:
- ROLE: Define the AI's expertise/persona (1-2 sentences)
- CONTEXT: Background info, scenario, input data (include variables here with {{variablename}} syntax)
- INSTRUCTIONS: Numbered steps or clear tasks (use \\n for line breaks, e.g., "1. First step\\n2. Second step\\n3. Third step")
- RULES: Bulleted constraints/guidelines (use \\n for line breaks, e.g., "- Rule one\\n- Rule two\\n- Rule three")
- OUTPUT_FORMAT: Specific formatting requirements

You will receive the Target LLM that will be used with your generated prompt.Adapt prompt style for the target LLM as each LLM has its own prompt engineering style:
- GPT (OpenAI): Clear, structured, explicit guidance
- Claude (Anthropic): Encourage reasoning and thoughtful outputs  
- Gemini (Google): Context-rich but concise
- Mistral/Llama: Explicit instructions, simple wording

${variables.length > 0 ? `
VARIABLES TO INCLUDE WITH {{}} SYNTAX:
${variables.map(v => `- {{${v.name}}} (${v.type}): ${v.type === 'text' ? 'Text input' : 'Document content'} - use this variable in relevant sections`).join('\n')}

IMPORTANT: Include these variables in the appropriate sections using the {{variable_name}} format. For example:
- In CONTEXT: "Use the following input data: {{input_data}}"
- In INSTRUCTIONS: "1. Analyze the {{input_data}} provided by the user..."
` : ''}

RESPONSE FORMAT - Return exactly this JSON structure:
{
  "title": "Clear, descriptive title for the user request prompt",
  "description": "Brief explanation of what this prompt accomplishes",  
  "prompt": {
    "role": "You are [specific role and expertise]...",
    "context": "[Background, scenario, include {{variables}} where relevant]...",
    "instructions": "1. [Step one, use {{variables}} where helpful]\n2. [Step two]\n3. [Additional steps]...",
    "rules": "- [Constraint 1]\n- [Constraint 2]\n- [Additional rules]...",
    "output_format": "[Specific formatting requirements]..."
  }
}

Target LLM: ${targetModel}
User_Request: ${goal}${variables.length > 0 ? `
Include variables: ${variables.map(v => v.name).join(', ')}` : ''}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Create a prompt for: ${goal}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    console.log('Raw API response:', response)

    let promptData: any
    try {
      // Sanitize the response to fix newline issues in JSON strings
      let sanitizedResponse = response
      
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = sanitizedResponse.match(/```(?:json)?\s*({[\s\S]*})\s*```/)
      if (jsonMatch) {
        sanitizedResponse = jsonMatch[1]
      }
      
      // Fix unescaped newlines within JSON string values
      // This regex finds strings and escapes newlines within them
      sanitizedResponse = sanitizedResponse.replace(/"([^"]*(?:\\.[^"]*)*)"/g, (match, content) => {
        const escapedContent = content
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t')
        return `"${escapedContent}"`
      })
      
      promptData = JSON.parse(sanitizedResponse)
      console.log('Parsed promptData:', JSON.stringify(promptData, null, 2))
      
      // Validate the structure and clean up any nested JSON strings
      if (promptData.prompt && typeof promptData.prompt === 'object') {
        // Check if any field contains a JSON string that needs parsing
        Object.keys(promptData.prompt).forEach(key => {
          const value = promptData.prompt[key]
          if (typeof value === 'string' && value.trim().startsWith('{')) {
            try {
              // Try to parse if it looks like JSON
              const parsed = JSON.parse(value)
              if (parsed.prompt && typeof parsed.prompt === 'object') {
                // If this field contains the actual structured prompt, use it
                promptData = parsed
              }
            } catch {
              // If parsing fails, keep the original value
            }
          }
        })
        
        // Ensure all required fields exist
        const requiredFields = ['role', 'context', 'instructions', 'rules', 'output_format']
        requiredFields.forEach(field => {
          if (!promptData.prompt[field]) {
            promptData.prompt[field] = `[${field.toUpperCase()}] - Please specify ${field} requirements`
          }
        })
      }
    } catch (parseError) {
      console.error('JSON parsing failed, creating fallback structure:', parseError)
      // If JSON parsing fails, try to create a structured format from the response
      promptData = {
        title: "Generated Prompt",
        description: "AI-generated prompt based on your requirements",
        prompt: {
          role: `You are a specialized assistant for ${goal}.`,
          context: `The user needs help with ${goal}.`,
          instructions: `1. Understand the user's specific needs\n2. Provide clear, actionable guidance\n3. Use examples when helpful\n4. Ensure practical applicability`,
          rules: `- Follow best practices\n- Be helpful and accurate\n- Provide actionable guidance\n- Maintain professional tone`,
          output_format: `Provide a clear, structured response with specific recommendations.`
        }
      }
    }

    return NextResponse.json(promptData)

  } catch (error: any) {
    console.error('Error generating prompt:', error)
    
    // Handle specific OpenAI errors with helpful messages
    if (error?.code === 'insufficient_quota') {
      const quotaPrompt = {
        title: `Smart Prompt for: ${goal}`,
        description: "Demo prompt generated due to OpenAI quota limits. Check your OpenAI billing or add a different API key in Settings.",
        prompt: {
          role: `You are an expert assistant specialized in ${goal}. Your mission is to provide exceptional guidance that helps users achieve their objectives efficiently and effectively.`,
          context: `The user is seeking assistance with ${goal}. This is a professional consultation where accuracy and practical value are paramount.${variables.length > 0 ? `\n\nAvailable inputs:\n${variables.map(v => `- {{${v.name}}} (${v.type}): ${v.type === 'text' ? 'Text content' : 'Document content'} to be analyzed`).join('\n')}` : ''}`,
          instructions: `1. Understand the Context: Carefully analyze what the user is trying to accomplish${variables.length > 0 ? '\n2. Process Variables: Use the provided inputs to inform your response' : ''}\n${variables.length > 0 ? '3' : '2'}. Break It Down: Divide complex tasks into clear, manageable steps\n${variables.length > 0 ? '4' : '3'}. Provide Specifics: Give concrete examples, templates, or frameworks when applicable\n${variables.length > 0 ? '5' : '4'}. Anticipate Challenges: Identify potential obstacles and offer proactive solutions\n${variables.length > 0 ? '6' : '5'}. Ensure Clarity: Use simple language and organize information logically`,
          rules: `- Always be specific, actionable, and encouraging\n- Focus on practical steps that lead to real results\n- Maintain professional expertise throughout\n- Provide comprehensive yet digestible information${variables.length > 0 ? '\n- Leverage all provided variables effectively' : ''}`,
          output_format: `Deliver your response in a well-structured format with clear sections, actionable recommendations, and specific next steps.`
        }
      }
      return NextResponse.json(quotaPrompt)
    }
    
    if (error?.code === 'model_not_found') {
      return NextResponse.json(
        { error: 'Model not accessible. Please check your OpenAI API access.' },
        { status: 400 }
      )
    }
    
    // Generic fallback for other errors
    const fallbackPrompt = {
      title: `Generated Prompt for: ${goal}`,
      description: "Fallback prompt generated due to API limitations. Check your API key in Settings → API Keys.",
      prompt: {
        role: `You are a helpful AI assistant focused on ${goal} with expertise in providing practical solutions.`,
        context: `The user needs assistance with ${goal} and is looking for actionable guidance.${variables.length > 0 ? `\n\nAvailable inputs:\n${variables.map(v => `- {{${v.name}}} (${v.type}): ${v.type === 'text' ? 'Text content' : 'Document content'} to analyze`).join('\n')}` : ''}`,
        instructions: `1. Listen carefully to understand the specific need${variables.length > 0 ? '\n2. Utilize the provided variables in your analysis' : ''}\n${variables.length > 0 ? '3' : '2'}. Provide clear, step-by-step guidance\n${variables.length > 0 ? '4' : '3'}. Include relevant examples or best practices\n${variables.length > 0 ? '5' : '4'}. Ensure recommendations are actionable`,
        rules: `- Be specific and actionable\n- Focus on practical solutions\n- Maintain helpful and professional tone\n- Ensure responses directly address user needs${variables.length > 0 ? '\n- Make appropriate use of all provided variables' : ''}`,
        output_format: `Provide a clear, well-organized response with specific recommendations and next steps.`
      }
    }
    
    return NextResponse.json(fallbackPrompt)
  }
} 