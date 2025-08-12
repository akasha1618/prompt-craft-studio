import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  let goal = ''
  
  try {
    const body = await request.json()
    goal = body.goal
    const targetModel = body.targetModel || 'gpt-4o'
    const userApiKey = body.openaiApiKey

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal is required' },
        { status: 400 }
      )
    }

    // Prioritize user-provided API key, then fall back to .env.local
    const apiKey = userApiKey || process.env.OPENAI_API_KEY
    const hasValidKey = apiKey && apiKey !== 'your_openai_api_key_here'

    if (!hasValidKey) {
      // Return a demo prompt chain if no API key is available
      const demoChain = {
        title: `Prompt Chain for: ${goal}`,
        description: "Demo prompt chain generated without OpenAI API. Add your OpenAI API key in Settings → API Keys to enable AI generation.",
        metadata: {
          generatedAt: new Date().toISOString(),
          responseTime: 850, // Demo response time
          usage: {
            promptTokens: 180,
            completionTokens: 420,
            totalTokens: 600
          },
          model: "demo-mode",
          targetModel: targetModel
        },
        steps: [
          {
            id: 1,
            title: "Step 1: Analysis & Planning",
            description: "Break down the task and create a structured approach",
            prompt: `You are an expert analyst. Your task is to thoroughly analyze the following request and create a detailed plan:\n\nRequest: "${goal}"\n\nAnalyze this request and:\n1. Identify the key components and requirements\n2. Break down the task into logical steps\n3. Identify potential challenges or considerations\n4. Create a structured approach\n\nProvide a clear, organized analysis that will guide the next steps.`,
            expectedOutput: "Structured analysis and plan",
            connectsTo: [2],
            estimatedTime: 3200,
            estimatedTokens: {
              input: 85,
              output: 180
            }
          },
          {
            id: 2,
            title: "Step 2: Implementation & Execution",
            description: "Execute the plan with detailed implementation",
            prompt: `Based on the analysis and plan from the previous step, now implement the solution:\n\nPrevious Analysis: [OUTPUT FROM STEP 1]\n\nUsing the analysis above, create a comprehensive implementation that:\n1. Follows the structured approach identified\n2. Addresses all key components\n3. Provides specific, actionable details\n4. Considers the challenges mentioned\n\nDeliver a complete, practical solution.`,
            expectedOutput: "Detailed implementation",
            connectsTo: [3],
            estimatedTime: 4100,
            estimatedTokens: {
              input: 220,
              output: 350
            }
          },
          {
            id: 3,
            title: "Step 3: Review & Optimization",
            description: "Review and refine the implementation",
            prompt: `Review and optimize the implementation from the previous step:\n\nImplementation: [OUTPUT FROM STEP 2]\n\nCarefully review the implementation and:\n1. Check for completeness and accuracy\n2. Identify areas for improvement\n3. Suggest optimizations or enhancements\n4. Ensure it fully addresses the original goal: "${goal}"\n\nProvide the final, optimized version with your improvements.`,
            expectedOutput: "Final optimized solution",
            connectsTo: [],
            estimatedTime: 2800,
            estimatedTokens: {
              input: 380,
              output: 240
            }
          }
        ]
      }
      
      return NextResponse.json(demoChain)
    }

    // Create OpenAI client with the determined API key
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    const systemPrompt = `You are an expert prompt engineer who specializes in creating chained prompts by breaking down complex tasks into sequential, smaller steps prompts.

CRITICAL INSTRUCTIONS:
1. Return ONLY a valid JSON object - no explanations, no markdown, no additional text
2. Do NOT wrap the JSON in code blocks or quotes  
3. Use \\n for line breaks within JSON strings, never actual newlines
4. Keep all content on single lines within JSON string values

Your task: Analyze the user's goal and create a prompt chain of 2-4 connected prompts (MINIMUM 2 steps, MAXIMUM 4 steps) that work together to achieve the goal more effectively than a single prompt. Take into consideration the target model that will be used with the prompt chain.

User Goal: ${goal}
Target Model: ${targetModel}

IMPORTANT: You MUST create at least 2 steps, but no more than 4 steps. Single-step chains are not allowed.

Guidelines for creating prompt chains:
1. Break the complex task into logical, sequential steps (2-4 steps)
2. Each prompt should build on the previous one's output
3. Use clear handoff instructions like "[OUTPUT FROM STEP 1]", "[OUTPUT FROM STEP 2]", etc.
4. Each step should have a specific, focused purpose
5. The chain should be more effective than a single monolithic prompt

Common effective prompt chaining patterns (pick one that fits):
- Analysis → Implementation → Refinement (3 steps)
- Planning → Execution → Review → Polish (4 steps)
- Research → Synthesis → Application (3 steps)
- Break Down → Build → Optimize (3 steps)
- Gather → Process → Deliver (3 steps)

Create a JSON response with this EXACT structure:
{
  "title": "Descriptive title for this prompt chain",
  "description": "Brief description of what this chain accomplishes", 
  "steps": [
    {
      "id": 1,
      "title": "Step name",
      "description": "What this step does",
      "prompt": "The complete prompt text with clear instructions",
      "expectedOutput": "What output this step should produce",
      "connectsTo": [2]
    },
    {
      "id": 2, 
      "title": "Step name",
      "description": "What this step does",
      "prompt": "The complete prompt text that uses [OUTPUT FROM STEP 1]",
      "expectedOutput": "What output this step should produce", 
      "connectsTo": [3]
    }
  ]
}

CRITICAL: Always create 2-4 steps. Make each prompt detailed and optimized for ${targetModel}. Include clear placeholders like [OUTPUT FROM STEP X] for chaining.`

    const startTime = Date.now()

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Create a prompt chain for: ${goal}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    const response = completion.choices[0]?.message?.content
    
    if (!response) {
      throw new Error('No response from OpenAI')
    }

    console.log('Raw response:', response)

    // Get token usage
    const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }

    let chainData
    try {
      // Sanitize the response to fix JSON formatting issues
      let sanitizedResponse = response
      
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = sanitizedResponse.match(/```(?:json)?\s*({[\s\S]*})\s*```/)
      if (jsonMatch) {
        sanitizedResponse = jsonMatch[1]
      }
      
      // Fix unescaped newlines within JSON string values
      sanitizedResponse = sanitizedResponse.replace(/"([^"]*(?:\\.[^"]*)*)"/g, (match, content) => {
        const escapedContent = content
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t')
        return `"${escapedContent}"`
      })
      
      chainData = JSON.parse(sanitizedResponse)
      console.log('Parsed chainData:', JSON.stringify(chainData, null, 2))
      
      // Add generation metadata to the chain
      chainData.metadata = {
        generatedAt: new Date().toISOString(),
        responseTime: responseTime,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens
        },
        model: "gpt-5",
        targetModel: targetModel
      }

      // Add estimated timing and tokens for each step
      chainData.steps = chainData.steps.map((step: any, index: number) => ({
        ...step,
        estimatedTime: Math.floor(Math.random() * 3000) + 2000, // 2-5 seconds estimated
        estimatedTokens: {
          input: Math.floor(step.prompt.length / 4), // Rough token estimate
          output: Math.floor(Math.random() * 300) + 100, // 100-400 tokens estimated
        }
      }))

    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError)
      console.log('Raw response:', response)
      
      // If JSON parsing fails, create a simple 2-step chain from the raw response
      chainData = {
        title: `Prompt Chain for: ${goal}`,
        description: "Generated prompt chain (parsed from AI response)",
        metadata: {
          generatedAt: new Date().toISOString(),
          responseTime: responseTime,
          usage: {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens
          },
          model: "gpt-5",
          targetModel: targetModel
        },
        steps: [
          {
            id: 1,
            title: "Research & Planning",
            description: "Analyze and plan the approach",
            prompt: `Analyze the task: ${goal}\n\nBreak down this task into key components:\n1. Identify main objectives\n2. Determine required resources\n3. Plan the approach\n4. Set success criteria\n\nProvide a comprehensive analysis to guide implementation.`,
            expectedOutput: "Analysis and plan",
            connectsTo: [2],
            estimatedTime: 3000,
            estimatedTokens: {
              input: 200,
              output: 150
            }
          },
          {
            id: 2,
            title: "Implementation & Execution", 
            description: "Execute the plan and deliver results",
            prompt: `Based on the planning from the previous step:\n\n[OUTPUT FROM STEP 1]\n\nNow implement the solution for: ${goal}\n\nCreate a detailed implementation that:\n1. Follows the planned approach\n2. Addresses all requirements\n3. Provides actionable steps\n4. Delivers complete results\n\nEnsure your solution is practical and comprehensive.`,
            expectedOutput: "Complete implementation",
            connectsTo: [],
            estimatedTime: 4000,
            estimatedTokens: {
              input: 300,
              output: 250
            }
          }
        ]
      }
    }

    return NextResponse.json(chainData)

  } catch (error: any) {
    console.error('Error generating prompt chain:', error)
    
    // Handle specific OpenAI errors with helpful messages
    if (error?.code === 'insufficient_quota') {
      const quotaChain = {
        title: `Smart Prompt Chain for: ${goal}`,
        description: "Demo prompt chain generated due to OpenAI quota limits. Check your OpenAI billing or add a different API key in Settings.",
        steps: [
          {
            id: 1,
            title: "Analysis Phase",
            description: "Understand and break down the task",
            prompt: `You are an expert analyst focused on ${goal}. Begin by thoroughly understanding and analyzing this task:\n\n1. Break down the core requirements\n2. Identify key challenges and considerations\n3. Plan a structured approach\n4. Set clear success criteria\n\nProvide a comprehensive analysis that will guide the implementation phase.`,
            expectedOutput: "Detailed analysis and plan",
            connectsTo: [2]
          },
          {
            id: 2,
            title: "Implementation Phase", 
            description: "Execute the plan with detailed steps",
            prompt: `Based on the analysis from the previous step, now implement the solution for ${goal}:\n\n[Use output from Analysis Phase]\n\nCreate a detailed, step-by-step implementation that:\n1. Follows the planned approach\n2. Addresses all identified requirements\n3. Provides specific, actionable guidance\n4. Anticipates and handles potential challenges\n\nDeliver a complete, practical solution.`,
            expectedOutput: "Complete implementation",
            connectsTo: [3]
          },
          {
            id: 3,
            title: "Refinement Phase",
            description: "Review, optimize and finalize",
            prompt: `Review and refine the implementation for ${goal}:\n\n[Use output from Implementation Phase]\n\nOptimize the solution by:\n1. Checking for completeness and accuracy\n2. Identifying improvement opportunities\n3. Adding enhancements or missing elements\n4. Ensuring it fully meets the original goal\n\nProvide the final, polished version of the solution.`,
            expectedOutput: "Final optimized solution",
            connectsTo: []
          }
        ]
      }
      return NextResponse.json(quotaChain)
    }
    
    if (error?.code === 'model_not_found') {
      return NextResponse.json(
        { error: 'Model not accessible. Please check your OpenAI API access.' },
        { status: 400 }
      )
    }
    
    // Generic fallback for other errors
    const fallbackChain = {
      title: `Prompt Chain for: ${goal}`,
      description: "Fallback prompt chain generated due to API limitations. Check your API key in Settings → API Keys.",
      steps: [
        {
          id: 1,
          title: "Planning & Analysis",
          description: "Analyze the requirements and plan approach",
          prompt: `You are a helpful AI assistant focused on ${goal}. First, analyze this task thoroughly:\n\n1. Break down the main components\n2. Identify key requirements\n3. Plan a step-by-step approach\n4. Consider potential challenges\n\nProvide a clear analysis and plan that will guide the implementation.`,
          expectedOutput: "Analysis and plan",
          connectsTo: [2],
          estimatedTime: 3000,
          estimatedTokens: {
            input: 250,
            output: 150
          }
        },
        {
          id: 2,
          title: "Implementation & Solution",
          description: "Execute the plan and create the solution",
          prompt: `Based on the analysis from the previous step:\n\n[OUTPUT FROM STEP 1]\n\nNow implement the solution for ${goal}. Create a comprehensive, actionable solution that:\n1. Follows the planned approach\n2. Addresses all requirements\n3. Provides specific, practical steps\n4. Delivers complete results\n\nEnsure your solution is detailed and directly applicable.`,
          expectedOutput: "Complete implementation",
          connectsTo: [],
          estimatedTime: 4000,
          estimatedTokens: {
            input: 350,
            output: 250
          }
        }
      ]
    }
    
    return NextResponse.json(fallbackChain)
  }
} 