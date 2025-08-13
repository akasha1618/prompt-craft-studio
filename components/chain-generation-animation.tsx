'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Brain, GitBranch, Link2, CheckCircle, Sparkles, Zap, Database, ArrowRight } from 'lucide-react'

interface ChainGenerationAnimationProps {
  isLoading: boolean
  onComplete?: () => void
}

const ChainGenerationAnimation: React.FC<ChainGenerationAnimationProps> = ({ isLoading, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const steps = [
    {
      id: 1,
      icon: Brain,
      title: "Analyzing complexity and requirements",
      description: "Evaluating task structure and optimal breakdown strategy",
      duration: 2000,
      color: "from-purple-500 to-indigo-600",
      bgColor: "from-purple-50 to-indigo-100",
      borderColor: "border-purple-300"
    },
    {
      id: 2,
      icon: GitBranch,
      title: "Designing intelligent workflow sequence",
      description: "Creating logical prompt connections and dependencies",
      duration: 2500,
      color: "from-blue-500 to-cyan-600",
      bgColor: "from-blue-50 to-cyan-100",
      borderColor: "border-blue-300"
    },
    {
      id: 3,
      icon: Link2,
      title: "Optimizing prompt interconnections",
      description: "Ensuring seamless data flow between chain steps",
      duration: 2000,
      color: "from-emerald-500 to-teal-600",
      bgColor: "from-emerald-50 to-teal-100",
      borderColor: "border-emerald-300"
    },
    {
      id: 4,
      icon: Sparkles,
      title: "Finalizing enhanced prompt architecture",
      description: "Delivering superior results through intelligent chaining",
      duration: 1500,
      color: "from-amber-500 to-orange-600",
      bgColor: "from-amber-50 to-orange-100",
      borderColor: "border-amber-300"
    }
  ]

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0)
      setCompletedSteps([])
      return
    }

    let timeouts: NodeJS.Timeout[] = []
    let cumulativeTime = 500

    steps.forEach((step, index) => {
      const stepTimeout = setTimeout(() => {
        setCurrentStep(index + 1)
      }, cumulativeTime)
      
      const completeTimeout = setTimeout(() => {
        setCompletedSteps(prev => [...prev, step.id])
      }, cumulativeTime + step.duration)

      timeouts.push(stepTimeout, completeTimeout)
      cumulativeTime += step.duration + 300
    })

    // Final completion callback
    const finalTimeout = setTimeout(() => {
      onComplete?.()
    }, cumulativeTime + 500)
    timeouts.push(finalTimeout)

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [isLoading, onComplete])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur border-2 shadow-2xl">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
              <Zap className="h-8 w-8 text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Generating Prompt Chain
            </h2>
            <p className="text-gray-600">Creating your intelligent workflow sequence...</p>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = currentStep === step.id
              const isCompleted = completedSteps.includes(step.id)
              const isPending = currentStep < step.id

              return (
                <div key={step.id} className="relative">
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200">
                      <div 
                        className={`w-full bg-gradient-to-b transition-all duration-1000 ${
                          isCompleted ? step.color : 'from-transparent to-transparent'
                        }`}
                        style={{ 
                          height: isCompleted ? '100%' : '0%',
                          transitionDelay: isCompleted ? '0ms' : '500ms'
                        }}
                      />
                    </div>
                  )}

                  {/* Step Card */}
                  <div className={`
                    flex items-center p-4 rounded-lg border-2 transition-all duration-500 transform
                    ${isActive ? `bg-gradient-to-r ${step.bgColor} ${step.borderColor} scale-105 shadow-lg` : ''}
                    ${isCompleted ? `bg-gradient-to-r ${step.bgColor} border-green-300 shadow-md` : ''}
                    ${isPending ? 'bg-gray-50 border-gray-200 opacity-60' : ''}
                  `}>
                    {/* Step Icon */}
                    <div className={`
                      flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4 transition-all duration-500
                      ${isActive ? `bg-gradient-to-br ${step.color} shadow-lg animate-pulse` : ''}
                      ${isCompleted ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-md' : ''}
                      ${isPending ? 'bg-gray-300' : ''}
                    `}>
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6 text-white" />
                      ) : (
                        <StepIcon className={`h-6 w-6 ${isActive || isCompleted ? 'text-white' : 'text-gray-500'}`} />
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                      <h3 className={`font-semibold transition-colors duration-300 ${
                        isActive ? 'text-gray-900' : isCompleted ? 'text-green-800' : 'text-gray-500'
                      }`}>
                        Step {step.id}: {step.title}
                      </h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        isActive ? 'text-gray-700' : isCompleted ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {step.description}
                      </p>
                    </div>

                    {/* Loading Animation for Active Step */}
                    {isActive && (
                      <div className="flex-shrink-0 ml-4">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}

                    {/* Completion Check */}
                    {isCompleted && (
                      <div className="flex-shrink-0 ml-4">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{Math.round((completedSteps.length / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Final Message */}
          {completedSteps.length === steps.length && (
            <div className="mt-6 text-center animate-fade-in">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 border border-green-300 rounded-full">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">Chain Generation Complete!</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default ChainGenerationAnimation 