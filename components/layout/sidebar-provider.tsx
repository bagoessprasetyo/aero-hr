"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface SidebarContextType {
  isExpanded: boolean
  isMobileOpen: boolean
  toggleExpanded: () => void
  setExpanded: (expanded: boolean) => void
  toggleMobile: () => void
  setMobileOpen: (open: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

interface SidebarProviderProps {
  children: React.ReactNode
  defaultExpanded?: boolean
}

export function SidebarProvider({ 
  children, 
  defaultExpanded = true 
}: SidebarProviderProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('aero-hr-sidebar-expanded')
    if (saved !== null) {
      setIsExpanded(JSON.parse(saved))
    }
  }, [])

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem('aero-hr-sidebar-expanded', JSON.stringify(isExpanded))
  }, [isExpanded])

  // Close mobile sidebar on large screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const setExpanded = (expanded: boolean) => {
    setIsExpanded(expanded)
  }

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  const setMobileOpen = (open: boolean) => {
    setIsMobileOpen(open)
  }

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isMobileOpen,
        toggleExpanded,
        setExpanded,
        toggleMobile,
        setMobileOpen,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}