"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { HelpCommandPalette } from './help-command-palette'

interface HelpContextType {
  openCommandPalette: () => void
  closeCommandPalette: () => void
  isCommandPaletteOpen: boolean
  showContextualHelp: (content: string) => void
  hideContextualHelp: () => void
}

const HelpContext = createContext<HelpContextType | null>(null)

export function useHelp() {
  const context = useContext(HelpContext)
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider')
  }
  return context
}

interface HelpProviderProps {
  children: React.ReactNode
}

export function HelpProvider({ children }: HelpProviderProps) {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const [contextualHelp, setContextualHelp] = useState<string | null>(null)
  const router = useRouter()

  const openCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(true)
  }, [])

  const closeCommandPalette = useCallback(() => {
    setIsCommandPaletteOpen(false)
  }, [])

  const showContextualHelp = useCallback((content: string) => {
    setContextualHelp(content)
  }, [])

  const hideContextualHelp = useCallback(() => {
    setContextualHelp(null)
  }, [])

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command Palette: Ctrl+K or Cmd+K
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault()
        openCommandPalette()
        return
      }

      // Help shortcut: ? (when not in input fields)
      if (event.key === '?' && !['INPUT', 'TEXTAREA'].includes((event.target as Element)?.tagName)) {
        event.preventDefault()
        router.push('/help')
        return
      }

      // Quick help: Ctrl+H or Cmd+H
      if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
        event.preventDefault()
        router.push('/help')
        return
      }

      // Quick navigation shortcuts (only when not in input fields)
      if (!['INPUT', 'TEXTAREA'].includes((event.target as Element)?.tagName)) {
        // G + D for Dashboard
        if (event.key === 'g') {
          const handleSecondKey = (secondEvent: KeyboardEvent) => {
            if (secondEvent.key === 'd') {
              secondEvent.preventDefault()
              router.push('/dashboard')
            } else if (secondEvent.key === 'e') {
              secondEvent.preventDefault()
              router.push('/employees')
            } else if (secondEvent.key === 'p') {
              secondEvent.preventDefault()
              router.push('/payroll')
            } else if (secondEvent.key === 'h') {
              secondEvent.preventDefault()
              router.push('/help')
            }
            document.removeEventListener('keydown', handleSecondKey)
          }
          
          document.addEventListener('keydown', handleSecondKey)
          // Remove listener after 2 seconds if no second key is pressed
          setTimeout(() => {
            document.removeEventListener('keydown', handleSecondKey)
          }, 2000)
        }
      }

      // Escape to close command palette
      if (event.key === 'Escape' && isCommandPaletteOpen) {
        closeCommandPalette()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [router, openCommandPalette, closeCommandPalette, isCommandPaletteOpen])

  // Prevent body scroll when command palette is open
  useEffect(() => {
    if (isCommandPaletteOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isCommandPaletteOpen])

  const value: HelpContextType = {
    openCommandPalette,
    closeCommandPalette,
    isCommandPaletteOpen,
    showContextualHelp,
    hideContextualHelp
  }

  return (
    <HelpContext.Provider value={value}>
      {children}
      <HelpCommandPalette 
        open={isCommandPaletteOpen} 
        onOpenChange={setIsCommandPaletteOpen}
      />
      
      {/* Contextual Help Overlay */}
      {contextualHelp && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed top-4 right-4 max-w-sm p-4 bg-background border rounded-lg shadow-lg">
            <div className="flex items-start justify-between">
              <p className="text-sm">{contextualHelp}</p>
              <button
                onClick={hideContextualHelp}
                className="ml-2 h-4 w-4 hover:bg-accent rounded"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </HelpContext.Provider>
  )
}