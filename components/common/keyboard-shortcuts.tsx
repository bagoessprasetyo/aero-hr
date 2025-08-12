"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  Keyboard,
  Command,
  Search,
  Plus,
  Home,
  Users,
  Calculator,
  FileText,
  HelpCircle,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast, useInfoToast } from "@/components/ui/toast"

interface KeyboardShortcut {
  id: string
  keys: string[]
  description: string
  action: () => void
  category: 'navigation' | 'actions' | 'general'
  scope?: 'global' | 'employees' | 'payroll' | 'dashboard'
}

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const infoToast = useInfoToast()
  const [isHelpOpen, setIsHelpOpen] = useState(false)

  const shortcuts: KeyboardShortcut[] = [
    // Navigation shortcuts
    {
      id: 'go-dashboard',
      keys: ['g', 'd'],
      description: 'Go to Dashboard',
      action: () => {
        router.push('/dashboard')
        infoToast('Navigated to Dashboard')
      },
      category: 'navigation',
      scope: 'global'
    },
    {
      id: 'go-employees',
      keys: ['g', 'e'],
      description: 'Go to Employees',
      action: () => {
        router.push('/employees')
        infoToast('Navigated to Employees')
      },
      category: 'navigation',
      scope: 'global'
    },
    {
      id: 'go-payroll',
      keys: ['g', 'p'],
      description: 'Go to Payroll',
      action: () => {
        router.push('/payroll')
        infoToast('Navigated to Payroll')
      },
      category: 'navigation',
      scope: 'global'
    },
    {
      id: 'go-bulk-operations',
      keys: ['g', 'b'],
      description: 'Go to Bulk Operations',
      action: () => {
        router.push('/bulk-operations')
        infoToast('Navigated to Bulk Operations')
      },
      category: 'navigation',
      scope: 'global'
    },
    {
      id: 'go-tax-reports',
      keys: ['g', 't'],
      description: 'Go to Tax Reports',
      action: () => {
        router.push('/tax')
        infoToast('Navigated to Tax Reports')
      },
      category: 'navigation',
      scope: 'global'
    },

    // Action shortcuts
    {
      id: 'new-employee',
      keys: ['c', 'e'],
      description: 'Create New Employee',
      action: () => {
        router.push('/employees?action=create')
        infoToast('Opening new employee form')
      },
      category: 'actions',
      scope: 'global'
    },
    {
      id: 'search',
      keys: ['/'],
      description: 'Focus Search',
      action: () => {
        // Focus search input if available
        const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      },
      category: 'general',
      scope: 'global'
    },

    // General shortcuts
    {
      id: 'show-shortcuts',
      keys: ['?'],
      description: 'Show Keyboard Shortcuts',
      action: () => setIsHelpOpen(true),
      category: 'general',
      scope: 'global'
    },
    {
      id: 'escape',
      keys: ['Escape'],
      description: 'Close Modal/Dialog',
      action: () => {
        // Close any open modals/dialogs
        const closeButton = document.querySelector('[data-dialog-close]') as HTMLButtonElement
        if (closeButton) {
          closeButton.click()
        }
      },
      category: 'general',
      scope: 'global'
    }
  ]

  useEffect(() => {
    let keySequence: string[] = []
    let sequenceTimer: NodeJS.Timeout | null = null

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        (event.target as Element)?.closest('[contenteditable]')
      ) {
        return
      }

      // Clear sequence timer
      if (sequenceTimer) {
        clearTimeout(sequenceTimer)
      }

      // Handle modifier keys + single key shortcuts
      const modifiers = []
      if (event.ctrlKey || event.metaKey) modifiers.push('Cmd')
      if (event.shiftKey) modifiers.push('Shift')
      if (event.altKey) modifiers.push('Alt')

      const key = event.key
      const fullKey = modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key

      // Add key to sequence
      keySequence.push(key.toLowerCase())

      // Find matching shortcuts
      const matchingShortcuts = shortcuts.filter(shortcut => {
        if (shortcut.keys.length === 1) {
          return shortcut.keys[0] === key || shortcut.keys[0] === fullKey
        } else {
          // Check if current sequence matches the beginning of the shortcut
          return shortcut.keys.every((shortcutKey, index) => 
            keySequence[index] === shortcutKey.toLowerCase()
          ) && keySequence.length <= shortcut.keys.length
        }
      })

      // Execute shortcut if exact match found
      const exactMatch = matchingShortcuts.find(shortcut => 
        shortcut.keys.length === keySequence.length &&
        shortcut.keys.every((shortcutKey, index) => 
          keySequence[index] === shortcutKey.toLowerCase()
        )
      )

      if (exactMatch) {
        event.preventDefault()
        exactMatch.action()
        keySequence = []
        return
      }

      // If we have potential matches, wait for more keys
      if (matchingShortcuts.length > 0) {
        event.preventDefault()
        // Reset sequence after 2 seconds if no complete match
        sequenceTimer = setTimeout(() => {
          keySequence = []
        }, 2000)
      } else {
        // No matches, reset sequence
        keySequence = []
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (sequenceTimer) {
        clearTimeout(sequenceTimer)
      }
    }
  }, [router, infoToast])

  return (
    <>
      {children}
      <KeyboardShortcutsDialog 
        shortcuts={shortcuts}
        isOpen={isHelpOpen}
        onOpenChange={setIsHelpOpen}
      />
    </>
  )
}

interface KeyboardShortcutsDialogProps {
  shortcuts: KeyboardShortcut[]
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

function KeyboardShortcutsDialog({ shortcuts, isOpen, onOpenChange }: KeyboardShortcutsDialogProps) {
  const categories = {
    navigation: { icon: Home, label: 'Navigation' },
    actions: { icon: Plus, label: 'Actions' },
    general: { icon: Keyboard, label: 'General' }
  }

  const formatKeys = (keys: string[]) => {
    return keys.map(key => {
      switch (key.toLowerCase()) {
        case 'cmd':
        case 'ctrl':
          return '⌘'
        case 'shift':
          return '⇧'
        case 'alt':
        case 'option':
          return '⌥'
        case 'escape':
          return 'Esc'
        case ' ':
          return 'Space'
        default:
          return key.toUpperCase()
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Keyboard className="h-5 w-5" />
            <span>Keyboard Shortcuts</span>
          </DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and interact with Aero HR more efficiently
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {Object.entries(categories).map(([categoryKey, { icon: Icon, label }]) => {
            const categoryShortcuts = shortcuts.filter(s => s.category === categoryKey)
            
            if (categoryShortcuts.length === 0) return null
            
            return (
              <div key={categoryKey}>
                <h3 className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-3">
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </h3>
                
                <div className="space-y-2">
                  {categoryShortcuts.map(shortcut => (
                    <div 
                      key={shortcut.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">
                        {shortcut.description}
                      </span>
                      
                      <div className="flex items-center space-x-1">
                        {formatKeys(shortcut.keys).map((key, index) => (
                          <div key={index} className="flex items-center">
                            <Badge 
                              variant="outline" 
                              className="text-xs font-mono px-2 py-1 bg-gray-100"
                            >
                              {key}
                            </Badge>
                            {index < shortcut.keys.length - 1 && (
                              <span className="text-gray-400 mx-1">then</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            💡 Tip: Press <Badge variant="outline" className="text-xs font-mono">?</Badge> anytime to open this help dialog
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Accessibility helper component for focus management
export function FocusTrap({ children, enabled = true }: { 
  children: React.ReactNode
  enabled?: boolean 
}) {
  useEffect(() => {
    if (!enabled) return

    const focusableElements = document.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [enabled])

  return <>{children}</>
}

// Skip to main content link for screen readers
export function SkipToMainContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Skip to main content
    </a>
  )
}

// Announcement region for screen readers
export function LiveRegion({ message, priority = 'polite' }: { 
  message: string
  priority?: 'polite' | 'assertive' 
}) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}