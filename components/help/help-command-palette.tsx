"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Search,
  FileText,
  Video,
  Users,
  Calculator,
  HelpCircle,
  ArrowRight,
  Clock,
  Zap,
  Bookmark,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  Keyboard
} from "lucide-react"
import { cn } from "@/lib/utils"

interface HelpItem {
  id: string
  title: string
  description?: string
  category: string
  type: 'article' | 'video' | 'tutorial' | 'action' | 'page'
  href?: string
  action?: () => void
  keywords?: string[]
  icon?: React.ComponentType<any>
  readTime?: number
  popular?: boolean
}

interface HelpCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const helpItems: HelpItem[] = [
  // Quick Actions
  {
    id: 'new-employee',
    title: 'Add New Employee',
    description: 'Create a new employee profile',
    category: 'Actions',
    type: 'action',
    href: '/employees?action=create',
    icon: Users,
    keywords: ['add', 'create', 'new', 'employee', 'hire']
  },
  {
    id: 'new-payroll',
    title: 'Create Payroll Period',
    description: 'Start a new monthly payroll calculation',
    category: 'Actions',
    type: 'action',
    href: '/payroll?action=create',
    icon: Calculator,
    keywords: ['payroll', 'salary', 'monthly', 'calculate']
  },
  {
    id: 'help-shortcuts',
    title: 'Keyboard Shortcuts',
    description: 'View all available keyboard shortcuts',
    category: 'Actions',
    type: 'action',
    icon: Keyboard,
    keywords: ['shortcuts', 'keyboard', 'hotkeys', 'commands']
  },

  // Help Articles
  {
    id: 'getting-started',
    title: 'Getting Started with Aero HR',
    description: 'Complete guide to setting up and using Aero HR',
    category: 'Getting Started',
    type: 'tutorial',
    href: '/help?article=getting-started',
    icon: HelpCircle,
    readTime: 10,
    popular: true,
    keywords: ['start', 'setup', 'tutorial', 'guide', 'basics']
  },
  {
    id: 'employee-management',
    title: 'Employee Management Guide',
    description: 'Learn how to manage employee profiles and data',
    category: 'Employees',
    type: 'article',
    href: '/help?article=employee-management',
    icon: Users,
    readTime: 8,
    keywords: ['employee', 'profile', 'manage', 'data', 'information']
  },
  {
    id: 'payroll-calculation',
    title: 'Payroll Calculation Process',
    description: 'Step-by-step guide to calculating monthly payroll',
    category: 'Payroll',
    type: 'tutorial',
    href: '/help?article=payroll-calculation',
    icon: Calculator,
    readTime: 12,
    popular: true,
    keywords: ['payroll', 'calculate', 'salary', 'monthly', 'process']
  },
  {
    id: 'pph21-guide',
    title: 'PPh 21 Tax Configuration',
    description: 'Configure Indonesian income tax calculations',
    category: 'Compliance',
    type: 'article',
    href: '/help?article=pph21-guide',
    icon: FileText,
    readTime: 15,
    keywords: ['pph21', 'tax', 'income', 'indonesia', 'compliance']
  },
  {
    id: 'bpjs-setup',
    title: 'BPJS Enrollment Management',
    description: 'Managing employee BPJS health and employment insurance',
    category: 'Compliance',
    type: 'tutorial',
    href: '/help?article=bpjs-setup',
    icon: FileText,
    readTime: 8,
    keywords: ['bpjs', 'insurance', 'health', 'employment', 'enrollment']
  },

  // Video Tutorials
  {
    id: 'payroll-video',
    title: 'Payroll Processing Walkthrough',
    description: 'Video tutorial on complete payroll process',
    category: 'Videos',
    type: 'video',
    href: '/help?video=payroll-process',
    icon: Video,
    readTime: 15,
    keywords: ['video', 'payroll', 'walkthrough', 'tutorial', 'visual']
  },
  {
    id: 'employee-video',
    title: 'Employee Onboarding Video',
    description: 'How to add and set up new employees',
    category: 'Videos',
    type: 'video',
    href: '/help?video=employee-onboarding',
    icon: Video,
    readTime: 8,
    keywords: ['video', 'employee', 'onboarding', 'add', 'setup']
  },

  // Navigation
  {
    id: 'dashboard',
    title: 'Go to Dashboard',
    description: 'Navigate to the main dashboard',
    category: 'Navigation',
    type: 'page',
    href: '/dashboard',
    icon: ArrowRight,
    keywords: ['dashboard', 'home', 'main', 'overview']
  },
  {
    id: 'employees-page',
    title: 'Go to Employees',
    description: 'Navigate to employee management',
    category: 'Navigation',
    type: 'page',
    href: '/employees',
    icon: Users,
    keywords: ['employees', 'staff', 'people', 'team']
  },
  {
    id: 'payroll-page',
    title: 'Go to Payroll',
    description: 'Navigate to payroll processing',
    category: 'Navigation',
    type: 'page',
    href: '/payroll',
    icon: Calculator,
    keywords: ['payroll', 'salary', 'payments', 'calculate']
  }
]

export function HelpCommandPalette({ open, onOpenChange }: HelpCommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const router = useRouter()

  // Filter items based on search query
  const filteredItems = helpItems.filter(item => {
    if (!query) return true
    
    const searchTerm = query.toLowerCase()
    const titleMatch = item.title.toLowerCase().includes(searchTerm)
    const descriptionMatch = item.description?.toLowerCase().includes(searchTerm)
    const categoryMatch = item.category.toLowerCase().includes(searchTerm)
    const keywordMatch = item.keywords?.some(keyword => 
      keyword.toLowerCase().includes(searchTerm)
    )
    
    return titleMatch || descriptionMatch || categoryMatch || keywordMatch
  })

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {} as Record<string, HelpItem[]>)

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!open) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filteredItems.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selectedItem = filteredItems[selectedIndex]
      if (selectedItem) {
        handleItemSelect(selectedItem)
      }
    }
  }, [open, filteredItems, selectedIndex])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleItemSelect = (item: HelpItem) => {
    if (item.action) {
      item.action()
    } else if (item.href) {
      router.push(item.href)
    }
    onOpenChange(false)
    setQuery("")
  }

  const getItemIcon = (item: HelpItem) => {
    if (item.icon) {
      const Icon = item.icon
      return <Icon className="h-4 w-4" />
    }
    
    switch (item.type) {
      case 'video':
        return <Video className="h-4 w-4 text-red-500" />
      case 'tutorial':
        return <Zap className="h-4 w-4 text-blue-500" />
      case 'article':
        return <FileText className="h-4 w-4 text-green-500" />
      case 'action':
        return <ArrowRight className="h-4 w-4 text-purple-500" />
      default:
        return <HelpCircle className="h-4 w-4" />
    }
  }

  const getTypeBadge = (item: HelpItem) => {
    const variants = {
      video: 'destructive',
      tutorial: 'default',
      article: 'secondary',
      action: 'outline',
      page: 'outline'
    } as const

    return (
      <Badge variant={variants[item.type]} className="text-xs">
        {item.type}
      </Badge>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 top-[20%] translate-y-0">
        <div className="border-b">
          <div className="flex items-center px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground mr-3" />
            <Input
              placeholder="Search help articles, tutorials, and actions..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 text-base"
              autoFocus
            />
            {query && (
              <kbd className="pointer-events-none h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-2">
                <span className="text-xs">↵</span>
              </kbd>
            )}
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {Object.keys(groupedItems).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {query ? `No results found for "${query}"` : 'Start typing to search...'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([category, items], categoryIndex) => (
                <div key={category}>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {items.map((item, itemIndex) => {
                      const globalIndex = filteredItems.indexOf(item)
                      const isSelected = globalIndex === selectedIndex
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemSelect(item)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                            "hover:bg-accent",
                            isSelected && "bg-accent"
                          )}
                        >
                          <div className="flex-shrink-0">
                            {getItemIcon(item)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm truncate">
                                {item.title}
                              </p>
                              {item.popular && (
                                <Badge variant="secondary" className="text-xs">
                                  Popular
                                </Badge>
                              )}
                              {getTypeBadge(item)}
                            </div>
                            
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </p>
                            )}
                            
                            {item.readTime && (
                              <div className="flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {item.readTime} min
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-shrink-0">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {categoryIndex < Object.keys(groupedItems).length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="h-4 w-4 rounded border bg-muted flex items-center justify-center text-[10px]">
                  ↑↓
                </kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="h-4 w-4 rounded border bg-muted flex items-center justify-center text-[10px]">
                  ↵
                </kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="h-4 w-4 rounded border bg-muted flex items-center justify-center text-[10px]">
                  ⎋
                </kbd>
                <span>Close</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span>Press</span>
              <kbd className="h-4 rounded border bg-muted px-1 text-[10px]">?</kbd>
              <span>for help</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}