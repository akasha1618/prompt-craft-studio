'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  Sparkles, 
  Plus, 
  BookOpen, 
  TestTube, 
  Settings,
  Home,
  GitBranch,
  History,
  Beaker
} from 'lucide-react'

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Create Prompt', href: '/dashboard/create', icon: Plus },
    { name: 'My Prompts', href: '/dashboard/prompts', icon: BookOpen },
    { name: 'Prompt Lab', href: '/dashboard/lab', icon: Beaker },
    { name: 'Improve & Optimize', href: '/dashboard/enhance', icon: Sparkles },
    { name: 'Test Prompts', href: '/dashboard/test', icon: TestTube },
    { name: 'Chained Prompts', href: '/dashboard/chains', icon: GitBranch },
    { name: 'Chains History', href: '/dashboard/chains/history', icon: History },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white shadow-sm border-r">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <Sparkles className="h-8 w-8 text-indigo-600" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900 leading-tight">PromptCraft</span>
            <span className="text-sm font-semibold text-indigo-600 leading-tight">Studio</span>
          </div>
        </div>
      </div>
      <nav className="mt-6">
        <div className="px-3">
          {navigation.slice(0, 3).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-2 transition-all duration-300 border-2 shadow-sm hover:shadow-md hover:scale-[1.02]',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 shadow-md'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 hover:text-indigo-700 border-transparent hover:border-indigo-200'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 transition-all duration-300',
                    isActive
                      ? 'text-indigo-600'
                      : 'text-gray-400 group-hover:text-indigo-500 group-hover:scale-110'
                  )}
                />
                {item.name}
              </Link>
            )
          })}

          {/* Prompts & Tools */}
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-6 border-b border-gray-200">
            Prompts & Tools
          </div>
          {navigation.slice(3, 6).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-2 transition-all duration-300 border-2 shadow-sm hover:shadow-md hover:scale-[1.02]',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 shadow-md'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 hover:text-indigo-700 border-transparent hover:border-indigo-200'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 transition-all duration-300',
                    isActive
                      ? 'text-indigo-600'
                      : 'text-gray-400 group-hover:text-indigo-500 group-hover:scale-110'
                  )}
                />
                {item.name}
              </Link>
            )
          })}

          {/* Advanced */}
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-6 border-b border-gray-200">
            Advanced
          </div>
          {navigation.slice(6, 8).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-2 transition-all duration-300 border-2 shadow-sm hover:shadow-md hover:scale-[1.02]',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 shadow-md'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 hover:text-indigo-700 border-transparent hover:border-indigo-200'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 transition-all duration-300',
                    isActive
                      ? 'text-indigo-600'
                      : 'text-gray-400 group-hover:text-indigo-500 group-hover:scale-110'
                  )}
                />
                {item.name}
              </Link>
            )
          })}

          {/* Account */}
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 mt-6 border-b border-gray-200">
            Account
          </div>
          {navigation.slice(8).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2 text-sm font-medium rounded-lg mb-2 transition-all duration-300 border-2 shadow-sm hover:shadow-md hover:scale-[1.02]',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border-indigo-200 shadow-md'
                    : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-indigo-50 hover:text-indigo-700 border-transparent hover:border-indigo-200'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 transition-all duration-300',
                    isActive
                      ? 'text-indigo-600'
                      : 'text-gray-400 group-hover:text-indigo-500 group-hover:scale-110'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
} 