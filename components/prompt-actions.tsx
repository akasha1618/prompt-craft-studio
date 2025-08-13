'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Edit, Trash2, Eye, Loader2 } from 'lucide-react'
import type { Prompt } from '@/types/database'

interface PromptActionsProps {
  prompt: Prompt
  onDelete?: () => void
  showLabels?: boolean
}

export default function PromptActions({ prompt, onDelete, showLabels = false }: PromptActionsProps) {
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createSupabaseClient()

  const handleDelete = async () => {
    setDeleting(true)
    
    try {
      const { error } = await supabase
        .from('prompts')
        .delete()
        .eq('id', prompt.id)

      if (error) {
        throw error
      }

      // Call onDelete callback if provided to update UI immediately
      if (onDelete) {
        onDelete()
      } else {
        // Fallback behavior based on current page
        const currentPath = window.location.pathname
        if (currentPath.includes('/prompts/') && currentPath !== '/dashboard/prompts') {
          // If we're on an individual prompt page, redirect to prompts list
          router.push('/dashboard/prompts')
        } else {
          // Otherwise refresh the current page
          router.refresh()
        }
      }
    } catch (error) {
      console.error('Error deleting prompt:', error)
      alert('Failed to delete prompt. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center space-x-1">
      <Link href={`/dashboard/prompts/${prompt.id}`}>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
          {showLabels && <span className="ml-1">View</span>}
        </Button>
      </Link>
      
      <Link href={`/dashboard/prompts/${prompt.id}/edit`}>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
          {showLabels && <span className="ml-1">Edit</span>}
        </Button>
      </Link>
      
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {showLabels && !deleting && <span className="ml-1">Delete</span>}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{prompt.title}"? This action cannot be undone.
              This will also delete all versions and test results associated with this prompt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Prompt'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 