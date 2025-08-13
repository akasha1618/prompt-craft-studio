'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Edit, Check, X, User, FileText, ListChecks, Shield, Layout } from 'lucide-react'

interface StructuredPrompt {
  role: string
  context: string
  instructions: string
  rules: string
  output_format: string
}

interface StructuredPromptDisplayProps {
  prompt: StructuredPrompt | string
  onUpdate?: (updatedPrompt: StructuredPrompt) => void
  onVariableDetected?: (text: string) => void
  variables?: Array<{ name: string; value: string }>
  editable?: boolean
  className?: string
}

export default function StructuredPromptDisplay({ 
  prompt, 
  onUpdate,
  onVariableDetected,
  variables = [],
  editable = false, 
  className = '' 
}: StructuredPromptDisplayProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Function to replace variables in text for display
  const replaceVariablesInText = (text: string): string => {
    let result = text
    variables.forEach(variable => {
      if (variable.value) {
        const regex = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g')
        result = result.replace(regex, variable.value)
      }
    })
    return result
  }

  // Function to detect variables when text is edited
  const detectVariables = (text: string) => {
    if (onVariableDetected) {
      onVariableDetected(text)
    }
  }

  // Handle legacy string prompts
  const isStructured = typeof prompt === 'object' && prompt !== null
  
  if (!isStructured) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="bg-gray-900 text-gray-100 rounded-lg p-4 font-mono text-sm whitespace-pre-wrap">
            {typeof prompt === 'string' ? prompt : 'No prompt content'}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Legacy format - not structured
          </div>
        </CardContent>
      </Card>
    )
  }

  const structuredPrompt = prompt as StructuredPrompt

  const sections = [
    {
      key: 'role',
      label: 'Role',
      icon: User,
      value: structuredPrompt.role,
      bgColor: 'bg-blue-50',
      borderColor: 'border-l-blue-500',
      textColor: 'text-blue-900',
      hoverBg: 'hover:bg-blue-100'
    },
    {
      key: 'context',
      label: 'Context',
      icon: FileText,
      value: structuredPrompt.context,
      bgColor: 'bg-green-50',
      borderColor: 'border-l-green-500',
      textColor: 'text-green-900',
      hoverBg: 'hover:bg-green-100'
    },
    {
      key: 'instructions',
      label: 'Instructions',
      icon: ListChecks,
      value: structuredPrompt.instructions,
      bgColor: 'bg-orange-50',
      borderColor: 'border-l-orange-500',
      textColor: 'text-orange-900',
      hoverBg: 'hover:bg-orange-100'
    },
    {
      key: 'rules',
      label: 'Rules',
      icon: Shield,
      value: structuredPrompt.rules,
      bgColor: 'bg-red-50',
      borderColor: 'border-l-red-500',
      textColor: 'text-red-900',
      hoverBg: 'hover:bg-red-100'
    },
    {
      key: 'output_format',
      label: 'Output Format',
      icon: Layout,
      value: structuredPrompt.output_format,
      bgColor: 'bg-purple-50',
      borderColor: 'border-l-purple-500',
      textColor: 'text-purple-900',
      hoverBg: 'hover:bg-purple-100'
    }
  ]

  const startEditing = (section: any) => {
    if (!editable) return
    setEditingSection(section.key)
    setEditValue(section.value)
  }

  const saveEdit = () => {
    if (onUpdate && editingSection) {
      // Detect variables in the edited text
      detectVariables(editValue)
      
      const updatedPrompt = {
        ...structuredPrompt,
        [editingSection]: editValue
      }
      onUpdate(updatedPrompt)
    }
    setEditingSection(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingSection(null)
    setEditValue('')
  }

  const copyFullPrompt = () => {
    const fullPrompt = sections.map(s => `${s.label}:\n${replaceVariablesInText(s.value)}`).join('\n\n')
    navigator.clipboard.writeText(fullPrompt)
  }

  return (
    <Card className={`${className}`}>
      <CardContent className="p-0">
        <div className="space-y-1">
          {sections.map((section) => {
            const Icon = section.icon
            const isEditing = editingSection === section.key
            
            return (
              <div
                key={section.key}
                className={`
                  ${section.bgColor} ${section.borderColor} ${section.hoverBg}
                  border-l-4 p-4 transition-all duration-200 group cursor-pointer
                  ${editable ? 'hover:shadow-sm' : ''}
                `}
                onClick={() => !isEditing && startEditing(section)}
                title={editable ? `Click to edit ${section.label}` : section.label}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${section.textColor}`} />
                    <span className={`text-xs font-semibold uppercase tracking-wider ${section.textColor}`}>
                      {section.label}
                    </span>
                  </div>
                  {editable && !isEditing && (
                    <Edit className={`h-3 w-3 ${section.textColor} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  )}
                  {isEditing && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          saveEdit()
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Check className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          cancelEdit()
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  )}
                </div>
                
                {isEditing ? (
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="min-h-20 text-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className={`text-sm ${section.textColor} whitespace-pre-wrap font-medium leading-relaxed`}>
                    {replaceVariablesInText(section.value)}
                    {/* Show original text with variables if any variables are detected */}
                    {section.value !== replaceVariablesInText(section.value) && (
                      <div className="mt-2 text-xs text-gray-500 border-t pt-2">
                        <em>Original: {section.value}</em>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Professional prompt structure • Click sections to edit
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyFullPrompt}
            className="text-xs"
          >
            Copy Full Prompt
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 